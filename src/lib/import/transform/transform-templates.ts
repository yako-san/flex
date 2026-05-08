// Mapping V1 dump.templates (Record<string, string> flat) → V2
// Workshop.emailTemplates (structuré { eval, facture, vente, smsRappel,
// smsSuivi } × { subject, body }).
//
// V1 utilise des clés flat type `evaluation_fr`, `facture_subject_fr`, etc.
// Comme on n'a pas la liste exacte des clés observées (section 4 de
// v1-reference.md non accessible côté V2 sans repo), on fait un mapping
// best-effort par regex sur les patterns les plus courants. Tout ce qui
// n'est pas reconnu est préservé brut sous `_unmapped` pour audit.

export type V2EmailTemplates = {
  eval?: { subject?: string; body?: string };
  facture?: { subject?: string; body?: string };
  vente?: { subject?: string; body?: string };
  smsRappel?: { body?: string };
  smsSuivi?: { body?: string };
  _unmapped?: Record<string, string>;
};

// Détecte le type de template à partir d'une clé v1.
// Retourne { kind, field, locale? } ou null si non reconnu.
function classify(rawKey: string): {
  kind: 'eval' | 'facture' | 'vente' | 'smsRappel' | 'smsSuivi';
  field: 'subject' | 'body';
  locale?: 'fr' | 'en';
} | null {
  // On garde les séparateurs pour pouvoir détecter le suffixe locale
  // (ex. "evaluation_body_fr" → "fr" en fin de chaîne).
  const k = rawKey.toLowerCase();
  const compact = k.replace(/[\s_-]+/g, '');

  let kind: 'eval' | 'facture' | 'vente' | 'smsRappel' | 'smsSuivi' | null = null;
  if (/eval(uation)?/.test(compact) && !/sms/.test(compact)) kind = 'eval';
  else if (/facturebdt|facturebdc|facturationbdt/.test(compact)) kind = 'facture';
  else if (/facturevente|facturecomptoir/.test(compact)) kind = 'vente';
  else if (/facture/.test(compact) && !/vente|comptoir/.test(compact)) kind = 'facture';
  else if (/smsrappel|rappelsms/.test(compact)) kind = 'smsRappel';
  else if (/smssuivi|suivisms/.test(compact)) kind = 'smsSuivi';
  else if (/courrielsuivi|suivicourriel|suivi/.test(compact)) kind = 'smsSuivi';
  else if (/rappel/.test(compact)) kind = 'smsRappel';
  if (!kind) return null;

  const isSubject = /subject|sujet|object|titre/.test(compact);
  const field: 'subject' | 'body' = isSubject ? 'subject' : 'body';

  // Locale détectée si suffixe `_fr` / `_en` / mot isolé `fr`/`en`.
  let locale: 'fr' | 'en' | undefined;
  if (/(^|[\s_-])fr([\s_-]|$)|french|francais/.test(k)) locale = 'fr';
  else if (/(^|[\s_-])en([\s_-]|$)|english|anglais/.test(k)) locale = 'en';

  if (locale === undefined) return { kind, field };
  return { kind, field, locale };
}

// V2 ne stocke pas la locale dans emailTemplates (un seul template, censé
// être déjà localisé selon `Client.lang`). Pour le mapping initial v1→v2,
// on prend la version FR par défaut, puis on stocke EN dans `_unmapped`
// pour audit (l'utilisateur fera la localisation manuelle dans une v2
// future qui supportera les 2 langues).
export function transformTemplates(
  raw: Record<string, string> | undefined,
): V2EmailTemplates | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  const result: V2EmailTemplates = {};
  const unmapped: Record<string, string> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== 'string' || value.trim() === '') continue;
    const cls = classify(key);
    if (!cls) {
      unmapped[key] = value;
      continue;
    }

    // SMS n'a pas de subject (ignoré côté V2 — texte court direct)
    if ((cls.kind === 'smsRappel' || cls.kind === 'smsSuivi') && cls.field === 'subject') {
      unmapped[key] = value;
      continue;
    }

    // Locale EN : préserver dans _unmapped pour audit (V2 mono-locale pour l'instant)
    if (cls.locale === 'en') {
      unmapped[key] = value;
      continue;
    }

    // Locale FR ou non spécifiée : assigner
    if (cls.kind === 'smsRappel' || cls.kind === 'smsSuivi') {
      result[cls.kind] = { ...result[cls.kind], body: value };
    } else {
      result[cls.kind] = { ...result[cls.kind], [cls.field]: value };
    }
  }

  if (Object.keys(unmapped).length > 0) result._unmapped = unmapped;
  return Object.keys(result).length > 0 ? result : undefined;
}
