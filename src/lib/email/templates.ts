// Templates HTML simples pour les courriels client. Restent inline-safe pour
// les clients mail (Gmail, Outlook, Apple Mail) qui ne supportent pas tous
// les CSS modernes.

import { escapeHtml } from '@/lib/pdf-html/templates/styles';

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

export function evalEmailTemplate(opts: {
  workshop: WorkshopBranding;
  clientPrenom: string;
  bdcShortId: string;
  totalEstime: number;
  customMessage?: string | null;
}): string {
  return shell({
    workshop: opts.workshop,
    bodyHtml: `
      <p>Bonjour ${E(opts.clientPrenom)},</p>
      <p>
        Voici l'évaluation pour votre vélo (BDT n° ${E(opts.bdcShortId)}).
        Le PDF complet est en pièce jointe.
      </p>
      ${opts.customMessage
        ? `<p style="background: #fafafa; padding: 12px; border-left: 3px solid #1a1a1a; white-space: pre-wrap;">${E(opts.customMessage)}</p>`
        : ''}
      <p>
        <strong>Total estimé HT :</strong> ${opts.totalEstime.toFixed(2)} $<br>
        <span style="color: #666; font-size: 12px;">Les taxes seront ajoutées à la facturation finale.</span>
      </p>
      <p>
        Si tu approuves cette évaluation, réponds simplement à ce courriel.
        Pour toute question ou modification, n'hésite pas à nous contacter.
      </p>
      <p>Merci !</p>
    `,
  });
}

export function factureEmailTemplate(opts: {
  workshop: WorkshopBranding;
  clientPrenom: string;
  factureNumero: string;
  grandTotal: number;
  modePaiement?: string | null;
  customMessage?: string | null;
}): string {
  return shell({
    workshop: opts.workshop,
    bodyHtml: `
      <p>Bonjour ${E(opts.clientPrenom)},</p>
      <p>
        Voici la facture <strong>${E(opts.factureNumero)}</strong> en pièce jointe.
      </p>
      ${opts.customMessage
        ? `<p style="background: #fafafa; padding: 12px; border-left: 3px solid #1a1a1a; white-space: pre-wrap;">${E(opts.customMessage)}</p>`
        : ''}
      <p>
        <strong>Total TTC :</strong> ${opts.grandTotal.toFixed(2)} $${
          opts.modePaiement ? ` (${E(opts.modePaiement.toLowerCase())})` : ''
        }
      </p>
      <p>Merci pour votre confiance, et bonne route ! 🚴</p>
    `,
  });
}
