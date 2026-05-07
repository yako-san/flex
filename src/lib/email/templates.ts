// Templates HTML simples pour les courriels client. Restent inline-safe pour
// les clients mail (Gmail, Outlook, Apple Mail) qui ne supportent pas tous
// les CSS modernes. Les bodies par défaut peuvent être surchargés par
// workshop.emailTemplates (Paramètres → Templates courriel).

import { escapeHtml } from '@/lib/pdf-html/templates/styles';
import {
  renderTemplate,
  DEFAULT_EVAL_BODY,
  DEFAULT_EVAL_SUBJECT,
  DEFAULT_FACTURE_BODY,
  DEFAULT_FACTURE_SUBJECT,
  type EmailTemplates,
} from './render-template';

export type WorkshopBranding = {
  name: string;
  raisonSociale?: string | null;
  logoBase64?: string | null;
  signatureText?: string | null;
};

const E = escapeHtml;

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  color: #1a1a1a;
  line-height: 1.5;
  font-size: 14px;
`;

function shell(opts: { workshop: WorkshopBranding; bodyHtml: string }): string {
  const { workshop, bodyHtml } = opts;
  const logo = workshop.logoBase64
    ? `<img src="${workshop.logoBase64}" alt="${E(workshop.name)}" style="width: 60px; height: 60px; object-fit: contain;" />`
    : '';
  const signature = workshop.signatureText
    ? `<p style="color: #666; font-size: 12px; margin-top: 24px; white-space: pre-wrap;">${E(workshop.signatureText)}</p>`
    : `<p style="color: #666; font-size: 12px; margin-top: 24px;">${E(workshop.raisonSociale ?? workshop.name)}</p>`;
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"></head>
<body style="${baseStyles}">
  <div style="max-width: 580px; margin: 0 auto; padding: 24px;">
    ${logo}
    ${bodyHtml}
    ${signature}
  </div>
</body>
</html>`;
}

function customMessageBlock(msg: string | null | undefined): string {
  if (!msg) return '';
  return `<p style="background: #fafafa; padding: 12px; border-left: 3px solid #1a1a1a; white-space: pre-wrap;">${E(msg)}</p>`;
}

export function evalEmailTemplate(opts: {
  workshop: WorkshopBranding;
  templates?: EmailTemplates;
  clientPrenom: string;
  clientNom?: string | null;
  bdcShortId: string;
  totalEstime: number;
  customMessage?: string | null;
}): string {
  const tpl = opts.templates?.eval?.body || DEFAULT_EVAL_BODY;
  const rendered = renderTemplate(tpl, {
    clientPrenom: opts.clientPrenom,
    clientNom: opts.clientNom ?? '',
    bdcShortId: opts.bdcShortId,
    totalEstime: opts.totalEstime.toFixed(2),
    workshopName: opts.workshop.name,
  });
  return shell({
    workshop: opts.workshop,
    bodyHtml: `${rendered}${customMessageBlock(opts.customMessage)}`,
  });
}

export function evalEmailSubject(opts: {
  templates?: EmailTemplates;
  bdcShortId: string;
  workshopName: string;
}): string {
  const tpl = opts.templates?.eval?.subject || DEFAULT_EVAL_SUBJECT;
  return renderTemplate(tpl, {
    bdcShortId: opts.bdcShortId,
    workshopName: opts.workshopName,
  });
}

export function factureEmailTemplate(opts: {
  workshop: WorkshopBranding;
  templates?: EmailTemplates;
  clientPrenom: string;
  clientNom?: string | null;
  factureNumero: string;
  grandTotal: number;
  modePaiement?: string | null;
  customMessage?: string | null;
}): string {
  const tpl = opts.templates?.facture?.body || DEFAULT_FACTURE_BODY;
  const rendered = renderTemplate(tpl, {
    clientPrenom: opts.clientPrenom,
    clientNom: opts.clientNom ?? '',
    factureNumero: opts.factureNumero,
    grandTotal: opts.grandTotal.toFixed(2),
    modePaiement: opts.modePaiement?.toLowerCase() ?? '',
    workshopName: opts.workshop.name,
  });
  return shell({
    workshop: opts.workshop,
    bodyHtml: `${rendered}${customMessageBlock(opts.customMessage)}`,
  });
}

export function factureEmailSubject(opts: {
  templates?: EmailTemplates;
  factureNumero: string;
  workshopName: string;
}): string {
  const tpl = opts.templates?.facture?.subject || DEFAULT_FACTURE_SUBJECT;
  return renderTemplate(tpl, {
    factureNumero: opts.factureNumero,
    workshopName: opts.workshopName,
  });
}
