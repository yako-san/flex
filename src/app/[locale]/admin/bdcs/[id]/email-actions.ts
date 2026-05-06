'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { sendEmail } from '@/lib/email/send';
import { evalEmailTemplate, factureEmailTemplate } from '@/lib/email/templates';
import { loadBdcPdfContext } from '@/lib/pdf-html/load-bdc-context';
import { buildEvalHtml } from '@/lib/pdf-html/templates/eval';
import { buildFactureHtml } from '@/lib/pdf-html/templates/facture';
import { htmlToPdf } from '@/lib/pdf-html/render';
import type { ItemRow } from '@/lib/pdf-html/templates/types';

export type EmailState = { error?: string; success?: boolean; emailLogId?: string };

function fromAddress(workshop: {
  name: string;
  fiscalEntity: unknown;
}): string {
  const f = workshop.fiscalEntity as { courriel?: string; raisonSociale?: string } | null;
  // Si courriel configuré dans fiscal, on l'utilise. Sinon Resend default.
  // Note: Resend exige soit un domaine vérifié, soit utilise onboarding@resend.dev en dev.
  const fallback = process.env['EMAIL_FROM'] ?? 'onboarding@resend.dev';
  if (f?.courriel) {
    const displayName = f.raisonSociale ?? workshop.name;
    return `${displayName} <${f.courriel}>`;
  }
  return fallback;
}

// Envoie l'éval BDT par courriel au client (PDF en pièce jointe).
export async function sendEvalEmailAction(
  bdcId: string,
  customMessage: string | null,
): Promise<EmailState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const ctx = await loadBdcPdfContext(workshop, bdcId);
  if (!ctx) return { error: 'BDT introuvable' };
  if (!ctx.client.courriel) return { error: 'Le client n\'a pas de courriel renseigné' };

  // Génère le PDF
  const html = buildEvalHtml({
    workshop: ctx.workshop,
    client: ctx.client,
    velo: ctx.velo,
    bdcId: ctx.bdcId,
    date: new Date(),
    items: ctx.items,
    totalServices: ctx.totalServices,
    totalPieces: ctx.totalPieces,
    remises: ctx.remises,
    notes: ctx.notes,
  });
  const pdfBuffer = await htmlToPdf(html);

  // Construit le body HTML
  const f = workshop.fiscalEntity as Record<string, string> | null;
  const totalEstime = ctx.totalServices + ctx.totalPieces - ctx.remises;
  const bodyHtml = evalEmailTemplate({
    workshop: {
      name: workshop.name,
      raisonSociale: f?.raisonSociale ?? null,
      logoBase64: workshop.logoBase64 ?? null,
      signatureText: f?.footerText ?? null,
    },
    clientPrenom: ctx.client.prenom,
    bdcShortId: bdcId.slice(-4),
    totalEstime,
    customMessage,
  });

  const result = await sendEmail({
    workshopId: workshop.id,
    kind: 'BDT_EVAL',
    to: ctx.client.courriel,
    from: fromAddress(workshop),
    subject: `Évaluation pour votre vélo — BDT ${bdcId.slice(-4)}`,
    html: bodyHtml,
    attachments: [
      { filename: `eval-${bdcId.slice(-4)}.pdf`, content: pdfBuffer },
    ],
    bdcId,
    createdById: userId,
  });

  if (!result.ok) return { error: result.error, emailLogId: result.emailLogId };

  // Marque l'éval comme envoyée
  await prisma.bdc.update({
    where: { id: bdcId },
    data: { cbEvalEnvoye: true },
  });

  revalidatePath(`/[locale]/admin/bdcs/${bdcId}`, 'page');
  return { success: true, emailLogId: result.emailLogId };
}

// Envoie la facture par courriel au client (PDF en pièce jointe).
export async function sendFactureEmailAction(
  factureLogId: string,
  customMessage: string | null,
): Promise<EmailState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const facture = await prisma.factureLog.findFirst({
    where: { id: factureLogId, workshopId: workshop.id },
  });
  if (!facture) return { error: 'Facture introuvable' };

  const client = facture.clientId
    ? await prisma.client.findUnique({ where: { id: facture.clientId } })
    : null;
  if (!client?.courriel) return { error: 'Le client n\'a pas de courriel renseigné' };

  // Charge le vélo si BDT
  let velo = null;
  if (facture.bdcId) {
    const bdc = await prisma.bdc.findUnique({
      where: { id: facture.bdcId },
      include: { velo: { include: { marque: true } } },
    });
    if (bdc?.velo) {
      velo = {
        veloNumero: bdc.velo.veloNumero,
        marque: bdc.velo.marque?.nom ?? null,
        modele: bdc.velo.modele,
        couleur: bdc.velo.couleur,
        taille: bdc.velo.taille,
        numeroSerie: bdc.velo.numeroSerie,
      };
    }
  }

  const fiscalEntity = (workshop.fiscalEntity as Record<string, string> | null) ?? null;
  const lines = (facture.linesSnapshot as unknown as Array<{
    position: number;
    kind: 'SERVICE' | 'PIECE' | 'FORFAIT';
    label: string;
    qty: string;
    unitPrice: string;
    total: string;
  }>) ?? [];
  const items: ItemRow[] = lines.map((l) => ({
    position: l.position,
    kind: l.kind,
    label: l.label,
    sku: null,
    qty: Number(l.qty),
    unitPrice: Number(l.unitPrice),
    total: Number(l.total),
  }));

  const html = buildFactureHtml({
    workshop: {
      name: workshop.name,
      logoBase64: workshop.logoBase64 ?? null,
      fiscalEntity,
    },
    client: {
      prenom: client.prenom,
      nom: client.nom,
      telephone: client.telephone,
      indicatif: client.indicatif,
      courriel: client.courriel,
    },
    velo,
    factureNumero: facture.factureNumero,
    date: facture.date,
    items,
    totals: {
      totalServices: Number(facture.totalServices),
      totalPieces: Number(facture.totalPieces),
      sousTotal: Number(facture.sousTotal),
      tps: Number(facture.tps),
      tvq: Number(facture.tvq),
      grandTotal: Number(facture.grandTotal),
    },
    modePaiement: facture.modePaiement,
    notes: facture.notes,
  });
  const pdfBuffer = await htmlToPdf(html);

  const bodyHtml = factureEmailTemplate({
    workshop: {
      name: workshop.name,
      raisonSociale: fiscalEntity?.['raisonSociale'] ?? null,
      logoBase64: workshop.logoBase64 ?? null,
      signatureText: fiscalEntity?.['footerText'] ?? null,
    },
    clientPrenom: client.prenom,
    factureNumero: facture.factureNumero,
    grandTotal: Number(facture.grandTotal),
    modePaiement: facture.modePaiement,
    customMessage,
  });

  const result = await sendEmail({
    workshopId: workshop.id,
    kind: 'BDT_FACTURE',
    to: client.courriel,
    from: fromAddress(workshop),
    subject: `Facture ${facture.factureNumero}`,
    html: bodyHtml,
    attachments: [
      { filename: `${facture.factureNumero}.pdf`, content: pdfBuffer },
    ],
    factureLogId,
    bdcId: facture.bdcId,
    clientId: facture.clientId,
    createdById: userId,
  });

  if (!result.ok) return { error: result.error, emailLogId: result.emailLogId };

  if (facture.bdcId) {
    revalidatePath(`/[locale]/admin/bdcs/${facture.bdcId}`, 'page');
  }
  return { success: true, emailLogId: result.emailLogId };
}
