import { generateId } from '../../ids/generate-id';
import { normalizeNonValue } from '../../normalize/normalize-non-value';
import { parseV1Date } from '../../normalize/parse-v1-date';
import type { IdMapping } from '../dedupe-piece';
import { resolvePieceFromLegacyRef } from '../resolve-piece-from-legacy-ref';
import type {
  ImportContext,
  PosImportResult,
  V2PoDraft,
  V2PoItemDraft,
  V2PoStatus,
} from './types';

export type V1PoItem = {
  nom: string;
  sku: string;
  qteCommandee: number;
  qteRecue: number;
  prixAchat: number;
  recu: boolean;
  pieceRow: number;
  notes: string;
  pieceId: string;
  categorie: string;
};

export type V1Po = {
  poNumber: string;
  fournisseur: string;
  dateCommande: string;
  dateReception: string | null;
  status: string;
  items: V1PoItem[];
  _rows: number[];
};

export type PosLookups = {
  piecesMapping: IdMapping[];
};

const STATUS_MAP: Record<string, V2PoStatus> = {
  RECU: 'RECU',
  REÇU: 'RECU',
  'EN ATTENTE': 'EN_ATTENTE',
  EN_ATTENTE: 'EN_ATTENTE',
  PARTIEL: 'PARTIEL',
  ANNULE: 'ANNULE',
  ANNULÉ: 'ANNULE',
};

function mapStatus(raw: string): V2PoStatus {
  const cleaned = (raw ?? '').trim().toUpperCase();
  return STATUS_MAP[cleaned] ?? 'EN_ATTENTE';
}

function resolvePoNumero(rawPoNumber: string, dateCommande: string): string {
  const cleaned = normalizeNonValue(rawPoNumber);
  if (cleaned === null || cleaned.toLowerCase() === 'inconnu') {
    return `INCONNU-${dateCommande}`;
  }
  return cleaned;
}

// Stratégie pour les PO : essai en cascade par critère le plus précis disponible.
// Le nom des items PO peut différer subtilement du nom catalogue (ex "Lubrifiant
// céramique sec 60 ml" PO vs "Mint'n Dry, Lubrifiant céramique, sec, 60 ml" catalogue),
// donc on ne combine pas tous les critères en AND mais on essaie dans l'ordre
// pieceId → sku → nom.
function resolvePieceForItem(item: V1PoItem, mapping: IdMapping[]): string | null {
  if (item.pieceId) {
    const r = resolvePieceFromLegacyRef(mapping, { legacyId: item.pieceId });
    if (r) return r;
  }
  if (item.sku) {
    const r = resolvePieceFromLegacyRef(mapping, { sku: item.sku });
    if (r) return r;
  }
  if (item.nom) {
    const r = resolvePieceFromLegacyRef(mapping, { nom: item.nom });
    if (r) return r;
  }
  return null;
}

export function transformPos(
  v1: V1Po[],
  ctx: ImportContext,
  lookups: PosLookups,
): PosImportResult {
  const pos: V2PoDraft[] = [];
  const items: V2PoItemDraft[] = [];
  const skipped: PosImportResult['skipped'] = [];

  for (const raw of v1) {
    const dateCommande = parseV1Date(raw.dateCommande) ?? raw.dateCommande;
    if (dateCommande === '' || dateCommande === null) {
      skipped.push({ reason: 'PO sans dateCommande', entityType: 'po', raw });
      continue;
    }

    const poId = generateId('po');
    pos.push({
      id: poId,
      workshopId: ctx.workshopId,
      poNumero: resolvePoNumero(raw.poNumber, dateCommande),
      fournisseur: raw.fournisseur?.trim() ?? '',
      dateCommande,
      dateReception: raw.dateReception ? parseV1Date(raw.dateReception) : null,
      status: mapStatus(raw.status),
      notes: null,
    });

    let pos_idx = 0;
    for (const item of raw.items) {
      pos_idx += 1;
      items.push({
        id: generateId('poi'),
        poId,
        pieceId: resolvePieceForItem(item, lookups.piecesMapping),
        position: pos_idx,
        skuSnapshot: normalizeNonValue(item.sku ?? ''),
        nomSnapshot: item.nom,
        qtyCommandee: String(item.qteCommandee ?? 0),
        qtyRecue: String(item.qteRecue ?? 0),
        unitPrice: String(item.prixAchat ?? 0),
      });
    }
  }

  return { pos, items, skipped };
}
