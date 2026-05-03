import { generateId } from '../../ids/generate-id';
import { normalizeNonValue } from '../../normalize/normalize-non-value';
import { dedupePieces, type IdMapping, type LegacyPiece } from '../dedupe-piece';
import type {
  ImportContext,
  SkippedItem,
  V2PieceDraft,
  V2TranslationDraft,
} from './types';

export type V1CataloguePiece = {
  pieceId: string;
  nom: string;
  sku: string;
  flag: string;
  groupe: string;
  skuUrl: string;
  prixAchat: number;
  prixBase: number;
  prixVente: number;
  prixCost: number;
  prixBDC: number;
  codeBarre: string;
  fournisseur: string;
  oos: number;
  qteACommander: number;
  sousTotal: number;
  categorie: string;
  stock: number;
  stockReserve: number;
  surplus: number;
  notes: string;
};

export type PieceImportResult = {
  records: V2PieceDraft[];
  mapping: IdMapping[];
  translations: V2TranslationDraft[];
  skipped: SkippedItem[];
};

// SKUs invalides v1 : valeurs textuelles type "page", "lien", "shop"
// utilisées comme placeholders (lien vers un catalogue fournisseur).
const INVALID_SKU_PREFIXES = ['page', 'lien', 'shop'];

function isValidSku(rawSku: string): boolean {
  const cleaned = normalizeNonValue(rawSku);
  if (cleaned === null) return false;
  if (cleaned === '?') return false;
  const lower = cleaned.toLowerCase();
  for (const p of INVALID_SKU_PREFIXES) {
    if (lower === p || lower.startsWith(`${p} `)) return false;
  }
  return true;
}

function isHeaderRow(raw: V1CataloguePiece): boolean {
  // Ligne d'en-tête raw du Sheet : nom="item", sku="sku"
  if (raw.nom === 'item' && raw.sku === 'sku') return true;
  // Marqueurs "FIN DE → ..."
  if (raw.nom.startsWith('FIN DE →')) return true;
  // Headers de groupe (flag="/" + tous prix à 0)
  if (
    raw.flag === '/' &&
    raw.prixAchat === 0 &&
    raw.prixBase === 0 &&
    raw.prixVente === 0 &&
    raw.prixCost === 0 &&
    raw.prixBDC === 0
  ) {
    return true;
  }
  return false;
}

// v1 met 0 pour les prix non renseignés. On normalise vers null sauf prixVente
// qui peut légitimement valoir 0 (services/produits gratuits) et reste obligatoire.
function priceOrNull(n: number): string | null {
  if (n === 0) return null;
  return String(n);
}

export function transformPieces(
  v1: V1CataloguePiece[],
  ctx: ImportContext,
): PieceImportResult {
  const skipped: SkippedItem[] = [];
  const filtered: V1CataloguePiece[] = [];

  for (const raw of v1) {
    if (isHeaderRow(raw)) {
      skipped.push({ reason: 'header / séparateur catalogue', entityType: 'piece', raw });
      continue;
    }
    if (normalizeNonValue(raw.nom) === null) {
      skipped.push({ reason: 'nom vide ou placeholder', entityType: 'piece', raw });
      continue;
    }
    filtered.push(raw);
  }

  // Délégation à dedupePieces pour la dédup sur (sku, nom). Les sku invalides
  // (page, lien...) restent dans la dedupKey pour distinguer les lignes.
  const legacyInputs: LegacyPiece[] = filtered.map((raw) => ({
    pieceId: raw.pieceId,
    sku: raw.sku,
    nom: raw.nom,
  }));
  const deduped = dedupePieces(legacyInputs);

  // Map dedupKey → raw pour récupérer les champs supplémentaires (prix, stock...)
  const rawByKey = new Map<string, V1CataloguePiece>();
  for (const raw of filtered) {
    const key = `${raw.sku.trim().toLowerCase()}|${raw.nom.trim().toLowerCase()}`;
    if (!rawByKey.has(key)) rawByKey.set(key, raw);
  }

  const records: V2PieceDraft[] = [];
  const translations: V2TranslationDraft[] = [];
  const now = new Date();

  for (const dp of deduped.pieces) {
    const key = `${dp.sku.trim().toLowerCase()}|${dp.nom.trim().toLowerCase()}`;
    const raw = rawByKey.get(key);
    if (!raw) continue; // ne devrait pas arriver

    const piece: V2PieceDraft = {
      id: dp.id,
      workshopId: ctx.workshopId,
      legacyCode: normalizeNonValue(raw.pieceId),
      nomCanonical: dp.nom,
      sku: isValidSku(raw.sku) ? raw.sku.trim() : null,
      codeBarre: normalizeNonValue(raw.codeBarre),
      categorie: normalizeNonValue(raw.categorie),
      fournisseur: normalizeNonValue(raw.fournisseur),
      prixAchat: priceOrNull(raw.prixAchat),
      prixBase: priceOrNull(raw.prixBase),
      prixVente: String(raw.prixVente),
      prixCost: priceOrNull(raw.prixCost),
      prixBdc: priceOrNull(raw.prixBDC),
      taxable: true,
      stockPhysique: raw.stock,
      stockReserve: raw.stockReserve,
    };
    records.push(piece);

    translations.push({
      id: generateId('translation'),
      workshopId: ctx.workshopId,
      entityType: 'PIECE',
      entityId: piece.id,
      field: 'label',
      locale: ctx.defaultLocale,
      value: dp.nom,
      source: 'USER',
      reviewedAt: now,
      reviewedById: null,
    });
  }

  return { records, mapping: deduped.mapping, translations, skipped };
}
