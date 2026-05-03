import type { ImportContext } from './types';

// Mappe une langue v1 (code ISO 639-1 simple type 'FR'/'EN'/'ES' OU déjà BCP 47
// type 'fr-CA'/'es-MX') vers une locale BCP 47 active dans le contexte.
//
// Si :
//   - vide → defaultLocale
//   - BCP 47 déjà valide ET dans activeLocales → tel quel
//   - BCP 47 absent de activeLocales → defaultLocale (locale non supportée)
//   - code ISO simple → première activeLocale qui matche le préfixe ou defaultLocale
export function mapV1LangToBcp47(rawLang: string, ctx: ImportContext): string {
  const lang = rawLang.trim();
  if (lang === '') return ctx.defaultLocale;

  if (lang.includes('-')) {
    return ctx.activeLocales.includes(lang) ? lang : ctx.defaultLocale;
  }

  const lower = lang.toLowerCase();
  const found = ctx.activeLocales.find((l) => l.toLowerCase().startsWith(`${lower}-`));
  return found ?? ctx.defaultLocale;
}
