'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';

export type MaintenanceState = { error?: string; success?: string };

const deleteBdcSchema = z.object({
  bdcId: z.string().trim().min(1, 'ID requis'),
  confirmation: z.string().trim(),
});

// Soft-delete d'un BDT par ID — ne touche pas aux factures émises (immutables).
// Refuse si le BDT a déjà des factures associées (car suppression romprait
// la traçabilité comptable). Pour un cas pareil, passer par la BD directement.
export async function deleteBdcByIdAction(
  _prev: MaintenanceState | null,
  formData: FormData,
): Promise<MaintenanceState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = deleteBdcSchema.safeParse({
    bdcId: formData.get('bdcId') ?? '',
    confirmation: formData.get('confirmation') ?? '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Validation' };
  if (parsed.data.confirmation !== 'SUPPRIMER') {
    return { error: 'Tape SUPPRIMER (en majuscules) pour confirmer.' };
  }

  const bdc = await prisma.bdc.findFirst({
    where: { id: parsed.data.bdcId, workshopId: workshop.id, deletedAt: null },
    include: { factures: { select: { id: true } } },
  });
  if (!bdc) return { error: 'BDT introuvable ou déjà supprimé' };
  if (bdc.factures.length > 0) {
    return {
      error: `BDT ${parsed.data.bdcId} a ${bdc.factures.length} facture(s) émise(s) — suppression refusée pour intégrité comptable.`,
    };
  }

  await prisma.bdc.update({
    where: { id: bdc.id },
    data: { deletedAt: new Date(), updatedById: userId },
  });

  revalidatePath('/[locale]/admin/bdcs', 'page');
  revalidatePath('/[locale]/admin/maintenance', 'page');
  return { success: `BDT ${bdc.id} marqué comme supprimé.` };
}

// Recompute les caches stockPhysique/stockReserve depuis les StockMovement.
// Utile après une migration ou un import qui aurait pu désaligner.
export async function recomputeStockAction(
  _prev: MaintenanceState | null,
): Promise<MaintenanceState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const pieces = await prisma.piece.findMany({
    where: { workshopId: workshop.id, deletedAt: null },
    select: { id: true },
  });

  let updated = 0;
  for (const p of pieces) {
    const movements = await prisma.stockMovement.findMany({
      where: { pieceId: p.id },
      select: { delta: true, type: true },
    });
    let physique = 0;
    let reserve = 0;
    for (const m of movements) {
      const delta = Number(m.delta);
      if (m.type === 'RESERVATION' || m.type === 'RELEASE') {
        reserve += delta;
      } else {
        physique += delta;
      }
    }
    await prisma.piece.update({
      where: { id: p.id },
      data: { stockPhysique: physique, stockReserve: reserve },
    });
    updated += 1;
  }

  revalidatePath('/[locale]/admin/pieces', 'page');
  revalidatePath('/[locale]/admin/maintenance', 'page');
  return { success: `${updated} pièces recalculées depuis les StockMovement.` };
}
