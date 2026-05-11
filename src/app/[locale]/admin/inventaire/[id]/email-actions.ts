'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { sendEmail } from '@/lib/email/send';
import {
  evalEmailTemplate,
  evalEmailSubject,
  factureEmailTemplate,
  factureEmailSubject,
  suiviEmailTemplate,
  suiviEmailSubject,
} from '@/lib/email/templates';
import { getEmailTemplates } from '@/lib/email/render-template';
import { getEmailProvider } from '@/lib/email/client';
import { gmailFromAddress } from '@/lib/email/gmail';
import { loadBdcPdfContext } from '@/lib/pdf-html/load-bdc-context';
import { buildEvalHtml } from '@/lib/pdf-html/templates/eval';
import { buildFactureHtml } from '@/lib/pdf-html/templates/facture';
import { htmlToPdf } from '@/lib/pdf-html/render';
import type { ItemRow } from '@/lib/pdf-html/templates/types';

export type EmailMode = 'send' | 'draft';

export type EmailState = {
  error?: string;
  success?: boolean;
  emailLogId?: string;
  mode?: EmailMode;
};

function fromAddress(workshop: {
  name: string;
  fiscalEntity: unknown;
}): string {
  const f = workshop.fiscalEntity as { courriel?: string; raisonSociale?: string } | null;
  const displayName = f?.raisonSociale ?? workshop.name;

  // Priorité Gmail si configuré : on doit envoyer DEPUIS l'adresse GMAIL_USER
  // (Google bloque les "from spoofing" sauf alias officiels du compte).
  if (getEmailProvider() === 'GMAIL') {
    return gmailFromAddress(displayName);
  }

  // Sinon Resend : on peut configurer EMAIL_FROM custom (domaine vérifié requis).
  const fallback = process.env['EMAIL_FROM'] ?? 'onboarding@resend.dev';
  if (f?.courriel) {
    return `${displayName} <${f.courriel}>`;
  }
  return fallback;
}

// Envoie l'éval BDT par courriel au client (PDF en pièce jointe).
// mode='send' (default) → envoi direct via SMTP/Resend.
// mode='draft' → crée un brouillon dans le Gmail connecté du workshop.
export async function sendEvalEmailAction(
  bdcId: string,
  customMessage: string | null,
  mode: EmailMode = 'send',
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
    notes: ctx.noteClientEval,
  });
  const pdfBuffer = await htmlToPdf(html);

  // Construit le body HTML
  const f = workshop.fiscalEntity as Record<string, string> | null;
  const totalEstime = ctx.totalServices + ctx.totalPieces - ctx.remises;
  const templates = getEmailTemplates(workshop.emailTemplates);
  const clientLang = ctx.client.lang ?? null;
  const veloLabel =
    [ctx.velo.marque, ctx.velo.modele, ctx.velo.couleur].filter(Boolean).join(', ') ||
    `Vélo ${String(ctx.velo.veloNumero).padStart(4, '0')}`;
  const bodyHtml = evalEmailTemplate({
    workshop: {
      name: workshop.name,
      raisonSociale: f?.raisonSociale ?? null,
      logoBase64: workshop.logoBase64 ?? null,
      signatureText: f?.footerText ?? null,
    },
    templates,
    clientLang,
    clientPrenom: ctx.client.prenom,
    clientNom: ctx.client.nom,
    veloNumero: ctx.bdcNumero,
    veloLabel,
    totalEstime,
    noteClient: ctx.noteClientEval,
    items: ctx.items.map((it) => ({
      kind: it.kind,
      label: it.label,
    })),
    customMessage,
    date: new Date(),
  });
  const subject = evalEmailSubject({
    templates,
    clientLang,
    veloNumero: ctx.bdcNumero,
    workshopName: workshop.name,
    date: new Date(),
  });

  const result = await sendEmail({
    workshopId: workshop.id,
    kind: 'BDT_EVAL',
    to: ctx.client.courriel,
    from: fromAddress(workshop),
    subject,
    html: bodyHtml,
    attachments: [
      { filename: `eval-${bdcId.slice(-4)}.pdf`, content: pdfBuffer },
    ],
    bdcId,
    createdById: userId,
    mode,
    googleRefreshToken: workshop.googleRefreshToken,
  });

  if (!result.ok) return { error: result.error, emailLogId: result.emailLogId };

  // Marque l'éval comme envoyée (que ce soit un draft ou un envoi direct —
  // dans les 2 cas l'utilisateur a "fait l'action" pour cet éval).
  await prisma.bdc.update({
    where: { id: bdcId },
    data: { cbEvalEnvoye: true },
  });

  revalidatePath(`/[locale]/admin/bdcs/${bdcId}`, 'page');
  return { success: true, emailLogId: result.emailLogId, mode };
}

