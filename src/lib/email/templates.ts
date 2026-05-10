// Templates HTML simples pour les courriels client. Restent inline-safe pour
// les clients mail (Gmail, Outlook, Apple Mail) qui ne supportent pas tous
// les CSS modernes. Les bodies par défaut peuvent être surchargés par
// workshop.emailTemplates (Paramètres → Templates courriel) — multi-locale
// FR + EN, sélection automatique selon Client.lang.
//
// Pas de logo intégré dans le HTML : V1 = email texte simple, le client mail
// (Gmail, etc.) ajoute déjà la signature de l'expéditeur. Évite la
// duplication visuelle. Le sujet et le corps peuvent contenir des
// placeholders V1 ({{prenom}}, {{id}}, {{date}}, {{veloDesc}},
// {{services}}, {{pieces}}, {{noteClient}}, {{clientNom}}) qui sont
// remplacés au rendu.

import { escapeHtml } from '@/lib/pdf-html/templates/styles';
import {
  renderTemplate,
  nl2br,
  pickLocale,
  DEFAULT_EVAL_BODY_FR,
  DEFAULT_EVAL_BODY_EN,
  DEFAULT_EVAL_SUBJECT_FR,
  DEFAULT_EVAL_SUBJECT_EN,
  DEFAULT_FACTURE_BODY_FR,
  DEFAULT_FACTURE_BODY_EN,
  DEFAULT_FACTURE_SUBJECT_FR,
  DEFAULT_FACTURE_SUBJECT_EN,
  DEFAULT_SUIVI_BODY_FR,
  DEFAULT_SUIVI_BODY_EN,
  DEFAULT_SUIVI_SUBJECT_FR,
  DEFAULT_SUIVI_SUBJECT_EN,
  type EmailTemplates,
  type Locale,
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

// Shell minimal — pas de logo (V1 pattern). La signature workshop reste,
// mais le client mail ajoutera aussi sa propre signature.
function shell(opts: { workshop: WorkshopBranding; bodyHtml: string }): string {
  const { workshop, bodyHtml } = opts;
  const signature = workshop.signatureText
    ? `<p style="color: #666; font-size: 12px; margin-top: 24px; white-space: pre-wrap;">${E(workshop.signatureText)}</p>`
    : '';
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"></head>
<body style="${baseStyles}">
  <div style="max-width: 580px; margin: 0 auto; padding: 16px;">
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

// Sélection locale : Client.lang en V2 = 'fr-CA' / 'en-CA' (BCP 47),
// V1 = 'FR' / 'EN'. On normalise vers 'fr' / 'en'.
function normalizeLocale(raw: string | null | undefined): Locale {
  if (!raw) return 'fr';
  const lower = raw.toLowerCase();
  if (lower.startsWith('en')) return 'en';
  return 'fr';
}

// Format date courte locale (fr-CA / en-CA).
function formatDate(d: Date, locale: Locale): string {
  return d.toLocaleDateString(locale === 'en' ? 'en-CA' : 'fr-CA');
}

// Construit la liste HTML des services et pièces à partir des items du BDT.
// Format : 1 item par ligne, format "• Nom — qty × prix = total".
function formatItemsList(
  items: Array<{ kind: 'SERVICE' | 'PIECE' | 'FORFAIT'; label: string; qty: number; total: number }>,
  filterKind: 'SERVICE_OR_FORFAIT' | 'PIECE',
): string {
  const filtered = items.filter((it) =>
    filterKind === 'PIECE' ? it.kind === 'PIECE' : it.kind === 'SERVICE' || it.kind === 'FORFAIT',
  );
  if (filtered.length === 0) return '';
  const lines = filtered.map((it) => {
    const qtyTxt = it.qty !== 1 ? `${it.qty} × ` : '';
    return `• ${E(it.label)} — ${qtyTxt}${it.total.toFixed(2)} $`;
  });
  return lines.join('<br />');
}

export function evalEmailTemplate(opts: {
  workshop: WorkshopBranding;
  templates?: EmailTemplates;
  clientLang?: string | null;
  clientPrenom: string;
  clientNom?: string | null;
  bdcShortId: string;
  veloLabel?: string | null;
  totalEstime: number;
  noteClient?: string | null;
  items?: Array<{ kind: 'SERVICE' | 'PIECE' | 'FORFAIT'; label: string; qty: number; total: number }>;
  customMessage?: string | null;
  date?: Date;
}): string {
  const locale = normalizeLocale(opts.clientLang);
  const fallback = locale === 'en' ? DEFAULT_EVAL_BODY_EN : DEFAULT_EVAL_BODY_FR;
  const tpl = pickLocale(opts.templates?.eval?.body, locale) || fallback;
  const date = opts.date ?? new Date();
  const items = opts.items ?? [];
  const rendered = nl2br(
    renderTemplate(tpl, {
      // V2 names (legacy)
      clientPrenom: opts.clientPrenom,
      clientNom: opts.clientNom ?? '',
      bdcShortId: opts.bdcShortId,
      totalEstime: opts.totalEstime.toFixed(2),
      workshopName: opts.workshop.name,
      // V1 names (depuis dump.templates)
      prenom: opts.clientPrenom,
      veloDesc: opts.veloLabel ?? '',
      id: opts.bdcShortId,
      date: formatDate(date, locale),
      noteClient: opts.noteClient ?? '',
      services: formatItemsList(items, 'SERVICE_OR_FORFAIT'),
      pieces: formatItemsList(items, 'PIECE'),
    }),
  );
  return shell({
    workshop: opts.workshop,
    bodyHtml: `${rendered}${customMessageBlock(opts.customMessage)}`,
  });
}

export function evalEmailSubject(opts: {
  templates?: EmailTemplates;
  clientLang?: string | null;
  bdcShortId: string;
  workshopName: string;
  date?: Date;
}): string {
  const locale = normalizeLocale(opts.clientLang);
  const fallback = locale === 'en' ? DEFAULT_EVAL_SUBJECT_EN : DEFAULT_EVAL_SUBJECT_FR;
  const tpl = pickLocale(opts.templates?.eval?.subject, locale) || fallback;
  const date = opts.date ?? new Date();
  return renderTemplate(tpl, {
    bdcShortId: opts.bdcShortId,
    workshopName: opts.workshopName,
    id: opts.bdcShortId,
    date: formatDate(date, locale),
  });
}

export function factureEmailTemplate(opts: {
  workshop: WorkshopBranding;
  templates?: EmailTemplates;
  clientLang?: string | null;
  clientPrenom: string;
  clientNom?: string | null;
  factureNumero: string;
  grandTotal: number;
  modePaiement?: string | null;
  customMessage?: string | null;
  date?: Date;
}): string {
  const locale = normalizeLocale(opts.clientLang);
  const fallback = locale === 'en' ? DEFAULT_FACTURE_BODY_EN : DEFAULT_FACTURE_BODY_FR;
  const tpl = pickLocale(opts.templates?.facture?.body, locale) || fallback;
  const date = opts.date ?? new Date();
  const rendered = nl2br(
    renderTemplate(tpl, {
      clientPrenom: opts.clientPrenom,
      clientNom: opts.clientNom ?? '',
      factureNumero: opts.factureNumero,
      grandTotal: opts.grandTotal.toFixed(2),
      modePaiement: opts.modePaiement?.toLowerCase() ?? '',
      workshopName: opts.workshop.name,
      // V1 names
      prenom: opts.clientPrenom,
      id: opts.factureNumero,
      date: formatDate(date, locale),
    }),
  );
  return shell({
    workshop: opts.workshop,
    bodyHtml: `${rendered}${customMessageBlock(opts.customMessage)}`,
  });
}

export function factureEmailSubject(opts: {
  templates?: EmailTemplates;
  clientLang?: string | null;
  factureNumero: string;
  workshopName: string;
  date?: Date;
}): string {
  const locale = normalizeLocale(opts.clientLang);
  const fallback = locale === 'en' ? DEFAULT_FACTURE_SUBJECT_EN : DEFAULT_FACTURE_SUBJECT_FR;
  const tpl = pickLocale(opts.templates?.facture?.subject, locale) || fallback;
  const date = opts.date ?? new Date();
  return renderTemplate(tpl, {
    factureNumero: opts.factureNumero,
    workshopName: opts.workshopName,
    id: opts.factureNumero,
    date: formatDate(date, locale),
  });
}

export function suiviEmailTemplate(opts: {
  workshop: WorkshopBranding;
  templates?: EmailTemplates;
  clientLang?: string | null;
  clientPrenom: string;
  clientNom?: string | null;
  veloLabel?: string | null;
  customMessage?: string | null;
  date?: Date;
}): string {
  const locale = normalizeLocale(opts.clientLang);
  const fallback = locale === 'en' ? DEFAULT_SUIVI_BODY_EN : DEFAULT_SUIVI_BODY_FR;
  const tpl = pickLocale(opts.templates?.courrielSuivi?.body, locale) || fallback;
  const date = opts.date ?? new Date();
  const rendered = nl2br(
    renderTemplate(tpl, {
      clientPrenom: opts.clientPrenom,
      clientNom: opts.clientNom ?? '',
      veloLabel: opts.veloLabel ?? '',
      workshopName: opts.workshop.name,
      // V1 names
      prenom: opts.clientPrenom,
      veloDesc: opts.veloLabel ?? '',
      date: formatDate(date, locale),
    }),
  );
  return shell({
    workshop: opts.workshop,
    bodyHtml: `${rendered}${customMessageBlock(opts.customMessage)}`,
  });
}

export function suiviEmailSubject(opts: {
  templates?: EmailTemplates;
  clientLang?: string | null;
  workshopName: string;
  date?: Date;
}): string {
  const locale = normalizeLocale(opts.clientLang);
  const fallback = locale === 'en' ? DEFAULT_SUIVI_SUBJECT_EN : DEFAULT_SUIVI_SUBJECT_FR;
  const tpl = pickLocale(opts.templates?.courrielSuivi?.subject, locale) || fallback;
  const date = opts.date ?? new Date();
  return renderTemplate(tpl, {
    workshopName: opts.workshopName,
    date: formatDate(date, locale),
  });
}
