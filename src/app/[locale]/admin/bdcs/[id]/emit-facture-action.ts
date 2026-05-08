'use server';

import Decimal from 'decimal.js';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { generateId } from '@/lib/ids/generate-id';
import { calcQuebecTaxes, TPS_RATE, TVQ_RATE } from '@/lib/billing/quebec-taxes';
import { recordStockMovement } from '@/lib/stock';

// Émet la facture pour un BDT : crée FactureLog (immutable), incrémente
// le counter FACTURE_SEQUENCE, met l'archive_status à ARCHIVE_FACTURE.
//
// Si une FactureLog existe déjà pour ce BDT, on n'en crée pas une nouvelle :
// la facture est immutable. Pour annuler, il faudra émettre une note de crédit
// (Phase ultérieure).
export async function emitFactureAction(
  bdcId: string,
  modePaiement: 'COMPTANT' | 'INTERAC' | 'CARTE' | 'AUTRE' | null,
): Promise<{ error?: string; factureLogId?: string; factureNumero?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const bdc = await tx.bdc.findFirst({
        where: { id: bdcId, workshopId: workshop.id, deletedAt: null },
        include: {
          velo: { include: { client: true } },
          items: { orderBy: { position: 'asc' } },
        },
      });
      if (!bdc) throw new Error('BDT introuvable');

      // Idempotence : si une facture existe déjà, retourne-la.
      const existing = await tx.factureLog.findFirst({
        where: { bdcId, workshopId: workshop.id },
      });
      if (existing) {
        return { factureLogId: existing.id, factureNumero: existing.factureNumero };
      }

      if (bdc.items.length === 0) {
        throw new Error('Impossible de facturer un BDT sans items');
      }

      // Sous-totaux pre-remise
      const totalServicesGross = bdc.items
        .filter((it) => it.kind === 'SERVICE' || it.kind === 'FORFAIT')
        .reduce((acc, it) => acc.plus(new Decimal(it.total.toString())), new Decimal(0));
      const totalPiecesGross = bdc.items
        .filter((it) => it.kind === 'PIECE')
        .reduce((acc, it) => acc.plus(new Decimal(it.total.toString())), new Decimal(0));

      // Application des remises (PCT ou FIXED) services + pièces
      const remSvcVal = bdc.remiseSvcValue ? new Decimal(bdc.remiseSvcValue.toString()) : null;
      const remPceVal = bdc.remisePceValue ? new Decimal(bdc.remisePceValue.toString()) : null;
      const totalServices =
        remSvcVal && bdc.remiseSvcType === 'PCT'
          ? totalServicesGross.times(new Decimal(1).minus(remSvcVal.div(100)))
          : remSvcVal && bdc.remiseSvcType === 'FIXED'
            ? Decimal.max(0, totalServicesGross.minus(remSvcVal))
            : totalServicesGross;
      const totalPieces =
        remPceVal && bdc.remisePceType === 'PCT'
          ? totalPiecesGross.times(new Decimal(1).minus(remPceVal.div(100)))
          : remPceVal && bdc.remisePceType === 'FIXED'
            ? Decimal.max(0, totalPiecesGross.minus(remPceVal))
            : totalPiecesGross;
      const remisesAmount = totalServicesGross
        .plus(totalPiecesGross)
        .minus(totalServices.plus(totalPieces));

      // Calcul taxes Québec : on répartit la remise au prorata sur les items
      // taxables vs non-taxables. Approche simple : on applique la remise
      // proportionnellement aux items du même groupe (svc/pce) en gardant
      // leur ratio taxable.
      const ratio = (g: Decimal, n: Decimal): Decimal =>
        g.isZero() ? new Decimal(1) : n.div(g);
      const ratioSvc = ratio(totalServicesGross, totalServices);
      const ratioPce = ratio(totalPiecesGross, totalPieces);
      const taxLines = bdc.items.map((it) => {
        const isSvc = it.kind === 'SERVICE' || it.kind === 'FORFAIT';
        const r = isSvc ? ratioSvc : ratioPce;
        return {
          amount: new Decimal(it.total.toString()).times(r),
          taxable: it.taxableSnapshot,
        };
      });
      const tax = calcQuebecTaxes(taxLines);

      // Increment counter FACTURE_SEQUENCE
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
            prefix: 'F',
            current: next,
          },
        });
      }

      const prefix = counter?.prefix ?? 'F';
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10);
      const factureNumero = `${prefix}${String(next).padStart(4, '0')}-${dateStr}`;

      const factureLogId = generateId('facture');
      const linesSnapshot = bdc.items.map((it) => ({
        position: it.position,
        kind: it.kind,
        label: it.labelSnapshot,
        qty: it.qty.toString(),
        unitPrice: it.unitPriceSnapshot.toString(),
        total: it.total.toString(),
        taxable: it.taxableSnapshot,
      }));

      await tx.factureLog.create({
        data: {
          id: factureLogId,
          workshopId: workshop.id,
          type: 'BDC',
          factureNumero,
          date: today,
          modePaiement,
          statut: 'EMIS',
          bdcId,
          clientId: bdc.velo.client?.id ?? null,
          taxRatesSnapshot: { tps: TPS_RATE.toString(), tvq: TVQ_RATE.toString() } as Prisma.InputJsonValue,
          linesSnapshot: linesSnapshot as unknown as Prisma.InputJsonValue,
          fiscalSnapshot: (workshop.fiscalEntity ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          totalServices: new Prisma.Decimal(totalServices.toString()),
          totalPieces: new Prisma.Decimal(totalPieces.toString()),
          sousTotal: new Prisma.Decimal(tax.subtotal.toString()),
          tps: new Prisma.Decimal(tax.tps.toString()),
          tvq: new Prisma.Decimal(tax.tvq.toString()),
          taxes: new Prisma.Decimal(tax.tps.plus(tax.tvq).toString()),
          grandTotal: new Prisma.Decimal(tax.total.toString()),
          // Snapshot de la note client visible facture au moment de l'émission.
          // FactureLog est immutable, donc on fige le texte ici.
          notes: bdc.noteClientFacture ?? null,
        },
      });

      // Marque le BDT comme archivé/facturé
      await tx.bdc.update({
        where: { id: bdcId },
        data: { archiveStatus: 'ARCHIVE_FACTURE', cbArchiver: true },
      });

      // Mouvements de stock : pour chaque pièce du BDT, on libère la
      // réservation (RELEASE) et on décrémente le stock physique
      // (BDC_INVOICED).
      for (const item of bdc.items) {
        if (item.kind !== 'PIECE' || !item.pieceId) continue;
        const qty = Number(item.qty);
        await recordStockMovement(tx, {
          workshopId: workshop.id,
          pieceId: item.pieceId,
          type: 'RELEASE',
          delta: -qty,
          bdcItemId: item.id,
          reason: `Libération réservation suite à facturation ${factureNumero}`,
          createdById: userId,
        });
        await recordStockMovement(tx, {
          workshopId: workshop.id,
          pieceId: item.pieceId,
          type: 'BDC_INVOICED',
          delta: -qty,
          bdcItemId: item.id,
          reason: `Sortie stock suite à facturation ${factureNumero}`,
          createdById: userId,
        });
      }

      return { factureLogId, factureNumero };
    });

    revalidatePath(`/[locale]/admin/bdcs/${bdcId}`, 'page');
    return result;
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Erreur d\'émission',
    };
  }
}
