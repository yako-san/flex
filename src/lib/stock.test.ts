import { describe, expect, it, vi } from 'vitest';
import { recomputePieceStock, recordStockMovement } from './stock';

// Fake transaction client : on capture les appels stockMovement.create/findMany
// et piece.update pour vérifier que la logique recomputePieceStock partitionne
// correctement PHYSICAL_TYPES vs RESERVE_TYPES.
function makeTx({
  movements = [] as { type: string; delta: number | string }[],
}: { movements?: { type: string; delta: number | string }[] } = {}) {
  const createCalls: unknown[] = [];
  const updateCalls: unknown[] = [];

  return {
    tx: {
      stockMovement: {
        create: vi.fn(async (args: unknown) => {
          createCalls.push(args);
          return { id: 'mov_FAKE' };
        }),
        findMany: vi.fn(async () => movements),
      },
      piece: {
        update: vi.fn(async (args: unknown) => {
          updateCalls.push(args);
          return {};
        }),
      },
    } as never,
    createCalls,
    updateCalls,
  };
}

describe('recordStockMovement', () => {
  it('crée un StockMovement avec les bons champs', async () => {
    const { tx, createCalls } = makeTx();

    await recordStockMovement(tx, {
      workshopId: 'w_x',
      pieceId: 'pce_x',
      type: 'PO_RECEIVED',
      delta: 10,
      reason: 'Réception fournisseur',
      poItemId: 'poi_x',
      createdById: 'user_x',
    });

    expect(createCalls).toHaveLength(1);
    const call = createCalls[0] as { data: Record<string, unknown> };
    expect(call.data.workshopId).toBe('w_x');
    expect(call.data.pieceId).toBe('pce_x');
    expect(call.data.type).toBe('PO_RECEIVED');
    expect(call.data.reason).toBe('Réception fournisseur');
    expect(call.data.poItemId).toBe('poi_x');
    expect(call.data.bdcItemId).toBeNull();
    expect(call.data.venteItemId).toBeNull();
    expect(call.data.createdById).toBe('user_x');
    expect(String(call.data.delta)).toBe('10');
  });

  it("optionnels null par défaut (reason, bdcItemId, etc.)", async () => {
    const { tx, createCalls } = makeTx();

    await recordStockMovement(tx, {
      workshopId: 'w',
      pieceId: 'p',
      type: 'MANUAL_ADJUSTMENT',
      delta: -3,
    });

    const data = (createCalls[0] as { data: Record<string, unknown> }).data;
    expect(data.reason).toBeNull();
    expect(data.bdcItemId).toBeNull();
    expect(data.venteItemId).toBeNull();
    expect(data.poItemId).toBeNull();
    expect(data.createdById).toBeNull();
  });

  it('appelle recomputePieceStock après la création (piece.update appelé)', async () => {
    const { tx, updateCalls } = makeTx();

    await recordStockMovement(tx, {
      workshopId: 'w',
      pieceId: 'pce_TARGET',
      type: 'PO_RECEIVED',
      delta: 5,
    });

    expect(updateCalls).toHaveLength(1);
    expect((updateCalls[0] as { where: { id: string } }).where.id).toBe('pce_TARGET');
  });

  it('delta négatif accepté (sortie)', async () => {
    const { tx, createCalls } = makeTx();

    await recordStockMovement(tx, {
      workshopId: 'w',
      pieceId: 'p',
      type: 'BDC_INVOICED',
      delta: -2,
    });

    expect(String((createCalls[0] as { data: { delta: unknown } }).data.delta)).toBe('-2');
  });
});

describe('recomputePieceStock', () => {
  it('mouvements PHYSICAL_TYPES additionnés dans stockPhysique', async () => {
    const { tx, updateCalls } = makeTx({
      movements: [
        { type: 'PO_RECEIVED', delta: 10 },
        { type: 'BDC_INVOICED', delta: -2 },
        { type: 'SALE_INVOICED', delta: -1 },
        { type: 'MANUAL_ADJUSTMENT', delta: 3 },
      ],
    });

    await recomputePieceStock(tx, 'pce_x');

    const data = (updateCalls[0] as { data: { stockPhysique: number; stockReserve: number } })
      .data;
    expect(data.stockPhysique).toBe(10);
    expect(data.stockReserve).toBe(0);
  });

  it('mouvements RESERVE_TYPES additionnés dans stockReserve', async () => {
    const { tx, updateCalls } = makeTx({
      movements: [
        { type: 'RESERVATION', delta: 5 },
        { type: 'RELEASE', delta: -2 },
      ],
    });

    await recomputePieceStock(tx, 'pce_x');

    const data = (updateCalls[0] as { data: { stockPhysique: number; stockReserve: number } })
      .data;
    expect(data.stockPhysique).toBe(0);
    expect(data.stockReserve).toBe(3);
  });

  it('mélange physique + reserve — partitions disjointes', async () => {
    const { tx, updateCalls } = makeTx({
      movements: [
        { type: 'PO_RECEIVED', delta: 20 },
        { type: 'RESERVATION', delta: 5 },
        { type: 'BDC_INVOICED', delta: -3 },
        { type: 'RELEASE', delta: -1 },
      ],
    });

    await recomputePieceStock(tx, 'pce_x');

    const data = (updateCalls[0] as { data: { stockPhysique: number; stockReserve: number } })
      .data;
    expect(data.stockPhysique).toBe(17); // 20 - 3
    expect(data.stockReserve).toBe(4); // 5 - 1
  });

  it("aucun mouvement → stocks à 0", async () => {
    const { tx, updateCalls } = makeTx({ movements: [] });

    await recomputePieceStock(tx, 'pce_x');

    const data = (updateCalls[0] as { data: { stockPhysique: number; stockReserve: number } })
      .data;
    expect(data.stockPhysique).toBe(0);
    expect(data.stockReserve).toBe(0);
  });

  it('arrondit les fractions au plus proche entier', async () => {
    const { tx, updateCalls } = makeTx({
      movements: [
        { type: 'PO_RECEIVED', delta: '2.7' },
        { type: 'MANUAL_ADJUSTMENT', delta: '0.4' },
      ],
    });

    await recomputePieceStock(tx, 'pce_x');

    const data = (updateCalls[0] as { data: { stockPhysique: number } }).data;
    // 2.7 + 0.4 = 3.1 → 3
    expect(data.stockPhysique).toBe(3);
  });

  it('cible la bonne pièce', async () => {
    const { tx, updateCalls } = makeTx({ movements: [{ type: 'PO_RECEIVED', delta: 1 }] });

    await recomputePieceStock(tx, 'pce_TARGET_123');

    expect((updateCalls[0] as { where: { id: string } }).where.id).toBe('pce_TARGET_123');
  });
});
