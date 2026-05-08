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

// =============================================================================
// Structure multi-locale FR + EN (V1 stocke les deux langues).
// La langue rendue côté client est déterminée par Client.lang à l'envoi.
// =============================================================================

export type Locale = 'fr' | 'en';

export type LocaleString = { fr?: string; en?: string };

// Fragments granulaires V1 : V1 décompose les bodies en greeting/intro/
// cta/outro pour édition séparée. V2 conserve la même structure quand
// présente, et reconstitue un body si le champ `body` direct est absent.
export type TemplateFragments = {
  greeting?: LocaleString;
  intro?:    LocaleString;
  cta?:      LocaleString;
  outro?:    LocaleString;
};

export type EmailTemplates = {
  eval?:          { subject?: LocaleString; body?: LocaleString } & TemplateFragments;
  facture?:       { subject?: LocaleString; body?: LocaleString } & TemplateFragments;
  vente?:         { subject?: LocaleString; body?: LocaleString } & TemplateFragments;
  courrielSuivi?: { subject?: LocaleString; body?: LocaleString } & TemplateFragments;
  smsRappel?:     { body?: LocaleString };
  smsSuivi?:      { body?: LocaleString };
  // Outro générique (V1 stocke `outro_fr` / `outro_en` sans suffixe — partagé
  // entre eval, facture, vente). Fallback si pas de outro spécifique.
  outro?: LocaleString;
  // Signatures par lead V1 (yako = yako-cyclo, cf = cyclo-flex). Utilisées
  // au pied des courriels pour préserver le branding multi-marque V1.
  signatures?: { yako?: string; cf?: string };
};

export function getEmailTemplates(workshopJson: unknown): EmailTemplates {
  if (!workshopJson || typeof workshopJson !== 'object') return {};
  return workshopJson as EmailTemplates;
}

// Pick la version localisée d'un champ (fallback FR si EN absent et vice
// versa, puis empty string si vraiment rien).
export function pickLocale(
  field: LocaleString | undefined,
  locale: Locale,
): string {
  if (!field) return '';
  const direct = field[locale];
  if (direct && direct.trim() !== '') return direct;
  const fallback = locale === 'fr' ? field['en'] : field['fr'];
  return fallback ?? '';
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
  '{{veloLabel}}',
] as const;

// =============================================================================
// Defaults — utilisés uniquement si le workshop n'a pas de templates v1
// hydratés et n'en a pas saisis manuellement.
// =============================================================================

export const DEFAULT_EVAL_SUBJECT_FR = 'Évaluation #{{bdcShortId}}';
export const DEFAULT_EVAL_SUBJECT_EN = 'Evaluation #{{bdcShortId}}';
export const DEFAULT_EVAL_BODY_FR = `<p>Bonjour {{clientPrenom}},</p>
<p>Tu trouveras ci-joint l'évaluation des travaux à faire sur ton vélo (BDT #{{bdcShortId}}).</p>
<p><strong>Total estimé HT :</strong> {{totalEstime}} $</p>
<p>Merci de commenter ou d'approuver ce courriel afin que nous puissions commencer le travail.</p>`;
export const DEFAULT_EVAL_BODY_EN = `<p>Hello {{clientPrenom}},</p>
<p>Please find attached the evaluation of the work to do on your bike (BDT #{{bdcShortId}}).</p>
<p><strong>Estimated total before tax:</strong> {{totalEstime}} $</p>
<p>Please comment on or approve this email so we can begin the work.</p>`;

export const DEFAULT_FACTURE_SUBJECT_FR = 'Facture {{factureNumero}}';
export const DEFAULT_FACTURE_SUBJECT_EN = 'Invoice {{factureNumero}}';
export const DEFAULT_FACTURE_BODY_FR = `<p>Bonjour {{clientPrenom}},</p>
<p>Voici la facture <strong>{{factureNumero}}</strong> en pièce jointe.</p>
<p><strong>Total TTC :</strong> {{grandTotal}} $ ({{modePaiement}})</p>`;
export const DEFAULT_FACTURE_BODY_EN = `<p>Hello {{clientPrenom}},</p>
<p>Please find attached invoice <strong>{{factureNumero}}</strong>.</p>
<p><strong>Total with tax:</strong> {{grandTotal}} $ ({{modePaiement}})</p>`;

export const DEFAULT_VENTE_SUBJECT_FR = 'Reçu vente comptoir {{factureNumero}}';
export const DEFAULT_VENTE_SUBJECT_EN = 'Counter sale receipt {{factureNumero}}';
export const DEFAULT_VENTE_BODY_FR = `<p>Bonjour {{clientPrenom}},</p>
<p>Voici votre reçu pour la vente <strong>{{factureNumero}}</strong>.</p>`;
export const DEFAULT_VENTE_BODY_EN = `<p>Hello {{clientPrenom}},</p>
<p>Please find attached your receipt for sale <strong>{{factureNumero}}</strong>.</p>`;

export const DEFAULT_SUIVI_SUBJECT_FR = 'Comment va ton vélo ?';
export const DEFAULT_SUIVI_SUBJECT_EN = 'How is your bike?';
export const DEFAULT_SUIVI_BODY_FR = `<p>Bonjour {{clientPrenom}},</p>
<p>Comment va ton vélo {{veloLabel}} depuis ta visite chez {{workshopName}} ? N'hésite pas si tu as des questions.</p>`;
export const DEFAULT_SUIVI_BODY_EN = `<p>Hello {{clientPrenom}},</p>
<p>How is your bike {{veloLabel}} since your visit at {{workshopName}}? Don't hesitate if you have any questions.</p>`;

export const DEFAULT_SMS_RAPPEL_FR =
  'Salut {{clientPrenom}}, ton vélo {{veloLabel}} est prêt à récupérer chez {{workshopName}}.';
export const DEFAULT_SMS_RAPPEL_EN =
  'Hi {{clientPrenom}}, your bike {{veloLabel}} is ready for pickup at {{workshopName}}.';
export const DEFAULT_SMS_SUIVI_FR =
  'Salut {{clientPrenom}}, comment va ton vélo {{veloLabel}} ?';
export const DEFAULT_SMS_SUIVI_EN =
  'Hi {{clientPrenom}}, how is your bike {{veloLabel}}?';

// =============================================================================
// Compat : anciens noms de constants utilisés ailleurs dans le code (UI
// templates form). On exporte en alias FR pour éviter de tout casser.
// =============================================================================

export const DEFAULT_EVAL_SUBJECT = DEFAULT_EVAL_SUBJECT_FR;
export const DEFAULT_EVAL_BODY = DEFAULT_EVAL_BODY_FR;
export const DEFAULT_FACTURE_SUBJECT = DEFAULT_FACTURE_SUBJECT_FR;
export const DEFAULT_FACTURE_BODY = DEFAULT_FACTURE_BODY_FR;
export const DEFAULT_VENTE_SUBJECT = DEFAULT_VENTE_SUBJECT_FR;
export const DEFAULT_VENTE_BODY = DEFAULT_VENTE_BODY_FR;
export const DEFAULT_SMS_RAPPEL = DEFAULT_SMS_RAPPEL_FR;
export const DEFAULT_SMS_SUIVI = DEFAULT_SMS_SUIVI_FR;
