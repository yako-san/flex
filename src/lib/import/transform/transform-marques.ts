import { generateId } from '../../ids/generate-id';
import { normalizeNonValue } from '../../normalize/normalize-non-value';
import type {
  ImportContext,
  ImportResult,
  V2MarqueDraft,
  V2TranslationDraft,
} from './types';

export type V1Marque = {
  nom: string;
};

// Préfixes de pollution v1 (lignes d'aide collées dans le Sheet par erreur).
const POLLUTION_PREFIXES = ['ℹ️', 'Sélection →'];

// Sentinelles UI v1 reconnues comme "non-valeur" en plus de normalizeNonValue.
const UI_SENTINELS = new Set(['Sélection →']);

function isPollution(nom: string): boolean {
  if (UI_SENTINELS.has(nom)) return true;
  return POLLUTION_PREFIXES.some((p) => nom.startsWith(p));
}

export function transformMarques(
  v1: V1Marque[],
  ctx: ImportContext,
): ImportResult<V2MarqueDraft> {
  const records: V2MarqueDraft[] = [];
  const translations: V2TranslationDraft[] = [];
  const skipped: ImportResult<V2MarqueDraft>['skipped'] = [];

  // Index pour la dédup case-insensitive
  const seen = new Map<string, V2MarqueDraft>();
  const now = new Date();

  for (const raw of v1) {
    const cleaned = normalizeNonValue(raw.nom);
    if (cleaned === null) {
      skipped.push({ reason: 'nom vide ou placeholder', entityType: 'marque', raw });
      continue;
    }
    if (isPollution(cleaned)) {
      skipped.push({ reason: 'pollution v1 (sentinelle UI)', entityType: 'marque', raw });
      continue;
    }

    const dedupKey = cleaned.toLowerCase();
    if (seen.has(dedupKey)) {
      skipped.push({
        reason: `doublon de "${seen.get(dedupKey)?.nom}"`,
        entityType: 'marque',
        raw,
      });
      continue;
    }

    const marque: V2MarqueDraft = {
      id: generateId('marque'),
      workshopId: ctx.workshopId,
      nom: cleaned,
    };
    records.push(marque);
    seen.set(dedupKey, marque);

    // Une seule traduction à l'import (default locale). Les autres locales
    // seront générées par DeepL/Claude dans un job de post-traitement.
    translations.push({
      id: generateId('translation'),
      workshopId: ctx.workshopId,
      entityType: 'MARQUE',
      entityId: marque.id,
      field: 'label',
      locale: ctx.defaultLocale,
      value: cleaned,
      source: 'USER',
      reviewedAt: now,
      reviewedById: null,
    });
  }

  return { records, translations, skipped };
}
