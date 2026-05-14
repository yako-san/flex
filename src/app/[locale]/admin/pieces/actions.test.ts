import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  prisma: {
    piece: { findFirst: vi.fn(), update: vi.fn() },
  },
}));
vi.mock('@/lib/workshop', () => ({ getActiveWorkshop: vi.fn() }));
vi.mock('@/lib/stock', () => ({ recordStockMovement: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); }),
}));

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import {
  adjustStockAction,
  createPieceAction,
  deletePieceAction,
  updatePieceAction,
} from './actions';

const mockAuth = vi.mocked(auth);
const mockGetWorkshop = vi.mocked(getActiveWorkshop);
const WORKSHOP = { id: 'workshop_TEST' } as unknown as Awaited<
  ReturnType<typeof getActiveWorkshop>
>;

function fd(values: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
}

const VALID_PIECE = {
  nomCanonical: 'Chambre à air 700C',
  prixVente: '12.99',
  taxable: 'on',
};

beforeEach(() => {
  mockAuth.mockResolvedValue({ userId: 'user_TEST' } as never);
  mockGetWorkshop.mockResolvedValue(WORKSHOP);
});

afterEach(() => vi.clearAllMocks());

describe('createPieceAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await createPieceAction(null, fd(VALID_PIECE))).toEqual({
      error: 'Non authentifié',
    });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await createPieceAction(null, fd(VALID_PIECE))).toEqual({
      error: 'Aucun workshop actif',
    });
  });

  it('refuse si nomCanonical vide', async () => {
    const r = await createPieceAction(null, fd({ ...VALID_PIECE, nomCanonical: '' }));
    expect(r.error).toBe('Validation');
    expect(r.fieldErrors?.nomCanonical).toBeDefined();
  });

  it('refuse si prixVente vide', async () => {
    const r = await createPieceAction(null, fd({ ...VALID_PIECE, prixVente: '' }));
    expect(r.error).toBe('Validation');
    expect(r.fieldErrors?.prixVente).toBeDefined();
  });
});

describe('updatePieceAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await updatePieceAction('pce_x', null, fd(VALID_PIECE))).toEqual({
      error: 'Non authentifié',
    });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await updatePieceAction('pce_x', null, fd(VALID_PIECE))).toEqual({
      error: 'Aucun workshop actif',
    });
  });

  it('refuse si validation échoue', async () => {
    const r = await updatePieceAction('pce_x', null, fd({ ...VALID_PIECE, prixVente: '' }));
    expect(r.error).toBe('Validation');
  });
});

describe('deletePieceAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await deletePieceAction('pce_x')).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await deletePieceAction('pce_x')).toEqual({ error: 'Aucun workshop actif' });
  });

  it('refuse si pièce introuvable', async () => {
    vi.mocked(prisma.piece.findFirst).mockResolvedValueOnce(null);
    expect(await deletePieceAction('pce_x')).toEqual({ error: 'Pièce introuvable' });
  });

  it('refuse si refs > 0 (somme BDT + ventes + POs)', async () => {
    vi.mocked(prisma.piece.findFirst).mockResolvedValueOnce({
      id: 'pce_x',
      _count: { bdcItems: 2, venteItems: 1, poItems: 0 },
    } as never);
    const r = await deletePieceAction('pce_x');
    expect(r.error).toContain('3 références');
  });

  it('soft-delete si refs = 0 partout', async () => {
    vi.mocked(prisma.piece.findFirst).mockResolvedValueOnce({
      id: 'pce_x',
      _count: { bdcItems: 0, venteItems: 0, poItems: 0 },
    } as never);
    vi.mocked(prisma.piece.update).mockResolvedValueOnce({} as never);
    await expect(deletePieceAction('pce_x')).rejects.toThrow('NEXT_REDIRECT');
    expect(
      vi.mocked(prisma.piece.update).mock.calls[0]![0].data.deletedAt,
    ).toBeInstanceOf(Date);
  });
});

describe('adjustStockAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(
      await adjustStockAction(null, fd({ pieceId: 'p', delta: '1', reason: 'r' })),
    ).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(
      await adjustStockAction(null, fd({ pieceId: 'p', delta: '1', reason: 'r' })),
    ).toEqual({ error: 'Aucun workshop actif' });
  });

  it('refuse si pieceId vide', async () => {
    const r = await adjustStockAction(null, fd({ pieceId: '', delta: '1', reason: 'r' }));
    expect(r.error).toBeDefined();
  });

  it('refuse si delta = 0', async () => {
    const r = await adjustStockAction(null, fd({ pieceId: 'p', delta: '0', reason: 'r' }));
    expect(r.error).toContain('Delta');
  });

  it('refuse si raison vide', async () => {
    const r = await adjustStockAction(null, fd({ pieceId: 'p', delta: '1', reason: '' }));
    expect(r.error).toContain('Raison');
  });

  it('refuse si pièce introuvable', async () => {
    vi.mocked(prisma.piece.findFirst).mockResolvedValueOnce(null);
    const r = await adjustStockAction(
      null,
      fd({ pieceId: 'pce_x', delta: '5', reason: 'inventaire' }),
    );
    expect(r).toEqual({ error: 'Pièce introuvable' });
  });
});
