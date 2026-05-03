import { generateId } from '../../ids/generate-id';
import { normalizeNonValue } from '../../normalize/normalize-non-value';
import type { IdMapping } from '../dedupe-piece';
import { resolvePieceFromLegacyRef } from '../resolve-piece-from-legacy-ref';
import { resolveServiceOrForfait } from './resolve-service-or-forfait';
import type {
  BdcsImportResult,
  ImportContext,
  V2BdcArchiveStatus,
  V2BdcDraft,
  V2BdcEvalStatus,
  V2BdcItemDraft,
  V2BdcItemKind,
  V2BdcItemTaskDraft,
  V2BdcItemTaskStatus,
  V2ForfaitDraft,
  V2ForfaitTaskTemplateDraft,
  V2ServiceDraft,
  V2VeloDraft,
} from './types';

export type V1BdcItemService = {
  serviceId?: string;
  nom: string;
  fait: boolean;
  status: string;
  prix: number;
};

export type V1BdcItemPiece = {
  nom: string;
  prix: number;
  cmd: string;
  qte: number;
  sousTotal: number;
  flag: string;
  cmdNote: string;
};

export type V1BdcItem = {
  _row: number;
  service?: V1BdcItemService;
  piece?: V1BdcItemPiece;
};

export type V1Remise = { type: 'pct' | 'fixed'; value: number };

export type V1Bdc = {
  id: string;
  dateIn: string;
  veloDesc: string;
  clientNom: string;
  noteClient: string;
  checkEval: boolean;
  checkOk: boolean;
  checkBds: boolean;
  checkOut: boolean;
  evalStatus: string;
  items: V1BdcItem[];
  totalServices: number;
  totalPieces: number;
  remiseSvc?: V1Remise;
  remisePce?: V1Remise;
  noteClientFacture: string;
};

export type V1BdcArchive = V1Bdc & {
  dateOut: string;
  archiveStatus: string;
  evalMecano: string;
  mecaMecano: string;
  ctrlMecano: string;
  noteVelo: string;
  noteInterne: string;
};

export type BdcsLookups = {
  velos: V2VeloDraft[];
  services: V2ServiceDraft[];
  forfaits: V2ForfaitDraft[];
  taskTemplates: V2ForfaitTaskTemplateDraft[];
  piecesMapping: IdMapping[];
};

const EVAL_STATUS_MAP: Record<string, V2BdcEvalStatus> = {
  APPROUVE: 'APPROUVE',
  APPROUVÉ: 'APPROUVE',
  REDUX: 'REDUX',
  ATTENTE: 'EN_ATTENTE',
  EN_ATTENTE: 'EN_ATTENTE',
  REFUSE: 'REFUSE',
  REFUSÉ: 'REFUSE',
};

const ARCHIVE_STATUS_MAP: Record<string, V2BdcArchiveStatus> = {
  FACTURÉ: 'ARCHIVE_FACTURE',
  FACTURE: 'ARCHIVE_FACTURE',
  FACTURER: 'ARCHIVE_A_FACTURER',
  REFUSÉ: 'ARCHIVE_REFUSE',
  REFUSE: 'ARCHIVE_REFUSE',
  'CTRL QLTÉ': 'ARCHIVE_CTRL_QLTE',
  'CTRL QLTE': 'ARCHIVE_CTRL_QLTE',
  'ÉVAL.': 'ARCHIVE_EVAL',
  'EVAL.': 'ARCHIVE_EVAL',
  ÉVAL: 'ARCHIVE_EVAL',
  EVAL: 'ARCHIVE_EVAL',
  ARCHIVÉ: 'ARCHIVE_LEGACY',
  ARCHIVE: 'ARCHIVE_LEGACY',
};

function mapEvalStatus(raw: string): V2BdcEvalStatus {
  const cleaned = (raw ?? '').trim().toUpperCase();
  return EVAL_STATUS_MAP[cleaned] ?? 'EN_ATTENTE';
}

function mapArchiveStatus(raw: string): V2BdcArchiveStatus | null {
  const cleaned = (raw ?? '').trim().toUpperCase();
  return ARCHIVE_STATUS_MAP[cleaned] ?? null;
}

function lookupVelo(rawId: string, velos: V2VeloDraft[]): string | null {
  const num = Number.parseInt(rawId, 10);
  if (Number.isNaN(num)) return null;
  return velos.find((v) => v.veloNumero === num)?.id ?? null;
}

function mapRemise(r: V1Remise | undefined): {
  type: 'PCT' | 'FIXED' | null;
  value: string | null;
} {
  if (!r) return { type: null, value: null };
  return {
    type: r.type === 'pct' ? 'PCT' : 'FIXED',
    value: String(r.value),
  };
}

// Détermine le statut initial des sous-tâches d'un forfait selon l'état du BDC.
function initialTaskStatus(archiveStatus: V2BdcArchiveStatus): V2BdcItemTaskStatus {
  if (archiveStatus === 'ARCHIVE_FACTURE' || archiveStatus === 'ARCHIVE_A_FACTURER') {
    return 'DONE';
  }
  return 'TODO';
}

