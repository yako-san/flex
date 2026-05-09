import { generateId } from '../../ids/generate-id';
import { normalizeNonValue } from '../../normalize/normalize-non-value';
import { parseV1Date } from '../../normalize/parse-v1-date';
import { resolveMecano } from './resolve-mecano';
import type { V1Bdc, V1BdcArchive } from './transform-bdcs';
import type {
  ImportContext,
  SkippedItem,
  V2ClientDraft,
  V2EquipeMemberDraft,
  V2MarqueDraft,
  V2VeloDraft,
  V2VeloStatus,
} from './types';

// =============================================================================
// Phantom velos pour BDC orphelins
//
// Quand le dump v1 contient un BDC (actif ou archivé) dont l'`id` ne correspond
// à aucun vélo dans la liste `velos` v1, on crée un "phantom velo" à partir
// des infos contenues dans le BDC :
//   - `veloDesc` (format "Marque, Modèle, Couleur, Taille") parsé en composants
//   - `clientNom` résolu vers un client v2
//   - `evalMecano` / `mecaMecano` / `ctrlMecano` (archives seulement) résolus
//
// Sans ce mécanisme, tous les BDC archivés v1 sont skip (les vélos archivés
// disparaissent de la liste velos v1) → perte d'historique facturation.
// =============================================================================

export type PhantomVelosLookups = {
  clients: V2ClientDraft[];
  marques: V2MarqueDraft[];
  equipe: V2EquipeMemberDraft[];
};

export type PhantomVelosResult = {
  phantoms: V2VeloDraft[];
  skipped: SkippedItem[];
};

// Mapping evalStatus actif v1 → V2VeloStatus pour les phantoms d'actifs sans vélo.
const ACTIVE_EVAL_STATUS_TO_VELO_STATUS: Record<string, V2VeloStatus> = {
  APPROUVE: 'APPROUVE',
  APPROUVÉ: 'APPROUVE',
  ATTENTE: 'EN_ATTENTE',
  REDUX: 'EVAL',
  REFUSE: 'EVAL',
  REFUSÉ: 'EVAL',
  '': 'RV',
};

// Mapping archiveStatus v1 → V2VeloStatus pour phantoms d'archives.
const ARCHIVE_STATUS_TO_VELO_STATUS: Record<string, V2VeloStatus> = {
  FACTURÉ: 'FACTURE',
  FACTURE: 'FACTURE',
  FACTURER: 'FACTURER',
  REFUSÉ: 'FINI',
  'CTRL QLTÉ': 'CTRL_QLTE',
  'CTRL QLTE': 'CTRL_QLTE',
  'ÉVAL.': 'EVAL',
  'EVAL.': 'EVAL',
  ARCHIVÉ: 'FACTURE',
  ARCHIVE: 'FACTURE',
};

function parseVeloDesc(desc: string): {
  marque: string | null;
  modele: string | null;
  couleur: string | null;
  taille: string | null;
} {
  const cleaned = normalizeNonValue(desc);
  if (cleaned === null) {
    return { marque: null, modele: null, couleur: null, taille: null };
  }
  const parts = cleaned.split(',').map((p) => p.trim());
  return {
    marque: parts[0] ? normalizeNonValue(parts[0]) : null,
    modele: parts[1] ? normalizeNonValue(parts[1]) : null,
    couleur: parts[2] ? normalizeNonValue(parts[2]) : null,
    taille: parts[3] ? normalizeNonValue(parts[3]) : null,
  };
}

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

