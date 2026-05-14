import { describe, expect, it } from 'vitest';
import { buildEvalHtml } from './eval';
import type { ClientInfo, ItemRow, VeloInfo, WorkshopInfo } from './types';

const WORKSHOP: WorkshopInfo = {
  name: 'Yako Cyclo',
  fiscalEntity: { raisonSociale: 'Yako Cyclo inc.', ville: 'Montréal' },
};

const CLIENT: ClientInfo = {
  prenom: 'Marie',
  nom: 'Tremblay',
  telephone: null,
  indicatif: null,
  courriel: 'marie@x.com',
  lang: 'fr-CA',
};

const VELO: VeloInfo = {
  veloNumero: 42,
  marque: 'Trek',
  modele: '7300',
  couleur: null,
  taille: null,
  numeroSerie: null,
};

const SERVICE_ITEM: ItemRow = {
  position: 1,
  kind: 'SERVICE',
  label: 'Mise au point',
  sku: null,
  qty: 1,
  unitPrice: 50,
  total: 50,
};

const PIECE_ITEM: ItemRow = {
  position: 2,
  kind: 'PIECE',
  label: 'Chambre à air',
  sku: 'CAR700',
  qty: 1,
  unitPrice: 8,
  total: 8,
};

const FORFAIT_ITEM: ItemRow = {
  position: 3,
  kind: 'FORFAIT',
  label: 'Forfait été',
  sku: null,
  qty: 1,
  unitPrice: 100,
  total: 100,
};

describe('buildEvalHtml', () => {
  const baseOpts = {
    workshop: WORKSHOP,
    client: CLIENT,
    velo: VELO,
    bdcId: 'bdc_01HXYZABCD0042',
    date: new Date('2026-05-14T12:00:00Z'),
    items: [SERVICE_ITEM, PIECE_ITEM],
    totalServices: 50,
    totalPieces: 8,
    notes: null,
  };

  it('produit un HTML doctype complet', () => {
    const html = buildEvalHtml(baseOpts);
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<html lang="fr">');
    expect(html).toContain('</html>');
  });

  it('title contient les 4 derniers chars de bdcId', () => {
    const html = buildEvalHtml(baseOpts);
    expect(html).toContain('<title>Évaluation 0042</title>');
  });

  it('docLabel = "évaluation" en bas de page (pattern V1)', () => {
    const html = buildEvalHtml(baseOpts);
    expect(html).toContain('évaluation');
  });

  it('label "bon de travail" en metaHtml', () => {
    const html = buildEvalHtml(baseOpts);
    expect(html).toContain('bon de travail');
  });

  it('services + pièces partitionnés (FORFAIT compte comme service)', () => {
    const html = buildEvalHtml({
      ...baseOpts,
      items: [SERVICE_ITEM, PIECE_ITEM, FORFAIT_ITEM],
    });
    expect(html).toContain('Mise au point');
    expect(html).toContain('Chambre à air');
    expect(html).toContain('Forfait été');
    // L'ordre dans le HTML : Services avant Pièces
    expect(html.indexOf('Mise au point')).toBeLessThan(html.indexOf('Chambre à air'));
  });

  it('total HT = services + pièces - remises', () => {
    const html = buildEvalHtml({
      ...baseOpts,
      totalServices: 100,
      totalPieces: 50,
      remises: 10,
    });
    // 100 + 50 - 10 = 140
    expect(html).toContain('140.00 $');
  });

  it("pas de remises affichées si remises = 0 (ou absent)", () => {
    const html = buildEvalHtml(baseOpts);
    expect(html).not.toContain('Remises');
  });

  it('remises > 0 → ligne Remises avec − devant', () => {
    const html = buildEvalHtml({ ...baseOpts, remises: 15 });
    expect(html).toContain('Remises');
    expect(html).toContain('−15.00 $');
  });

  it("notes rendues en .notes-block si présentes", () => {
    const html = buildEvalHtml({ ...baseOpts, notes: 'Vélo prêt mardi' });
    expect(html).toContain('notes-block');
    expect(html).toContain('Vélo prêt mardi');
  });

  it("pas de <div class='notes-block'> si notes vides", () => {
    const html = buildEvalHtml({ ...baseOpts, notes: null });
    // La classe CSS .notes-block existe toujours dans <style>, mais aucune div
    expect(html).not.toContain('<div class="notes-block">');
  });

  it('échappe les notes (XSS)', () => {
    const html = buildEvalHtml({ ...baseOpts, notes: '<script>x</script>' });
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it("contient la signature line (eval seulement)", () => {
    const html = buildEvalHtml(baseOpts);
    expect(html).toContain('signature-line');
    expect(html).toContain('Approuvé par le client');
  });

  it("contient le disclaimer évaluation valable 30 jours", () => {
    const html = buildEvalHtml(baseOpts);
    expect(html).toContain('30 jours');
  });

  it('format date locale fr-CA', () => {
    const html = buildEvalHtml({ ...baseOpts, date: new Date('2026-05-14T12:00:00Z') });
    // fr-CA : YYYY-MM-DD
    expect(html).toContain('2026-05-14');
  });

  it("affiche les totaux subtitle services + pièces (toujours)", () => {
    const html = buildEvalHtml(baseOpts);
    expect(html).toContain('Sous-total services');
    expect(html).toContain('Sous-total pièces');
    expect(html).toContain('Total estimé HT');
  });

  it('version bottom-corners = modèle v2,5', () => {
    const html = buildEvalHtml(baseOpts);
    expect(html).toContain('modèle v2,5');
  });
});
