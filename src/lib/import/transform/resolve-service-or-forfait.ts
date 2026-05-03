import { normalizeNonValue } from '../../normalize/normalize-non-value';
import type { V2ForfaitDraft, V2ServiceDraft } from './types';

export type ResolvedServiceOrForfait = {
  kind: 'SERVICE' | 'FORFAIT';
  id: string;
};

// Résout un item BDT v1 (qui peut être un service à la carte ou un forfait)
// vers son ID v2. Le legacyCode v1 (ex 'S00001') prime sur le label.
// Forfait prioritaire si conflit (les forfaits sont une sous-catégorie de
// services en v1 mais entité distincte en v2).
export function resolveServiceOrForfait(
  legacyCode: string | null | undefined,
  label: string,
  services: V2ServiceDraft[],
  forfaits: V2ForfaitDraft[],
): ResolvedServiceOrForfait | null {
  // 1. Match par legacyCode
  if (legacyCode) {
    const f = forfaits.find((fr) => fr.legacyCode === legacyCode);
    if (f) return { kind: 'FORFAIT', id: f.id };
    const s = services.find((sv) => sv.legacyCode === legacyCode);
    if (s) return { kind: 'SERVICE', id: s.id };
  }

  // 2. Match par label (case-insensitive)
  const cleanedLabel = normalizeNonValue(label);
  if (cleanedLabel === null) return null;
  const lower = cleanedLabel.toLowerCase();

  const f2 = forfaits.find((fr) => fr.labelCanonical.toLowerCase() === lower);
  if (f2) return { kind: 'FORFAIT', id: f2.id };

  const s2 = services.find((sv) => sv.labelCanonical.toLowerCase() === lower);
  if (s2) return { kind: 'SERVICE', id: s2.id };

  return null;
}
