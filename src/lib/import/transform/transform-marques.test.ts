import { describe, it, expect } from 'vitest';
import { transformMarques } from './transform-marques';
import type { ImportContext } from './types';

const ctx: ImportContext = {
  workshopId: 'workshop_01HXTEST',
  defaultLocale: 'fr-CA',
  activeLocales: ['fr-CA', 'en-CA'],
};

describe('transformMarques', () => {
  describe('cas vides', () => {
    it('liste vide → résultat vide', () => {
      const r = transformMarques([], ctx);
      expect(r.records).toEqual([]);
      expect(r.translations).toEqual([]);
      expect(r.skipped).toEqual([]);
    });
  });

  describe('cas nominal', () => {
    it('marque unique "Argon18" → 1 V2Marque + 1 Translation fr-CA', () => {
      const r = transformMarques([{ nom: 'Argon18' }], ctx);

      expect(r.records).toHaveLength(1);
      expect(r.records[0]?.workshopId).toBe('workshop_01HXTEST');
      expect(r.records[0]?.nom).toBe('Argon18');
      expect(r.records[0]?.id).toMatch(/^marque_[0-9A-HJKMNP-TV-Z]{26}$/);

      expect(r.translations).toHaveLength(1);
      expect(r.translations[0]).toMatchObject({
        workshopId: 'workshop_01HXTEST',
        entityType: 'MARQUE',
        entityId: r.records[0]?.id,
        field: 'label',
        locale: 'fr-CA',
        value: 'Argon18',
        source: 'USER',
      });
      expect(r.translations[0]?.reviewedAt).toBeInstanceOf(Date);
    });

    it('30 marques v1 réelles (yako-cyclo) → 30 V2Marques', () => {
      const real = [
        'Autre',
        'Argon18',
        'Aspire',
        'Bassi',
        'Bianchi',
        'Bonelli',
        'Brompton',
        'Cannondale',
        'Cervélo',
        'Desmarais',
        'Devinci',
        'Giant',
        'IGO',
        'Kona',
        'Louis Garneau',
        'Marin',
        'Marinoni',
        'Miele',
        'Moose',
        'Norco',
        'Opus',
        'Panorama',
        'Peugeot',
        'Picnica',
        'Raleigh',
        'Rocky Mountain',
        'Specialized',
        'Surly',
        'Trek',
        'Triban',
        'Vélomane',
      ];
      const r = transformMarques(
        real.map((nom) => ({ nom })),
        ctx,
      );
      expect(r.records).toHaveLength(31);
      expect(r.translations).toHaveLength(31);
      expect(r.skipped).toEqual([]);

      // tous les ids sont distincts
      const ids = new Set(r.records.map((m) => m.id));
      expect(ids.size).toBe(31);

      // chaque translation pointe vers un id existant
      for (const t of r.translations) {
        expect(ids.has(t.entityId)).toBe(true);
      }
    });
  });

  describe('filtrage des artefacts v1', () => {
    it.each([
      ['', 'vide'],
      ['   ', 'whitespace'],
      ['...', 'placeholder'],
      ['—', 'tiret cadratin'],
      ['Sélection →', 'sentinelle UI v1'],
      ['ℹ️ Après modification, recharger la page', 'pollution help-text v1'],
    ])('skip "%s" (%s)', (nom, _) => {
      const r = transformMarques([{ nom }], ctx);
      expect(r.records).toEqual([]);
      expect(r.translations).toEqual([]);
      expect(r.skipped).toHaveLength(1);
      expect(r.skipped[0]?.entityType).toBe('marque');
      expect(r.skipped[0]?.raw).toEqual({ nom });
    });
  });

  describe('déduplication case-insensitive', () => {
    it('"Trek" + "trek" + "TREK" → 1 seule entrée + 2 skipped', () => {
      const r = transformMarques(
        [{ nom: 'Trek' }, { nom: 'trek' }, { nom: 'TREK' }],
        ctx,
      );
      expect(r.records).toHaveLength(1);
      expect(r.records[0]?.nom).toBe('Trek');
      expect(r.skipped).toHaveLength(2);
      expect(r.skipped.every((s) => s.reason.includes('doublon'))).toBe(true);
    });

    it('"  Trek  " et "Trek" → 1 seule entrée (whitespace ignoré)', () => {
      const r = transformMarques([{ nom: '  Trek  ' }, { nom: 'Trek' }], ctx);
      expect(r.records).toHaveLength(1);
      expect(r.skipped).toHaveLength(1);
    });
  });

  describe('locales multiples', () => {
    it('activeLocales=[fr-CA, en-CA] → translations seulement en defaultLocale (les autres ajoutées plus tard via DeepL)', () => {
      // Décision : on ne génère qu'une seule translation à l'import (default locale).
      // Les traductions automatiques DeepL/Claude se feront en post-traitement.
      const r = transformMarques([{ nom: 'Trek' }], ctx);
      expect(r.translations).toHaveLength(1);
      expect(r.translations[0]?.locale).toBe('fr-CA');
    });
  });

  describe('trim conservatif', () => {
    it('"  Bonelli  " → nom canonique "Bonelli"', () => {
      const r = transformMarques([{ nom: '  Bonelli  ' }], ctx);
      expect(r.records[0]?.nom).toBe('Bonelli');
      expect(r.translations[0]?.value).toBe('Bonelli');
    });
  });
});
