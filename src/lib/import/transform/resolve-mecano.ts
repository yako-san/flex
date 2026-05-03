import { normalizeNonValue } from '../../normalize/normalize-non-value';
import type { V2EquipeMemberDraft } from './types';

// Sentinelles v1 connues qui signifient "personne assignée" :
const SENTINELS = new Set(['Sélection →', 'Attente APPROBATION', 'Attente MÉCANIQUE']);

// Résout un mecano référencé par texte libre (eval/meca/ctrl sur les BDT v1)
// vers son ID v2. Stratégie en 3 niveaux :
//   1. Match exact sur surnom (case-insensitive)
//   2. Match sur "prenom nom" complet
//   3. Match sur prenom seul si unique dans l'équipe
// Retourne null pour les sentinelles ("Sélection →", "Attente XXX") ou si
// la résolution est ambiguë.
export function resolveMecano(
  raw: string | null | undefined,
  equipe: V2EquipeMemberDraft[],
): string | null {
  const cleaned = normalizeNonValue(raw ?? '');
  if (cleaned === null) return null;
  if (SENTINELS.has(cleaned)) return null;

  const lower = cleaned.toLowerCase();

  // 1. Surnom exact
  const bySurnom = equipe.find((m) => m.surnom.toLowerCase() === lower);
  if (bySurnom) return bySurnom.id;

  // 2. Prenom + nom complet
  const byFull = equipe.find((m) => `${m.prenom} ${m.nom}`.toLowerCase() === lower);
  if (byFull) return byFull.id;

  // 3. Prenom seul si unique
  const matches = equipe.filter((m) => m.prenom.toLowerCase() === lower);
  if (matches.length === 1) return matches[0]?.id ?? null;

  return null;
}
