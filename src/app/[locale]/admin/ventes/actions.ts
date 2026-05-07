'use server';

import Decimal from 'decimal.js';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { generateId } from '@/lib/ids/generate-id';
import { calcQuebecTaxes, TPS_RATE, TVQ_RATE } from '@/lib/billing/quebec-taxes';
import { recordStockMovement } from '@/lib/stock';

// Création d'une vente directe (vide, items à ajouter ensuite).
const createSchema = z.object({
  clientId: z.string().trim().optional(),
  notes: z.string().optional().nullable(),
});

export type VenteFormState = { error?: string; fieldErrors?: Record<string, string> };

export async function createVenteAction(
  _p: VenteFormState | null,
  formData: FormData,
): Promise<VenteFormState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = createSchema.safeParse({
    clientId: formData.get('clientId') || undefined,
    notes: formData.get('notes') || null,
  });
  if (!parsed.success) return { error: 'Validation' };
  const d = parsed.data;

  const id = generateId('vente');
  await prisma.venteDirecte.create({
    data: {
      id,
      workshopId: workshop.id,
      clientId: d.clientId || null,
      date: new Date(),
      totalPieces: new Prisma.Decimal(0),
      notes: d.notes ?? null,
    },
  });

  revalidatePath('/[locale]/admin/ventes', 'page');
  redirect(`/fr-CA/admin/ventes/${id}`);
}

// Ajout d'un item PIECE à une vente directe (uniquement pièces, pas services).
const addItemSchema = z.object({
  venteId: z.string().trim().min(1),
  pieceId: z.string().trim().min(1, 'Pièce requise'),
  qty: z.coerce.number().positive().default(1),
});

