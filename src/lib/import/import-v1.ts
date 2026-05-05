import { generateId } from '../ids/generate-id';
import { transformMarques, type V1Marque } from './transform/transform-marques';
import { transformEquipe, type V1EquipeMember } from './transform/transform-equipe';
import {
  transformCatalogueServices,
  type V1CatalogueService,
} from './transform/transform-catalogue-services';
import { transformPieces, type V1CataloguePiece } from './transform/transform-pieces';
import { transformClients, type V1Client } from './transform/transform-clients';
import { transformVelos, type V1Velo } from './transform/transform-velos';
import {
  transformBdcs,
  type V1Bdc,
  type V1BdcArchive,
} from './transform/transform-bdcs';
import {
  transformVentes,
  type V1Vente,
  type V1VenteArchiveRaw,
} from './transform/transform-ventes';
import { transformPos, type V1Po } from './transform/transform-pos';
import { createPhantomVelosForOrphanedBdcs } from './transform/create-phantom-velos';
import type {
  ImportContext,
  SkippedItem,
  V2BdcDraft,
  V2BdcItemDraft,
  V2BdcItemTaskDraft,
  V2ClientDraft,
  V2EquipeMemberDraft,
  V2ForfaitDraft,
  V2ForfaitTaskTemplateDraft,
  V2LegacyIdMappingDraft,
  V2MarqueDraft,
  V2PieceDraft,
  V2PoDraft,
  V2PoItemDraft,
  V2ServiceDraft,
  V2TranslationDraft,
  V2VeloDraft,
  V2VenteDirecteDraft,
  V2VenteDirecteItemDraft,
  V2WorkshopDraft,
  V2CounterDraft,
} from './transform/types';

// =============================================================================
// V1 Dump format (correspond au shape exposé par /api/admin/export-v1 v1)
// =============================================================================
export type V1Dump = {
  schemaVersion: string;
  exportedAt: string;
  appVersion: string;
  workshop: {
    id: string;
    name: string;
    lang: string;
    currency: string;
    timezone: string;
  };
  counters: { veloId: number; factureNumero: number };
  marques: V1Marque[];
  clients: V1Client[];
  velos: V1Velo[];
  bdcs: V1Bdc[];
  bdcsArchives: V1BdcArchive[];
  ventes: V1Vente[];
  ventesArchives: V1VenteArchiveRaw[];
  catalogue: { pieces: V1CataloguePiece[]; services: V1CatalogueService[] };
  pos: V1Po[];
  equipe: V1EquipeMember[];
};

export type ImportV1Options = {
  workshopId?: string; // si fourni, override l'ID auto-généré
  country?: string; // ISO 3166 alpha-2 (default 'CA')
  defaultLocale?: string; // BCP 47 (default 'fr-CA')
  activeLocales?: string[]; // (default ['fr-CA', 'en-CA'])
};

export type ImportV1Result = {
  workshop: V2WorkshopDraft;
  marques: V2MarqueDraft[];
  equipe: V2EquipeMemberDraft[];
  services: V2ServiceDraft[];
  forfaits: V2ForfaitDraft[];
  taskTemplates: V2ForfaitTaskTemplateDraft[];
  pieces: V2PieceDraft[];
  clients: V2ClientDraft[];
  velos: V2VeloDraft[];
  bdcs: V2BdcDraft[];
  bdcItems: V2BdcItemDraft[];
  bdcItemTasks: V2BdcItemTaskDraft[];
  ventes: V2VenteDirecteDraft[];
  venteItems: V2VenteDirecteItemDraft[];
  pos: V2PoDraft[];
  poItems: V2PoItemDraft[];
  counters: V2CounterDraft[];
  translations: V2TranslationDraft[];
  legacyMappings: V2LegacyIdMappingDraft[];
  skipped: SkippedItem[];
  stats: {
    marques: number;
    equipe: number;
    services: number;
    forfaits: number;
    pieces: number;
    clients: number;
    velos: number;
    bdcs: number;
    ventes: number;
    pos: number;
    translations: number;
    skipped: number;
  };
};

function buildLegacyMapping(
  workshopId: string,
  entityType: string,
  legacyId: string,
  newId: string,
  legacySku: string | null = null,
  legacyNom: string | null = null,
): V2LegacyIdMappingDraft {
  return {
    id: generateId('map'),
    workshopId,
    entityType,
    legacyId,
    newId,
    legacySku,
    legacyNom,
    notes: null,
  };
}

