import { generateId } from '../../ids/generate-id';
import { normalizeNonValue } from '../../normalize/normalize-non-value';
import { parseV1Date } from '../../normalize/parse-v1-date';
import type { IdMapping } from '../dedupe-piece';
import { resolvePieceFromLegacyRef } from '../resolve-piece-from-legacy-ref';
import type {
  ImportContext,
  V2ClientDraft,
  V2ModePaiement,
  V2VenteDirecteDraft,
  V2VenteDirecteItemDraft,
  VentesImportResult,
} from './types';

export type V1VenteItem = {
  pieceId: string;
  sku: string;
  nom: string;
  qte: number;
  prixUnit: number;
  sousTotal: number;
};

export type V1Vente = {
  venteId: string;
  date: string;
  client: string;
  factureNumero?: string;
  factureDate?: string;
  factureUrl?: string;
  cost: boolean;
  remiseType?: 'pct' | 'fixed';
  remiseValue?: number | string;
  modePaiement?: string;
  items: V1VenteItem[];
  _rows: number[];
  total: number;
};

export type V1VenteArchiveRaw = {
  row: number;
  rawCols: (string | number)[];
};

export type VentesLookups = {
  clients: V2ClientDraft[];
  piecesMapping: IdMapping[];
};

const MODE_PAIEMENT_MAP: Record<string, V2ModePaiement> = {
  comptant: 'COMPTANT',
  interac: 'INTERAC',
  interact: 'INTERAC',
  carte: 'CARTE',
  cartes: 'CARTE',
};

function mapModePaiement(raw: string | undefined): V2ModePaiement | null {
  const cleaned = normalizeNonValue(raw ?? '');
  if (cleaned === null) return null;
  const lower = cleaned.toLowerCase();
  if (MODE_PAIEMENT_MAP[lower]) return MODE_PAIEMENT_MAP[lower];
  return 'AUTRE';
}

function resolveClient(rawClient: string, clients: V2ClientDraft[]): string | null {
  const cleaned = normalizeNonValue(rawClient);
  if (cleaned === null) return null;
  const lower = cleaned.toLowerCase();
  // Match par "prenom nom"
  const byFull = clients.find((c) => `${c.prenom} ${c.nom}`.trim().toLowerCase() === lower);
  if (byFull) return byFull.id;
  // Fallback : match par prenom seul si unique (cas Walk-in)
  const byPrenom = clients.filter((c) => c.prenom.toLowerCase() === lower);
  if (byPrenom.length === 1) return byPrenom[0]?.id ?? null;
  return null;
}

