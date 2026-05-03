import { describe, it, expect } from 'vitest';
import { stripInvisibleUnicode } from './strip-invisible-unicode';

describe('stripInvisibleUnicode', () => {
  describe('caractères de direction bidi (vus dans tels v1 collés depuis Sheets/iOS)', () => {
    it('strip LRE (U+202A) et PDF (U+202C) autour d\'un téléphone', () => {
      // Cas réel : equipe[1].tel = "‭(438) 969-8642‬"
      const input = '‪(438) 969-8642‬';
      expect(stripInvisibleUnicode(input)).toBe('(438) 969-8642');
    });

    it('strip LRM (U+200E) en début et fin', () => {
      expect(stripInvisibleUnicode('‎5145830972‎')).toBe('5145830972');
    });

    it('strip RLM (U+200F) au milieu', () => {
      expect(stripInvisibleUnicode('51458‏30972')).toBe('5145830972');
    });

    it('strip LRO (U+202D) et RLO (U+202E)', () => {
      expect(stripInvisibleUnicode('‭514‮')).toBe('514');
    });
  });

  describe('zero-width caractères', () => {
    it.each([
      ['​test', 'test', 'ZWSP'],
      ['te‌st', 'test', 'ZWNJ'],
      ['te‍st', 'test', 'ZWJ'],
      ['﻿test', 'test', 'BOM'],
      ['te⁠st', 'test', 'WORD JOINER'],
    ])('strip "%s" → "%s" (%s)', (input, expected) => {
      expect(stripInvisibleUnicode(input)).toBe(expected);
    });
  });

  describe('cas combinés (vrais tels v1)', () => {
    it('"‭(514) 274-7713‬" (LRE+PDF) → "(514) 274-7713"', () => {
      const real = '‪(514) 274-7713‬';
      expect(stripInvisibleUnicode(real)).toBe('(514) 274-7713');
    });

    it('"‭(514) 617-5774‬" (LRE+PDF) → "(514) 617-5774"', () => {
      const real = '‪(514) 617-5774‬';
      expect(stripInvisibleUnicode(real)).toBe('(514) 617-5774');
    });
  });

  describe('no-op sur texte propre', () => {
    it.each([
      'Hello World',
      '5145830972',
      '+15142446223',
      'a@b.com',
      'Bonjour, ça va? — accents préservés',
    ])('renvoie tel quel "%s"', (input) => {
      expect(stripInvisibleUnicode(input)).toBe(input);
    });
  });

  describe('valeurs vides ou nulles', () => {
    it('chaîne vide → chaîne vide', () => {
      expect(stripInvisibleUnicode('')).toBe('');
    });
    it('null → null', () => {
      expect(stripInvisibleUnicode(null)).toBeNull();
    });
    it('undefined → null', () => {
      expect(stripInvisibleUnicode(undefined)).toBeNull();
    });
  });

  describe('préserve les espaces normaux', () => {
    it('espaces ASCII et insécables conservés', () => {
      expect(stripInvisibleUnicode('a b c')).toBe('a b c');
    });
  });
});
