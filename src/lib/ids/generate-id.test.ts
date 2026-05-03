import { describe, it, expect } from 'vitest';
import { generateId, ID_PREFIXES, type IdPrefix } from './generate-id';

describe('generateId', () => {
  describe('format préfixe + ULID', () => {
    it.each([
      'workshop',
      'user',
      'member',
      'client',
      'velo',
      'bdc',
      'service',
      'piece',
      'forfait',
      'marque',
      'facture',
      'vente',
      'po',
      'translation',
    ] as const satisfies readonly IdPrefix[])('"%s" → format <prefix>_<26 chars Crockford>', (prefix) => {
      const id = generateId(prefix);
      const re = new RegExp(`^${prefix}_[0-9A-HJKMNP-TV-Z]{26}$`);
      expect(id).toMatch(re);
    });
  });

  describe('unicité', () => {
    it('1000 appels successifs → 1000 IDs distincts', () => {
      const set = new Set<string>();
      for (let i = 0; i < 1000; i++) set.add(generateId('client'));
      expect(set.size).toBe(1000);
    });
  });

  describe('ordre lexicographique = ordre temporel (ULID v7)', () => {
    it('IDs successifs ordonnés lexicographiquement croissants', async () => {
      const a = generateId('client');
      // ULID partage les 10 premiers chars (timestamp ms) — il faut espacer
      await new Promise((r) => setTimeout(r, 5));
      const b = generateId('client');
      expect(a < b).toBe(true);
    });
  });

  describe('ID_PREFIXES expose la liste des préfixes valides', () => {
    it('contient les 14 préfixes du domaine', () => {
      expect(ID_PREFIXES).toEqual([
        'workshop',
        'user',
        'member',
        'client',
        'velo',
        'bdc',
        'bdci',
        'task',
        'service',
        'piece',
        'forfait',
        'marque',
        'facture',
        'vente',
        'vdi',
        'po',
        'poi',
        'mov',
        'ctr',
        'eq',
        'translation',
        'log',
        'map',
        'ftt',
      ]);
    });
  });
});
