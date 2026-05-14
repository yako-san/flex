import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Workshop } from '@prisma/client';

vi.mock('@/lib/db', () => ({
  prisma: { bdc: { findFirst: vi.fn() } },
}));

import { prisma } from '@/lib/db';
import { loadBdcPdfContext } from './load-bdc-context';

const mockFindFirst = vi.mocked(prisma.bdc.findFirst);

const WORKSHOP = {
  id: 'w_x',
  name: 'Yako Cyclo',
  logoBase64: null,
  fiscalEntity: { raisonSociale: 'Yako inc.' },
} as unknown as Workshop;

function buildBdc(overrides: Record<string, unknown> = {}): unknown {
  return {
    id: 'bdc_x',
    workshopId: 'w_x',
    numero: 42,
    noteClientEval: null,
    noteClientFacture: null,
    notes: null,
    avanceMontant: null,
    avanceMode: null,
    remiseSvcType: null,
    remiseSvcValue: null,
    remisePceType: null,
    remisePceValue: null,
    items: [],
    velo: {
      veloNumero: 7,
      marque: { nom: 'Trek' },
      modele: '7300',
      couleur: 'rouge',
      taille: 'M',
      numeroSerie: 'SN123',
      client: {
        prenom: 'Marie',
        nom: 'Tremblay',
        telephone: '5145551234',
        indicatif: '+1',
        courriel: 'marie@x.com',
        lang: 'fr-CA',
      },
    },
    ...overrides,
  };
}

afterEach(() => vi.clearAllMocks());

