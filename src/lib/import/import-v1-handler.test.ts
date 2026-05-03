import { describe, it, expect, vi } from 'vitest';
import { handleImportV1 } from './import-v1-handler';
import type { PrismaClient } from '@prisma/client';

// Mock Prisma minimal : transaction qui exécute le callback, modèles avec
// create/createMany no-op. Le but est de tester la logique du handler
// (auth, token, validation), pas la persistence réelle.
function mockPrisma(): PrismaClient {
  const noopModel = {
    create: vi.fn(async (a: { data: unknown }) => a.data),
    createMany: vi.fn(async (a: { data: unknown[] }) => ({ count: a.data.length })),
  };
  const tx = new Proxy(
    {},
    {
      get: () => noopModel,
    },
  );
  return {
    $transaction: vi.fn(async (fn: (t: unknown) => Promise<unknown>) => fn(tx)),
  } as unknown as PrismaClient;
}

const validDump = () => ({
  schemaVersion: '1.0',
  exportedAt: '2026-05-03T00:00:00Z',
  appVersion: '1.0.0',
  workshop: {
    id: 'yako-cyclo',
    name: 'Yako Cyclo',
    lang: 'fr',
    currency: 'CAD',
    timezone: 'America/Montreal',
  },
  counters: { veloId: 1, factureNumero: 1 },
  marques: [],
  clients: [],
  velos: [],
  bdcs: [],
  bdcsArchives: [],
  ventes: [],
  ventesArchives: [],
  catalogue: { pieces: [], services: [] },
  pos: [],
  equipe: [],
});

const baseInput = (overrides: Partial<Parameters<typeof handleImportV1>[1]> = {}) => ({
  userId: 'user_123',
  adminToken: 'secret',
  expectedAdminToken: 'secret',
  rawBody: validDump(),
  ...overrides,
});

describe('handleImportV1', () => {
  it('refuse 401 si pas de userId Clerk', async () => {
    const r = await handleImportV1(mockPrisma(), baseInput({ userId: null }));
    expect(r.status).toBe(401);
    expect(r.ok).toBe(false);
  });

  it('refuse 500 si IMPORT_V1_ADMIN_TOKEN non configuré', async () => {
    const r = await handleImportV1(mockPrisma(), baseInput({ expectedAdminToken: undefined }));
    expect(r.status).toBe(500);
  });

  it('refuse 403 si token admin invalide', async () => {
    const r = await handleImportV1(mockPrisma(), baseInput({ adminToken: 'wrong' }));
    expect(r.status).toBe(403);
  });

  it('refuse 403 si header x-admin-token absent', async () => {
    const r = await handleImportV1(mockPrisma(), baseInput({ adminToken: null }));
    expect(r.status).toBe(403);
  });

  it('refuse 400 si dump v1 mal formé', async () => {
    const r = await handleImportV1(
      mockPrisma(),
      baseInput({ rawBody: { not: 'a dump' } }),
    );
    expect(r.status).toBe(400);
    if (!r.ok) expect(r.body.error).toMatch(/invalide/i);
  });

  it('accepte un dump valide et retourne workshopId + stats', async () => {
    const r = await handleImportV1(mockPrisma(), baseInput());
    expect(r.status).toBe(200);
    if (r.ok) {
      expect(r.body.workshopId).toMatch(/^workshop_/);
      expect(r.body.stats.workshop).toBe(1);
      expect(r.body.skippedCount).toBe(0);
    }
  });

  it('honore l\'override workshopId via options', async () => {
    const r = await handleImportV1(
      mockPrisma(),
      baseInput({ options: { workshopId: 'workshop_custom_id' } }),
    );
    expect(r.status).toBe(200);
    if (r.ok) expect(r.body.workshopId).toBe('workshop_custom_id');
  });
});
