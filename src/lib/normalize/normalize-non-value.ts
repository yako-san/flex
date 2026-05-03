// Placeholders v1 fréquents pour signifier "pas de valeur" :
// "...", "—", "-", ".", "…", série de points/tirets entourés de whitespace.
// Ces sentinelles polluent les exports CSV/JSON v1 et doivent être ramenées à null
// avant d'écrire en DB v2 (qui utilise des colonnes nullables propres).
const ONLY_PUNCTUATION_PLACEHOLDER = /^[.\-—…\s]+$/;

export function normalizeNonValue(input: string | null | undefined): string | null {
  if (input === null || input === undefined) return null;
  const trimmed = input.trim();
  if (trimmed === '') return null;
  if (ONLY_PUNCTUATION_PLACEHOLDER.test(trimmed)) return null;
  return trimmed;
}
