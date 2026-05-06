import Decimal from 'decimal.js';
import { Prisma, type StockMovementType } from '@prisma/client';
import { generateId } from '@/lib/ids/generate-id';

// =============================================================================
// Stock dynamique — append-only StockMovement + cache stockPhysique/stockReserve
// sur Piece, recalculé à chaque mouvement.
//
// Modèle :
//   - StockMovement.delta signé (positif = entrée, négatif = sortie)
//   - PO_RECEIVED       : +qté physique (réception fournisseur)
//   - BDC_INVOICED      : -qté physique + -qté réservée (facturation BDT)
//   - SALE_INVOICED     : -qté physique (vente comptoir)
//   - MANUAL_ADJUSTMENT : delta libre physique (inventaire)
//   - RESERVATION       : +qté réservée (item piece ajouté à BDT actif)
//   - RELEASE           : -qté réservée (item piece retiré ou BDT annulé)
//
// piece.stockPhysique = SUM(delta) of mvts hors RESERVATION/RELEASE
// piece.stockReserve  = SUM(delta) of mvts RESERVATION/RELEASE
// (recalculé via recomputePieceStock après chaque mouvement)
// =============================================================================

type Tx = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

const PHYSICAL_TYPES: StockMovementType[] = [
  'PO_RECEIVED',
  'BDC_INVOICED',
  'SALE_INVOICED',
  'MANUAL_ADJUSTMENT',
];
const RESERVE_TYPES: StockMovementType[] = ['RESERVATION', 'RELEASE'];

export type RecordMovementInput = {
  workshopId: string;
  pieceId: string;
  type: StockMovementType;
  delta: number; // signé (positif = entrée, négatif = sortie)
  reason?: string | null;
  bdcItemId?: string | null;
  venteItemId?: string | null;
  poItemId?: string | null;
  createdById?: string | null;
};

export async function recordStockMovement(tx: Tx, input: RecordMovementInput): Promise<void> {
  await tx.stockMovement.create({
    data: {
      id: generateId('mov'),
      workshopId: input.workshopId,
      pieceId: input.pieceId,
      type: input.type,
      delta: new Prisma.Decimal(input.delta),
      reason: input.reason ?? null,
      bdcItemId: input.bdcItemId ?? null,
      venteItemId: input.venteItemId ?? null,
      poItemId: input.poItemId ?? null,
      createdById: input.createdById ?? null,
    },
  });

  await recomputePieceStock(tx, input.pieceId);
}

// Recalcule stockPhysique et stockReserve depuis tous les mouvements de la pièce.
// Source de vérité : SUM(delta) groupé par catégorie de type.
export async function recomputePieceStock(tx: Tx, pieceId: string): Promise<void> {
  const all = await tx.stockMovement.findMany({
    where: { pieceId },
    select: { type: true, delta: true },
  });
  let physique = new Decimal(0);
  let reserve = new Decimal(0);
  for (const m of all) {
    const d = new Decimal(m.delta.toString());
    if (PHYSICAL_TYPES.includes(m.type)) physique = physique.plus(d);
    if (RESERVE_TYPES.includes(m.type)) reserve = reserve.plus(d);
  }
  await tx.piece.update({
    where: { id: pieceId },
    data: {
      // stockPhysique et stockReserve sont Int en DB → arrondit (négocier
      // si on supporte des qtés fractionnaires plus tard).
      stockPhysique: Math.round(physique.toNumber()),
      stockReserve: Math.round(reserve.toNumber()),
    },
  });
}
