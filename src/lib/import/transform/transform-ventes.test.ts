import { describe, it, expect } from 'vitest';
import {
  transformVentes,
  groupVentesArchives,
  type V1Vente,
  type V1VenteArchiveRaw,
  type VentesLookups,
} from './transform-ventes';
import { dedupePieces } from '../dedupe-piece';
import type { ImportContext, V2ClientDraft } from './types';

const ctx: ImportContext = {
  workshopId: 'workshop_TEST',
  defaultLocale: 'fr-CA',
  activeLocales: ['fr-CA', 'en-CA'],
};

const cl = (overrides: Partial<V2ClientDraft>): V2ClientDraft => ({
  id: 'client_TEST',
  workshopId: 'workshop_TEST',
  prenom: '',
  nom: '',
  telephone: null,
  indicatif: '+1',
  courriel: null,
  commPref: 'AUCUN',
  lang: 'fr-CA',
  lead: null,
  remiseDefault: null,
  adressePostale: null,
  notes: null,
  legacyRawV1: null,
  ...overrides,
});

function buildLookups(): VentesLookups {
  const piecesV1 = [
    { pieceId: 'P00038', sku: '46-650', nom: 'KMC, Chaînes X9 vitesses, argent' },
    { pieceId: 'P00106', sku: '020184-26', nom: 'Kenda, 700C, 20-28C, Presta 48mm' },
    { pieceId: 'P00114', sku: '79-782', nom: 'Schwalbe, 700 x 28-45 Presta 60mm SV17' },
    { pieceId: 'P00549', sku: '_TEST_SKU_', nom: '_TEST_STOCK_' },
  ];
  const deduped = dedupePieces(piecesV1);

  return {
    clients: [
      cl({ id: 'client_walkin', prenom: 'Walk-in', nom: '' }),
      cl({ id: 'client_cycloflex', prenom: 'Cyclo', nom: 'Flex' }),
      cl({ id: 'client_yacono', prenom: 'Jean-Christophe', nom: 'Yacono' }),
      cl({ id: 'client_savard', prenom: 'Martin', nom: 'Savard' }),
    ],
    piecesMapping: deduped.mapping,
  };
}