describe('loadBdcPdfContext', () => {
  it('renvoie null si BDT introuvable', async () => {
    mockFindFirst.mockResolvedValueOnce(null);
    expect(await loadBdcPdfContext(WORKSHOP, 'bdc_orphan')).toBeNull();
  });

  it('happy path renvoie workshop/client/velo/items mappés', async () => {
    mockFindFirst.mockResolvedValueOnce(buildBdc() as never);
    const ctx = await loadBdcPdfContext(WORKSHOP, 'bdc_x');
    expect(ctx).not.toBeNull();
    expect(ctx!.workshop.name).toBe('Yako Cyclo');
    expect(ctx!.workshop.fiscalEntity).toEqual({ raisonSociale: 'Yako inc.' });
    expect(ctx!.client.prenom).toBe('Marie');
    expect(ctx!.velo.marque).toBe('Trek');
    expect(ctx!.velo.modele).toBe('7300');
    expect(ctx!.bdcNumero).toBe(42);
  });

  it('client null → placeholder "?" sans crash', async () => {
    mockFindFirst.mockResolvedValueOnce(
      buildBdc({
        velo: {
          veloNumero: 1,
          marque: null,
          modele: null,
          couleur: null,
          taille: null,
          numeroSerie: null,
          client: null,
        },
      }) as never,
    );
    const ctx = await loadBdcPdfContext(WORKSHOP, 'bdc_x');
    expect(ctx!.client.prenom).toBe('?');
    expect(ctx!.client.nom).toBe('');
  });

  it('items mappés en ItemRow avec qty/unitPrice/total castés en number', async () => {
    mockFindFirst.mockResolvedValueOnce(
      buildBdc({
        items: [
          {
            position: 1,
            kind: 'SERVICE',
            labelSnapshot: 'Mise au point',
            qty: '1.5',
            unitPriceSnapshot: '50.00',
            total: '75.00',
            tasks: [],
          },
        ],
      }) as never,
    );
    const ctx = await loadBdcPdfContext(WORKSHOP, 'bdc_x');
    expect(ctx!.items).toHaveLength(1);
    expect(ctx!.items[0]!.qty).toBe(1.5);
    expect(ctx!.items[0]!.unitPrice).toBe(50);
    expect(ctx!.items[0]!.total).toBe(75);
    expect(ctx!.items[0]!.label).toBe('Mise au point');
  });

  it('tasksByItem indexé par position si tasks non vides', async () => {
    mockFindFirst.mockResolvedValueOnce(
      buildBdc({
        items: [
          {
            position: 5,
            kind: 'FORFAIT',
            labelSnapshot: 'Forfait',
            qty: 1,
            unitPriceSnapshot: 0,
            total: 0,
            tasks: [
              { labelSnapshot: 'Step 1', status: 'TODO' },
              { labelSnapshot: 'Step 2', status: 'DONE' },
            ],
          },
        ],
      }) as never,
    );
    const ctx = await loadBdcPdfContext(WORKSHOP, 'bdc_x');
    expect(ctx!.tasksByItem[5]).toEqual([
      { label: 'Step 1', status: 'TODO' },
      { label: 'Step 2', status: 'DONE' },
    ]);
  });

  it("tasksByItem n'a pas d'entrée pour items sans tasks (économise space)", async () => {
    mockFindFirst.mockResolvedValueOnce(
      buildBdc({
        items: [
          {
            position: 1,
            kind: 'SERVICE',
            labelSnapshot: 'x',
            qty: 1,
            unitPriceSnapshot: 0,
            total: 0,
            tasks: [],
          },
        ],
      }) as never,
    );
    const ctx = await loadBdcPdfContext(WORKSHOP, 'bdc_x');
    expect(ctx!.tasksByItem[1]).toBeUndefined();
  });

  it('totalServices = SUM(SERVICE + FORFAIT)', async () => {
    mockFindFirst.mockResolvedValueOnce(
      buildBdc({
        items: [
          { position: 1, kind: 'SERVICE', labelSnapshot: 'a', qty: 1, unitPriceSnapshot: 0, total: 30, tasks: [] },
          { position: 2, kind: 'FORFAIT', labelSnapshot: 'b', qty: 1, unitPriceSnapshot: 0, total: 70, tasks: [] },
          { position: 3, kind: 'PIECE', labelSnapshot: 'c', qty: 1, unitPriceSnapshot: 0, total: 999, tasks: [] },
        ],
      }) as never,
    );
    const ctx = await loadBdcPdfContext(WORKSHOP, 'bdc_x');
    expect(ctx!.totalServices).toBe(100); // 30 + 70
    expect(ctx!.totalPieces).toBe(999);
  });

  it('remise PCT services calculée sur totalServicesGross', async () => {
    mockFindFirst.mockResolvedValueOnce(
      buildBdc({
        items: [
          { position: 1, kind: 'SERVICE', labelSnapshot: 'a', qty: 1, unitPriceSnapshot: 0, total: 100, tasks: [] },
        ],
        remiseSvcType: 'PCT',
        remiseSvcValue: '10',
      }) as never,
    );
    const ctx = await loadBdcPdfContext(WORKSHOP, 'bdc_x');
    // 10% de 100 = 10
    expect(ctx!.remises).toBe(10);
  });

  it('remise FIXED services = montant direct', async () => {
    mockFindFirst.mockResolvedValueOnce(
      buildBdc({
        items: [
          { position: 1, kind: 'SERVICE', labelSnapshot: 'a', qty: 1, unitPriceSnapshot: 0, total: 100, tasks: [] },
        ],
        remiseSvcType: 'FIXED',
        remiseSvcValue: '15',
      }) as never,
    );
    const ctx = await loadBdcPdfContext(WORKSHOP, 'bdc_x');
    expect(ctx!.remises).toBe(15);
  });

  it('remise services + remise pièces additionnées', async () => {
    mockFindFirst.mockResolvedValueOnce(
      buildBdc({
        items: [
          { position: 1, kind: 'SERVICE', labelSnapshot: 'a', qty: 1, unitPriceSnapshot: 0, total: 200, tasks: [] },
          { position: 2, kind: 'PIECE', labelSnapshot: 'b', qty: 1, unitPriceSnapshot: 0, total: 100, tasks: [] },
        ],
        remiseSvcType: 'PCT',
        remiseSvcValue: '10', // 10% de 200 = 20
        remisePceType: 'FIXED',
        remisePceValue: '5', // 5
      }) as never,
    );
    const ctx = await loadBdcPdfContext(WORKSHOP, 'bdc_x');
    expect(ctx!.remises).toBe(25); // 20 + 5
  });

  it('arrondit à 2 décimales (1/3 d\'un 33.333 % = 33.33)', async () => {
    mockFindFirst.mockResolvedValueOnce(
      buildBdc({
        items: [
          { position: 1, kind: 'SERVICE', labelSnapshot: 'a', qty: 1, unitPriceSnapshot: 0, total: 100, tasks: [] },
        ],
        remiseSvcType: 'PCT',
        remiseSvcValue: '33.333',
      }) as never,
    );
    const ctx = await loadBdcPdfContext(WORKSHOP, 'bdc_x');
    expect(ctx!.remises).toBe(33.33);
  });

  it('aucune remise si types null → remises = 0', async () => {
    mockFindFirst.mockResolvedValueOnce(buildBdc() as never);
    const ctx = await loadBdcPdfContext(WORKSHOP, 'bdc_x');
    expect(ctx!.remises).toBe(0);
  });

  it("forward les notes (eval/facture/internes)", async () => {
    mockFindFirst.mockResolvedValueOnce(
      buildBdc({
        noteClientEval: 'Note pour éval',
        noteClientFacture: 'Note pour facture',
        notes: 'Notes internes secrètes',
      }) as never,
    );
    const ctx = await loadBdcPdfContext(WORKSHOP, 'bdc_x');
    expect(ctx!.noteClientEval).toBe('Note pour éval');
    expect(ctx!.noteClientFacture).toBe('Note pour facture');
    expect(ctx!.notesInternes).toBe('Notes internes secrètes');
  });

  it('avance mappée en number si présent', async () => {
    mockFindFirst.mockResolvedValueOnce(
      buildBdc({
        avanceMontant: '50.00',
        avanceMode: 'INTERAC',
      }) as never,
    );
    const ctx = await loadBdcPdfContext(WORKSHOP, 'bdc_x');
    expect(ctx!.avanceMontant).toBe(50);
    expect(ctx!.avanceMode).toBe('INTERAC');
  });

  it('avance null → null', async () => {
    mockFindFirst.mockResolvedValueOnce(buildBdc() as never);
    const ctx = await loadBdcPdfContext(WORKSHOP, 'bdc_x');
    expect(ctx!.avanceMontant).toBeNull();
    expect(ctx!.avanceMode).toBeNull();
  });
});
