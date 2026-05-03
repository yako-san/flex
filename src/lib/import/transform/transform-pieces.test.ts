import { describe, it, expect } from 'vitest';
import { transformPieces, type V1CataloguePiece } from './transform-pieces';
import type { ImportContext } from './types';

const ctx: ImportContext = {
  workshopId: 'workshop_01HXTEST',
  defaultLocale: 'fr-CA',
  activeLocales: ['fr-CA', 'en-CA'],
};

const pc = (overrides: Partial<V1CataloguePiece>): V1CataloguePiece => ({
  pieceId: 'P00000',
  nom: 'Pièce générique',
  sku: 'TEST-SKU',
  flag: '@',
  groupe: '',
  skuUrl: '',
  prixAchat: 0,
  prixBase: 10,
  prixVente: 18.5,
  prixCost: 10,
  prixBDC: 18.5,
  codeBarre: '',
  fournisseur: '',
  oos: 0,
  qteACommander: 0,
  sousTotal: 0,
  categorie: '',
  stock: 0,
  stockReserve: 0,
  surplus: 0,
  notes: '',
  ...overrides,
});

describe('transformPieces', () => {
  describe('cas vides', () => {
    it('liste vide → tout vide', () => {
      const r = transformPieces([], ctx);
      expect(r.records).toEqual([]);
      expect(r.mapping).toEqual([]);
      expect(r.translations).toEqual([]);
      expect(r.skipped).toEqual([]);
    });
  });

  describe('cas nominal', () => {
    it('pièce simple → 1 V2PieceDraft + 1 Translation + 1 mapping', () => {
      const r = transformPieces(
        [
          pc({
            pieceId: 'P00038',
            nom: 'KMC, Chaînes X9 vitesses, argent',
            sku: '46-650',
            prixVente: 38.85,
            prixAchat: 21,
            prixBase: 21,
            stock: 1,
            stockReserve: 1,
            categorie: '2. Transmission, Chaines',
            fournisseur: 'Babac',
          }),
        ],
        ctx,
      );

      expect(r.records).toHaveLength(1);
      expect(r.records[0]).toMatchObject({
        legacyCode: 'P00038',
        nomCanonical: 'KMC, Chaînes X9 vitesses, argent',
        sku: '46-650',
        prixVente: '38.85',
        prixAchat: '21',
        prixBase: '21',
        stockPhysique: 1,
        stockReserve: 1,
        categorie: '2. Transmission, Chaines',
        fournisseur: 'Babac',
        taxable: true,
      });

      expect(r.records[0]?.id).toMatch(/^piece_[0-9A-HJKMNP-TV-Z]{26}$/);

      expect(r.mapping).toHaveLength(1);
      expect(r.mapping[0]).toMatchObject({
        legacyPieceId: 'P00038',
        legacySku: '46-650',
        legacyNom: 'KMC, Chaînes X9 vitesses, argent',
        newId: r.records[0]?.id,
      });

      expect(r.translations).toHaveLength(1);
      expect(r.translations[0]).toMatchObject({
        entityType: 'PIECE',
        entityId: r.records[0]?.id,
        locale: 'fr-CA',
        value: 'KMC, Chaînes X9 vitesses, argent',
      });
    });
  });

  describe('filtrage des artefacts v1', () => {
    it('skip ligne header avec nom="item" et sku="sku"', () => {
      const r = transformPieces(
        [pc({ pieceId: 'P00001', nom: 'item', sku: 'sku', prixVente: 0 })],
        ctx,
      );
      expect(r.records).toEqual([]);
      expect(r.skipped).toHaveLength(1);
    });

    it('skip lignes "FIN DE → pièces ..." (séparateurs de fin de catalogue)', () => {
      const r = transformPieces(
        [
          pc({ pieceId: 'P00220', nom: 'FIN DE → pièces à commander - Babac', sku: '—', prixVente: 0 }),
          pc({ pieceId: 'P00221', nom: 'FIN DE → pièces commandées - Babac', sku: '—', prixVente: 0 }),
        ],
        ctx,
      );
      expect(r.records).toEqual([]);
      expect(r.skipped).toHaveLength(2);
    });

    it('skip headers de groupe (flag="/" + tous prix à 0)', () => {
      const r = transformPieces(
        [
          pc({
            pieceId: 'P00005',
            nom: 'Liste de jeu de direction - IS',
            sku: '',
            flag: '/',
            prixAchat: 0,
            prixBase: 0,
            prixVente: 0,
            prixCost: 0,
            prixBDC: 0,
          }),
          pc({
            pieceId: 'P00049',
            nom: 'Cassette 5/6v',
            sku: '',
            flag: '/',
            prixAchat: 0,
            prixBase: 0,
            prixVente: 0,
            prixCost: 0,
            prixBDC: 0,
          }),
        ],
        ctx,
      );
      expect(r.records).toEqual([]);
      expect(r.skipped).toHaveLength(2);
    });

    it('skip si nom vide après normalize', () => {
      const r = transformPieces([pc({ nom: '...' })], ctx);
      expect(r.records).toEqual([]);
      expect(r.skipped).toHaveLength(1);
    });
  });

  describe('SKU invalide → null (préservé en raw dans le mapping)', () => {
    it.each([
      'page',
      'page Babac',
      'page HLC',
      'lien',
      'lien Babac',
      'shop',
      '—',
      '?',
      '',
    ])('"%s" → record.sku=null mais legacySku conservé dans mapping', (rawSku) => {
      const r = transformPieces(
        [pc({ pieceId: 'P00001', nom: 'Test', sku: rawSku, prixVente: 10 })],
        ctx,
      );
      expect(r.records).toHaveLength(1);
      expect(r.records[0]?.sku).toBeNull();
      expect(r.mapping[0]?.legacySku).toBe(rawSku);
    });

    it('SKU valide alphanumérique préservé', () => {
      const r = transformPieces([pc({ sku: '46-635' })], ctx);
      expect(r.records[0]?.sku).toBe('46-635');
    });

    it('SKU avec slash et chiffres préservé', () => {
      const r = transformPieces([pc({ sku: '500292-04' })], ctx);
      expect(r.records[0]?.sku).toBe('500292-04');
    });
  });

  describe('déduplication réutilisation pieceId v1 (cas réels)', () => {
    it('P00004 ×3 (Surly Guidon, Babac Fourche, Babac Entretoise) → 3 V2Piece distincts (sku+nom différents)', () => {
      const r = transformPieces(
        [
          pc({
            pieceId: 'P00004',
            nom: 'Surly, Guidon Open Bar Noir (refurbish)',
            sku: '',
            prixVente: 74,
            stock: 1,
          }),
          pc({
            pieceId: 'P00004',
            nom: 'Babac, Fourche 27″ 1″ (25.4mm) acier chromé',
            sku: '26-057',
            prixVente: 46.25,
            stock: 1,
          }),
          pc({
            pieceId: 'P00004',
            nom: 'Babac, Entretoise, Crown Race, 26,4mm, noir',
            sku: '26-057',
            prixVente: 4.625,
            stock: 7,
          }),
        ],
        ctx,
      );
      expect(r.records).toHaveLength(3);
      expect(r.mapping).toHaveLength(3);
      // tous les mappings ont legacyPieceId=P00004 mais newIds distincts
      expect(r.mapping.every((m) => m.legacyPieceId === 'P00004')).toBe(true);
      expect(new Set(r.mapping.map((m) => m.newId)).size).toBe(3);
    });

    it('P00035 ×2 (KMC Z6 sku 46-600 et KMC Z7 sku 46-635) → 2 V2Piece', () => {
      const r = transformPieces(
        [
          pc({
            pieceId: 'P00035',
            nom: 'KMC, Chaînes Z6 5/6/7 vitesses',
            sku: '46-600',
            prixVente: 17.575,
          }),
          pc({
            pieceId: 'P00035',
            nom: 'KMC, Chaînes Z7 5/6/7 vitesses',
            sku: '46-635',
            prixVente: 18.5,
          }),
        ],
        ctx,
      );
      expect(r.records).toHaveLength(2);
      expect(r.mapping).toHaveLength(2);
    });
  });

  describe('mapping stock v1 → v2', () => {
    it('stock=96 stockReserve=2 → stockPhysique=96 stockReserve=2', () => {
      const r = transformPieces(
        [pc({ pieceId: 'P00549', nom: '_TEST_STOCK_', sku: '_TEST_SKU_', stock: 96, stockReserve: 2 })],
        ctx,
      );
      expect(r.records[0]?.stockPhysique).toBe(96);
      expect(r.records[0]?.stockReserve).toBe(2);
    });
  });

  describe('valeurs nullable', () => {
    it('codeBarre vide → null', () => {
      const r = transformPieces([pc({ codeBarre: '' })], ctx);
      expect(r.records[0]?.codeBarre).toBeNull();
    });

    it('fournisseur "..." → null', () => {
      const r = transformPieces([pc({ fournisseur: '...' })], ctx);
      expect(r.records[0]?.fournisseur).toBeNull();
    });

    it('categorie vide → null', () => {
      const r = transformPieces([pc({ categorie: '' })], ctx);
      expect(r.records[0]?.categorie).toBeNull();
    });

    it('prixAchat=0 → null (pas renseigné en v1, pas de prix achat connu)', () => {
      // v1 met 0 pour les prix non renseignés. On veut null en v2 pour distinguer
      // "pas de prix" de "prix=0$" (gratuit). prixVente reste obligatoire.
      const r = transformPieces([pc({ prixAchat: 0, prixVente: 18.5 })], ctx);
      expect(r.records[0]?.prixAchat).toBeNull();
    });

    it('prixVente=0 reste "0" (vente gratuite légitime, pas null)', () => {
      const r = transformPieces([pc({ prixVente: 0 })], ctx);
      expect(r.records[0]?.prixVente).toBe('0');
    });
  });
});
