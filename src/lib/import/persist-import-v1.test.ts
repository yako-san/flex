import { describe, it, expect, vi } from 'vitest';
import { persistImportV1 } from './persist-import-v1';
import type { ImportV1Result } from './import-v1';

// Mock Prisma : on capture les appels createMany / create par modèle pour
// vérifier l'orchestration (ordre, chunks, comptes), sans vraie DB.
function createMockPrisma() {
  const calls: { model: string; method: string; data: unknown }[] = [];
  const trackedModel = (name: string) => ({
    create: vi.fn(async (args: { data: unknown }) => {
      calls.push({ model: name, method: 'create', data: args.data });
      return args.data;
    }),
    createMany: vi.fn(async (args: { data: unknown[] }) => {
      calls.push({ model: name, method: 'createMany', data: args.data });
      return { count: args.data.length };
    }),
  });

  const tx = {
    workshop: trackedModel('workshop'),
    marque: trackedModel('marque'),
    equipeMember: trackedModel('equipeMember'),
    service: trackedModel('service'),
    forfait: trackedModel('forfait'),
    forfaitTaskTemplate: trackedModel('forfaitTaskTemplate'),
    piece: trackedModel('piece'),
    client: trackedModel('client'),
    velo: trackedModel('velo'),
    bdc: trackedModel('bdc'),
    bdcItem: trackedModel('bdcItem'),
    bdcItemTask: trackedModel('bdcItemTask'),
    venteDirecte: trackedModel('venteDirecte'),
    venteDirecteItem: trackedModel('venteDirecteItem'),
    po: trackedModel('po'),
    poItem: trackedModel('poItem'),
    translation: trackedModel('translation'),
    legacyIdMapping: trackedModel('legacyIdMapping'),
  };

  const prisma = {
    $transaction: vi.fn(async (fn: (t: unknown) => Promise<unknown>) => fn(tx)),
    ...tx,
  };

  return { prisma: prisma as never, calls, tx };
}

const baseResult = (): ImportV1Result => ({
  workshop: {
    id: 'workshop_test',
    slug: 'test',
    name: 'Test Workshop',
    country: 'CA',
    currency: 'CAD',
    timezone: 'America/Montreal',
    defaultLocale: 'fr-CA',
    activeLocales: ['fr-CA', 'en-CA'],
    legacyV1Extras: null,
  },
  marques: [],
  equipe: [],
  services: [],
  forfaits: [],
  taskTemplates: [],
  pieces: [],
  clients: [],
  velos: [],
  bdcs: [],
  bdcItems: [],
  bdcItemTasks: [],
  ventes: [],
  venteItems: [],
  pos: [],
  poItems: [],
  counters: [],
  translations: [],
  legacyMappings: [],
  skipped: [],
  stats: {
    marques: 0,
    equipe: 0,
    services: 0,
    forfaits: 0,
    pieces: 0,
    clients: 0,
    velos: 0,
    bdcs: 0,
    ventes: 0,
    pos: 0,
    translations: 0,
    skipped: 0,
  },
});

