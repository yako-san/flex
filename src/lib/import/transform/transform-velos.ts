import { generateId } from '../../ids/generate-id';
import { normalizeNonValue } from '../../normalize/normalize-non-value';
import { parseV1Date } from '../../normalize/parse-v1-date';
import { resolveMecano } from './resolve-mecano';
import type {
  ImportContext,
  ImportResult,
  V2ClientDraft,
  V2EquipeMemberDraft,
  V2MarqueDraft,
  V2VeloDraft,
  V2VeloStatus,
} from './types';

export type V1Velo = {
  id: string;
  status: string;
  date1: string | null;
  date2: string | null;
  date3: string | null;
  client: string;
  marque: string;
  modele: string;
  couleur: string;
  taille: string;
  serie: string;
  noteVelo: string;
  eval: string;
  meca: string;
  ctrl: string;
  services: string;
  pieces: string;
  notes: string;
  noteClientEval: string;
  noteClientFacture: string;
};

const STATUS_MAP: Record<string, V2VeloStatus> = {
  RV: 'RV',
  REÇU: 'RECU',
  RECU: 'RECU',
  'EN ATTENTE': 'EN_ATTENTE',
  EVAL: 'EVAL',
  ÉVAL: 'EVAL',
  APPROUVÉ: 'APPROUVE',
  APPROUVE: 'APPROUVE',
  'ON BENCH': 'ON_BENCH',
  'CTRL QLTÉ': 'CTRL_QLTE',
  'CTRL QLTE': 'CTRL_QLTE',
  FINI: 'FINI',
  LIVRÉ: 'LIVRE',
  LIVRE: 'LIVRE',
  FACTURER: 'FACTURER',
  FACTURÉ: 'FACTURE',
  FACTURE: 'FACTURE',
};

export type VeloLookups = {
  clients: V2ClientDraft[];
  marques: V2MarqueDraft[];
  equipe: V2EquipeMemberDraft[];
};

function resolveClient(rawNomComplet: string, clients: V2ClientDraft[]): string | null {
  const cleaned = normalizeNonValue(rawNomComplet);
  if (cleaned === null) return null;
  const lower = cleaned.toLowerCase();
  const found = clients.find((c) => `${c.prenom} ${c.nom}`.trim().toLowerCase() === lower);
  return found?.id ?? null;
}

function resolveMarque(rawNom: string, marques: V2MarqueDraft[]): string | null {
  const cleaned = normalizeNonValue(rawNom);
  if (cleaned === null) return null;
  if (cleaned === 'Sélection →') return null;
  const lower = cleaned.toLowerCase();
  const found = marques.find((m) => m.nom.toLowerCase() === lower);
  return found?.id ?? null;
}

export function transformVelos(
  v1: V1Velo[],
  ctx: ImportContext,
  lookups: VeloLookups,
): ImportResult<V2VeloDraft> {
  const records: V2VeloDraft[] = [];
  const skipped: ImportResult<V2VeloDraft>['skipped'] = [];

  for (const raw of v1) {
    // veloNumero
    const veloNumero = Number.parseInt(raw.id, 10);
    if (!Number.isFinite(veloNumero) || String(veloNumero) !== String(Number.parseInt(raw.id, 10))) {
      // Vérification supplémentaire : "XYZ".parseInt = NaN, qui échoue isFinite
    }
    if (Number.isNaN(veloNumero) || !Number.isFinite(veloNumero)) {
      skipped.push({ reason: `id vélo non numérique "${raw.id}"`, entityType: 'velo', raw });
      continue;
    }

    // status
    const statusKey = raw.status?.trim().toUpperCase() ?? '';
    const status = STATUS_MAP[statusKey] ?? null;
    if (status === null) {
      skipped.push({
        reason: `status v1 inconnu "${raw.status}"`,
        entityType: 'velo',
        raw,
      });
      continue;
    }

    // client (FK requise)
    const clientId = resolveClient(raw.client, lookups.clients);
    if (clientId === null) {
      skipped.push({
        reason: `client introuvable "${raw.client}"`,
        entityType: 'velo',
        raw,
      });
      continue;
    }

    records.push({
      id: generateId('velo'),
      workshopId: ctx.workshopId,
      clientId,
      marqueId: resolveMarque(raw.marque, lookups.marques),
      veloNumero,
      status,
      date1: parseV1Date(raw.date1),
      date2: parseV1Date(raw.date2),
      date3: parseV1Date(raw.date3),
      modele: normalizeNonValue(raw.modele),
      couleur: normalizeNonValue(raw.couleur),
      taille: normalizeNonValue(raw.taille),
      numeroSerie: normalizeNonValue(raw.serie),
      evalMecanoId: resolveMecano(raw.eval, lookups.equipe),
      mecaMecanoId: resolveMecano(raw.meca, lookups.equipe),
      ctrlMecanoId: resolveMecano(raw.ctrl, lookups.equipe),
      noteVelo: normalizeNonValue(raw.noteVelo),
      noteClientEval: normalizeNonValue(raw.noteClientEval),
      noteClientFacture: normalizeNonValue(raw.noteClientFacture),
      notes: normalizeNonValue(raw.notes),
      legacyRawV1: raw as unknown as Record<string, unknown>,
    });
  }

  return { records, translations: [], skipped };
}
