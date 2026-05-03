export type FactureNumero = {
  prefix: 'V' | null;
  sequence: number;
  raw: string;
};

const WITH_PREFIX = /^[Vv](\d+)$/;
const NUMERIC_ONLY = /^(\d+)$/;

export function parseLegacyFactureNumero(
  input: string | null | undefined,
): FactureNumero | null {
  if (input === null || input === undefined) return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  const m1 = trimmed.match(WITH_PREFIX);
  if (m1 && m1[1] !== undefined) {
    return { prefix: 'V', sequence: Number.parseInt(m1[1], 10), raw: input };
  }

  const m2 = trimmed.match(NUMERIC_ONLY);
  if (m2 && m2[1] !== undefined) {
    return { prefix: null, sequence: Number.parseInt(m2[1], 10), raw: input };
  }

  return null;
}
