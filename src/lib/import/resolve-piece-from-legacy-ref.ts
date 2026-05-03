import type { IdMapping } from './dedupe-piece';

export type LegacyPieceRef = {
  legacyId?: string;
  sku?: string;
  nom?: string;
};

function norm(s: string): string {
  return s.trim().toLowerCase();
}

// Résout une référence v1 (pieceId + sku/nom optionnels) vers le newId v2.
// Renvoie null si :
//   - aucun critère fourni
//   - aucun mapping ne correspond
//   - plusieurs newIds distincts correspondent (ambiguïté → log à l'appelant)
export function resolvePieceFromLegacyRef(
  mapping: IdMapping[],
  ref: LegacyPieceRef,
): string | null {
  if (ref.legacyId === undefined && ref.sku === undefined && ref.nom === undefined) {
    return null;
  }

  let candidates = mapping;
  if (ref.legacyId !== undefined) {
    candidates = candidates.filter((m) => m.legacyPieceId === ref.legacyId);
  }
  if (ref.sku !== undefined) {
    const target = norm(ref.sku);
    candidates = candidates.filter((m) => norm(m.legacySku) === target);
  }
  if (ref.nom !== undefined) {
    const target = norm(ref.nom);
    candidates = candidates.filter((m) => norm(m.legacyNom) === target);
  }

  if (candidates.length === 0) return null;

  const distinctNewIds = new Set(candidates.map((c) => c.newId));
  if (distinctNewIds.size === 1) {
    return candidates[0]?.newId ?? null;
  }

  return null; // ambigu
}
