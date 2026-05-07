'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { recordStockMovement } from '@/lib/stock';

// Marque un PO comme RECU : pour chaque item, qty_recue = qty_commandee +
// crée un StockMovement PO_RECEIVED qui incrémente Piece.stockPhysique.
export async function receivePoAction(poId: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  try {
    await prisma.$transaction(async (tx) => {
      const po = await tx.po.findFirst({
        where: { id: poId, workshopId: workshop.id, deletedAt: null },
        include: { items: true },
      });
      if (!po) throw new Error('PO introuvable');
      if (po.status === 'RECU') throw new Error('PO déjà marqué reçu');

      for (const it of po.items) {
        const qtyDelta = Number(it.qtyCommandee) - Number(it.qtyRecue);
        if (qtyDelta <= 0) continue;
        await tx.poItem.update({
          where: { id: it.id },
          data: { qtyRecue: it.qtyCommandee },
        });
        if (it.pieceId) {
          await recordStockMovement(tx, {
            workshopId: workshop.id,
            pieceId: it.pieceId,
            type: 'PO_RECEIVED',
            delta: qtyDelta,
            poItemId: it.id,
            reason: `Réception PO ${po.poNumero}`,
            createdById: userId,
          });
        }
      }

      await tx.po.update({
        where: { id: poId },
        data: { status: 'RECU', dateReception: new Date() },
      });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Réception échouée' };
  }

  revalidatePath('/[locale]/admin/pos', 'page');
  revalidatePath(`/[locale]/admin/pos/${poId}`, 'page');
  return {};
}

export async function deletePoAction(poId: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const po = await prisma.po.findFirst({
    where: { id: poId, workshopId: workshop.id, deletedAt: null },
  });
  if (!po) return { error: 'PO introuvable' };
  if (po.status === 'RECU') {
    return { error: 'Impossible : PO déjà reçu (mouvements stock liés)' };
  }
  await prisma.po.update({
    where: { id: poId },
    data: { deletedAt: new Date() },
  });
  revalidatePath('/[locale]/admin/pos', 'page');
  redirect('/fr-CA/admin/pos');
}
