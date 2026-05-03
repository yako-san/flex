import { describe, it, expect } from 'vitest';
import { transformEquipe, type V1EquipeMember } from './transform-equipe';
import type { ImportContext } from './types';

const ctx: ImportContext = {
  workshopId: 'workshop_01HXTEST',
  defaultLocale: 'fr-CA',
  activeLocales: ['fr-CA', 'en-CA'],
};

const member = (overrides: Partial<V1EquipeMember> = {}): V1EquipeMember => ({
  prenom: 'Jean',
  nom: 'Doe',
  surnom: 'jdoe',
  courriel: 'jean@example.com',
  tel: '5145559999',
  indicatif: '+1',
  lang: 'FR',
  role: 'Mécanicien',
  active: true,
  notes: '',
  ...overrides,
});

describe('transformEquipe', () => {
  describe('cas vides', () => {
    it('liste vide → résultat vide', () => {
      const r = transformEquipe([], ctx);
      expect(r.records).toEqual([]);
      expect(r.skipped).toEqual([]);
    });
  });

  describe('cas réels yako-cyclo (3 mecanos)', () => {
    const real: V1EquipeMember[] = [
      {
        prenom: 'François',
        nom: 'Comeau',
        surnom: 'Paco',
        courriel: '[borealeinfo@gmail.com](mailto:borealeinfo@gmail.com)',
        tel: '(438) 969-8642‬',
        indicatif: '+1',
        lang: 'FR',
        role: 'Mécanicien',
        active: true,
        notes: '',
      },
      {
        prenom: 'Jean-François',
        nom: 'Bienvenue',
        surnom: 'J-F',
        courriel: '[fcomeau07@gmail.com](mailto:fcomeau07@gmail.com)',
        tel: '‭(514) 274-7713‬',
        indicatif: '+1',
        lang: 'FR',
        role: 'Mécanicien',
        active: true,
        notes: '',
      },
      {
        prenom: 'Jean-Christophe',
        nom: 'Yacono',
        surnom: 'yako',
        courriel: '[yako.cyclo@gmail.com](mailto:yako.cyclo@gmail.com)',
        tel: '(514) 995-3445',
        indicatif: '+1',
        lang: 'FR',
        role: 'Mécanicien',
        active: true,
        notes: '',
      },
    ];

    it('3 mecanos importés correctement', () => {
      const r = transformEquipe(real, ctx);
      expect(r.records).toHaveLength(3);
      expect(r.skipped).toEqual([]);
    });

    it('courriels strippés du markdown', () => {
      const r = transformEquipe(real, ctx);
      expect(r.records[0]?.courriel).toBe('borealeinfo@gmail.com');
      expect(r.records[1]?.courriel).toBe('fcomeau07@gmail.com');
      expect(r.records[2]?.courriel).toBe('yako.cyclo@gmail.com');
    });

    it('tels normalisés en E.164 (incl. invisibles strippés)', () => {
      const r = transformEquipe(real, ctx);
      expect(r.records[0]?.telephone).toBe('+14389698642');
      expect(r.records[1]?.telephone).toBe('+15142747713');
      expect(r.records[2]?.telephone).toBe('+15149953445');
    });

    it('surnoms préservés', () => {
      const r = transformEquipe(real, ctx);
      expect(r.records.map((m) => m.surnom)).toEqual(['Paco', 'J-F', 'yako']);
    });

    it('lang FR → fr-CA (mappée sur defaultLocale du context)', () => {
      const r = transformEquipe(real, ctx);
      expect(r.records.every((m) => m.lang === 'fr-CA')).toBe(true);
    });

    it('IDs préfixés eq_ + ULID', () => {
      const r = transformEquipe(real, ctx);
      expect(r.records.every((m) => /^eq_[0-9A-HJKMNP-TV-Z]{26}$/.test(m.id))).toBe(true);
    });
  });

  describe('mapping de la lang v1 → BCP 47', () => {
    it('lang="FR" + activeLocales=[fr-CA, en-CA] → "fr-CA"', () => {
      const r = transformEquipe([member({ lang: 'FR' })], ctx);
      expect(r.records[0]?.lang).toBe('fr-CA');
    });

    it('lang="EN" + activeLocales=[fr-CA, en-CA] → "en-CA"', () => {
      const r = transformEquipe([member({ lang: 'EN' })], ctx);
      expect(r.records[0]?.lang).toBe('en-CA');
    });

    it('lang="ES" mais activeLocales sans es- → fallback defaultLocale', () => {
      const r = transformEquipe([member({ lang: 'ES' })], ctx);
      expect(r.records[0]?.lang).toBe('fr-CA');
    });

    it('lang vide → fallback defaultLocale', () => {
      const r = transformEquipe([member({ lang: '' })], ctx);
      expect(r.records[0]?.lang).toBe('fr-CA');
    });

    it('lang BCP 47 déjà fournie ("es-MX") → préservée', () => {
      const ctxMx: ImportContext = {
        ...ctx,
        activeLocales: ['es-MX', 'en-CA'],
        defaultLocale: 'es-MX',
      };
      const r = transformEquipe([member({ lang: 'es-MX' })], ctxMx);
      expect(r.records[0]?.lang).toBe('es-MX');
    });
  });

  describe('active : tolérance booléen ou string FAUX/VRAI/TRUE/FALSE', () => {
    it.each([
      [true, true],
      [false, false],
      ['VRAI', true],
      ['vrai', true],
      ['TRUE', true],
      ['true', true],
      ['FAUX', false],
      ['faux', false],
      ['FALSE', false],
      ['false', false],
    ])('active=%p → %p', (input, expected) => {
      const r = transformEquipe([member({ active: input as never })], ctx);
      expect(r.records[0]?.active).toBe(expected);
    });

    it('active manquant → true (default)', () => {
      const m: V1EquipeMember = { ...member(), active: undefined as never };
      const r = transformEquipe([m], ctx);
      expect(r.records[0]?.active).toBe(true);
    });
  });

  describe('cas dégénérés à skip', () => {
    it('surnom vide → skip', () => {
      const r = transformEquipe([member({ surnom: '' })], ctx);
      expect(r.records).toEqual([]);
      expect(r.skipped).toHaveLength(1);
    });

    it('surnom = "..." (placeholder) → skip', () => {
      const r = transformEquipe([member({ surnom: '...' })], ctx);
      expect(r.records).toEqual([]);
      expect(r.skipped).toHaveLength(1);
    });

    it('prenom + nom tous deux vides → skip', () => {
      const r = transformEquipe([member({ prenom: '', nom: '' })], ctx);
      expect(r.records).toEqual([]);
      expect(r.skipped).toHaveLength(1);
    });

    it('2 équipiers même surnom (case-insensitive) → 1 + 1 skipped', () => {
      const r = transformEquipe(
        [
          member({ prenom: 'Jean', nom: 'Doe', surnom: 'jdoe' }),
          member({ prenom: 'John', nom: 'Doe', surnom: 'JDOE' }),
        ],
        ctx,
      );
      expect(r.records).toHaveLength(1);
      expect(r.skipped).toHaveLength(1);
      expect(r.skipped[0]?.reason).toContain('surnom');
    });
  });

  describe('valeurs nullable', () => {
    it('courriel vide → null', () => {
      const r = transformEquipe([member({ courriel: '' })], ctx);
      expect(r.records[0]?.courriel).toBeNull();
    });

    it('tel="à venir" → telephone null', () => {
      const r = transformEquipe([member({ tel: 'à venir' })], ctx);
      expect(r.records[0]?.telephone).toBeNull();
    });

    it('role vide → null', () => {
      const r = transformEquipe([member({ role: '' })], ctx);
      expect(r.records[0]?.role).toBeNull();
    });

    it('notes "..." → null', () => {
      const r = transformEquipe([member({ notes: '...' })], ctx);
      expect(r.records[0]?.notes).toBeNull();
    });
  });
});
