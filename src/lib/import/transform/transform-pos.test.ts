import { describe, it, expect } from 'vitest';
import { transformPos, type V1Po, type PosLookups } from './transform-pos';
import { dedupePieces } from '../dedupe-piece';
import type { ImportContext } from './types';

const ctx: ImportContext = {
  workshopId: 'workshop_TEST',
  defaultLocale: 'fr-CA',
  activeLocales: ['fr-CA', 'en-CA'],
};

function buildLookups(): PosLookups {
  const piecesV1 = [
    { pieceId: 'P00035', sku: '46-635', nom: 'KMC, Chaînes Z7 5/6/7 vitesses' },
    { pieceId: 'P00524', sku: 'LUBE-DRY-60', nom: "Mint'n Dry, Lubrifiant céramique, sec, 60 ml" },
    { pieceId: 'P00102', sku: '180299-05', nom: 'Shimano, Alivio BR-T4000, Frein en V, Avant, Noir' },
  ];
  const deduped = dedupePieces(piecesV1);
  return { piecesMapping: deduped.mapping };
}

const po = (overrides: Partial<V1Po>): V1Po => ({
  poNumber: 'TEST',
  fournisseur: 'Babac',
  dateCommande: '2026-04-12',
  dateReception: null,
  status: 'EN ATTENTE',
  items: [],
  _rows: [],
  ...overrides,
});

describe('transformPos', () => {
  describe('cas vide', () => {
    it('liste vide → vide', () => {
      const r = transformPos([], ctx, buildLookups());
      expect(r.pos).toEqual([]);
      expect(r.items).toEqual([]);
    });
  });

  describe('cas réel : PO TEST002 (1 item KMC Z7 reçu)', () => {
    const v: V1Po = {
      poNumber: 'TEST002',
      fournisseur: 'Babac',
      dateCommande: '2026-04-12',
      dateReception: '2026-04-12',
      status: 'RECU',
      items: [
        {
          nom: 'KMC, Chaînes Z7 5/6/7 vitesses',
          sku: '46-635',
          qteCommandee: 2,
          qteRecue: 2,
          prixAchat: 10,
          recu: true,
          pieceRow: 60,
          notes: '',
          pieceId: 'P00035',
          categorie: '',
        },
      ],
      _rows: [2],
    };

    it('mappe le PO complet', () => {
      const r = transformPos([v], ctx, buildLookups());
      expect(r.pos).toHaveLength(1);
      expect(r.pos[0]).toMatchObject({
        poNumero: 'TEST002',
        fournisseur: 'Babac',
        dateCommande: '2026-04-12',
        dateReception: '2026-04-12',
        status: 'RECU',
      });
      expect(r.pos[0]?.id).toMatch(/^po_/);
    });

    it('item résolu via pieceId vers piece v2', () => {
      const r = transformPos([v], ctx, buildLookups());
      expect(r.items).toHaveLength(1);
      expect(r.items[0]).toMatchObject({
        skuSnapshot: '46-635',
        nomSnapshot: 'KMC, Chaînes Z7 5/6/7 vitesses',
        qtyCommandee: '2',
        qtyRecue: '2',
        unitPrice: '10',
      });
      expect(r.items[0]?.pieceId).toMatch(/^piece_/);
    });
  });

  describe('PO "Inconnu" → poNumero auto-généré', () => {
    it('poNumber="Inconnu" + dateCommande → poNumero "INCONNU-{date}"', () => {
      const v = po({ poNumber: 'Inconnu', dateCommande: '2026-04-01' });
      const r = transformPos([v], ctx, buildLookups());
      expect(r.pos[0]?.poNumero).toBe('INCONNU-2026-04-01');
    });

    it('poNumber vide → INCONNU-{date}', () => {
      const v = po({ poNumber: '', dateCommande: '2026-04-15' });
      const r = transformPos([v], ctx, buildLookups());
      expect(r.pos[0]?.poNumero).toBe('INCONNU-2026-04-15');
    });
  });

  describe('items avec pieceId="" → résolution par SKU', () => {
    it('PO Mint\'n Dry items sans pieceId → match par SKU LUBE-DRY-60', () => {
      const v: V1Po = {
        poNumber: 'INC1',
        fournisseur: "Mint'n Dry",
        dateCommande: '2026-04-01',
        dateReception: '2026-04-19',
        status: 'RECU',
        items: [
          {
            nom: 'Lubrifiant céramique sec 60 ml',
            sku: 'LUBE-DRY-60',
            qteCommandee: 6,
            qteRecue: 6,
            prixAchat: 7,
            recu: true,
            pieceRow: -1,
            notes: '',
            pieceId: '',
            categorie: "6. Produits d'entretien, Lubrification",
          },
        ],
        _rows: [41],
      };
      const r = transformPos([v], ctx, buildLookups());
      expect(r.items[0]?.pieceId).toMatch(/^piece_/);
    });
  });

  describe('mapping status v1 → v2', () => {
    it.each([
      ['RECU', 'RECU'],
      ['EN ATTENTE', 'EN_ATTENTE'],
      ['PARTIEL', 'PARTIEL'],
      ['ANNULE', 'ANNULE'],
      ['ANNULÉ', 'ANNULE'],
    ])('"%s" → %s', (input, expected) => {
      const r = transformPos([po({ status: input })], ctx, buildLookups());
      expect(r.pos[0]?.status).toBe(expected);
    });

    it('status inconnu → default EN_ATTENTE + warning skip', () => {
      const r = transformPos([po({ status: 'XYZ' })], ctx, buildLookups());
      expect(r.pos[0]?.status).toBe('EN_ATTENTE');
    });
  });

  describe('items orphelins (pieceId et SKU inconnus dans mapping)', () => {
    it('item avec piece non trouvée → pieceId null mais item conservé', () => {
      const v = po({
        poNumber: 'X1',
        items: [
          {
            nom: 'Produit inconnu',
            sku: 'UNKNOWN-SKU',
            qteCommandee: 1,
            qteRecue: 0,
            prixAchat: 5,
            recu: false,
            pieceRow: -1,
            notes: '',
            pieceId: '',
            categorie: '',
          },
        ],
      });
      const r = transformPos([v], ctx, buildLookups());
      expect(r.items[0]?.pieceId).toBeNull();
      expect(r.items[0]?.nomSnapshot).toBe('Produit inconnu');
    });
  });

  describe('positions séquentielles', () => {
    it('items numérotés 1, 2, 3...', () => {
      const v = po({
        items: [
          { nom: 'A', sku: 'A', qteCommandee: 1, qteRecue: 0, prixAchat: 1, recu: false, pieceRow: 0, notes: '', pieceId: '', categorie: '' },
          { nom: 'B', sku: 'B', qteCommandee: 1, qteRecue: 0, prixAchat: 1, recu: false, pieceRow: 0, notes: '', pieceId: '', categorie: '' },
          { nom: 'C', sku: 'C', qteCommandee: 1, qteRecue: 0, prixAchat: 1, recu: false, pieceRow: 0, notes: '', pieceId: '', categorie: '' },
        ],
      });
      const r = transformPos([v], ctx, buildLookups());
      expect(r.items.map((i) => i.position)).toEqual([1, 2, 3]);
    });
  });

  describe('dateReception null pour PO en attente', () => {
    it('dateReception=null → null', () => {
      const r = transformPos([po({ dateReception: null })], ctx, buildLookups());
      expect(r.pos[0]?.dateReception).toBeNull();
    });
  });
});
