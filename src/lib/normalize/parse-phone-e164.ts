import { stripInvisibleUnicode } from './strip-invisible-unicode';

const E164_MIN_DIGITS = 7;
const E164_MAX_DIGITS = 15;
const NORTH_AMERICA_COUNTRY_CODE = '1';

export function parsePhoneE164(
  input: string | null | undefined,
  defaultIndicatif = '+1',
): string | null {
  if (input === null || input === undefined) return null;

  const cleaned = stripInvisibleUnicode(input)?.trim();
  if (!cleaned) return null;

  const hasPlus = cleaned.startsWith('+');
  const digits = cleaned.replace(/\D/g, '');

  if (digits.length < E164_MIN_DIGITS || digits.length > E164_MAX_DIGITS) return null;

  if (hasPlus) return `+${digits}`;

  // Pas de + : déduction de l'indicatif
  // Cas Amérique du Nord : 11 digits commençant par 1
  if (digits.length === 11 && digits.startsWith(NORTH_AMERICA_COUNTRY_CODE)) {
    return `+${digits}`;
  }

  // Cas 10 digits + defaultIndicatif = +1 (Canada/US local)
  if (digits.length === 10 && defaultIndicatif === '+1') {
    return `+1${digits}`;
  }

  // Cas autre indicatif (FR, MX, etc) : on préfixe avec defaultIndicatif
  return `${defaultIndicatif}${digits}`;
}
