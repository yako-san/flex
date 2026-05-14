import { describe, expect, it } from 'vitest';
import {
  bottomCornersHtml,
  itemSectionHtml,
  logoHtml,
  metaHtml,
  workshopHtml,
} from './components';
import type { ClientInfo, ItemRow, VeloInfo, WorkshopInfo } from './types';

const CLIENT: ClientInfo = {
  prenom: 'Marie',
  nom: 'Tremblay',
  telephone: '5145551234',
  indicatif: '+1',
  courriel: 'marie@example.com',
  lang: 'fr-CA',
};

const VELO: VeloInfo = {
  veloNumero: 42,
  marque: 'Trek',
  modele: '7300',
  couleur: 'rouge',
  taille: 'M',
  numeroSerie: 'SN123',
};

describe('logoHtml', () => {
  it("logoBase64 présent → balise <img> avec alt=workshop.name", () => {
    const html = logoHtml({ name: 'Yako', logoBase64: 'data:image/png;base64,abc' });
    expect(html).toContain('<img');
    expect(html).toContain('src="data:image/png;base64,abc"');
    expect(html).toContain('alt="Yako"');
  });

  it("pas de logo → fallback texte workshop.name", () => {
    const html = logoHtml({ name: 'Yako Cyclo' });
    expect(html).not.toContain('<img');
    expect(html).toContain('Yako Cyclo');
  });

  it('échappe HTML dans workshop.name', () => {
    const html = logoHtml({ name: '<script>x</script>' });
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('metaHtml', () => {
  it('contient docLabel + docDate + docNumber', () => {
    const html = metaHtml({
      docLabel: 'Évaluation',
      docDate: '2026-05-14',
      docNumberLabel: 'no.',
      docNumber: 'B0042',
      client: CLIENT,
      velo: VELO,
    });
    expect(html).toContain('Évaluation');
    expect(html).toContain('2026-05-14');
    expect(html).toContain('no.');
    expect(html).toContain('B0042');
  });

  it('vélo : liste marque + modèle + couleur + taille joints', () => {
    const html = metaHtml({
      docLabel: 'L',
      docDate: 'D',
      docNumberLabel: 'N',
      docNumber: 'X',
      client: CLIENT,
      velo: VELO,
    });
    expect(html).toContain('Trek, 7300, rouge, M');
  });

  it("vélo champs vides filtrés (filter Boolean)", () => {
    const html = metaHtml({
      docLabel: 'L',
      docDate: 'D',
      docNumberLabel: 'N',
      docNumber: 'X',
      client: CLIENT,
      velo: { ...VELO, modele: null, couleur: null, taille: null },
    });
    expect(html).toContain('Trek');
    expect(html).not.toContain('Trek, ,');
  });

  it("vélo null → pas de section vélo", () => {
    const html = metaHtml({
      docLabel: 'L',
      docDate: 'D',
      docNumberLabel: 'N',
      docNumber: 'X',
      client: CLIENT,
      velo: null,
    });
    expect(html).not.toContain('>vélo<');
  });

  it("client : prénom + nom joints, '—' si vide", () => {
    const html = metaHtml({
      docLabel: 'L',
      docDate: 'D',
      docNumberLabel: 'N',
      docNumber: 'X',
      client: { ...CLIENT, prenom: '', nom: '' },
      velo: null,
    });
    expect(html).toContain('>—<');
  });

  it("courriel absent → pas de ligne contact", () => {
    const html = metaHtml({
      docLabel: 'L',
      docDate: 'D',
      docNumberLabel: 'N',
      docNumber: 'X',
      client: { ...CLIENT, courriel: null },
      velo: null,
    });
    expect(html).not.toContain('contact');
  });
});

describe('workshopHtml', () => {
  it('aucun fiscalEntity → div vide', () => {
    const html = workshopHtml({ name: 'X' });
    expect(html).toBe('<div class="workshop"></div>');
  });

  it('raisonSociale rendu en .workshop-name', () => {
    const html = workshopHtml({
      name: 'X',
      fiscalEntity: { raisonSociale: 'Yako Cyclo inc.' },
    });
    expect(html).toContain('workshop-name');
    expect(html).toContain('Yako Cyclo inc.');
  });

  it("adresse : ligne1 + ville-province-postal joints", () => {
    const html = workshopHtml({
      name: 'X',
      fiscalEntity: {
        adresseLigne1: '123 rue Pie',
        ville: 'Montréal',
        province: 'QC',
        codePostal: 'H1X 2Y3',
      },
    });
    expect(html).toContain('123 rue Pie');
    expect(html).toContain('Montréal QC H1X 2Y3');
  });

  it("contact (courriel + tel) regroupés", () => {
    const html = workshopHtml({
      name: 'X',
      fiscalEntity: { courriel: 'info@yako.cc', telephone: '5145551234' },
    });
    expect(html).toContain('workshop-contact');
    expect(html).toContain('info@yako.cc');
    expect(html).toContain('5145551234');
  });

  it('échappe HTML dans les champs (XSS)', () => {
    const html = workshopHtml({
      name: 'X',
      fiscalEntity: { raisonSociale: '<img src=x>' },
    });
    expect(html).not.toContain('<img src=x>');
    expect(html).toContain('&lt;img');
  });
});

describe('itemSectionHtml', () => {
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

  it('items vides → chaîne vide (pas de section)', () => {
    const html = itemSectionHtml({ title: 'X', bullet: '•', items: [] });
    expect(html).toBe('');
  });

  it('rend title + table', () => {
    const html = itemSectionHtml({ title: 'SERVICES', bullet: '⚙', items: ITEMS });
    expect(html).toContain('SERVICES');
    expect(html).toContain('class="items"');
  });

  it("rend tous les items + leur bullet", () => {
    const html = itemSectionHtml({ title: 'X', bullet: '🔧', items: ITEMS });
    expect(html).toContain('Mise au point');
    expect(html).toContain('Chambre à air');
    // 2 bullets : un par row
    expect((html.match(/🔧/g) ?? []).length).toBe(2);
  });

  it('affiche SKU si présent', () => {
    const html = itemSectionHtml({ title: 'X', bullet: '•', items: ITEMS });
    expect(html).toContain('SKU CAR700');
  });

  it('prix formatés en fmt$ (X.XX $)', () => {
    const html = itemSectionHtml({ title: 'X', bullet: '•', items: ITEMS });
    expect(html).toContain('50.00 $');
    expect(html).toContain('8.00 $');
    expect(html).toContain('16.00 $');
  });

  it('hidePrices=true → pas de colonnes prix/qty/total', () => {
    const html = itemSectionHtml({
      title: 'X',
      bullet: '•',
      items: ITEMS,
      hidePrices: true,
    });
    expect(html).not.toContain('50.00');
    expect(html).not.toContain('unitaire');
    expect(html).not.toContain('prix');
  });

  it('échappe HTML dans label (XSS)', () => {
    const html = itemSectionHtml({
      title: 'X',
      bullet: '•',
      items: [{ ...ITEMS[0]!, label: '<script>x</script>' }],
    });
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('bottomCornersHtml', () => {
  it('contient version + message merci', () => {
    const html = bottomCornersHtml('v2.0.42');
    expect(html).toContain('v2.0.42');
    expect(html).toContain('Merci et bonne route');
  });

  it('échappe HTML dans version', () => {
    const html = bottomCornersHtml('<script>x</script>');
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
