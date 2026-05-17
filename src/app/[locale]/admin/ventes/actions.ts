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

// Ajout d'un item à une vente directe. Accepte PIECE (catalogue, décrémente
// stock à la facturation) ou SERVICE (pas de stock). Le `itemRef` au format
// `kind:id` (ex `piece:pce_123`, `service:srv_456`) est parsé ici plutôt que
// d'avoir 2 actions distinctes — V1 utilise le même picker pour les deux.
// Cluster 4 item n (PR V1 #7).
//
// `prixOverride` (cluster 4 item o, PR V1 #8) : si fourni, écrase le prix
// catalogue. Cas typique = 0 via bouton 🆓 « inclus » pour décrémenter
// le stock d'une pièce sans la facturer (forfait flat fixed-price).
const addItemSchema = z.object({
  venteId: z.string().trim().min(1),
  itemRef: z
    .string()
    .regex(/^(piece|service):.+$/, 'Format attendu : kind:id'),
  qty: z.coerce.number().positive().default(1),
  prixOverride: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? undefined : Number(v)))
    .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0), {
      message: 'Prix invalide',
    }),
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
    itemRef: formData.get('itemRef') ?? '',
    qty: formData.get('qty') ?? 1,
    prixOverride: formData.get('prixOverride') ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Validation' };
  const { venteId, itemRef, qty, prixOverride } = parsed.data;

  const [kind, refId] = itemRef.split(':', 2) as ['piece' | 'service', string];

  await prisma.$transaction(async (tx) => {
    const vente = await tx.venteDirecte.findFirst({
      where: { id: venteId, workshopId: workshop.id, deletedAt: null },
    });
    if (!vente) throw new Error('Vente introuvable');
    if (vente.factureNumero) {
      throw new Error('Vente déjà facturée — items immutables');
    }

    // Snapshot dépend du kind. Pour SERVICE, pas de FK pieceId (null).
    let snapshot: {
      pieceId: string | null;
      nom: string;
      sku: string | null;
      unitPrice: Decimal;
      taxable: boolean;
    };
    if (kind === 'service') {
      const service = await tx.service.findFirst({
        where: { id: refId, workshopId: workshop.id, deletedAt: null },
      });
      if (!service) throw new Error('Service introuvable');
      snapshot = {
        pieceId: null,
        nom: service.labelCanonical,
        sku: service.legacyCode ?? null,
        unitPrice: new Decimal(service.prix.toString()),
        taxable: service.taxable,
      };
    } else {
      const piece = await tx.piece.findFirst({
        where: { id: refId, workshopId: workshop.id, deletedAt: null },
      });
      if (!piece) throw new Error('Pièce introuvable');
      snapshot = {
        pieceId: piece.id,
        nom: piece.nomCanonical,
        sku: piece.sku ?? null,
        unitPrice: new Decimal(piece.prixVente.toString()),
        taxable: piece.taxable,
      };
    }

    // Override prix (bouton 🆓) — utilisé pour les pièces incluses dans
    // un forfait fixe. Compatible aussi sur services si jamais utile.
    const unitPrice =
      prixOverride !== undefined ? new Decimal(prixOverride) : snapshot.unitPrice;
    const total = unitPrice.times(qty);

    const last = await tx.venteDirecteItem.findFirst({
      where: { venteId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const position = (last?.position ?? 0) + 1;

    await tx.venteDirecteItem.create({
      data: {
        id: generateId('vdi'),
        venteId,
        pieceId: snapshot.pieceId,
        position,
        skuSnapshot: snapshot.sku,
        nomSnapshot: snapshot.nom,
        qty: new Prisma.Decimal(qty),
        unitPriceSnapshot: new Prisma.Decimal(unitPrice.toString()),
        taxableSnapshot: snapshot.taxable,
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

/**
 * Marque ou démarque une vente facturée comme payée (cluster 4 item m).
 * Refuse si la vente n'est pas facturée ; toggle binaire (paidAt = NOW()
 * ou null). Optimiste côté UI via React 19 useOptimistic.
 */
export async function markVentePayeeAction(
  venteId: string,
  paid: boolean,
): Promise<{ error?: string; paidAt?: string | null }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const v = await prisma.venteDirecte.findFirst({
    where: { id: venteId, workshopId: workshop.id, deletedAt: null },
    select: { id: true, factureNumero: true },
  });
  if (!v) return { error: 'Vente introuvable' };
  if (!v.factureNumero) {
    return { error: 'Vente non facturée — marque-la facturée d\'abord' };
  }

  const paidAt = paid ? new Date() : null;
  await prisma.venteDirecte.update({
    where: { id: venteId },
    data: { paidAt },
  });
  revalidatePath('/[locale]/admin/ventes', 'page');
  revalidatePath(`/[locale]/admin/ventes/${venteId}`, 'page');
  return { paidAt: paidAt ? paidAt.toISOString() : null };
}

/**
 * Archive une vente directe (soft-delete) — autorisée uniquement si la
 * vente est facturée ET payée. Préserve les mouvements de stock liés.
 * Pour les ventes non facturées, utiliser `deleteVenteAction`.
 */
export async function archiveVenteAction(venteId: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const v = await prisma.venteDirecte.findFirst({
    where: { id: venteId, workshopId: workshop.id, deletedAt: null },
    select: { id: true, factureNumero: true, paidAt: true },
  });
  if (!v) return { error: 'Vente introuvable' };
  if (!v.factureNumero) {
    return { error: 'Vente non facturée — utilise « Supprimer » à la place' };
  }
  if (!v.paidAt) {
    return { error: 'Marque la vente comme payée avant d\'archiver' };
  }

  await prisma.venteDirecte.update({
    where: { id: venteId },
    data: { deletedAt: new Date() },
  });
  revalidatePath('/[locale]/admin/ventes', 'page');
  return {};
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
