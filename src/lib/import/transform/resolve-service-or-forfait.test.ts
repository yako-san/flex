import { describe, it, expect } from 'vitest';
import { resolveServiceOrForfait } from './resolve-service-or-forfait';
import type { V2ForfaitDraft, V2ServiceDraft } from './types';

const svc = (overrides: Partial<V2ServiceDraft>): V2ServiceDraft => ({
  id: 'service_TEST',
  workshopId: 'workshop_TEST',
  legacyCode: null,
  labelCanonical: '',
  categorie: null,
  categoriePrio: null,
  dureeMinutes: null,
  prix: '0',
  taxable: true,
  ...overrides,
});

const fft = (overrides: Partial<V2ForfaitDraft>): V2ForfaitDraft => ({
  id: 'forfait_TEST',
  workshopId: 'workshop_TEST',
  legacyCode: null,
  labelCanonical: '',
  prix: '0',
  dureeMinutes: null,
  taxable: true,
  ...overrides,
});

const services = [
  svc({ id: 'service_S00035', legacyCode: 'S00035', labelCanonical: '🧰 Ajust. : boitier de pédalier' }),
  svc({ id: 'service_S00047', legacyCode: 'S00047', labelCanonical: '🧰 Install. : chaine et lubrification' }),
  svc({ id: 'service_S00088', legacyCode: 'S00088', labelCanonical: '⛑️ Urgent. : Flat (15,5+13$ de chambre à air)' }),
];

const forfaits = [
  fft({ id: 'forfait_S00001', legacyCode: 'S00001', labelCanonical: '👌🏻 Forfait "BASE" - mise au point de sécurité' }),
  fft({ id: 'forfait_S00009', legacyCode: 'S00009', labelCanonical: '👌🏻 Forfait "MID" : préparation saisonnière' }),
  fft({ id: 'forfait_S00021', legacyCode: 'S00021', labelCanonical: '👌🏻 Forfait "FULL" : entretien complet' }),
];

describe('resolveServiceOrForfait', () => {
  describe('match par legacyCode (priorité forfait > service)', () => {
    it('S00001 → FORFAIT (forfait BASE)', () => {
      expect(resolveServiceOrForfait('S00001', '', services, forfaits)).toEqual({
        kind: 'FORFAIT',
        id: 'forfait_S00001',
      });
    });

    it('S00035 → SERVICE (Ajust. boitier)', () => {
      expect(resolveServiceOrForfait('S00035', '', services, forfaits)).toEqual({
        kind: 'SERVICE',
        id: 'service_S00035',
      });
    });

    it('S00088 → SERVICE (Urgent flat)', () => {
      expect(resolveServiceOrForfait('S00088', '', services, forfaits)).toEqual({
        kind: 'SERVICE',
        id: 'service_S00088',
      });
    });
  });

  describe('match par label si legacyCode absent', () => {
    it('label exact "👌🏻 Forfait \\"BASE\\" ..." → FORFAIT', () => {
      expect(
        resolveServiceOrForfait(
          undefined,
          '👌🏻 Forfait "BASE" - mise au point de sécurité',
          services,
          forfaits,
        ),
      ).toEqual({ kind: 'FORFAIT', id: 'forfait_S00001' });
    });

    it('label exact service → SERVICE', () => {
      expect(
        resolveServiceOrForfait(undefined, '🧰 Install. : chaine et lubrification', services, forfaits),
      ).toEqual({ kind: 'SERVICE', id: 'service_S00047' });
    });

    it('label case-insensitive', () => {
      expect(
        resolveServiceOrForfait(
          undefined,
          '👌🏻 forfait "BASE" - MISE AU POINT DE SÉCURITÉ',
          services,
          forfaits,
        ),
      ).toEqual({ kind: 'FORFAIT', id: 'forfait_S00001' });
    });

    it('label avec whitespace autour', () => {
      expect(
        resolveServiceOrForfait(undefined, '  🧰 Install. : chaine et lubrification  ', services, forfaits),
      ).toEqual({ kind: 'SERVICE', id: 'service_S00047' });
    });
  });

  describe('legacyCode invalide → fallback label', () => {
    it('legacyCode inconnu mais label match → trouve via label', () => {
      expect(
        resolveServiceOrForfait('S99999', '👌🏻 Forfait "BASE" - mise au point de sécurité', services, forfaits),
      ).toEqual({ kind: 'FORFAIT', id: 'forfait_S00001' });
    });
  });

  describe('non trouvé → null', () => {
    it('legacyCode et label inconnus', () => {
      expect(resolveServiceOrForfait('S99999', 'Service inconnu', services, forfaits)).toBeNull();
    });

    it('aucun critère fourni', () => {
      expect(resolveServiceOrForfait(undefined, '', services, forfaits)).toBeNull();
    });

    it('label vide / placeholder', () => {
      expect(resolveServiceOrForfait(undefined, '...', services, forfaits)).toBeNull();
      expect(resolveServiceOrForfait(undefined, '   ', services, forfaits)).toBeNull();
    });
  });

  describe('null/undefined safe', () => {
    it('legacyCode null + label valide', () => {
      expect(
        resolveServiceOrForfait(null, '🧰 Install. : chaine et lubrification', services, forfaits),
      ).toEqual({ kind: 'SERVICE', id: 'service_S00047' });
    });
  });
});
