import { describe, it, expect } from 'vitest';
import {
  transformCatalogueServices,
  type V1CatalogueService,
} from './transform-catalogue-services';
import type { ImportContext } from './types';

const ctx: ImportContext = {
  workshopId: 'workshop_01HXTEST',
  defaultLocale: 'fr-CA',
  activeLocales: ['fr-CA', 'en-CA'],
};

const svc = (overrides: Partial<V1CatalogueService>): V1CatalogueService => ({
  serviceId: 'S00000',
  label: '',
  duree: '',
  categorie: '',
  prix: 0,
  categoriePrio: '',
  ...overrides,
});

describe('transformCatalogueServices', () => {
  describe('cas vides', () => {
    it('liste vide → tout vide', () => {
      const r = transformCatalogueServices([], ctx);
      expect(r.services).toEqual([]);
      expect(r.forfaits).toEqual([]);
      expect(r.taskTemplates).toEqual([]);
      expect(r.translations).toEqual([]);
      expect(r.skipped).toEqual([]);
    });
  });

  describe('classification des lignes v1', () => {
    it('Forfait isolé (S00001 sans sous-items) → 1 V2Forfait', () => {
      const r = transformCatalogueServices(
        [
          svc({
            serviceId: 'S00001',
            label: '👌🏻 Forfait "BASE" - mise au point de sécurité',
            duree: '2:00',
            categorie: 'Forfaits',
            prix: 90,
            categoriePrio: '',
          }),
        ],
        ctx,
      );
      expect(r.forfaits).toHaveLength(1);
      expect(r.forfaits[0]).toMatchObject({
        legacyCode: 'S00001',
        labelCanonical: '👌🏻 Forfait "BASE" - mise au point de sécurité',
        prix: '90',
        dureeMinutes: 120,
        taxable: true,
      });
      expect(r.services).toEqual([]);
      expect(r.taskTemplates).toEqual([]);
    });

    it('Service à la carte → 1 V2Service', () => {
      const r = transformCatalogueServices(
        [
          svc({
            serviceId: 'S00035',
            label: '🧰 Ajust. : boitier de pédalier',
            duree: '0:40',
            categorie: 'Services - À la carte',
            prix: 30,
            categoriePrio: '2. Transmission, Cartouches BB',
          }),
        ],
        ctx,
      );
      expect(r.services).toHaveLength(1);
      expect(r.services[0]).toMatchObject({
        legacyCode: 'S00035',
        labelCanonical: '🧰 Ajust. : boitier de pédalier',
        dureeMinutes: 40,
        prix: '30',
        taxable: true,
        categorie: 'Services - À la carte',
        categoriePrio: '2. Transmission, Cartouches BB',
      });
      expect(r.forfaits).toEqual([]);
      expect(r.taskTemplates).toEqual([]);
    });

    it('Service avec prix=0 (rencontre gratuite) → V2Service à part entière', () => {
      const r = transformCatalogueServices(
        [
          svc({
            serviceId: 'S00090',
            label: '👋 Rencontre : dépôt et évaluation',
            duree: '0:15',
            prix: 0,
          }),
        ],
        ctx,
      );
      expect(r.services).toHaveLength(1);
      expect(r.services[0]?.prix).toBe('0');
    });
  });

  describe('headers de section → skip', () => {
    it.each([
      ['—', 'séparateur visuel pur'],
      ['— SERVICES À LA CARTE', 'header section em-dash'],
      ['— RENCONTRE', 'header section'],
      ['— DIVERS', 'header section'],
    ])('skip "%s" (%s)', (label) => {
      const r = transformCatalogueServices([svc({ label })], ctx);
      expect(r.services).toEqual([]);
      expect(r.forfaits).toEqual([]);
      expect(r.skipped).toHaveLength(1);
    });
  });

  describe('sous-tâches de forfait (label "- xxx" + dans une zone forfait)', () => {
    it('Forfait BASE + 7 sous-tâches → 1 Forfait + 0 Service + 7 ForfaitTaskTemplate', () => {
      const r = transformCatalogueServices(
        [
          svc({ serviceId: 'S00001', label: '👌🏻 Forfait "BASE"', duree: '2:00', prix: 90 }),
          svc({ serviceId: 'S00002', label: "- évaluation de l'état général du vélo" }),
          svc({ serviceId: 'S00003', label: '- ajustement freins/vitesses' }),
          svc({ serviceId: 'S00004', label: '- lubrification de la chaine' }),
          svc({ serviceId: 'S00005', label: '- nettoyage rapide du cadre' }),
          svc({ serviceId: 'S00006', label: '- serrage vis/écrous' }),
          svc({ serviceId: 'S00007', label: '- vérification des guidon/selle' }),
          svc({ serviceId: 'S00008', label: '- vérification pneus' }),
        ],
        ctx,
      );

      expect(r.forfaits).toHaveLength(1);
      expect(r.services).toEqual([]); // sous-tâches ne créent PAS de Service
      expect(r.taskTemplates).toHaveLength(7);

      const forfaitId = r.forfaits[0]?.id;
      const positions = r.taskTemplates.map((t) => t.position).sort((a, b) => a - b);
      expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7]);
      for (const t of r.taskTemplates) {
        expect(t.forfaitId).toBe(forfaitId);
      }
      // labels préservés
      expect(r.taskTemplates[0]?.labelCanonical).toBe("- évaluation de l'état général du vélo");
    });

    it('Forfait BASE + sous-tâches + Forfait MID + sous-tâches → reset du contexte', () => {
      const r = transformCatalogueServices(
        [
          svc({ serviceId: 'S00001', label: '👌🏻 Forfait "BASE"', duree: '2:00', prix: 90 }),
          svc({ serviceId: 'S00002', label: '- évaluation' }),
          svc({ serviceId: 'S00003', label: '- ajustement' }),
          svc({ serviceId: 'S00009', label: '👌🏻 Forfait "MID"', duree: '3:30', prix: 170 }),
          svc({ serviceId: 'S00011', label: '- inspection' }),
          svc({ serviceId: 'S00012', label: '- lubrification' }),
        ],
        ctx,
      );
      expect(r.forfaits).toHaveLength(2);
      expect(r.services).toEqual([]);
      expect(r.taskTemplates).toHaveLength(4);

      const forfaitBaseId = r.forfaits[0]?.id;
      const forfaitMidId = r.forfaits[1]?.id;

      const tplBase = r.taskTemplates.filter((t) => t.forfaitId === forfaitBaseId);
      const tplMid = r.taskTemplates.filter((t) => t.forfaitId === forfaitMidId);
      expect(tplBase).toHaveLength(2);
      expect(tplMid).toHaveLength(2);

      // chaque forfait a sa propre numérotation de positions à partir de 1
      expect(tplBase.map((t) => t.position).sort()).toEqual([1, 2]);
      expect(tplMid.map((t) => t.position).sort()).toEqual([1, 2]);
    });

    it('Forfait + header content marker S00010 + sous-tâches → marker skipped, sous-tâches rattachées', () => {
      const r = transformCatalogueServices(
        [
          svc({ serviceId: 'S00009', label: '👌🏻 Forfait "MID"', duree: '3:30', prix: 170 }),
          svc({ serviceId: 'S00010', label: '— Ce service inclut le FORFAIT DE BASE :' }),
          svc({ serviceId: 'S00011', label: '- évaluation' }),
          svc({ serviceId: 'S00012', label: '- inspection' }),
        ],
        ctx,
      );
      expect(r.forfaits).toHaveLength(1);
      expect(r.taskTemplates).toHaveLength(2);
      expect(r.skipped).toHaveLength(1);
      const forfaitId = r.forfaits[0]?.id;
      for (const t of r.taskTemplates) {
        expect(t.forfaitId).toBe(forfaitId);
      }
    });

    it('Forfait + sous-tâches + service à la carte normal → reset forfait après le service à la carte', () => {
      const r = transformCatalogueServices(
        [
          svc({ serviceId: 'S00001', label: '👌🏻 Forfait "BASE"', duree: '2:00', prix: 90 }),
          svc({ serviceId: 'S00002', label: '- évaluation' }),
          svc({ serviceId: 'S00035', label: '🧰 Ajust. : boitier', duree: '0:40', prix: 30 }),
          svc({ serviceId: 'S99999', label: '- orphelin (corruption)' }),
        ],
        ctx,
      );
      expect(r.forfaits).toHaveLength(1);
      expect(r.services).toHaveLength(1); // que S00035
      expect(r.taskTemplates).toHaveLength(1); // S00002 → BASE
      expect(r.skipped).toHaveLength(1); // S99999 orphelin
      expect(r.skipped[0]?.reason).toContain('orphelin');
    });

    it('séparateur de section "—" → reset forfait', () => {
      const r = transformCatalogueServices(
        [
          svc({ serviceId: 'S00001', label: '👌🏻 Forfait "BASE"', duree: '2:00', prix: 90 }),
          svc({ serviceId: 'S00002', label: '- évaluation' }),
          svc({ serviceId: 'S00034', label: '— SERVICES À LA CARTE' }),
          svc({ serviceId: 'S99999', label: '- orphelin après section header' }),
        ],
        ctx,
      );
      expect(r.forfaits).toHaveLength(1);
      expect(r.services).toEqual([]);
      expect(r.taskTemplates).toHaveLength(1);
      expect(r.skipped).toHaveLength(2); // header + orphelin
    });
  });

  describe('Translations', () => {
    it('génère 1 Translation default locale par Forfait', () => {
      const r = transformCatalogueServices(
        [svc({ serviceId: 'S00001', label: '👌🏻 Forfait "BASE"', duree: '2:00', prix: 90 })],
        ctx,
      );
      const trsForfait = r.translations.filter((t) => t.entityType === 'FORFAIT');
      expect(trsForfait).toHaveLength(1);
      expect(trsForfait[0]).toMatchObject({
        entityType: 'FORFAIT',
        entityId: r.forfaits[0]?.id,
        field: 'label',
        locale: 'fr-CA',
        value: '👌🏻 Forfait "BASE"',
        source: 'USER',
      });
    });

    it('génère 1 Translation default locale par Service', () => {
      const r = transformCatalogueServices(
        [svc({ serviceId: 'S00035', label: '🧰 Ajust. : boitier de pédalier', duree: '0:40', prix: 30 })],
        ctx,
      );
      const trsService = r.translations.filter((t) => t.entityType === 'SERVICE');
      expect(trsService).toHaveLength(1);
      expect(trsService[0]?.value).toBe('🧰 Ajust. : boitier de pédalier');
    });

    it('aucune Translation pour les sous-tâches (label vit dans ForfaitTaskTemplate.labelCanonical)', () => {
      const r = transformCatalogueServices(
        [
          svc({ serviceId: 'S00001', label: '👌🏻 Forfait "BASE"', duree: '2:00', prix: 90 }),
          svc({ serviceId: 'S00002', label: '- évaluation' }),
          svc({ serviceId: 'S00003', label: '- ajustement' }),
        ],
        ctx,
      );
      // 1 translation pour Forfait, 0 pour les 2 sous-tâches
      expect(r.translations).toHaveLength(1);
      expect(r.translations[0]?.entityType).toBe('FORFAIT');
    });
  });

  describe('IDs préfixés ULID', () => {
    it.each([
      ['Forfait', /^forfait_[0-9A-HJKMNP-TV-Z]{26}$/],
      ['Service', /^service_[0-9A-HJKMNP-TV-Z]{26}$/],
    ])('format ID %s', (label, re) => {
      const r = transformCatalogueServices(
        [
          svc({ serviceId: 'S00001', label: '👌🏻 Forfait "BASE"', duree: '2:00', prix: 90 }),
          svc({ serviceId: 'S00035', label: '🧰 Ajust. : boitier', duree: '0:40', prix: 30 }),
        ],
        ctx,
      );
      const target = label === 'Forfait' ? r.forfaits[0]?.id : r.services[0]?.id;
      expect(target).toMatch(re);
    });

    it('forfaitTaskTemplate → format ftt_ + ULID', () => {
      const r = transformCatalogueServices(
        [
          svc({ serviceId: 'S00001', label: '👌🏻 Forfait "BASE"', duree: '2:00', prix: 90 }),
          svc({ serviceId: 'S00002', label: '- évaluation' }),
        ],
        ctx,
      );
      expect(r.taskTemplates[0]?.id).toMatch(/^ftt_[0-9A-HJKMNP-TV-Z]{26}$/);
    });
  });
});