export function importV1(dump: V1Dump, options: ImportV1Options = {}): ImportV1Result {
  const workshopId = options.workshopId ?? generateId('workshop');
  const country = options.country ?? 'CA';
  const defaultLocale = options.defaultLocale ?? 'fr-CA';
  const activeLocales = options.activeLocales ?? ['fr-CA', 'en-CA'];

  const workshop: V2WorkshopDraft = {
    id: workshopId,
    slug: dump.workshop.id, // ex 'yako-cyclo'
    name: dump.workshop.name,
    country,
    currency: dump.workshop.currency,
    timezone: dump.workshop.timezone,
    defaultLocale,
    activeLocales,
    // Snapshot intégral du dump v1 pour traçabilité totale (counters,
    // facturesJournal, schemaVersion, ventesArchives raw, etc.)
    legacyV1Extras: dump as unknown as Record<string, unknown>,
  };

  // Counters v1 → table Counter v2 (pour préserver les séquences ex
  // veloId=141 et factureNumero=5)
  const counters: V2CounterDraft[] = [
    {
      id: generateId('ctr'),
      workshopId,
      kind: 'VELO_SEQUENCE',
      prefix: null,
      current: dump.counters?.veloId ?? 0,
    },
    {
      id: generateId('ctr'),
      workshopId,
      kind: 'FACTURE_SEQUENCE',
      prefix: 'V',
      current: dump.counters?.factureNumero ?? 0,
    },
  ];

  const ctx: ImportContext = {
    workshopId,
    defaultLocale,
    activeLocales,
  };

  const skipped: SkippedItem[] = [];
  const legacyMappings: V2LegacyIdMappingDraft[] = [];

  // 1. Marques (pas de FK)
  const marquesResult = transformMarques(dump.marques, ctx);
  skipped.push(...marquesResult.skipped);

  // 2. Équipe (pas de FK)
  const equipeResult = transformEquipe(dump.equipe, ctx);
  skipped.push(...equipeResult.skipped);

  // 3. Catalogue services + forfaits (ordonné par _row pour le rattachement
  //    des sous-tâches). Le dump présente déjà les services dans cet ordre.
  const catalogueResult = transformCatalogueServices(dump.catalogue.services, ctx);
  skipped.push(...catalogueResult.skipped);
  for (const s of catalogueResult.services) {
    if (s.legacyCode)
      legacyMappings.push(buildLegacyMapping(workshopId, 'service', s.legacyCode, s.id));
  }
  for (const f of catalogueResult.forfaits) {
    if (f.legacyCode)
      legacyMappings.push(buildLegacyMapping(workshopId, 'forfait', f.legacyCode, f.id));
  }

  // 4. Pieces (utilise dedupePieces)
  const piecesResult = transformPieces(dump.catalogue.pieces, ctx);
  skipped.push(...piecesResult.skipped);
  for (const m of piecesResult.mapping) {
    legacyMappings.push(
      buildLegacyMapping(
        workshopId,
        'piece',
        m.legacyPieceId,
        m.newId,
        m.legacySku || null,
        m.legacyNom || null,
      ),
    );
  }

  // 5. Clients (pas de FK structurelle, juste ref nom)
  const clientsResult = transformClients(dump.clients, ctx);
  skipped.push(...clientsResult.skipped);

  // 6. Velos (FK client + marque + equipe)
  const velosResult = transformVelos(dump.velos, ctx, {
    clients: clientsResult.records,
    marques: marquesResult.records,
    equipe: equipeResult.records,
  });
  skipped.push(...velosResult.skipped);

  // 6b. Phantom velos pour les BDC orphelins (vélos archivés v1 absents de
  // la liste velos courante). Sans ça, ~50% de l'historique facturation
  // serait skip.
  const phantomVelosResult = createPhantomVelosForOrphanedBdcs(
    { actifs: dump.bdcs, archives: dump.bdcsArchives },
    velosResult.records,
    ctx,
    {
      clients: clientsResult.records,
      marques: marquesResult.records,
      equipe: equipeResult.records,
    },
  );
  skipped.push(...phantomVelosResult.skipped);
  const allVelos = [...velosResult.records, ...phantomVelosResult.phantoms];
  for (const v of allVelos) {
    legacyMappings.push(
      buildLegacyMapping(workshopId, 'velo', String(v.veloNumero), v.id),
    );
  }

  // 7. Bdcs actifs + archives (FK velo + service/forfait/piece)
  const bdcsResult = transformBdcs(
    { actifs: dump.bdcs, archives: dump.bdcsArchives },
    ctx,
    {
      velos: allVelos,
      services: catalogueResult.services,
      forfaits: catalogueResult.forfaits,
      taskTemplates: catalogueResult.taskTemplates,
      piecesMapping: piecesResult.mapping,
    },
  );
  skipped.push(...bdcsResult.skipped);

  // 8. Ventes (structurées + archives)
  const ventesResult = transformVentes(
    { structurees: dump.ventes, archives: dump.ventesArchives },
    ctx,
    {
      clients: clientsResult.records,
      piecesMapping: piecesResult.mapping,
    },
  );
  skipped.push(...ventesResult.skipped);

  // 9. POs
  const posResult = transformPos(dump.pos, ctx, { piecesMapping: piecesResult.mapping });
  skipped.push(...posResult.skipped);

  // Translations agrégées
  const translations: V2TranslationDraft[] = [
    ...marquesResult.translations,
    ...catalogueResult.translations,
    ...piecesResult.translations,
  ];

  return {
    workshop,
    marques: marquesResult.records,
    equipe: equipeResult.records,
    services: catalogueResult.services,
    forfaits: catalogueResult.forfaits,
    taskTemplates: catalogueResult.taskTemplates,
    pieces: piecesResult.records,
    clients: clientsResult.records,
    velos: allVelos,
    bdcs: bdcsResult.bdcs,
    bdcItems: bdcsResult.items,
    bdcItemTasks: bdcsResult.tasks,
    ventes: ventesResult.ventes,
    venteItems: ventesResult.items,
    pos: posResult.pos,
    poItems: posResult.items,
    counters,
    translations,
    legacyMappings,
    skipped,
    stats: {
      marques: marquesResult.records.length,
      equipe: equipeResult.records.length,
      services: catalogueResult.services.length,
      forfaits: catalogueResult.forfaits.length,
      pieces: piecesResult.records.length,
      clients: clientsResult.records.length,
      velos: allVelos.length,
      bdcs: bdcsResult.bdcs.length,
      ventes: ventesResult.ventes.length,
      pos: posResult.pos.length,
      translations: translations.length,
      skipped: skipped.length,
    },
  };
}
