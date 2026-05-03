import { describe, it, expect } from 'vitest';
import { parseExcelSerial } from './parse-excel-serial';

describe('parseExcelSerial', () => {
  describe('valeurs de référence Excel "1900 date system"', () => {
    it('serial 1 → 1900-01-01', () => {
      expect(parseExcelSerial(1)).toBe('1900-01-01');
    });

    it('serial 61 (post-bug 1900-leap-year) → 1900-03-01', () => {
      expect(parseExcelSerial(61)).toBe('1900-03-01');
    });

    it('serial 60 (le bug : Excel croit que 1900 est bissextile) → 1900-02-28 corrigé', () => {
      // 60 dans Excel = 1900-02-29 (n'existe pas). On compense en mappant
      // sur le 28 février 1900 (jour réel précédent).
      expect(parseExcelSerial(60)).toBe('1900-02-28');
    });
  });

  describe('valeurs réelles du journal factures v1 (yako-cyclo)', () => {
    it.each([
      [46129, '2026-04-17'], // BDT 0114 facture Mélanie Vallée
      [46134, '2026-04-22'], // BDT 0113 archive Martin Pilote
      [46135, '2026-04-23'], // BDT 0104 archive Aurélie Delimal
      [46139, '2026-04-27'], // BDT 0118 archive Zak Thevenin
      [46140, '2026-04-28'], // ventes V0003/V0004
      [46142, '2026-04-30'], // BDT 0130 Marie-Dominique Michaud
      [46143, '2026-05-01'], // vente V0005
    ])('serial %d → %s', (serial, expected) => {
      expect(parseExcelSerial(serial)).toBe(expected);
    });
  });

  describe('valeurs invalides', () => {
    it('serial 0 (Lotus 1-2-3 sentinel) → null', () => {
      expect(parseExcelSerial(0)).toBeNull();
    });

    it('serial négatif → null', () => {
      expect(parseExcelSerial(-1)).toBeNull();
    });

    it('NaN → null', () => {
      expect(parseExcelSerial(Number.NaN)).toBeNull();
    });

    it('Infinity → null', () => {
      expect(parseExcelSerial(Number.POSITIVE_INFINITY)).toBeNull();
    });

    it('non-entier → tronqué (jour partiel ignoré)', () => {
      // 46142.5 = 2026-04-30 12:00 → on garde juste la date
      expect(parseExcelSerial(46142.5)).toBe('2026-04-30');
    });
  });
});