describe('persistImportV1', () => {
  it('insère le workshop racine en premier', async () => {
    const { prisma, calls } = createMockPrisma();
    await persistImportV1(prisma, baseResult());
    expect(calls[0]).toMatchObject({ model: 'workshop', method: 'create' });
  });

  it('respecte l\'ordre des FKs : workshop → entités plates → velos → bdcs → items → tasks', async () => {
    const { prisma, calls } = createMockPrisma();
    const r = baseResult();
    r.marques = [
      { id: 'm1', workshopId: 'workshop_test', nom: 'specialized', legacyRawV1: null },
    ];
    r.clients = [
      {
        id: 'c1',
        workshopId: 'workshop_test',
        prenom: 'A',
        nom: 'B',
        telephone: null,
        indicatif: null,
        courriel: null,
        commPref: 'AUCUN',
        lang: 'fr-CA',
        lead: null,
        remiseDefault: null,
        adressePostale: null,
        notes: null,
        legacyRawV1: null,
      },
    ];
    r.velos = [
      {
        id: 'v1',
        workshopId: 'workshop_test',
        clientId: 'c1',
        marqueId: 'm1',
        veloNumero: 1,
        status: 'RECU',
        date1: null,
        date2: null,
        date3: null,
        modele: null,
        couleur: null,
        taille: null,
        numeroSerie: null,
        evalMecanoId: null,
        mecaMecanoId: null,
        ctrlMecanoId: null,
        noteVelo: null,
        notes: null,
        legacyRawV1: null,
      },
    ];
    r.bdcs = [
      {
        id: 'b1',
        workshopId: 'workshop_test',
        veloId: 'v1',
        evalStatus: 'INDECIS',
        archiveStatus: 'ACTIF',
        cbEvalEnvoye: false,
        cbEval: false,
        cbBonSortie: false,
        cbArchiver: false,
        remiseSvcType: null,
        remiseSvcValue: null,
        remisePceType: null,
        remisePceValue: null,
        totalServices: '0',
        totalPieces: '0',
        notes: null,
        noteClientEval: null,
        noteClientFacture: null,
        legacyRawV1: null,
      },
    ];
    r.bdcItems = [
      {
        id: 'bi1',
        workshopId: 'workshop_test',
        bdcId: 'b1',
        kind: 'PIECE',
        position: 1,
        serviceId: null,
        pieceId: null,
        forfaitId: null,
        labelSnapshot: 'X',
        unitPriceSnapshot: '10',
        taxableSnapshot: true,
        qty: '1',
        total: '10',
      },
    ];
    r.bdcItemTasks = [
      {
        id: 't1',
        bdcItemId: 'bi1',
        position: 1,
        labelSnapshot: 'sub',
        status: 'TODO',
        notes: null,
      },
    ];

    await persistImportV1(prisma, r);

    const order = calls.map((c) => c.model);
    const idx = (m: string) => order.indexOf(m);

    expect(idx('workshop')).toBeLessThan(idx('marque'));
    expect(idx('workshop')).toBeLessThan(idx('client'));
    expect(idx('marque')).toBeLessThan(idx('velo'));
    expect(idx('client')).toBeLessThan(idx('velo'));
    expect(idx('velo')).toBeLessThan(idx('bdc'));
    expect(idx('bdc')).toBeLessThan(idx('bdcItem'));
    expect(idx('bdcItem')).toBeLessThan(idx('bdcItemTask'));
  });

  it('chunke les inserts à 1000 records max par appel createMany', async () => {
    const { prisma, calls } = createMockPrisma();
    const r = baseResult();
    r.marques = Array.from({ length: 2500 }, (_, i) => ({
      id: `m${i}`,
      workshopId: 'workshop_test',
      nom: `marque-${i}`,
      legacyRawV1: null,
    }));

    await persistImportV1(prisma, r);

    const marqueCalls = calls.filter((c) => c.model === 'marque' && c.method === 'createMany');
    expect(marqueCalls).toHaveLength(3); // 1000 + 1000 + 500
    expect((marqueCalls[0]!.data as unknown[]).length).toBe(1000);
    expect((marqueCalls[1]!.data as unknown[]).length).toBe(1000);
    expect((marqueCalls[2]!.data as unknown[]).length).toBe(500);
  });

  it('skip les createMany pour les collections vides (pas d\'appel inutile)', async () => {
    const { prisma, calls } = createMockPrisma();
    await persistImportV1(prisma, baseResult());
    // Seul le workshop.create doit être appelé.
    expect(calls).toHaveLength(1);
    expect(calls[0]!.model).toBe('workshop');
  });

  it('utilise une transaction Prisma unique', async () => {
    const { prisma } = createMockPrisma();
    await persistImportV1(prisma, baseResult());
    expect((prisma as unknown as { $transaction: ReturnType<typeof vi.fn> }).$transaction)
      .toHaveBeenCalledTimes(1);
  });

  it('retourne les stats agrégées', async () => {
    const { prisma } = createMockPrisma();
    const r = baseResult();
    r.marques = [{ id: 'm1', workshopId: 'workshop_test', nom: 'x', legacyRawV1: null }];
    r.legacyMappings = [
      {
        id: 'map1',
        workshopId: 'workshop_test',
        entityType: 'piece',
        legacyId: 'P1',
        newId: 'pc_1',
        legacySku: null,
        legacyNom: null,
        notes: null,
      },
    ];

    const stats = await persistImportV1(prisma, r);

    expect(stats).toMatchObject({
      workshop: 1,
      marques: 1,
      legacyMappings: 1,
      clients: 0,
    });
  });
});
