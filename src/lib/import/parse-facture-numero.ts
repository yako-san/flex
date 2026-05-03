import { parseV1Date } from '../normalize/parse-v1-date';

export type FactureNumero = {
  prefix: 'V' | null;
  sequence: number;
  dateSuffix: string | null;
  raw: string;
};

const WITH_PREFIX_AND_DATE = /^[Vv](\d+)(?:-(\d{4}-\d{2}-\d{2}))?$/;
const NUMERIC_ONLY = /^(\d+)$/;

export function parseLegacyFactureNumero(
  input: string | null | undefined,
): FactureNumero | null {
  if (input === null || input === undefined) return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  const m1 = trimmed.match(WITH_PREFIX_AND_DATE);
  if (m1 && m1[1] !== undefined) {
    const rawSuffix = m1[2] ?? null;
    // Si un suffixe est présent, valider qu'il représente une vraie date.
    let dateSuffix: string | null = null;
    if (rawSuffix !== null) {
      dateSuffix = parseV1Date(rawSuffix);
      if (dateSuffix === null) return null; // suffixe invalide → numéro invalide
    }
    return {
      prefix: 'V',
      sequence: Number.parseInt(m1[1], 10),
      dateSuffix,
      raw: input,
    };
  }

  const m2 = trimmed.match(NUMERIC_ONLY);
  if (m2 && m2[1] !== undefined) {
    return {
      prefix: null,
      sequence: Number.parseInt(m2[1], 10),
      dateSuffix: null,
      raw: input,
    };
  }

  return null;
}
