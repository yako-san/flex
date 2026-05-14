import { describe, expect, it } from 'vitest';
import type { ImportContext } from './types';
import { mapV1LangToBcp47 } from './map-v1-lang';

function ctx(
  active: string[] = ['fr-CA', 'en-CA'],
  def = 'fr-CA',
): ImportContext {
  return {
    activeLocales: active,
    defaultLocale: def,
  } as unknown as ImportContext;
}

describe('mapV1LangToBcp47', () => {
  it('chaîne vide → defaultLocale', () => {
    expect(mapV1LangToBcp47('', ctx())).toBe('fr-CA');
  });

  it('whitespace-only → defaultLocale (trim)', () => {
    expect(mapV1LangToBcp47('   ', ctx())).toBe('fr-CA');
  });

  it('BCP 47 valide et actif → tel quel', () => {
    expect(mapV1LangToBcp47('fr-CA', ctx())).toBe('fr-CA');
    expect(mapV1LangToBcp47('en-CA', ctx())).toBe('en-CA');
  });

  it("BCP 47 inactif → defaultLocale (locale non supportée)", () => {
    expect(mapV1LangToBcp47('es-MX', ctx())).toBe('fr-CA');
  });

  it("code ISO simple matche le préfixe d'une activeLocale", () => {
    expect(mapV1LangToBcp47('FR', ctx())).toBe('fr-CA');
    expect(mapV1LangToBcp47('en', ctx())).toBe('en-CA');
  });

  it('code ISO sans match → defaultLocale', () => {
    expect(mapV1LangToBcp47('ES', ctx())).toBe('fr-CA');
  });

  it('case-insensitive sur le code simple', () => {
    expect(mapV1LangToBcp47('Fr', ctx())).toBe('fr-CA');
    expect(mapV1LangToBcp47('EN', ctx())).toBe('en-CA');
  });

  it('contexte multi-locales avec espagnol actif', () => {
    const c = ctx(['fr-CA', 'en-CA', 'es-MX'], 'fr-CA');
    expect(mapV1LangToBcp47('ES', c)).toBe('es-MX');
    expect(mapV1LangToBcp47('es-MX', c)).toBe('es-MX');
  });

  it('defaultLocale custom (en)', () => {
    const c = ctx(['en-US', 'fr-FR'], 'en-US');
    expect(mapV1LangToBcp47('', c)).toBe('en-US');
    expect(mapV1LangToBcp47('xx', c)).toBe('en-US');
  });
});
