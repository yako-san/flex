import { describe, it, expect } from 'vitest';
import { resolveMecano } from './resolve-mecano';
import type { V2EquipeMemberDraft } from './types';

const mk = (overrides: Partial<V2EquipeMemberDraft>): V2EquipeMemberDraft => ({
  id: 'eq_TEST',
  workshopId: 'workshop_TEST',
  prenom: '',
  nom: '',
  surnom: '',
  courriel: null,
  telephone: null,
  indicatif: '+1',
  lang: 'fr-CA',
  role: null,
  active: true,
  notes: null,
  legacyRawV1: null,
  ...overrides,
});

const equipe: V2EquipeMemberDraft[] = [
  mk({ id: 'eq_paco', prenom: 'François', nom: 'Comeau', surnom: 'Paco' }),
  mk({ id: 'eq_jf', prenom: 'Jean-François', nom: 'Bienvenue', surnom: 'J-F' }),
  mk({ id: 'eq_yako', prenom: 'Jean-Christophe', nom: 'Yacono', surnom: 'yako' }),
];

describe('resolveMecano', () => {
  describe('match par surnom (case-insensitive)', () => {
    it.each([
      ['yako', 'eq_yako'],
      ['YAKO', 'eq_yako'],
      ['Yako', 'eq_yako'],
      ['Paco', 'eq_paco'],
      ['paco', 'eq_paco'],
      ['J-F', 'eq_jf'],
      ['j-f', 'eq_jf'],
    ])('"%s" → %s', (input, expected) => {
      expect(resolveMecano(input, equipe)).toBe(expected);
    });
  });

  describe('match par nomComplet', () => {
    it.each([
      ['Jean-Christophe Yacono', 'eq_yako'],
      ['François Comeau', 'eq_paco'],
      ['Jean-François Bienvenue', 'eq_jf'],
      ['  Jean-Christophe Yacono  ', 'eq_yako'], // whitespace
    ])('"%s" → %s', (input, expected) => {
      expect(resolveMecano(input, equipe)).toBe(expected);
    });
  });

  describe('match par prenom seul (si unique)', () => {
    it('"François" (unique dans équipe) → Paco', () => {
      expect(resolveMecano('François', equipe)).toBe('eq_paco');
    });

    it('"Jean-Christophe" → yako', () => {
      expect(resolveMecano('Jean-Christophe', equipe)).toBe('eq_yako');
    });

    it('prenom ambigu (2 François dans équipe) → null', () => {
      const ambig = [
        mk({ id: 'eq_a', prenom: 'François', nom: 'Comeau', surnom: 'Paco' }),
        mk({ id: 'eq_b', prenom: 'François', nom: 'Lemieux', surnom: 'FL' }),
      ];
      expect(resolveMecano('François', ambig)).toBeNull();
    });
  });

  describe('sentinelles v1 → null', () => {
    it.each([
      'Sélection →',
      'Attente APPROBATION',
      'Attente MÉCANIQUE',
      '',
      '   ',
      '...',
      '—',
    ])('"%s" → null', (input) => {
      expect(resolveMecano(input, equipe)).toBeNull();
    });

    it('null en entrée → null', () => {
      expect(resolveMecano(null, equipe)).toBeNull();
    });

    it('undefined en entrée → null', () => {
      expect(resolveMecano(undefined, equipe)).toBeNull();
    });
  });

  describe('non-match → null', () => {
    it('texte arbitraire → null', () => {
      expect(resolveMecano('Personne Inconnue', equipe)).toBeNull();
    });

    it('équipe vide → null', () => {
      expect(resolveMecano('yako', [])).toBeNull();
    });
  });
});