// Parse une virgule décimale française "18,525" → 18.525
function parseDecimalFR(raw: string | number): number {
  if (typeof raw === 'number') return raw;
  const cleaned = String(raw).replace(/\$/g, '').trim();
  const normalized = cleaned.replace(',', '.');
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

// Regroupe les rows raw d'un Sheet (format colonnes brutes) par venteId.
// Format des colonnes : [venteId, date, client, pieceId, sku, nom, qte,
//   prixUnit, factureNumero?, factureDate?, factureUrl?, cost?, remiseType?,
//   remiseValue?, modePaiement?]
// Les colonnes 9-15 ne sont remplies que sur la 1ère ligne d'une vente.
export function groupVentesArchives(raw: V1VenteArchiveRaw[]): V1Vente[] {
  const byVente = new Map<string, V1Vente>();

  for (const r of raw) {
    const cols = r.rawCols;
    const venteId = String(cols[0] ?? '').trim();
    if (venteId === '') continue;

    const item: V1VenteItem = {
      pieceId: String(cols[3] ?? ''),
      sku: String(cols[4] ?? ''),
      nom: String(cols[5] ?? ''),
      qte: parseDecimalFR(cols[6] ?? 0),
      prixUnit: parseDecimalFR(cols[7] ?? 0),
      sousTotal: parseDecimalFR(cols[6] ?? 0) * parseDecimalFR(cols[7] ?? 0),
    };

    let vente = byVente.get(venteId);
    if (!vente) {
      const remiseRaw = cols[13];
      const remiseValue =
        remiseRaw !== undefined && remiseRaw !== '' ? parseDecimalFR(remiseRaw) : null;
      const remiseTypeRaw = String(cols[12] ?? '').toLowerCase();
      const factureNumero = normalizeNonValue(String(cols[8] ?? ''));
      const factureDateStr = String(cols[9] ?? '');
      const factureUrlStr = String(cols[10] ?? '');
      const modePaiementStr = cols[14] !== undefined ? String(cols[14]) : '';

      const v: V1Vente = {
        venteId,
        date: String(cols[1] ?? ''),
        client: String(cols[2] ?? ''),
        cost: String(cols[11] ?? '').toUpperCase() === 'TRUE',
        items: [],
        _rows: [],
        total: 0,
      };
      if (factureNumero !== null) v.factureNumero = factureNumero;
      if (factureDateStr !== '') v.factureDate = factureDateStr;
      if (factureUrlStr !== '') v.factureUrl = factureUrlStr;
      if (remiseTypeRaw === 'pct' || remiseTypeRaw === 'fixed') v.remiseType = remiseTypeRaw;
      if (remiseValue !== null) v.remiseValue = remiseValue;
      if (modePaiementStr !== '') v.modePaiement = modePaiementStr;

      vente = v;
      byVente.set(venteId, vente);
    }

    vente.items.push(item);
    vente._rows.push(r.row);
    vente.total += item.sousTotal;
  }

  return Array.from(byVente.values());
}

function transformOneVente(
  raw: V1Vente,
  ctx: ImportContext,
  lookups: VentesLookups,
): { vente: V2VenteDirecteDraft; items: V2VenteDirecteItemDraft[] } {
  const venteId = generateId('vente');
  const date = parseV1Date(raw.date) ?? raw.date;
  const factureNumero = normalizeNonValue(raw.factureNumero ?? '');
  const factureDate = raw.factureDate ? parseV1Date(raw.factureDate) : null;
  const factureUrl = normalizeNonValue(raw.factureUrl ?? '');

  const remiseValue = raw.remiseValue !== undefined ? String(raw.remiseValue) : null;
  const remiseType =
    raw.remiseType === 'pct' ? 'PCT' : raw.remiseType === 'fixed' ? 'FIXED' : null;

  const items: V2VenteDirecteItemDraft[] = [];
  let pos = 0;
  let total = 0;
  for (const itm of raw.items) {
    pos += 1;
    total += itm.sousTotal;
    items.push({
      id: generateId('vdi'),
      venteId,
      pieceId: (() => {
        const ref: { legacyId?: string; sku?: string; nom?: string } = {};
        if (itm.pieceId) ref.legacyId = itm.pieceId;
        if (itm.sku) ref.sku = itm.sku;
        if (itm.nom) ref.nom = itm.nom;
        return resolvePieceFromLegacyRef(lookups.piecesMapping, ref);
      })(),
      position: pos,
      skuSnapshot: normalizeNonValue(itm.sku ?? ''),
      nomSnapshot: itm.nom,
      qty: String(itm.qte),
      unitPriceSnapshot: String(itm.prixUnit),
      taxableSnapshot: true,
      total: String(itm.sousTotal),
    });
  }

  const vente: V2VenteDirecteDraft = {
    id: venteId,
    workshopId: ctx.workshopId,
    clientId: resolveClient(raw.client, lookups.clients),
    date,
    factureNumero,
    factureDate,
    factureUrl,
    modePaiement: mapModePaiement(raw.modePaiement),
    remiseType: (remiseType as 'PCT' | 'FIXED' | null) ?? null,
    remiseValue: remiseValue && remiseValue !== '0' && remiseValue !== '' ? remiseValue : null,
    totalPieces: String(total),
    notes: null,
    legacyRawV1: raw as unknown as Record<string, unknown>,
  };

  return { vente, items };
}

export function transformVentes(
  input: { structurees: V1Vente[]; archives: V1VenteArchiveRaw[] },
  ctx: ImportContext,
  lookups: VentesLookups,
): VentesImportResult {
  const ventes: V2VenteDirecteDraft[] = [];
  const items: V2VenteDirecteItemDraft[] = [];
  const skipped: VentesImportResult['skipped'] = [];

  // Ventes structurées
  for (const raw of input.structurees) {
    const { vente, items: vItems } = transformOneVente(raw, ctx, lookups);
    ventes.push(vente);
    items.push(...vItems);
  }

  // Ventes archives raw : grouper d'abord puis transformer
  const grouped = groupVentesArchives(input.archives);
  for (const raw of grouped) {
    const { vente, items: vItems } = transformOneVente(raw, ctx, lookups);
    ventes.push(vente);
    items.push(...vItems);
  }

  return { ventes, items, skipped };
}
