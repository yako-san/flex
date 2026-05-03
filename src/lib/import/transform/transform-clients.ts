import { generateId } from '../../ids/generate-id';
import { normalizeNonValue } from '../../normalize/normalize-non-value';
import { stripMarkdownEmail } from '../../normalize/strip-markdown-email';
import { parsePhoneE164 } from '../../normalize/parse-phone-e164';
import { mapV1LangToBcp47 } from './map-v1-lang';
import type { ImportContext, ImportResult, V2ClientDraft } from './types';

export type V1Client = {
  prenom: string;
  nom: string;
  nomComplet: string;
  tel: string;
  indicatif: string;
  courriel: string;
  commPref: string;
  lead: string;
  dateIn: string | null;
  dateOut: string | null;
  notes: string;
  lang: string;
  remise: number;
  bdcIds: string[];
  velos: string[];
  googleResourceName?: string;
};

const COMM_PREF_MAP: Record<string, V2ClientDraft['commPref']> = {
  courriel: 'EMAIL',
  texto: 'SMS',
  sms: 'SMS',
  téléphone: 'TELEPHONE',
  telephone: 'TELEPHONE',
};

function mapCommPref(raw: string): V2ClientDraft['commPref'] {
  const cleaned = normalizeNonValue(raw);
  if (cleaned === null) return 'AUCUN';
  // Multi-valeur "Courriel,Texto" : on prend la première (préférence principale)
  const first = cleaned.split(',')[0]?.trim().toLowerCase() ?? '';
  return COMM_PREF_MAP[first] ?? 'AUCUN';
}

export function transformClients(
  v1: V1Client[],
  ctx: ImportContext,
): ImportResult<V2ClientDraft> {
  const records: V2ClientDraft[] = [];
  const skipped: ImportResult<V2ClientDraft>['skipped'] = [];

  for (const raw of v1) {
    const prenom = normalizeNonValue(raw.prenom) ?? '';
    const nom = normalizeNonValue(raw.nom) ?? '';
    const indicatif = normalizeNonValue(raw.indicatif) ?? '+1';
    const telephone = parsePhoneE164(raw.tel, indicatif);
    const courrielRaw = normalizeNonValue(raw.courriel);
    const courriel = courrielRaw !== null ? stripMarkdownEmail(courrielRaw) : null;

    // Skip si TOUS les champs identifiants sont vides
    if (prenom === '' && nom === '' && telephone === null && (courriel === null || courriel === '')) {
      skipped.push({
        reason: 'tous les champs identifiants sont vides',
        entityType: 'client',
        raw,
      });
      continue;
    }

    const remise = raw.remise > 0 ? String(raw.remise) : null;

    records.push({
      id: generateId('client'),
      workshopId: ctx.workshopId,
      prenom,
      nom,
      telephone,
      indicatif,
      courriel: courriel === '' ? null : courriel,
      commPref: mapCommPref(raw.commPref),
      lang: mapV1LangToBcp47(raw.lang, ctx),
      lead: normalizeNonValue(raw.lead),
      remiseDefault: remise,
      adressePostale: null, // v1 n'a pas d'adresse structurée
      notes: normalizeNonValue(raw.notes),
    });
  }

  return { records, translations: [], skipped };
}
