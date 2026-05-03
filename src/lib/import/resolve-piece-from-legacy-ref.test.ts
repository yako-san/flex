import { describe, it, expect } from 'vitest';
import { dedupePieces, type LegacyPiece } from './dedupe-piece';
import { resolvePieceFromLegacyRef } from './resolve-piece-from-legacy-ref';

const piece = (overrides: Partial<LegacyPiece>): LegacyPiece => ({
  pieceId: 'P00001',
  sku: 'SKU-001',
  nom: 'Pièce générique',
  prixVente: '10.00',
  ...overrides,
});

describe('resolvePieceFromLegacyRef', () => {
  describe('cas simple (pieceId unique dans le mapping)', () => {
    const fixture = dedupePieces([
      piece({ pieceId: 'P00001', sku: 'SKU-A', nom: 'Pièce A' }),
    ]);
    const expectedNewId = fixture.pieces[0]?.id;

    it('match par legacyId seul → newId', () => {
      expect(resolvePieceFromLegacyRef(fixture.mapping, { legacyId: 'P00001' })).toBe(expectedNewId);
    });

    it('match par legacyId + sku exact → newId', () => {
      expect(
        resolvePieceFromLegacyRef(fixture.mapping, { legacyId: 'P00001', sku: 'SKU-A' }),
      ).toBe(expectedNewId);
    });
  });

  describe('cas réel v1 : P00035 réutilisé sur 2 pièces (Z6 et Z7)', () => {
    const fixture = dedupePieces([
      piece({ pieceId: 'P00035', sku: '46-600', nom: 'KMC, Chaînes Z6 5/6/7 vitesses' }),
      piece({ pieceId: 'P00035', sku: '46-635', nom: 'KMC, Chaînes Z7 5/6/7 vitesses' }),
    ]);
    const z6NewId = fixture.pieces[0]?.id;
    const z7NewId = fixture.pieces[1]?.id;

    it('match par legacyId + sku Z6 → newId Z6', () => {
      expect(
        resolvePieceFromLegacyRef(fixture.mapping, { legacyId: 'P00035', sku: '46-600' }),
      ).toBe(z6NewId);
    });

    it('match par legacyId + sku Z7 → newId Z7', () => {
      expect(
        resolvePieceFromLegacyRef(fixture.mapping, { legacyId: 'P00035', sku: '46-635' }),
      ).toBe(z7NewId);
    });

    it('match par legacyId + nom Z6 (sku absent) → newId Z6', () => {
      expect(
        resolvePieceFromLegacyRef(fixture.mapping, {
          legacyId: 'P00035',
          nom: 'KMC, Chaînes Z6 5/6/7 vitesses',
        }),
      ).toBe(z6NewId);
    });

    it('match par legacyId seul (ambigu) → null', () => {
      expect(resolvePieceFromLegacyRef(fixture.mapping, { legacyId: 'P00035' })).toBeNull();
    });
  });

  describe('cas non trouvé', () => {
    const fixture = dedupePieces([piece({ pieceId: 'P00001' })]);

    it('legacyId inconnu → null', () => {
      expect(resolvePieceFromLegacyRef(fixture.mapping, { legacyId: 'P99999' })).toBeNull();
    });

    it('legacyId connu mais sku ne matche pas → null (pas de fallback dangereux)', () => {
      expect(
        resolvePieceFromLegacyRef(fixture.mapping, { legacyId: 'P00001', sku: 'WRONG-SKU' }),
      ).toBeNull();
    });
  });

  describe('match insensible à la casse et whitespace (cohérent avec dedupKey)', () => {
    const fixture = dedupePieces([piece({ pieceId: 'P00001', sku: 'SKU-A', nom: 'Pneu' })]);
    const newId = fixture.pieces[0]?.id;

    it('sku en minuscules → match', () => {
      expect(
        resolvePieceFromLegacyRef(fixture.mapping, { legacyId: 'P00001', sku: 'sku-a' }),
      ).toBe(newId);
    });

    it('nom avec espaces autour → match', () => {
      expect(
        resolvePieceFromLegacyRef(fixture.mapping, { legacyId: 'P00001', nom: '  Pneu  ' }),
      ).toBe(newId);
    });
  });

  describe('cas sans pieceId v1 (vente où seul le sku est connu)', () => {
    const fixture = dedupePieces([
      piece({ pieceId: 'P00067', sku: '220069-01', nom: 'Jagwire CEX' }),
      piece({ pieceId: 'P00068', sku: '220066-02', nom: 'Jagwire CGX-SL' }),
    ]);
    const cexId = fixture.pieces[0]?.id;

    it('sans legacyId mais avec sku → match par sku seul', () => {
      expect(resolvePieceFromLegacyRef(fixture.mapping, { sku: '220069-01' })).toBe(cexId);
    });

    it('sans legacyId mais avec nom unique → match', () => {
      expect(resolvePieceFromLegacyRef(fixture.mapping, { nom: 'Jagwire CEX' })).toBe(cexId);
    });

    it('sans aucun critère → null', () => {
      expect(resolvePieceFromLegacyRef(fixture.mapping, {})).toBeNull();
    });
  });
});