// Envoie la facture par courriel au client (PDF en pièce jointe).
export async function sendFactureEmailAction(
  factureLogId: string,
  customMessage: string | null,
  mode: EmailMode = 'send',
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
      lang: client.lang,
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

  const templates = getEmailTemplates(workshop.emailTemplates);
  const clientLang = client.lang ?? null;
  const veloNumero = velo?.veloNumero ?? null;
  const veloLabel = velo
    ? [velo.marque, velo.modele, velo.couleur].filter(Boolean).join(', ') ||
      `Vélo ${String(velo.veloNumero).padStart(4, '0')}`
    : null;
  const bodyHtml = factureEmailTemplate({
    workshop: {
      name: workshop.name,
      raisonSociale: fiscalEntity?.['raisonSociale'] ?? null,
      logoBase64: workshop.logoBase64 ?? null,
      signatureText: fiscalEntity?.['footerText'] ?? null,
    },
    templates,
    clientLang,
    clientPrenom: client.prenom,
    clientNom: client.nom,
    factureNumero: facture.factureNumero,
    veloNumero,
    veloLabel,
    grandTotal: Number(facture.grandTotal),
    modePaiement: facture.modePaiement,
    customMessage,
    date: facture.date,
  });
  const subject = factureEmailSubject({
    templates,
    clientLang,
    factureNumero: facture.factureNumero,
    veloNumero,
    workshopName: workshop.name,
    date: facture.date,
  });

  const result = await sendEmail({
    workshopId: workshop.id,
    kind: 'BDT_FACTURE',
    to: client.courriel,
    from: fromAddress(workshop),
    subject,
    html: bodyHtml,
    attachments: [
      { filename: `${facture.factureNumero}.pdf`, content: pdfBuffer },
    ],
    factureLogId,
    bdcId: facture.bdcId,
    clientId: facture.clientId,
    createdById: userId,
    mode,
    googleRefreshToken: workshop.googleRefreshToken,
  });

  if (!result.ok) return { error: result.error, emailLogId: result.emailLogId };

  if (facture.bdcId) {
    revalidatePath(`/[locale]/admin/bdcs/${facture.bdcId}`, 'page');
  }
  return { success: true, emailLogId: result.emailLogId, mode };
}

// Envoie un courriel de suivi post-livraison au client (sans PDF en pièce
// jointe). Utilise le template courrielSuivi (subject + body) avec
// fallback aux defaults V2. Marque Bdc.cbSuiviEnvoye=true à l'envoi
// réussi (visible dans la liste des suivis envoyés / à envoyer).
export async function sendSuiviEmailAction(
  bdcId: string,
  customMessage: string | null,
  mode: EmailMode = 'send',
): Promise<EmailState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const bdc = await prisma.bdc.findFirst({
    where: { id: bdcId, workshopId: workshop.id, deletedAt: null },
    include: {
      velo: {
        include: {
          client: { select: { prenom: true, nom: true, courriel: true, lang: true } },
          marque: { select: { nom: true } },
        },
      },
    },
  });
  if (!bdc) return { error: 'BDT introuvable' };
  if (!bdc.velo.client?.courriel) {
    return { error: "Le client n'a pas de courriel renseigné" };
  }

  const f = workshop.fiscalEntity as Record<string, string> | null;
  const templates = getEmailTemplates(workshop.emailTemplates);
  const veloLabel =
    [bdc.velo.marque?.nom, bdc.velo.modele].filter(Boolean).join(' ') || 'vélo';

  const bodyHtml = suiviEmailTemplate({
    workshop: {
      name: workshop.name,
      raisonSociale: f?.raisonSociale ?? null,
      logoBase64: workshop.logoBase64 ?? null,
      signatureText: f?.footerText ?? null,
    },
    templates,
    clientLang: bdc.velo.client.lang,
    clientPrenom: bdc.velo.client.prenom,
    clientNom: bdc.velo.client.nom,
    veloLabel,
    customMessage,
  });
  const subject = suiviEmailSubject({
    templates,
    clientLang: bdc.velo.client.lang,
    workshopName: workshop.name,
  });

  const result = await sendEmail({
    workshopId: workshop.id,
    kind: 'BDT_SUIVI',
    to: bdc.velo.client.courriel,
    from: fromAddress(workshop),
    subject,
    html: bodyHtml,
    bdcId,
    createdById: userId,
    mode,
    googleRefreshToken: workshop.googleRefreshToken,
  });

  if (!result.ok) return { error: result.error, emailLogId: result.emailLogId };

  await prisma.bdc.update({
    where: { id: bdcId },
    data: { cbSuiviEnvoye: true },
  });

  revalidatePath(`/[locale]/admin/bdcs/${bdcId}`, 'page');
  return { success: true, emailLogId: result.emailLogId, mode };
}