describe('transformVentes (structurées)', () => {
  describe('cas vide', () => {
    it('listes vides → résultat vide', () => {
      const r = transformVentes({ structurees: [], archives: [] }, ctx, buildLookups());
      expect(r.ventes).toEqual([]);
      expect(r.items).toEqual([]);
    });
  });

  describe('cas réel : V0003 Cyclo Flex (1 item)', () => {
    const v: V1Vente = {
      venteId: 'V1777395384333',
      date: '2026-04-28',
      client: 'Cyclo Flex',
      factureNumero: 'V0003-2026-04-28',
      factureDate: '2026-04-28',
      factureUrl: 'https://drive.google.com/...',
      cost: false,
      remiseType: 'pct',
      items: [
        {
          pieceId: 'P00106',
          sku: '020184-26',
          nom: 'Kenda, 700C, 20-28C, Presta 48mm',
          qte: 1,
          prixUnit: 12.95,
          sousTotal: 12.95,
        },
      ],
      _rows: [6],
      total: 12.95,
    };

    it('mappe la vente vers client_cycloflex', () => {
      const r = transformVentes({ structurees: [v], archives: [] }, ctx, buildLookups());
      expect(r.ventes).toHaveLength(1);
      expect(r.ventes[0]).toMatchObject({
        clientId: 'client_cycloflex',
        date: '2026-04-28',
        factureNumero: 'V0003-2026-04-28',
        factureDate: '2026-04-28',
        factureUrl: 'https://drive.google.com/...',
        remiseType: 'PCT',
        totalPieces: '12.95',
      });
    });

    it('crée 1 item avec FK piece résolue', () => {
      const r = transformVentes({ structurees: [v], archives: [] }, ctx, buildLookups());
      expect(r.items).toHaveLength(1);
      expect(r.items[0]).toMatchObject({
        skuSnapshot: '020184-26',
        nomSnapshot: 'Kenda, 700C, 20-28C, Presta 48mm',
        qty: '1',
        unitPriceSnapshot: '12.95',
        total: '12.95',
        position: 1,
      });
      expect(r.items[0]?.pieceId).toMatch(/^piece_/);
    });
  });

  describe('vente sans facture émise (V1777064835671 François Comeau)', () => {
    const v: V1Vente = {
      venteId: 'V1777064835671',
      date: '2026-04-24',
      client: 'François Comeau',
      cost: false,
      items: [
        { pieceId: 'P00067', sku: '220069-01', nom: 'Jagwire, CEX', qte: 4, prixUnit: 0.85, sousTotal: 3.4 },
        { pieceId: 'P00068', sku: '220066-02', nom: 'Jagwire, CGX-SL', qte: 4, prixUnit: 2.035, sousTotal: 8.14 },
      ],
      _rows: [4, 5],
      total: 11.54,
    };

    it('factureNumero null + 2 items', () => {
      const r = transformVentes({ structurees: [v], archives: [] }, ctx, buildLookups());
      expect(r.ventes[0]?.factureNumero).toBeNull();
      expect(r.ventes[0]?.factureDate).toBeNull();
      expect(r.items).toHaveLength(2);
      expect(r.items[0]?.position).toBe(1);
      expect(r.items[1]?.position).toBe(2);
    });

    it('client introuvable → clientId null (vente walk-in dégradée)', () => {
      const r = transformVentes({ structurees: [v], archives: [] }, ctx, buildLookups());
      // François Comeau pas dans les clients du lookup → clientId null
      expect(r.ventes[0]?.clientId).toBeNull();
    });
  });

  describe('IDs préfixés', () => {
    it('vente_ + ulid, vdi_ + ulid', () => {
      const v: V1Vente = {
        venteId: 'V1',
        date: '2026-04-28',
        client: 'Walk-in',
        cost: false,
        items: [{ pieceId: 'P00106', sku: 'X', nom: 'X', qte: 1, prixUnit: 1, sousTotal: 1 }],
        _rows: [1],
        total: 1,
      };
      const r = transformVentes({ structurees: [v], archives: [] }, ctx, buildLookups());
      expect(r.ventes[0]?.id).toMatch(/^vente_[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(r.items[0]?.id).toMatch(/^vdi_[0-9A-HJKMNP-TV-Z]{26}$/);
    });
  });
});

describe('groupVentesArchives (parsing rawCols)', () => {
  it('regroupe les rows par venteId (col 0)', () => {
    const raw: V1VenteArchiveRaw[] = [
      {
        row: 3,
        rawCols: [
          'V1777516981242',
          '2026-04-30',
          'Walk-in',
          'S00088',
          '',
          '⛑️ Urgent. : Flat',
          '1',
          '15',
          'V0007',
          '2026-04-30',
          'https://drive.google.com/...',
          'FALSE',
          'pct',
          '',
          'comptant',
        ],
      },
      {
        row: 4,
        rawCols: [
          'V1777516981242',
          '2026-04-30',
          'Walk-in',
          'P00114',
          '79-782',
          'Schwalbe, 700 x 28-45 Presta 60mm SV17',
          '1',
          '18,525',
        ],
      },
    ];

    const r = groupVentesArchives(raw);
    expect(r).toHaveLength(1);
    expect(r[0]?.venteId).toBe('V1777516981242');
    expect(r[0]?.factureNumero).toBe('V0007');
    expect(r[0]?.modePaiement).toBe('comptant');
    expect(r[0]?.items).toHaveLength(2);
  });

  it('ignore lignes sans venteId', () => {
    const raw: V1VenteArchiveRaw[] = [
      { row: 1, rawCols: ['', '', '', '', '', '', '', ''] },
      {
        row: 2,
        rawCols: [
          'V1',
          '2026-01-01',
          'Walk-in',
          'P1',
          'sku',
          'nom',
          '1',
          '10',
          'V001',
          '2026-01-01',
          'url',
          'FALSE',
          'pct',
        ],
      },
    ];
    const r = groupVentesArchives(raw);
    expect(r).toHaveLength(1);
  });

  it('parse virgule décimale française (18,525 → 18.525)', () => {
    const raw: V1VenteArchiveRaw[] = [
      {
        row: 2,
        rawCols: [
          'V1',
          '2026-04-30',
          'Walk-in',
          'P00114',
          '79-782',
          'Schwalbe',
          '1',
          '18,525',
          'V0006',
          '2026-04-30',
          'url',
          'FALSE',
          'pct',
        ],
      },
    ];
    const r = groupVentesArchives(raw);
    expect(r[0]?.items[0]?.prixUnit).toBe(18.525);
  });
});

describe('transformVentes (intégration ventes archives)', () => {
  it('archives raw → ventes regroupées + items', () => {
    const archives: V1VenteArchiveRaw[] = [
      {
        row: 6,
        rawCols: [
          'V1776304620395',
          '2026-04-16',
          'Jean-Christophe Yacono',
          'P00038',
          '46-650',
          'KMC, Chaînes X9 vitesses, argent',
          '1',
          '64,49',
          '',
          '2026-04-16',
          'https://drive.google.com/...',
          'FALSE',
          'pct',
          '15',
        ],
      },
    ];
    const r = transformVentes({ structurees: [], archives }, ctx, buildLookups());
    expect(r.ventes).toHaveLength(1);
    expect(r.ventes[0]?.clientId).toBe('client_yacono');
    expect(r.ventes[0]?.remiseValue).toBe('15');
    expect(r.items).toHaveLength(1);
  });
});

describe('mapping modePaiement', () => {
  const baseV: V1Vente = {
    venteId: 'V1',
    date: '2026-04-28',
    client: 'Walk-in',
    cost: false,
    items: [{ pieceId: 'P1', sku: 'X', nom: 'X', qte: 1, prixUnit: 1, sousTotal: 1 }],
    _rows: [1],
    total: 1,
  };

  it.each([
    ['comptant', 'COMPTANT'],
    ['interac', 'INTERAC'],
    ['INTERACT', 'INTERAC'],
    ['carte', 'CARTE'],
    ['cartes', 'CARTE'],
    ['flex', 'AUTRE'],
    ['FLEX', 'AUTRE'],
    ['test', 'AUTRE'],
    ['', null],
  ])('"%s" → %s', (input, expected) => {
    const r = transformVentes(
      { structurees: [{ ...baseV, modePaiement: input } as V1Vente], archives: [] },
      ctx,
      buildLookups(),
    );
    expect(r.ventes[0]?.modePaiement).toBe(expected);
  });
});
