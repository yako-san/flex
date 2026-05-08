'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { recordStockMovement } from '@/lib/stock';
import { generateId } from '@/lib/ids/generate-id';

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

// =============================================================================
// PO ADHOC — création d'un PO directement à la réception (achat impulsif,
// dépannage). poNumero préfixé "ADHOC-", status=RECU dès la création,
// stock physique incrémenté immédiatement via StockMovement.
// =============================================================================

const adhocItemSchema = z.object({
  pieceId: z.string().trim().min(1).optional().nullable(),
  nom: z.string().trim().min(1, 'Nom requis'),
  sku: z.string().trim().optional().nullable(),
  qty: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  categorie: z.string().trim().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const adhocSchema = z.object({
  fournisseur: z.string().trim().min(1, 'Fournisseur requis'),
  notes: z.string().optional().nullable(),
  items: z.array(adhocItemSchema).min(1, 'Au moins un item requis'),
});

export type AdhocPoState = {
  error?: string;
  ok?: boolean;
  poId?: string;
  poNumero?: string;
};

export async function createAdhocPoAction(
  _prev: AdhocPoState | null,
  formData: FormData,
): Promise<AdhocPoState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  // Items sont sérialisés dans un champ JSON 'items' du formData
  let rawItems: unknown;
  try {
    rawItems = JSON.parse(String(formData.get('items') ?? '[]'));
  } catch {
    return { error: 'Items invalides (JSON parse failed)' };
  }

  const parsed = adhocSchema.safeParse({
    fournisseur: formData.get('fournisseur') ?? '',
    notes: formData.get('notes') || null,
    items: rawItems,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Validation' };
  }
  const data = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Compteur séquentiel pour ADHOC- numéros (partage le PO_SEQUENCE)
      const counter = await tx.counter.findFirst({
        where: { workshopId: workshop.id, kind: 'PO_SEQUENCE' },
      });
      const next = (counter?.current ?? 0) + 1;
      if (counter) {
        await tx.counter.update({ where: { id: counter.id }, data: { current: next } });
      } else {
        await tx.counter.create({
          data: {
            id: generateId('ctr'),
            workshopId: workshop.id,
            kind: 'PO_SEQUENCE',
            prefix: 'ADHOC',
            current: next,
          },
        });
      }
      const poNumero = `ADHOC-${String(next).padStart(4, '0')}`;
      const today = new Date();

      const poId = generateId('po');
      await tx.po.create({
        data: {
          id: poId,
          workshopId: workshop.id,
          poNumero,
          fournisseur: data.fournisseur,
          dateCommande: today,
          dateReception: today,
          status: 'RECU',
          isAdhoc: true,
          notes: data.notes ?? null,
          createdById: userId,
        },
      });

      // Items + StockMovement par item
      for (let i = 0; i < data.items.length; i++) {
        const it = data.items[i]!;
        let pieceId = it.pieceId ?? null;

        // Auto-création Piece si pieceId absent (ADHOC : nouvelle pièce)
        if (!pieceId) {
          const newPieceId = generateId('piece');
          await tx.piece.create({
            data: {
              id: newPieceId,
              workshopId: workshop.id,
              nomCanonical: it.nom,
              sku: it.sku ?? null,
              prixAchat: new Prisma.Decimal(it.unitPrice),
              prixVente: new Prisma.Decimal(it.unitPrice * 1.5), // marge default 50%
              fournisseur: data.fournisseur,
              categorie: it.categorie ?? null,
              taxable: true,
            },
          });
          pieceId = newPieceId;
        }

        const poItemId = generateId('poi');
        await tx.poItem.create({
          data: {
            id: poItemId,
            poId,
            pieceId,
            position: i + 1,
            skuSnapshot: it.sku ?? null,
            nomSnapshot: it.nom,
            qtyCommandee: new Prisma.Decimal(it.qty),
            qtyRecue: new Prisma.Decimal(it.qty), // tout reçu d'office
            unitPrice: new Prisma.Decimal(it.unitPrice),
            categorie: it.categorie ?? null,
            notes: it.notes ?? null,
          },
        });

        // Mouvement de stock entrée immédiat
        await recordStockMovement(tx, {
          workshopId: workshop.id,
          pieceId,
          type: 'PO_RECEIVED',
          delta: it.qty,
          poItemId,
          reason: `Réception ADHOC ${poNumero}`,
          createdById: userId,
        });
      }

      return { poId, poNumero };
    });

    revalidatePath('/[locale]/admin/pos', 'page');
    revalidatePath('/[locale]/admin/pieces', 'page');
    return { ok: true, poId: result.poId, poNumero: result.poNumero };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Création ADHOC échouée' };
  }
}
