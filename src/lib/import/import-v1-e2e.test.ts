import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { importV1, type V1Dump } from './import-v1';

// Test d'intégration end-to-end sur le dump v1 réel.
// Activé seulement si __fixtures__/v1-dump.json existe (cf. README.md fixture).
// Les autres tests passent toujours, ce test est skippé en CI sans le fixture.

const FIXTURE_PATH = resolve(__dirname, '__fixtures__/v1-dump.json');
const FIXTURE_AVAILABLE = existsSync(FIXTURE_PATH);

const describeIfFixture = FIXTURE_AVAILABLE ? describe : describe.skip;

describeIfFixture('importV1 — e2e sur dump réel yako-cyclo', () => {
  // Lazy load : ne pas tenter readFileSync si le fixture n'existe pas (sinon
  // erreur au top-level du module avant le skip de describe).
  const dump: V1Dump = FIXTURE_AVAILABLE
    ? (JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8')) as V1Dump)
    : (null as unknown as V1Dump);

  it('parse le dump et exécute le pipeline complet sans throw', () => {
    expect(() => importV1(dump)).not.toThrow();
  });

  it('compte les marques après filtrage pollution', () => {
    const r = importV1(dump);
    // 31 marques v1 (incl. "Autre"), aucune pollution dans le dump fourni
    expect(r.marques.length).toBeGreaterThanOrEqual(30);
    expect(r.marques.length).toBeLessThanOrEqual(35);
  });

  it('importe les 3 mecanos yako-cyclo', () => {
    const r = importV1(dump);
    expect(r.equipe).toHaveLength(3);
    const surnoms = new Set(r.equipe.map((m) => m.surnom));
    expect(surnoms).toContain('yako');
    expect(surnoms).toContain('Paco');
    expect(surnoms).toContain('J-F');
  });

  it('importe ~26 clients (sans skip critique)', () => {
    const r = importV1(dump);
    expect(r.clients.length).toBeGreaterThanOrEqual(20);
    expect(r.clients.length).toBeLessThanOrEqual(30);
  });

  it('détecte les 3 forfaits (BASE/MID/FULL) avec leurs sous-tâches', () => {
    const r = importV1(dump);
    expect(r.forfaits).toHaveLength(3);
    // BASE a 7 sous-tâches, MID 10, FULL 11 = 28 total
    expect(r.taskTemplates.length).toBeGreaterThanOrEqual(25);
    expect(r.taskTemplates.length).toBeLessThanOrEqual(35);
  });

  it('importe le catalogue pieces (~250 entrées)', () => {
    const r = importV1(dump);
    expect(r.pieces.length).toBeGreaterThanOrEqual(150);
    expect(r.pieces.length).toBeLessThanOrEqual(280);
  });

  it('importe les vélos actifs et archives', () => {
    const r = importV1(dump);
    expect(r.velos.length).toBeGreaterThanOrEqual(10);
  });

  it('importe les BDC actifs + archives', () => {
    const r = importV1(dump);
    // 15 actifs + 13 archives = 28 max, certains peuvent être skip si velo introuvable
    expect(r.bdcs.length).toBeGreaterThanOrEqual(15);
    expect(r.bdcs.length).toBeLessThanOrEqual(28);
  });

  it('archives BDT facturé → BdcItemTask en DONE', () => {
    const r = importV1(dump);
    const factureBdcs = r.bdcs.filter((b) => b.archiveStatus === 'ARCHIVE_FACTURE');
    if (factureBdcs.length === 0) return; // pas de BDC facturé dans le dump

    const factureBdcIds = new Set(factureBdcs.map((b) => b.id));
    const factureItems = r.bdcItems.filter((i) => factureBdcIds.has(i.bdcId) && i.kind === 'FORFAIT');
    const factureItemIds = new Set(factureItems.map((i) => i.id));
    const factureTasks = r.bdcItemTasks.filter((t) => factureItemIds.has(t.bdcItemId));

    if (factureTasks.length > 0) {
      expect(factureTasks.every((t) => t.status === 'DONE')).toBe(true);
    }
  });

  it('importe les ventes structurées + archives', () => {
    const r = importV1(dump);
    expect(r.ventes.length).toBeGreaterThanOrEqual(4);
  });

  it('importe les POs', () => {
    const r = importV1(dump);
    expect(r.pos.length).toBeGreaterThanOrEqual(5);
  });

  it('génère des legacy mappings pour traçabilité piece + service + forfait + velo', () => {
    const r = importV1(dump);
    const types = new Set(r.legacyMappings.map((m) => m.entityType));
    expect(types).toContain('piece');
    expect(types).toContain('service');
    expect(types).toContain('forfait');
    expect(types).toContain('velo');

    // P00004 (Surly Guidon, Babac Fourche, Babac Entretoise) doit avoir 3 mappings
    const p00004Mappings = r.legacyMappings.filter(
      (m) => m.entityType === 'piece' && m.legacyId === 'P00004',
    );
    expect(p00004Mappings.length).toBeGreaterThanOrEqual(2); // au moins 2 (peut être 3)
  });

  it('cohérence FK : tous les bdcItems pointent vers un bdc existant', () => {
    const r = importV1(dump);
    const bdcIds = new Set(r.bdcs.map((b) => b.id));
    for (const item of r.bdcItems) {
      expect(bdcIds.has(item.bdcId)).toBe(true);
    }
  });

  it('cohérence FK : tous les venteItems pointent vers une vente existante', () => {
    const r = importV1(dump);
    const venteIds = new Set(r.ventes.map((v) => v.id));
    for (const item of r.venteItems) {
      expect(venteIds.has(item.venteId)).toBe(true);
    }
  });

  it('skipped reste raisonnable (pollution, héberge < 30 entrées)', () => {
    const r = importV1(dump);
    expect(r.skipped.length).toBeLessThanOrEqual(50);
  });

  it('stats consistantes avec les arrays', () => {
    const r = importV1(dump);
    expect(r.stats.marques).toBe(r.marques.length);
    expect(r.stats.bdcs).toBe(r.bdcs.length);
    expect(r.stats.ventes).toBe(r.ventes.length);
    expect(r.stats.pos).toBe(r.pos.length);
  });
});

describe('importV1 — e2e fixture detection', () => {
  it(`fixture status: ${FIXTURE_AVAILABLE ? 'AVAILABLE → tests run' : 'MISSING → tests skipped (cf. __fixtures__/README.md)'}`, () => {
    expect(typeof FIXTURE_AVAILABLE).toBe('boolean');
  });
});
