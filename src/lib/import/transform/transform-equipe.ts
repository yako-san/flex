import { generateId } from '../../ids/generate-id';
import { normalizeNonValue } from '../../normalize/normalize-non-value';
import { stripMarkdownEmail } from '../../normalize/strip-markdown-email';
import { parsePhoneE164 } from '../../normalize/parse-phone-e164';
import { mapV1LangToBcp47 } from './map-v1-lang';
import type { ImportContext, ImportResult, V2EquipeMemberDraft } from './types';

export type V1EquipeMember = {
  prenom: string;
  nom: string;
  surnom: string;
  courriel: string;
  tel: string;
  indicatif: string;
  lang: string;
  role: string;
  active: boolean | string;
  notes: string;
};

const TRUE_STRINGS = new Set(['true', 'vrai']);
const FALSE_STRINGS = new Set(['false', 'faux']);

function parseActive(raw: boolean | string | undefined): boolean {
  if (raw === undefined || raw === null) return true;
  if (typeof raw === 'boolean') return raw;
  const lower = raw.trim().toLowerCase();
  if (TRUE_STRINGS.has(lower)) return true;
  if (FALSE_STRINGS.has(lower)) return false;
  return true; // default si non reconnu
}

export function transformEquipe(
  v1: V1EquipeMember[],
  ctx: ImportContext,
): ImportResult<V2EquipeMemberDraft> {
  const records: V2EquipeMemberDraft[] = [];
  const skipped: ImportResult<V2EquipeMemberDraft>['skipped'] = [];
  const seenSurnom = new Map<string, V2EquipeMemberDraft>();

  for (const raw of v1) {
    const surnom = normalizeNonValue(raw.surnom);
    if (surnom === null) {
      skipped.push({ reason: 'surnom vide ou placeholder', entityType: 'equipe', raw });
      continue;
    }
    const prenom = normalizeNonValue(raw.prenom);
    const nom = normalizeNonValue(raw.nom);
    if (prenom === null && nom === null) {
      skipped.push({
        reason: 'prenom et nom tous deux vides',
        entityType: 'equipe',
        raw,
      });
      continue;
    }

    const dedupKey = surnom.toLowerCase();
    if (seenSurnom.has(dedupKey)) {
      skipped.push({
        reason: `doublon surnom de "${seenSurnom.get(dedupKey)?.surnom}"`,
        entityType: 'equipe',
        raw,
      });
      continue;
    }

    const indicatif = normalizeNonValue(raw.indicatif) ?? '+1';
    const member: V2EquipeMemberDraft = {
      id: generateId('eq'),
      workshopId: ctx.workshopId,
      prenom: prenom ?? '',
      nom: nom ?? '',
      surnom,
      courriel: stripMarkdownEmail(normalizeNonValue(raw.courriel) ?? ''),
      telephone: parsePhoneE164(raw.tel, indicatif),
      indicatif,
      lang: mapV1LangToBcp47(raw.lang, ctx),
      role: normalizeNonValue(raw.role),
      active: parseActive(raw.active),
      notes: normalizeNonValue(raw.notes),
      legacyRawV1: raw as unknown as Record<string, unknown>,
    };

    // courriel vide après strip → null
    if (member.courriel === '') member.courriel = null;

    records.push(member);
    seenSurnom.set(dedupKey, member);
  }

  return { records, translations: [], skipped };
}
