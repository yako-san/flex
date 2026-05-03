import { describe, it, expect } from 'vitest';
import { parseV1Date } from './parse-v1-date';

describe('parseV1Date', () => {
  describe('format ISO YYYY-MM-DD (déjà propre)', () => {
    it.each([
      ['2026-04-23', '2026-04-23'],
      ['2025-12-31', '2025-12-31'],
      ['2026-01-01', '2026-01-01'],
    ])('"%s" → "%s"', (input, expected) => {
      expect(parseV1Date(input)).toBe(expected);
    });
  });

  describe('format US M/D/YYYY (Sheets default)', () => {
    it.each([
      ['3/12/2026', '2026-03-12'], // Jean-Christophe Yacono dateIn
      ['3/26/2026', '2026-03-26'], // Aurélie Delimal dateIn
      ['4/7/2026', '2026-04-07'], // Alain Pelletier dateIn (zero-padding)
      ['12/31/2026', '2026-12-31'],
      ['1/1/2026', '2026-01-01'],
    ])('"%s" → "%s"', (input, expected) => {
      expect(parseV1Date(input)).toBe(expected);
    });
  });

  describe('ISO + heure embarquée → date seule', () => {
    it.each([
      ['2026-04-25\n13 h 30', '2026-04-25'], // vélo 0131 date1
      ['2026-04-23\n12:00', '2026-04-23'], // vélo 0121 date1
      ['2026-04-02\n09:32', '2026-04-02'], // BDC 0104 dateIn
      ['2026-05-04\n12 h 00', '2026-05-04'], // vélo 0138 date1
    ])('"%s" → "%s" (heure ignorée)', (input, expected) => {
      expect(parseV1Date(input)).toBe(expected);
    });
  });

  describe('Excel serial number', () => {
    it.each([
      [46142, '2026-04-30'],
      [46129, '2026-04-17'],
    ])('serial %d → "%s"', (input, expected) => {
      expect(parseV1Date(input)).toBe(expected);
    });
  });

  describe('valeurs vides / placeholders → null', () => {
    it.each(['', '   ', '...', '—', '-', null, undefined, '. . .'])('renvoie null pour %p', (input) => {
      expect(parseV1Date(input)).toBeNull();
    });
  });

  describe('formats non reconnus → null', () => {
    it.each([
      'random text',
      '2026', // année seule
      '32/13/2026', // mois/jour invalides
      '2026/04/23', // slash au lieu de tiret
      '23-04-2026', // DD-MM-YYYY
      'avril 23',
    ])('renvoie null pour "%s"', (input) => {
      expect(parseV1Date(input)).toBeNull();
    });
  });

  describe('whitespace + invisibles tolérés', () => {
    it('strip whitespace autour', () => {
      expect(parseV1Date('  2026-04-23  ')).toBe('2026-04-23');
      expect(parseV1Date('  3/12/2026  ')).toBe('2026-03-12');
    });
  });
});
