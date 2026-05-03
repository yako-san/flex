import { describe, it, expect } from 'vitest';
import { parseLegacyFactureNumero } from './parse-facture-numero';

describe('parseLegacyFactureNumero', () => {
  describe('format v1 standard "V" + chiffres', () => {
    it('V0001 → prefix=V, sequence=1', () => {
      expect(parseLegacyFactureNumero('V0001')).toEqual({
        prefix: 'V',
        sequence: 1,
        raw: 'V0001',
      });
    });

    it('V0042 → sequence=42', () => {
      expect(parseLegacyFactureNumero('V0042')).toEqual({
        prefix: 'V',
        sequence: 42,
        raw: 'V0042',
      });
    });

    it('V12345 → sequence=12345 (au-delà de 4 digits)', () => {
      expect(parseLegacyFactureNumero('V12345')).toEqual({
        prefix: 'V',
        sequence: 12345,
        raw: 'V12345',
      });
    });

    it('V minuscule toléré', () => {
      expect(parseLegacyFactureNumero('v0001')).toEqual({
        prefix: 'V',
        sequence: 1,
        raw: 'v0001',
      });
    });
  });

  describe('format legacy mixte (chiffres seuls)', () => {
    it('"42" → prefix=null, sequence=42', () => {
      expect(parseLegacyFactureNumero('42')).toEqual({
        prefix: null,
        sequence: 42,
        raw: '42',
      });
    });

    it('"0001" zero-padded sans préfixe → sequence=1', () => {
      expect(parseLegacyFactureNumero('0001')).toEqual({
        prefix: null,
        sequence: 1,
        raw: '0001',
      });
    });
  });

  describe('whitespace tolérant', () => {
    it('strip whitespace en début et fin', () => {
      expect(parseLegacyFactureNumero('  V0001  ')).toEqual({
        prefix: 'V',
        sequence: 1,
        raw: '  V0001  ',
      });
    });
  });

  describe('cas invalides → null', () => {
    it.each([
      ['', 'chaîne vide'],
      ['   ', 'whitespace seul'],
      ['V', 'préfixe sans séquence'],
      ['VV0001', 'double préfixe'],
      ['V00-01', 'tiret au milieu'],
      ['foo', 'lettres seules'],
      ['V0001A', 'suffixe alphabétique'],
      ['-1', 'séquence négative'],
    ])('renvoie null pour "%s" (%s)', (input) => {
      expect(parseLegacyFactureNumero(input)).toBeNull();
    });

    it('null en entrée → null', () => {
      expect(parseLegacyFactureNumero(null)).toBeNull();
    });

    it('undefined en entrée → null', () => {
      expect(parseLegacyFactureNumero(undefined)).toBeNull();
    });
  });

  describe('préserve raw input pour traçabilité', () => {
    it('le raw original (avec whitespace, casse) est conservé', () => {
      const r = parseLegacyFactureNumero('  v0042  ');
      expect(r?.raw).toBe('  v0042  ');
    });
  });
});
