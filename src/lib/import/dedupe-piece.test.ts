import { describe, it, expect } from 'vitest';
import { dedupePieces, type LegacyPiece } from './dedupe-piece';

const piece = (overrides: Partial<LegacyPiece>): LegacyPiece => ({
  pieceId: 'P00001',
  sku: 'SKU-001',
  nom: 'Pièce générique',
  prixVente: '10.00',
  ...overrides,
});

describe('dedupePieces', () => {
  it('liste vide → résultat vide', () => {
    const r = dedupePieces([]);
    expect(r.pieces).toEqual([]);
    expect(r.mapping).toEqual([]);
  });

  it('pièce unique → 1 sortie + 1 mapping legacy→new', () => {
    const input = [piece({ pieceId: 'P00001', sku: 'SKU-A', nom: 'Chambre à air 700c' })];
    const r = dedupePieces(input);

    expect(r.pieces).toHaveLength(1);
    expect(r.pieces[0]?.id).toMatch(/^piece_[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(r.pieces[0]?.sku).toBe('SKU-A');
    expect(r.pieces[0]?.nom).toBe('Chambre à air 700c');

    expect(r.mapping).toHaveLength(1);
    expect(r.mapping[0]).toMatchObject({
      legacyPieceId: 'P00001',
      newId: r.pieces[0]?.id,
    });
  });

  it('3 doublons (même pieceId, même sku, même nom) → 1 sortie + 3 mappings vers le même newId', () => {
    const input = [
      piece({ pieceId: 'P00004', sku: 'SKU-X', nom: 'Plaquettes Shimano' }),
      piece({ pieceId: 'P00004', sku: 'SKU-X', nom: 'Plaquettes Shimano' }),
      piece({ pieceId: 'P00004', sku: 'SKU-X', nom: 'Plaquettes Shimano' }),
    ];
    const r = dedupePieces(input);

    expect(r.pieces).toHaveLength(1);
    expect(r.mapping).toHaveLength(3);

    const newId = r.pieces[0]?.id;
    expect(newId).toBeDefined();
    for (const m of r.mapping) {
      expect(m.legacyPieceId).toBe('P00004');
      expect(m.newId).toBe(newId);
    }
  });

  it('même pieceId mais (sku, nom) différents → 2 entrées distinctes (corruption préservée)', () => {
    // Cas réel v1 : pieceId réutilisé sur deux pièces différentes
    const input = [
      piece({ pieceId: 'P00035', sku: 'SKU-A', nom: 'Câble dérailleur' }),
      piece({ pieceId: 'P00035', sku: 'SKU-B', nom: 'Câble frein' }),
    ];
    const r = dedupePieces(input);

    expect(r.pieces).toHaveLength(2);
    expect(r.mapping).toHaveLength(2);

    const ids = new Set(r.pieces.map((p) => p.id));
    expect(ids.size).toBe(2);

    // Les deux mappings pointent vers le pieceId legacy P00035 mais des newIds différents
    const newIds = new Set(r.mapping.map((m) => m.newId));
    expect(newIds.size).toBe(2);
    expect(r.mapping.every((m) => m.legacyPieceId === 'P00035')).toBe(true);
  });

  it('clé de dédup insensible à la casse et aux espaces sur sku+nom', () => {
    const input = [
      piece({ pieceId: 'P00040', sku: 'SKU-Z', nom: 'Pneu 700x32c' }),
      piece({ pieceId: 'P00040', sku: 'sku-z', nom: '  Pneu 700x32c  ' }),
    ];
    const r = dedupePieces(input);
    expect(r.pieces).toHaveLength(1);
    expect(r.mapping).toHaveLength(2);
  });

  it('newId est un préfixe + ULID (26 chars base32 Crockford)', () => {
    const input = [piece({})];
    const r = dedupePieces(input);
    expect(r.pieces[0]?.id).toMatch(/^piece_[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it('newId déterministe au sein d\'un même appel pour les doublons', () => {
    const input = [
      piece({ pieceId: 'P00001', sku: 'A', nom: 'Pièce A' }),
      piece({ pieceId: 'P00002', sku: 'B', nom: 'Pièce B' }),
      piece({ pieceId: 'P00001', sku: 'A', nom: 'Pièce A' }),
    ];
    const r = dedupePieces(input);
    expect(r.pieces).toHaveLength(2);
    // Les deux mappings P00001 doivent pointer vers le même newId
    const p1Mappings = r.mapping.filter((m) => m.legacyPieceId === 'P00001');
    expect(p1Mappings).toHaveLength(2);
    expect(p1Mappings[0]?.newId).toBe(p1Mappings[1]?.newId);
  });

  describe('mapping inclut legacySku + legacyNom (désambiguïsation)', () => {
    it('chaque mapping conserve sku et nom raw pour retrouver le bon newId', () => {
      const input = [
        piece({ pieceId: 'P00035', sku: '46-600', nom: 'KMC, Chaînes Z6 5/6/7 vitesses' }),
        piece({ pieceId: 'P00035', sku: '46-635', nom: 'KMC, Chaînes Z7 5/6/7 vitesses' }),
      ];
      const r = dedupePieces(input);
      expect(r.mapping).toHaveLength(2);
      expect(r.mapping[0]).toMatchObject({
        legacyPieceId: 'P00035',
        legacySku: '46-600',
        legacyNom: 'KMC, Chaînes Z6 5/6/7 vitesses',
      });
      expect(r.mapping[1]).toMatchObject({
        legacyPieceId: 'P00035',
        legacySku: '46-635',
        legacyNom: 'KMC, Chaînes Z7 5/6/7 vitesses',
      });
    });

    it('legacySku/legacyNom préservent la valeur raw même si dédupliqué', () => {
      const input = [
        piece({ pieceId: 'P00040', sku: 'SKU-Z', nom: 'Pneu 700x32c' }),
        piece({ pieceId: 'P00040', sku: 'sku-z', nom: '  Pneu 700x32c  ' }),
      ];
      const r = dedupePieces(input);
      // 1 pièce canonique mais 2 mappings, chacun avec son raw
      expect(r.mapping[0]?.legacySku).toBe('SKU-Z');
      expect(r.mapping[1]?.legacySku).toBe('sku-z');
      expect(r.mapping[1]?.legacyNom).toBe('  Pneu 700x32c  ');
    });
  });
});
