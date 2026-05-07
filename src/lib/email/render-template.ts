// Substitue les placeholders {{key}} par les valeurs fournies. Les clés
// inconnues sont laissées intactes ; les valeurs nulles deviennent vides.
export function renderTemplate(
  template: string,
  values: Record<string, string | number | null | undefined>,
): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (m, key) => {
    if (!(key in values)) return m;
    const v = values[key as keyof typeof values];
    if (v === null || v === undefined) return '';
    return String(v);
  });
}

export type EmailTemplates = {
  eval?: { subject?: string; body?: string };
  facture?: { subject?: string; body?: string };
};

export function getEmailTemplates(workshopJson: unknown): EmailTemplates {
  if (!workshopJson || typeof workshopJson !== 'object') return {};
  return workshopJson as EmailTemplates;
}

export const TEMPLATE_PLACEHOLDERS = [
  '{{clientPrenom}}',
  '{{clientNom}}',
  '{{workshopName}}',
  '{{bdcShortId}}',
  '{{totalEstime}}',
  '{{factureNumero}}',
  '{{grandTotal}}',
  '{{modePaiement}}',
] as const;

export const DEFAULT_EVAL_SUBJECT = 'Évaluation pour votre vélo — BDT {{bdcShortId}}';
export const DEFAULT_EVAL_BODY = `<p>Bonjour {{clientPrenom}},</p>
<p>
  Voici l'évaluation pour votre vélo (BDT n° {{bdcShortId}}).
  Le PDF complet est en pièce jointe.
</p>
<p>
  <strong>Total estimé HT :</strong> {{totalEstime}} $<br>
  <span style="color: #666; font-size: 12px;">Les taxes seront ajoutées à la facturation finale.</span>
</p>
<p>
  Si tu approuves cette évaluation, réponds simplement à ce courriel.
  Pour toute question ou modification, n'hésite pas à nous contacter.
</p>
<p>Merci !</p>`;

export const DEFAULT_FACTURE_SUBJECT = 'Facture {{factureNumero}}';
export const DEFAULT_FACTURE_BODY = `<p>Bonjour {{clientPrenom}},</p>
<p>
  Voici la facture <strong>{{factureNumero}}</strong> en pièce jointe.
</p>
<p>
  <strong>Total TTC :</strong> {{grandTotal}} $ ({{modePaiement}})
</p>
<p>Merci pour votre confiance, et bonne route !</p>`;
