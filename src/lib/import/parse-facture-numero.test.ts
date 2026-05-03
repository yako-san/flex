import { describe, it, expect } from 'vitest';
import { parseLegacyFactureNumero } from './parse-facture-numero';

describe('parseLegacyFactureNumero', () => {
  describe('format v1 standard "V" + chiffres', () => {
    it('V0001 → prefix=V, sequence=1', () => {
      expect(parseLegacyFactureNumero('V0001')).toEqual({
        prefix: 'V',
        sequence: 1,
        dateSuffix: null,
        raw: 'V0001',
      });
    });

    it('V0042 → sequence=42', () => {
      expect(parseLegacyFactureNumero('V0042')).toEqual({
        prefix: 'V',
        sequence: 42,
        dateSuffix: null,
        raw: 'V0042',
      });
    });

    it('V12345 → sequence=12345 (au-delà de 4 digits)', () => {
      expect(parseLegacyFactureNumero('V12345')).toEqual({
        prefix: 'V',
        sequence: 12345,
        dateSuffix: null,
        raw: 'V12345',
      });
    });

    it('V minuscule toléré', () => {
      expect(parseLegacyFactureNumero('v0001')).toEqual({
        prefix: 'V',
        sequence: 1,
        dateSuffix: null,
        raw: 'v0001',
      });
    });
  });

  describe('format v1 étendu "V####-YYYY-MM-DD" (vues sur ventes archivées)', () => {
    it.each([
      ['V0001-2026-04-15', 1, '2026-04-15'], // vente Yacono
      ['V0002-2026-04-23', 2, '2026-04-23'], // vente Martin Savard
      ['V0003-2026-04-28', 3, '2026-04-28'], // vente Cyclo Flex
      ['V0004-2026-04-28', 4, '2026-04-28'], // vente Walk-in
      ['V0005-2026-04-29', 5, '2026-04-29'], // vente Walk-in
      ['V0006-2026-04-29', 6, '2026-04-29'], // vente Walk-in
    ])('"%s" → sequence=%d, dateSuffix=%s', (input, sequence, dateSuffix) => {
      expect(parseLegacyFactureNumero(input)).toEqual({
        prefix: 'V',
        sequence,
        dateSuffix,
        raw: input,
      });
    });
  });

  describe('format legacy mixte (chiffres seuls)', () => {
    it('"42" → prefix=null, sequence=42', () => {
      expect(parseLegacyFactureNumero('42')).toEqual({
        prefix: null,
        sequence: 42,
        dateSuffix: null,
        raw: '42',
      });
    });

    it('"0001" zero-padded sans préfixe → sequence=1', () => {
      expect(parseLegacyFactureNumero('0001')).toEqual({
        prefix: null,
        sequence: 1,
        dateSuffix: null,
        raw: '0001',
      });
    });
  });

  describe('whitespace tolérant', () => {
    it('strip whitespace en début et fin', () => {
      expect(parseLegacyFactureNumero('  V0001  ')).toEqual({
        prefix: 'V',
        sequence: 1,
        dateSuffix: null,
        raw: '  V0001  ',
      });
    });

    it('strip whitespace avec dateSuffix', () => {
      expect(parseLegacyFactureNumero('  V0007-2026-04-30  ')).toEqual({
        prefix: 'V',
        sequence: 7,
        dateSuffix: '2026-04-30',
        raw: '  V0007-2026-04-30  ',
      });
    });
  });

  describe('cas invalides → null', () => {
    it.each([
      ['', 'chaîne vide'],
      ['   ', 'whitespace seul'],
      ['V', 'préfixe sans séquence'],
      ['VV0001', 'double préfixe'],
      ['V00-01', 'tiret au milieu sans date suffixe valide'],
      ['V0001-2026', 'date suffixe incomplète'],
      ['V0001-2026-13-01', 'mois invalide'],
      ['V0001-2026-04-32', 'jour invalide'],
      ['V0001-26-04-15', 'année 2 chiffres'],
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
