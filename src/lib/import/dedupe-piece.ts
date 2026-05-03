import { ulid } from 'ulid';

export type LegacyPiece = {
  pieceId: string;
  sku: string;
  nom: string;
  prixVente?: string;
  [key: string]: unknown;
};

export type DedupedPiece = {
  id: string;
  sku: string;
  nom: string;
  [key: string]: unknown;
};

export type IdMapping = {
  legacyPieceId: string;
  newId: string;
};

export type DedupeResult = {
  pieces: DedupedPiece[];
  mapping: IdMapping[];
};

function dedupKey(p: LegacyPiece): string {
  return `${p.sku.trim().toLowerCase()}|${p.nom.trim().toLowerCase()}`;
}

export function dedupePieces(input: LegacyPiece[]): DedupeResult {
  const byKey = new Map<string, DedupedPiece>();
  const mapping: IdMapping[] = [];

  for (const raw of input) {
    const key = dedupKey(raw);
    let canonical = byKey.get(key);
    if (!canonical) {
      canonical = {
        ...raw,
        id: `piece_${ulid()}`,
        sku: raw.sku.trim(),
        nom: raw.nom.trim(),
      };
      byKey.set(key, canonical);
    }
    mapping.push({ legacyPieceId: raw.pieceId, newId: canonical.id });
  }

  return { pieces: Array.from(byKey.values()), mapping };
}
