import { describe, it, expect } from 'vitest';
import { normalizeNonValue } from './normalize-non-value';

describe('normalizeNonValue', () => {
  describe('placeholders v1 → null', () => {
    it.each([
      '',
      '   ',
      '...',
      '..',
      '....',
      '—',
      '-',
      '.',
      '. . .',
      '…', // ellipsis Unicode (U+2026)
    ])('renvoie null pour "%s"', (input) => {
      expect(normalizeNonValue(input)).toBeNull();
    });

    it('null en entrée → null', () => {
      expect(normalizeNonValue(null)).toBeNull();
    });

    it('undefined en entrée → null', () => {
      expect(normalizeNonValue(undefined)).toBeNull();
    });
  });

  describe('valeurs réelles préservées', () => {
    it.each([
      'M', // taille vélo
      'noir', // couleur
      'XL',
      '700C',
      'a@b.com',
      '+15145830972',
      'Argon18',
      'Subito',
      'Bonjour le monde',
    ])('renvoie tel quel "%s"', (input) => {
      expect(normalizeNonValue(input)).toBe(input);
    });
  });

  describe('whitespace', () => {
    it('strip whitespace autour mais préserve la valeur', () => {
      expect(normalizeNonValue('  Bonelli  ')).toBe('Bonelli');
    });

    it('placeholder entouré de whitespace → null', () => {
      expect(normalizeNonValue('  ...  ')).toBeNull();
      expect(normalizeNonValue('   —   ')).toBeNull();
    });
  });

  describe('faux placeholders à ne PAS normaliser', () => {
    it('valeur contenant des points mais pas que → préservée', () => {
      expect(normalizeNonValue('M.')).toBe('M.');
      expect(normalizeNonValue('Mr.')).toBe('Mr.');
      expect(normalizeNonValue('U.S.A.')).toBe('U.S.A.');
    });

    it('numéro de série avec tirets → préservé', () => {
      expect(normalizeNonValue('360BXXS00017TL')).toBe('360BXXS00017TL');
      expect(normalizeNonValue('011723577')).toBe('011723577');
    });
  });
});