function buildPhantomFromArchive(
  arch: V1BdcArchive,
  num: number,
  clientId: string,
  ctx: ImportContext,
  lookups: PhantomVelosLookups,
): V2VeloDraft {
  const parsed = parseVeloDesc(arch.veloDesc);
  const archiveStatusKey = arch.archiveStatus?.trim().toUpperCase() ?? '';
  const status = ARCHIVE_STATUS_TO_VELO_STATUS[archiveStatusKey] ?? 'FACTURE';
  return {
    id: generateId('velo'),
    workshopId: ctx.workshopId,
    clientId,
    marqueId: parsed.marque ? resolveMarque(parsed.marque, lookups.marques) : null,
    veloNumero: num,
    status,
    date1: parseV1Date(arch.dateIn),
    date2: parseV1Date(arch.dateOut),
    date3: null,
    modele: parsed.modele,
    couleur: parsed.couleur,
    taille: parsed.taille,
    numeroSerie: null,
    evalMecanoId: resolveMecano(arch.evalMecano, lookups.equipe),
    mecaMecanoId: resolveMecano(arch.mecaMecano, lookups.equipe),
    ctrlMecanoId: resolveMecano(arch.ctrlMecano, lookups.equipe),
    noteVelo: normalizeNonValue(arch.noteVelo),
    // noteClientEval/Facture déplacés sur Bdc (Sprint 2.10)
    notes: normalizeNonValue(arch.noteInterne),
    legacyRawV1: arch as unknown as Record<string, unknown>,
  };
}

function buildPhantomFromActif(
  bdc: V1Bdc,
  num: number,
  clientId: string,
  ctx: ImportContext,
  lookups: PhantomVelosLookups,
): V2VeloDraft {
  const parsed = parseVeloDesc(bdc.veloDesc);
  const evalStatusKey = bdc.evalStatus?.trim().toUpperCase() ?? '';
  const status = ACTIVE_EVAL_STATUS_TO_VELO_STATUS[evalStatusKey] ?? 'RV';
  return {
    id: generateId('velo'),
    workshopId: ctx.workshopId,
    clientId,
    marqueId: parsed.marque ? resolveMarque(parsed.marque, lookups.marques) : null,
    veloNumero: num,
    status,
    date1: parseV1Date(bdc.dateIn),
    date2: null,
    date3: null,
    modele: parsed.modele,
    couleur: parsed.couleur,
    taille: parsed.taille,
    numeroSerie: null,
    evalMecanoId: null,
    mecaMecanoId: null,
    ctrlMecanoId: null,
    noteVelo: null,
    notes: null,
    legacyRawV1: bdc as unknown as Record<string, unknown>,
  };
}

export function createPhantomVelosForOrphanedBdcs(
  input: { actifs: V1Bdc[]; archives: V1BdcArchive[] },
  existingVelos: V2VeloDraft[],
  ctx: ImportContext,
  lookups: PhantomVelosLookups,
): PhantomVelosResult {
  const phantoms: V2VeloDraft[] = [];
  const skipped: SkippedItem[] = [];
  const takenNumeros = new Set(existingVelos.map((v) => v.veloNumero));

  // Pass 1 : archives en premier (info plus riche : evalMecano, archiveStatus, dateOut).
  for (const arch of input.archives) {
    const num = Number.parseInt(arch.id, 10);
    if (!Number.isFinite(num)) continue;
    if (takenNumeros.has(num)) continue;

    const clientId = resolveClient(arch.clientNom, lookups.clients);
    if (clientId === null) {
      skipped.push({
        reason: `phantom velo : client introuvable "${arch.clientNom}" pour BDC archivé "${arch.id}"`,
        entityType: 'phantom_velo',
        raw: arch,
      });
      continue;
    }

    phantoms.push(buildPhantomFromArchive(arch, num, clientId, ctx, lookups));
    takenNumeros.add(num);
  }

  // Pass 2 : actifs orphelins (généralement uniques après dédup avec archives).
  for (const bdc of input.actifs) {
    const num = Number.parseInt(bdc.id, 10);
    if (!Number.isFinite(num)) continue;
    if (takenNumeros.has(num)) continue;

    const clientId = resolveClient(bdc.clientNom, lookups.clients);
    if (clientId === null) {
      skipped.push({
        reason: `phantom velo : client introuvable "${bdc.clientNom}" pour BDC actif "${bdc.id}"`,
        entityType: 'phantom_velo',
        raw: bdc,
      });
      continue;
    }

    phantoms.push(buildPhantomFromActif(bdc, num, clientId, ctx, lookups));
    takenNumeros.add(num);
  }

  return { phantoms, skipped };
}
