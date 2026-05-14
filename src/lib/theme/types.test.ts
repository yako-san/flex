import { describe, expect, it } from 'vitest';
import {
  isValidColorValue,
  sanitizeTheme,
  themeToCssVars,
  type WorkshopTheme,
} from './types';

describe('isValidColorValue', () => {
  it('accepte hex 6 digits', () => {
    expect(isValidColorValue('#fff056')).toBe(true);
    expect(isValidColorValue('#000000')).toBe(true);
  });

  it('accepte hex 3 digits', () => {
    expect(isValidColorValue('#fff')).toBe(true);
  });

  it('accepte hex 8 digits (alpha)', () => {
    expect(isValidColorValue('#fff056aa')).toBe(true);
  });

  it('accepte hex case mixte', () => {
    expect(isValidColorValue('#aBcDeF')).toBe(true);
  });

  it('accepte rgba()', () => {
    expect(isValidColorValue('rgba(255, 240, 86, 0.4)')).toBe(true);
    expect(isValidColorValue('rgba(0,0,0,1)')).toBe(true);
  });

  it('accepte rgb() sans alpha', () => {
    expect(isValidColorValue('rgb(255, 240, 86)')).toBe(true);
  });

  it('refuse non-string', () => {
    expect(isValidColorValue(123)).toBe(false);
    expect(isValidColorValue(null)).toBe(false);
    expect(isValidColorValue(undefined)).toBe(false);
    expect(isValidColorValue({})).toBe(false);
  });

  it('refuse hex hors format (sans #)', () => {
    expect(isValidColorValue('fff056')).toBe(false);
  });

  it('refuse couleurs nommées (red, blue, etc.)', () => {
    expect(isValidColorValue('red')).toBe(false);
    expect(isValidColorValue('blue')).toBe(false);
  });

  it("refuse CSS injection : ';' '{' '}'", () => {
    expect(isValidColorValue('#fff; background:red')).toBe(false);
    expect(isValidColorValue('#fff }')).toBe(false);
    expect(isValidColorValue('rgba(0,0,0,0); evil')).toBe(false);
  });

  it('refuse format hsl() / oklch()', () => {
    expect(isValidColorValue('hsl(60, 100%, 50%)')).toBe(false);
    expect(isValidColorValue('oklch(70% 0.2 60)')).toBe(false);
  });
});

describe('sanitizeTheme', () => {
  it("null / undefined → {}", () => {
    expect(sanitizeTheme(null)).toEqual({});
    expect(sanitizeTheme(undefined)).toEqual({});
  });

  it("non-objet → {}", () => {
    expect(sanitizeTheme('string')).toEqual({});
    expect(sanitizeTheme(42)).toEqual({});
  });

  it('garde les clés valides + couleurs valides', () => {
    expect(
      sanitizeTheme({
        jaune: '#fff056',
        'st-rv-bg': '#aabbcc',
      }),
    ).toEqual({
      jaune: '#fff056',
      'st-rv-bg': '#aabbcc',
    });
  });

  it("drop clés avec underscore (non conforme [a-z0-9-])", () => {
    expect(sanitizeTheme({ jaune_h: '#fff' })).toEqual({});
  });

  it('drop clés avec MAJUSCULES', () => {
    expect(sanitizeTheme({ Jaune: '#fff', JAUNE: '#000' })).toEqual({});
  });

  it('drop clés avec caractères spéciaux', () => {
    expect(
      sanitizeTheme({
        'evil/key': '#fff',
        'space key': '#fff',
        '': '#fff',
      }),
    ).toEqual({});
  });

  it('drop valeurs invalides (couleur nommée, injection)', () => {
    expect(
      sanitizeTheme({
        jaune: 'red',
        rouge: '#fff; evil',
        'st-rv-bg': '#valid_color',
      }),
    ).toEqual({});
  });

  it('mix : garde uniquement les valides', () => {
    expect(
      sanitizeTheme({
        jaune: '#fff056', // valide
        rouge: 'red', // invalide
        'st-rv-bg': 'rgba(255,0,0,0.5)', // valide
        Evil: '#abc', // invalide (case)
      }),
    ).toEqual({
      jaune: '#fff056',
      'st-rv-bg': 'rgba(255,0,0,0.5)',
    });
  });

  it("rejette les keys qui ne sont pas des strings (Symbol etc.)", () => {
    // Object.entries skip les Symbol keys mais on teste pour sûreté
    const raw = { [Symbol('x')]: '#fff', valid: '#fff' };
    expect(sanitizeTheme(raw)).toEqual({ valid: '#fff' });
  });
});

describe('themeToCssVars', () => {
  it("theme vide → chaîne vide", () => {
    expect(themeToCssVars({})).toBe('');
  });

  it('1 var → "--key: val;"', () => {
    expect(themeToCssVars({ jaune: '#fff056' })).toBe('--jaune: #fff056;');
  });

  it('plusieurs vars → joints par espace', () => {
    const css = themeToCssVars({
      jaune: '#fff056',
      rouge: '#d92020',
    } as WorkshopTheme);
    expect(css).toContain('--jaune: #fff056;');
    expect(css).toContain('--rouge: #d92020;');
  });

  it("skip clés undefined (filter v != null)", () => {
    const css = themeToCssVars({
      jaune: '#fff056',
      'jaune-h': undefined as unknown as string,
    });
    expect(css).toContain('--jaune:');
    expect(css).not.toContain('--jaune-h:');
  });

  it("préfixe chaque key avec --", () => {
    const css = themeToCssVars({ jaune: '#fff056' });
    expect(css.startsWith('--')).toBe(true);
  });
});
