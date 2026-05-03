import { describe, it, expect } from 'vitest';
import { parseDureeHHMM } from './parse-duree-hhmm';

describe('parseDureeHHMM', () => {
  describe('format HH:MM (durée services v1)', () => {
    it.each([
      ['0:00', 0],
      ['0:05', 5],
      ['0:15', 15],
      ['0:30', 30],
      ['0:45', 45],
      ['1:00', 60],
      ['1:15', 75],
      ['1:30', 90],
      ['2:00', 120],
      ['3:30', 210],
      ['5:00', 300],
      ['6:00', 360],
      ['10:00', 600], // > 9h ok
    ])('"%s" → %d minutes', (input, expected) => {
      expect(parseDureeHHMM(input)).toBe(expected);
    });
  });

  describe('whitespace tolérant', () => {
    it('strip whitespace', () => {
      expect(parseDureeHHMM('  2:00  ')).toBe(120);
    });
  });

  describe('placeholders / vides → null', () => {
    it.each(['', '   ', '...', '—', '-', null, undefined])('renvoie null pour %p', (input) => {
      expect(parseDureeHHMM(input)).toBeNull();
    });
  });

  describe('formats invalides → null', () => {
    it.each([
      'abc',
      '2h00',
      '2:60', // minutes >= 60 invalide
      '2:99',
      '-1:00', // négatif
      '2:1', // une seule digit après ':'
      '2', // pas de séparateur
      ':30', // heure manquante
    ])('renvoie null pour "%s"', (input) => {
      expect(parseDureeHHMM(input)).toBeNull();
    });
  });
});