function processItem(
  raw: V1BdcItem,
  bdcId: string,
  workshopId: string,
  position: number,
  lookups: BdcsLookups,
): {
  items: V2BdcItemDraft[];
  resolvedForfaitIds: string[]; // pour générer les tasks ensuite
  positionUsed: number;
} {
  const items: V2BdcItemDraft[] = [];
  const resolvedForfaitIds: string[] = [];
  let pos = position;

  // service / forfait
  if (raw.service) {
    const resolved = resolveServiceOrForfait(
      raw.service.serviceId,
      raw.service.nom,
      lookups.services,
      lookups.forfaits,
    );
    const kind: V2BdcItemKind = resolved?.kind ?? 'SERVICE';
    pos += 1;
    items.push({
      id: generateId('bdci'),
      workshopId,
      bdcId,
      kind,
      position: pos,
      serviceId: kind === 'SERVICE' ? (resolved?.id ?? null) : null,
      pieceId: null,
      forfaitId: kind === 'FORFAIT' ? (resolved?.id ?? null) : null,
      labelSnapshot: raw.service.nom,
      unitPriceSnapshot: String(raw.service.prix),
      taxableSnapshot: true,
      qty: '1',
      total: String(raw.service.prix),
    });
    if (kind === 'FORFAIT' && resolved !== null) {
      resolvedForfaitIds.push(resolved.id);
    }
  }

  // piece
  if (raw.piece) {
    const newPieceId = resolvePieceFromLegacyRef(lookups.piecesMapping, {
      nom: raw.piece.nom,
    });
    pos += 1;
    items.push({
      id: generateId('bdci'),
      workshopId,
      bdcId,
      kind: 'PIECE',
      position: pos,
      serviceId: null,
      pieceId: newPieceId,
      forfaitId: null,
      labelSnapshot: raw.piece.nom,
      unitPriceSnapshot: String(raw.piece.prix),
      taxableSnapshot: true,
      qty: String(raw.piece.qte),
      total: String(raw.piece.sousTotal),
    });
  }

  // mapping forfait → bdcItemId pour les tasks
  return { items, resolvedForfaitIds, positionUsed: pos };
}

function buildBdcDraft(
  raw: V1Bdc | V1BdcArchive,
  veloId: string,
  archiveStatus: V2BdcArchiveStatus,
  ctx: ImportContext,
): V2BdcDraft {
  const remiseSvc = mapRemise(raw.remiseSvc);
  const remisePce = mapRemise(raw.remisePce);
  const noteRaw =
    'noteInterne' in raw && raw.noteInterne
      ? raw.noteInterne
      : raw.noteClient !== ''
      ? raw.noteClient
      : raw.noteClientFacture;

  return {
    id: generateId('bdc'),
    workshopId: ctx.workshopId,
    veloId,
    evalStatus: mapEvalStatus(raw.evalStatus ?? ''),
    archiveStatus,
    cbEvalEnvoye: raw.checkEval ?? false,
    cbEval: raw.checkOk ?? false,
    cbBonSortie: raw.checkBds ?? false,
    cbArchiver: raw.checkOut ?? false,
    remiseSvcType: remiseSvc.type,
    remiseSvcValue: remiseSvc.value,
    remisePceType: remisePce.type,
    remisePceValue: remisePce.value,
    totalServices: String(raw.totalServices ?? 0),
    totalPieces: String(raw.totalPieces ?? 0),
    notes: normalizeNonValue(noteRaw ?? ''),
    legacyRawV1: raw as unknown as Record<string, unknown>,
  };
}

export function transformBdcs(
  input: { actifs: V1Bdc[]; archives: V1BdcArchive[] },
  ctx: ImportContext,
  lookups: BdcsLookups,
): BdcsImportResult {
  const bdcs: V2BdcDraft[] = [];
  const items: V2BdcItemDraft[] = [];
  const tasks: V2BdcItemTaskDraft[] = [];
  const skipped: BdcsImportResult['skipped'] = [];

  function handleBdc(raw: V1Bdc | V1BdcArchive, archiveStatus: V2BdcArchiveStatus) {
    const veloId = lookupVelo(raw.id, lookups.velos);
    if (veloId === null) {
      skipped.push({
        reason: `velo introuvable pour BDT id "${raw.id}"`,
        entityType: 'bdc',
        raw,
      });
      return;
    }

    const draft = buildBdcDraft(raw, veloId, archiveStatus, ctx);
    bdcs.push(draft);

    let position = 0;
    for (const rawItem of raw.items) {
      const processed = processItem(rawItem, draft.id, ctx.workshopId, position, lookups);
      items.push(...processed.items);
      position = processed.positionUsed;

      // Pour chaque FORFAIT identifié, instancier les BdcItemTask depuis les
      // ForfaitTaskTemplate du forfait.
      for (const forfaitId of processed.resolvedForfaitIds) {
        const bdcItemId = processed.items.find((i) => i.kind === 'FORFAIT' && i.forfaitId === forfaitId)?.id;
        if (!bdcItemId) continue;
        const templates = lookups.taskTemplates.filter((t) => t.forfaitId === forfaitId);
        const taskStatus = initialTaskStatus(archiveStatus);
        for (const tpl of templates) {
          tasks.push({
            id: generateId('task'),
            bdcItemId,
            position: tpl.position,
            labelSnapshot: tpl.labelCanonical,
            status: taskStatus,
            notes: null,
          });
        }
      }
    }
  }

  // Dédup : un BDC dont l'id existe à la fois en actifs et archives
  // représente le même BDC à 2 états (le v1 export inclut souvent un
  // snapshot de l'actif avant son archivage). On privilégie l'archive
  // (statut/dateOut/mecano résolus, items finaux).
  const archivedIds = new Set(input.archives.map((a) => a.id));
  const dedupedActifs = input.actifs.filter((a) => !archivedIds.has(a.id));

  for (const a of dedupedActifs) {
    handleBdc(a, 'ACTIF');
  }
  for (const a of input.archives) {
    const status = mapArchiveStatus(a.archiveStatus) ?? 'ARCHIVE_LEGACY';
    handleBdc(a, status);
  }

  return { bdcs, items, tasks, skipped };
}
