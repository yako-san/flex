import { parseExcelSerial } from './parse-excel-serial';
import { normalizeNonValue } from './normalize-non-value';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const US_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

function isValidYMD(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  // Validation forte via Date : reconstruction et comparaison.
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function parseV1Date(input: string | number | null | undefined): string | null {
  if (input === null || input === undefined) return null;

  if (typeof input === 'number') return parseExcelSerial(input);

  // String : ignorer la partie après le premier '\n' (heure embarquée)
  const headOnly = input.split('\n')[0] ?? '';
  const cleaned = normalizeNonValue(headOnly);
  if (cleaned === null) return null;

  const isoMatch = cleaned.match(ISO_DATE);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    const d = Number(isoMatch[3]);
    return isValidYMD(y, m, d) ? `${y}-${pad2(m)}-${pad2(d)}` : null;
  }

  const usMatch = cleaned.match(US_DATE);
  if (usMatch) {
    const m = Number(usMatch[1]);
    const d = Number(usMatch[2]);
    const y = Number(usMatch[3]);
    return isValidYMD(y, m, d) ? `${y}-${pad2(m)}-${pad2(d)}` : null;
  }

  return null;
}
