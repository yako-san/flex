import { describe, it, expect } from 'vitest';
import { stripMarkdownEmail } from './strip-markdown-email';

describe('stripMarkdownEmail', () => {
  describe('format Sheets [email](mailto:email)', () => {
    it.each([
      ['[a@venir.ca](mailto:a@venir.ca)', 'a@venir.ca'],
      ['[etienne.mayrand@gmail.com](mailto:etienne.mayrand@gmail.com)', 'etienne.mayrand@gmail.com'],
      ['[mille_tentatives@hotmail.com](mailto:mille_tentatives@hotmail.com)', 'mille_tentatives@hotmail.com'],
      ['[fcomeau07@gmail.com](mailto:fcomeau07@gmail.com)', 'fcomeau07@gmail.com'],
      ['[zak.thevenin@pm.me](mailto:zak.thevenin@pm.me)', 'zak.thevenin@pm.me'],
    ])('extrait l\'email pur depuis "%s"', (input, expected) => {
      expect(stripMarkdownEmail(input)).toBe(expected);
    });

    it('le label affiché peut différer du mailto (priorité au mailto)', () => {
      // Cas théorique : label "contact" mais URL mailto:vrai@email.com
      expect(stripMarkdownEmail('[contact](mailto:vrai@email.com)')).toBe('vrai@email.com');
    });
  });

  describe('emails déjà propres (no-op)', () => {
    it.each([
      'walkin@cycloflex.local',
      'plain@example.com',
      'has+plus@example.com',
      'with.dot@sub.example.co.uk',
    ])('renvoie tel quel "%s"', (input) => {
      expect(stripMarkdownEmail(input)).toBe(input);
    });
  });

  describe('valeurs vides ou nulles', () => {
    it('chaîne vide → chaîne vide', () => {
      expect(stripMarkdownEmail('')).toBe('');
    });

    it('null → null', () => {
      expect(stripMarkdownEmail(null)).toBeNull();
    });

    it('undefined → null', () => {
      expect(stripMarkdownEmail(undefined)).toBeNull();
    });
  });

  describe('whitespace', () => {
    it('strip whitespace autour', () => {
      expect(stripMarkdownEmail('  a@b.com  ')).toBe('a@b.com');
      expect(stripMarkdownEmail('  [a@b.com](mailto:a@b.com)  ')).toBe('a@b.com');
    });
  });

  describe('format dégradé non-markdown → renvoyer tel quel après trim', () => {
    it('chaîne arbitraire sans markdown → tel quel (validation email faite ailleurs)', () => {
      expect(stripMarkdownEmail('not-an-email')).toBe('not-an-email');
    });

    it('markdown malformé → tel quel', () => {
      expect(stripMarkdownEmail('[a@b.com]')).toBe('[a@b.com]');
      expect(stripMarkdownEmail('[a@b.com](pas-mailto)')).toBe('[a@b.com](pas-mailto)');
    });
  });
});
