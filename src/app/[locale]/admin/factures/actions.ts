'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';

const schema = z.object({
  factureLogId: z.string().trim().min(1),
  statut: z.enum(['EMIS', 'PAYE', 'ANNULE']),
  modePaiement: z.enum(['COMPTANT', 'INTERAC', 'CARTE', 'AUTRE']).optional().nullable(),
});

export type FactureStatutResult = { error?: string; ok?: boolean };

// Met à jour le statut d'une facture (EMIS / PAYE / ANNULE) et
// optionnellement le mode de paiement. La facture reste IMMUTABLE pour
// le contenu (lignes, totaux, taxes) — seul le statut/mode/note évolue.
//
// Équivalent V1 : POST /api/factures/log-status
export async function setFactureStatutAction(
  factureLogId: string,
  statut: 'EMIS' | 'PAYE' | 'ANNULE',
  modePaiement: 'COMPTANT' | 'INTERAC' | 'CARTE' | 'AUTRE' | null,
): Promise<FactureStatutResult> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = schema.safeParse({ factureLogId, statut, modePaiement });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Validation' };

  const facture = await prisma.factureLog.findFirst({
    where: { id: factureLogId, workshopId: workshop.id },
    select: { id: true, bdcId: true, venteId: true, clientId: true, statut: true },
  });
  if (!facture) return { error: 'Facture introuvable' };

  await prisma.factureLog.update({
    where: { id: facture.id },
    data: {
      statut: parsed.data.statut,
      ...(parsed.data.modePaiement !== undefined
        ? { modePaiement: parsed.data.modePaiement }
        : {}),
    },
  });

  // Revalidate les pages liées (BDT, vente, client) pour refléter le changement.
  if (facture.bdcId) {
    revalidatePath(`/[locale]/admin/bdcs/${facture.bdcId}`, 'page');
  }
  if (facture.venteId) {
    revalidatePath(`/[locale]/admin/ventes/${facture.venteId}`, 'page');
  }
  if (facture.clientId) {
    revalidatePath(`/[locale]/admin/clients/${facture.clientId}`, 'page');
  }

  return { ok: true };
}
