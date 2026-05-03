import { normalizeNonValue } from './normalize-non-value';

const HHMM = /^(\d{1,3}):(\d{2})$/;

export function parseDureeHHMM(input: string | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  const cleaned = normalizeNonValue(input);
  if (cleaned === null) return null;

  const m = cleaned.match(HHMM);
  if (!m || m[1] === undefined || m[2] === undefined) return null;

  const h = Number.parseInt(m[1], 10);
  const min = Number.parseInt(m[2], 10);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  if (min >= 60) return null;
  return h * 60 + min;
}
