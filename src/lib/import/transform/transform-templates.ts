// Mapping V1 dump.templates (Record<string, string> flat) → V2
// Workshop.emailTemplates structuré multi-locale FR + EN.
//
// V1 keys observées (tag 1.1.0) :
//
//   eval_subject_fr / _en, eval_message_fr / _en
//   facture_subject_fr / _en, facture_message_fr / _en
//   vente_subject_fr / _en, vente_message_fr / _en
//   courriel_suivi_subject_fr / _en, courriel_suivi_fr / _en
//   sms_rappel_fr / _en
//   sms_suivi_fr / _en
//   signature_yako, signature_cf
//
// On fait un mapping EXPLICITE clé par clé pour éviter les ambiguïtés.

import type {
  EmailTemplates,
  Locale,
  LocaleString,
} from '@/lib/email/render-template';

// Helpers pour assigner un champ localisé en construisant l'objet au fur
// et à mesure (sans muter directement, plus sûr face aux undefined).
function setLocalized(
  target: LocaleString | undefined,
  locale: Locale,
  value: string,
): LocaleString {
  return { ...(target ?? {}), [locale]: value };
}

// Mapping clé v1 → cible v2 (kind + field + locale).
type Target =
  | { kind: 'eval' | 'facture' | 'vente' | 'courrielSuivi'; field: 'subject' | 'body' | 'greeting' | 'intro' | 'cta' | 'outro'; locale: Locale }
  | { kind: 'smsRappel' | 'smsSuivi'; field: 'body'; locale: Locale }
  | { kind: 'outroGlobal'; locale: Locale }
  | { kind: 'signature'; signatureKey: 'yako' | 'cf' };

const KEY_MAP: Record<string, Target> = {
  // Évaluation
  eval_subject_fr: { kind: 'eval', field: 'subject', locale: 'fr' },
  eval_subject_en: { kind: 'eval', field: 'subject', locale: 'en' },
  eval_message_fr: { kind: 'eval', field: 'body', locale: 'fr' },
  eval_message_en: { kind: 'eval', field: 'body', locale: 'en' },

  // Facture BDT
  facture_subject_fr: { kind: 'facture', field: 'subject', locale: 'fr' },
  facture_subject_en: { kind: 'facture', field: 'subject', locale: 'en' },
  facture_message_fr: { kind: 'facture', field: 'body', locale: 'fr' },
  facture_message_en: { kind: 'facture', field: 'body', locale: 'en' },

  // Vente directe
  vente_subject_fr: { kind: 'vente', field: 'subject', locale: 'fr' },
  vente_subject_en: { kind: 'vente', field: 'subject', locale: 'en' },
  vente_message_fr: { kind: 'vente', field: 'body', locale: 'fr' },
  vente_message_en: { kind: 'vente', field: 'body', locale: 'en' },

  // Courriel de suivi (post-livraison)
  courriel_suivi_subject_fr: { kind: 'courrielSuivi', field: 'subject', locale: 'fr' },
  courriel_suivi_subject_en: { kind: 'courrielSuivi', field: 'subject', locale: 'en' },
  courriel_suivi_fr: { kind: 'courrielSuivi', field: 'body', locale: 'fr' },
  courriel_suivi_en: { kind: 'courrielSuivi', field: 'body', locale: 'en' },

  // SMS rappel
  sms_rappel_fr: { kind: 'smsRappel', field: 'body', locale: 'fr' },
  sms_rappel_en: { kind: 'smsRappel', field: 'body', locale: 'en' },

  // SMS suivi
  sms_suivi_fr: { kind: 'smsSuivi', field: 'body', locale: 'fr' },
  sms_suivi_en: { kind: 'smsSuivi', field: 'body', locale: 'en' },

  // Signatures par lead V1
  signature_yako: { kind: 'signature', signatureKey: 'yako' },
  signature_cf:   { kind: 'signature', signatureKey: 'cf' },

  // Fragments granulaires V1 (greeting/intro/cta/outro)
  eval_greeting_fr: { kind: 'eval', field: 'greeting', locale: 'fr' },
  eval_greeting_en: { kind: 'eval', field: 'greeting', locale: 'en' },
  eval_intro_fr:    { kind: 'eval', field: 'intro', locale: 'fr' },
  eval_intro_en:    { kind: 'eval', field: 'intro', locale: 'en' },
  eval_cta_fr:      { kind: 'eval', field: 'cta', locale: 'fr' },
  eval_cta_en:      { kind: 'eval', field: 'cta', locale: 'en' },
  eval_outro_fr:    { kind: 'eval', field: 'outro', locale: 'fr' },
  eval_outro_en:    { kind: 'eval', field: 'outro', locale: 'en' },

  facture_greeting_fr: { kind: 'facture', field: 'greeting', locale: 'fr' },
  facture_greeting_en: { kind: 'facture', field: 'greeting', locale: 'en' },
  facture_intro_fr:    { kind: 'facture', field: 'intro', locale: 'fr' },
  facture_intro_en:    { kind: 'facture', field: 'intro', locale: 'en' },
  facture_cta_fr:      { kind: 'facture', field: 'cta', locale: 'fr' },
  facture_cta_en:      { kind: 'facture', field: 'cta', locale: 'en' },
  facture_outro_fr:    { kind: 'facture', field: 'outro', locale: 'fr' },
  facture_outro_en:    { kind: 'facture', field: 'outro', locale: 'en' },

  // Outro global V1 (partagé entre eval/facture/vente)
  outro_fr: { kind: 'outroGlobal', locale: 'fr' },
  outro_en: { kind: 'outroGlobal', locale: 'en' },
};

export function transformTemplates(
  raw: Record<string, string> | undefined,
): EmailTemplates | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  const result: EmailTemplates = {};
  const unmapped: Record<string, string> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== 'string' || value.trim() === '') continue;

    const target = KEY_MAP[key.trim()];
    if (!target) {
      unmapped[key] = value;
      continue;
    }

    if (target.kind === 'signature') {
      result.signatures = { ...(result.signatures ?? {}), [target.signatureKey]: value };
      continue;
    }

    if (target.kind === 'outroGlobal') {
      result.outro = setLocalized(result.outro, target.locale, value);
      continue;
    }

    if (target.kind === 'smsRappel' || target.kind === 'smsSuivi') {
      const existing = result[target.kind] ?? {};
      result[target.kind] = {
        ...existing,
        body: setLocalized(existing.body, target.locale, value),
      };
      continue;
    }

    // eval / facture / vente / courrielSuivi (subject, body, greeting,
    // intro, cta, outro spécifique)
    const existing = result[target.kind] ?? {};
    result[target.kind] = {
      ...existing,
      [target.field]: setLocalized(
        existing[target.field as keyof typeof existing] as LocaleString | undefined,
        target.locale,
        value,
      ),
    };
  }

  if (Object.keys(unmapped).length > 0) {
    (result as EmailTemplates & { _unmapped?: Record<string, string> })._unmapped = unmapped;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
