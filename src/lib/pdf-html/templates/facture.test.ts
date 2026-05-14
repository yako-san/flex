import { describe, expect, it } from 'vitest';
import { buildFactureHtml } from './facture';
import type { ClientInfo, ItemRow, VeloInfo, WorkshopInfo } from './types';

const WORKSHOP: WorkshopInfo = {
  name: 'Yako Cyclo',
  fiscalEntity: {
    raisonSociale: 'Yako Cyclo inc.',
    ville: 'Montréal',
    telephone: '514 555 1234',
    tps: '123456789RT0001',
    tvq: '987654321TQ0001',
  },
};

const CLIENT: ClientInfo = {
  prenom: 'Jean',
  nom: 'Dupont',
  telephone: null,
  indicatif: null,
  courriel: null,
  lang: 'fr-CA',
};

const VELO: VeloInfo = {
  veloNumero: 7,
  marque: 'Specialized',
  modele: null,
  couleur: null,
  taille: null,
  numeroSerie: null,
};

const ITEMS: ItemRow[] = [
  {
    position: 1,
    kind: 'SERVICE',
    label: 'Mise au point',
    sku: null,
    qty: 1,
    unitPrice: 50,
    total: 50,
  },
  {
    position: 2,
    kind: 'PIECE',
    label: 'Chambre à air',
    sku: 'CAR700',
    qty: 2,
    unitPrice: 8,
    total: 16,
  },
];

const TOTALS = {
  totalServices: 50,
  totalPieces: 16,
  sousTotal: 66,
  tps: 3.3,
  tvq: 6.58,
  grandTotal: 75.88,
};

describe('buildFactureHtml', () => {
  const baseOpts = {
    workshop: WORKSHOP,
    client: CLIENT,
    velo: VELO,
    factureNumero: 'F0042-2026-05-14',
    date: new Date('2026-05-14T12:00:00Z'),
    items: ITEMS,
    totals: TOTALS,
    modePaiement: null,
    notes: null,
  };

  it('produit un HTML doctype', () => {
    const html = buildFactureHtml(baseOpts);
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<html lang="fr">');
  });

  it('title contient factureNumero', () => {
    const html = buildFactureHtml(baseOpts);
    expect(html).toContain('<title>Facture F0042-2026-05-14</title>');
  });

  it('docLabel = "reçu de vente" (pattern V1)', () => {
    const html = buildFactureHtml(baseOpts);
    expect(html).toContain('reçu de vente');
  });

  it('contient les 5 sous-totaux + grandTotal', () => {
    const html = buildFactureHtml(baseOpts);
    expect(html).toContain('66.00 $'); // sous-total
    expect(html).toContain('3.30 $'); // TPS
    expect(html).toContain('6.58 $'); // TVQ
    expect(html).toContain('9.88 $'); // total taxes (TPS+TVQ)
    expect(html).toContain('75.88 $'); // grand total
  });

  it('libellés TPS/TVQ Québec avec taux %', () => {
    const html = buildFactureHtml(baseOpts);
    expect(html).toContain('T.P.S : (5%)');
    expect(html).toContain('T.V.Q : (9.975%)');
  });

  it('numéros TPS/TVQ atelier dans le footer', () => {
    const html = buildFactureHtml(baseOpts);
    expect(html).toContain('123456789RT0001');
    expect(html).toContain('987654321TQ0001');
  });

  it('si TPS atelier absent → "..." placeholder', () => {
    const html = buildFactureHtml({
      ...baseOpts,
      workshop: { name: 'X', fiscalEntity: { raisonSociale: 'X' } },
    });
    expect(html).toContain('T.P.S : ...');
    expect(html).toContain('T.V.Q : ...');
  });

  it('policy bilingue FR + EN présent (par défaut, pas de footerText)', () => {
    const html = buildFactureHtml(baseOpts);
    expect(html).toContain('Les retours considérés dans les trente jours');
    expect(html).toContain('Returns must be made within thirty days');
  });

  it('footerText custom remplace le payment-line par défaut', () => {
    const html = buildFactureHtml({
      ...baseOpts,
      workshop: {
        name: 'X',
        fiscalEntity: { footerText: 'Texte custom workshop' },
      },
    });
    expect(html).toContain('Texte custom workshop');
    // le payment-line par défaut contient "Le paiement se fera lors du retrait"
    expect(html).not.toContain('Le paiement se fera <a');
  });

  it('téléphone interac mentionné si présent', () => {
    const html = buildFactureHtml(baseOpts);
    expect(html).toContain('par interac');
    expect(html).toContain('514 555 1234');
  });

  it("pas de mention interac si pas de téléphone", () => {
    const html = buildFactureHtml({
      ...baseOpts,
      workshop: { name: 'X', fiscalEntity: { raisonSociale: 'X' } },
    });
    expect(html).not.toContain('par interac');
  });

  it('modePaiement présent → ligne dans le footer', () => {
    const html = buildFactureHtml({ ...baseOpts, modePaiement: 'INTERAC' });
    expect(html).toContain('Mode de paiement');
    expect(html).toContain('interac'); // lowercased
  });

  it('modePaiement null → pas de ligne mode paiement', () => {
    const html = buildFactureHtml(baseOpts);
    expect(html).not.toContain('Mode de paiement');
  });

  it('notes rendues si présentes', () => {
    const html = buildFactureHtml({ ...baseOpts, notes: 'Paiement reçu' });
    expect(html).toContain('Paiement reçu');
    expect(html).toContain('notes-block');
  });

  it("velo null → pas de section vélo dans meta", () => {
    const html = buildFactureHtml({ ...baseOpts, velo: null });
    expect(html).not.toContain('>vélo<');
  });

  it("affiche services et pièces séparément", () => {
    const html = buildFactureHtml(baseOpts);
    expect(html).toContain('Mise au point');
    expect(html).toContain('Chambre à air');
    expect(html.indexOf('Mise au point')).toBeLessThan(html.indexOf('Chambre à air'));
  });

  it('format date locale fr-CA', () => {
    const html = buildFactureHtml(baseOpts);
    expect(html).toContain('2026-05-14');
  });

  it('version bottom-corners = modèle v2,5', () => {
    const html = buildFactureHtml(baseOpts);
    expect(html).toContain('modèle v2,5');
  });

  it('échappe XSS dans factureNumero', () => {
    const html = buildFactureHtml({ ...baseOpts, factureNumero: '<script>x</script>' });
    expect(html).not.toContain('<script>x</script>');
  });
});