export async function addVenteItemAction(
  _p: VenteFormState | null,
  formData: FormData,
): Promise<VenteFormState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = addItemSchema.safeParse({
    venteId: formData.get('venteId') ?? '',
    pieceId: formData.get('pieceId') ?? '',
    qty: formData.get('qty') ?? 1,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Validation' };
  const { venteId, pieceId, qty } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const vente = await tx.venteDirecte.findFirst({
      where: { id: venteId, workshopId: workshop.id, deletedAt: null },
    });
    if (!vente) throw new Error('Vente introuvable');
    if (vente.factureNumero) {
      throw new Error('Vente déjà facturée — items immutables');
    }

    const piece = await tx.piece.findFirst({
      where: { id: pieceId, workshopId: workshop.id, deletedAt: null },
    });
    if (!piece) throw new Error('Pièce introuvable');

    const last = await tx.venteDirecteItem.findFirst({
      where: { venteId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const position = (last?.position ?? 0) + 1;
    const unitPrice = new Decimal(piece.prixVente.toString());
    const total = unitPrice.times(qty);

    await tx.venteDirecteItem.create({
      data: {
        id: generateId('vdi'),
        venteId,
        pieceId,
        position,
        skuSnapshot: piece.sku ?? null,
        nomSnapshot: piece.nomCanonical,
        qty: new Prisma.Decimal(qty),
        unitPriceSnapshot: new Prisma.Decimal(unitPrice.toString()),
        taxableSnapshot: piece.taxable,
        total: new Prisma.Decimal(total.toString()),
      },
    });

    await recalcTotal(tx, venteId);
  });

  revalidatePath(`/[locale]/admin/ventes/${venteId}`, 'page');
  return {};
}

export async function removeVenteItemAction(itemId: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  let venteId = '';
  try {
    await prisma.$transaction(async (tx) => {
      const item = await tx.venteDirecteItem.findFirst({
        where: { id: itemId, vente: { workshopId: workshop.id } },
        include: { vente: { select: { id: true, factureNumero: true } } },
      });
      if (!item) throw new Error('Item introuvable');
      if (item.vente.factureNumero) throw new Error('Vente déjà facturée — items immutables');
      venteId = item.vente.id;
      await tx.venteDirecteItem.delete({ where: { id: itemId } });
      await recalcTotal(tx, venteId);
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Suppression échouée' };
  }
  revalidatePath(`/[locale]/admin/ventes/${venteId}`, 'page');
  return {};
}

// Émet la facture pour une vente directe : counter, FactureLog VENTE_DIRECTE,
// stock SALE_INVOICED. Idempotent (si déjà facturée, retourne).
export async function emitVenteFactureAction(
  venteId: string,
  modePaiement: 'COMPTANT' | 'INTERAC' | 'CARTE' | 'AUTRE' | null,
): Promise<{ error?: string; factureLogId?: string; factureNumero?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const vente = await tx.venteDirecte.findFirst({
        where: { id: venteId, workshopId: workshop.id, deletedAt: null },
        include: { items: true },
      });
      if (!vente) throw new Error('Vente introuvable');

      const existing = await tx.factureLog.findFirst({
        where: { venteId, workshopId: workshop.id },
      });
      if (existing) {
        return { factureLogId: existing.id, factureNumero: existing.factureNumero };
      }

      if (vente.items.length === 0) throw new Error('Vente vide — ajoute des items');

      const taxLines = vente.items.map((it) => ({
        amount: new Decimal(it.total.toString()),
        taxable: it.taxableSnapshot,
      }));
      const tax = calcQuebecTaxes(taxLines);
      const totalPieces = vente.items
        .reduce((acc, it) => acc.plus(new Decimal(it.total.toString())), new Decimal(0));

      const counter = await tx.counter.findFirst({
        where: { workshopId: workshop.id, kind: 'FACTURE_SEQUENCE' },
      });
      const next = (counter?.current ?? 0) + 1;
      if (counter) {
        await tx.counter.update({ where: { id: counter.id }, data: { current: next } });
      } else {
        await tx.counter.create({
          data: {
            id: generateId('ctr'),
            workshopId: workshop.id,
            kind: 'FACTURE_SEQUENCE',
            prefix: 'V',
            current: next,
          },
        });
      }
      const prefix = counter?.prefix ?? 'V';
      const today = new Date();
      const factureNumero = `${prefix}${String(next).padStart(4, '0')}-${today.toISOString().slice(0, 10)}`;

      const factureLogId = generateId('facture');
      const linesSnapshot = vente.items.map((it) => ({
        position: it.position,
        kind: 'PIECE' as const,
        label: it.nomSnapshot,
        qty: it.qty.toString(),
        unitPrice: it.unitPriceSnapshot.toString(),
        total: it.total.toString(),
        taxable: it.taxableSnapshot,
      }));

      await tx.factureLog.create({
        data: {
          id: factureLogId,
          workshopId: workshop.id,
          type: 'VENTE_DIRECTE',
          factureNumero,
          date: today,
          modePaiement,
          statut: 'EMIS',
          venteId,
          clientId: vente.clientId,
          taxRatesSnapshot: { tps: TPS_RATE.toString(), tvq: TVQ_RATE.toString() } as Prisma.InputJsonValue,
          linesSnapshot: linesSnapshot as unknown as Prisma.InputJsonValue,
          fiscalSnapshot: (workshop.fiscalEntity ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          totalServices: new Prisma.Decimal(0),
          totalPieces: new Prisma.Decimal(totalPieces.toString()),
          sousTotal: new Prisma.Decimal(tax.subtotal.toString()),
          tps: new Prisma.Decimal(tax.tps.toString()),
          tvq: new Prisma.Decimal(tax.tvq.toString()),
          taxes: new Prisma.Decimal(tax.tps.plus(tax.tvq).toString()),
          grandTotal: new Prisma.Decimal(tax.total.toString()),
        },
      });

      await tx.venteDirecte.update({
        where: { id: venteId },
        data: {
          factureNumero,
          factureDate: today,
          modePaiement,
          totalPieces: new Prisma.Decimal(totalPieces.toString()),
        },
      });

      // Stock : sortie physique pour chaque pièce vendue
      for (const it of vente.items) {
        if (!it.pieceId) continue;
        await recordStockMovement(tx, {
          workshopId: workshop.id,
          pieceId: it.pieceId,
          type: 'SALE_INVOICED',
          delta: -Number(it.qty),
          venteItemId: it.id,
          reason: `Sortie stock vente comptoir ${factureNumero}`,
          createdById: userId,
        });
      }

      return { factureLogId, factureNumero };
    });
    revalidatePath(`/[locale]/admin/ventes/${venteId}`, 'page');
    return result;
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Émission échouée' };
  }
}

export async function deleteVenteAction(venteId: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const v = await prisma.venteDirecte.findFirst({
    where: { id: venteId, workshopId: workshop.id, deletedAt: null },
  });
  if (!v) return { error: 'Vente introuvable' };
  if (v.factureNumero) {
    return { error: 'Impossible : vente déjà facturée (mouvements stock liés)' };
  }
  await prisma.venteDirecte.update({
    where: { id: venteId },
    data: { deletedAt: new Date() },
  });
  revalidatePath('/[locale]/admin/ventes', 'page');
  redirect('/fr-CA/admin/ventes');
}

// === Helpers ===
type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function recalcTotal(tx: Tx, venteId: string): Promise<void> {
  const items = await tx.venteDirecteItem.findMany({
    where: { venteId },
    select: { total: true },
  });
  const total = items.reduce((acc, it) => acc.plus(new Decimal(it.total.toString())), new Decimal(0));
  await tx.venteDirecte.update({
    where: { id: venteId },
    data: { totalPieces: new Prisma.Decimal(total.toString()) },
  });
}
