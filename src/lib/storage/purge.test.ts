import { describe, expect, it, vi } from 'vitest';
import { purgeOrphanPhotos, type PurgePhotosDeps } from './purge';

type Captured = {
  capturedWhere: { deletedAt: { not: null; lt: Date } } | undefined;
  capturedTake: number | undefined;
  blobCalls: string[];
  deleteCalls: string[];
  logger: { warn: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };
};

function makeDeps({
  candidates = [] as { id: string; blobPath: string }[],
  blobError = null as Error | null,
  deleteError = null as Error | null,
  now = new Date('2026-06-15T00:00:00Z'),
}: {
  candidates?: { id: string; blobPath: string }[];
  blobError?: Error | null;
  deleteError?: Error | null;
  now?: Date;
} = {}): PurgePhotosDeps & Captured {
  const state: Captured = {
    capturedWhere: undefined,
    capturedTake: undefined,
    blobCalls: [],
    deleteCalls: [],
    logger: { warn: vi.fn(), info: vi.fn() },
  };

  const deps: PurgePhotosDeps = {
    now: () => now,
    logger: state.logger,
    deleteBlob: async (path) => {
      state.blobCalls.push(path);
      if (blobError) throw blobError;
    },
    prisma: {
      bdcPhoto: {
        findMany: async (args) => {
          state.capturedWhere = args.where;
          state.capturedTake = args.take;
          return candidates;
        },
        delete: async ({ where }) => {
          state.deleteCalls.push(where.id);
          if (deleteError) throw deleteError;
          return {};
        },
      },
    },
  };

  // Combinaison via getters : les mutations sur `state` restent visibles à
  // travers `deps` (Object.assign copierait les valeurs initiales).
  return Object.defineProperties(deps as PurgePhotosDeps & Captured, {
    capturedWhere: { get: () => state.capturedWhere, enumerable: true },
    capturedTake: { get: () => state.capturedTake, enumerable: true },
    blobCalls: { get: () => state.blobCalls, enumerable: true },
    deleteCalls: { get: () => state.deleteCalls, enumerable: true },
    logger: { get: () => state.logger, enumerable: true },
  });
}

describe('purgeOrphanPhotos', () => {
  it('aucun candidat : retour zéro partout', async () => {
    const deps = makeDeps({ candidates: [] });
    const r = await purgeOrphanPhotos(deps);
    expect(r).toEqual({
      candidates: 0,
      rowsDeleted: 0,
      blobsDeleted: 0,
      blobErrorsIgnored: 0,
      dbErrorsIgnored: 0,
    });
  });

  it('cutoff par défaut = now - 30 jours', async () => {
    const now = new Date('2026-06-15T00:00:00Z');
    const deps = makeDeps({ candidates: [], now });
    await purgeOrphanPhotos(deps);
    const expected = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    expect(deps.capturedWhere!.deletedAt.lt.toISOString()).toBe(expected.toISOString());
    expect(deps.capturedWhere!.deletedAt.not).toBe(null);
  });

  it('respecte olderThanDays custom', async () => {
    const now = new Date('2026-06-15T00:00:00Z');
    const deps = makeDeps({ candidates: [], now });
    await purgeOrphanPhotos(deps, { olderThanDays: 7 });
    const expected = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    expect(deps.capturedWhere!.deletedAt.lt.toISOString()).toBe(expected.toISOString());
  });

  it('respecte maxPerRun (passé en take à findMany)', async () => {
    const deps = makeDeps({ candidates: [] });
    await purgeOrphanPhotos(deps, { maxPerRun: 42 });
    expect(deps.capturedTake).toBe(42);
  });

  it('maxPerRun par défaut = 5000', async () => {
    const deps = makeDeps({ candidates: [] });
    await purgeOrphanPhotos(deps);
    expect(deps.capturedTake).toBe(5000);
  });

  it('happy path : 3 photos, supprime Blob + row pour chacune', async () => {
    const deps = makeDeps({
      candidates: [
        { id: 'p1', blobPath: 'workshops/w/bdcs/b/u1.jpg' },
        { id: 'p2', blobPath: 'workshops/w/bdcs/b/u2.jpg' },
        { id: 'p3', blobPath: 'workshops/w/bdcs/b/u3.jpg' },
      ],
    });
    const r = await purgeOrphanPhotos(deps);

    expect(r).toEqual({
      candidates: 3,
      rowsDeleted: 3,
      blobsDeleted: 3,
      blobErrorsIgnored: 0,
      dbErrorsIgnored: 0,
    });
    expect(deps.blobCalls).toEqual([
      'workshops/w/bdcs/b/u1.jpg',
      'workshops/w/bdcs/b/u2.jpg',
      'workshops/w/bdcs/b/u3.jpg',
    ]);
    expect(deps.deleteCalls).toEqual(['p1', 'p2', 'p3']);
  });

  it('Blob 404 ignorée : la row est quand même hard-delete', async () => {
    const deps = makeDeps({
      candidates: [{ id: 'p1', blobPath: 'gone.jpg' }],
      blobError: new Error('404 Not Found'),
    });
    const r = await purgeOrphanPhotos(deps);

    expect(r.blobsDeleted).toBe(0);
    expect(r.blobErrorsIgnored).toBe(1);
    expect(r.rowsDeleted).toBe(1);
    expect(deps.logger.warn).toHaveBeenCalled();
  });

  it("erreur DB lors du hard-delete : comptée mais ne bloque pas le run", async () => {
    const deps = makeDeps({
      candidates: [
        { id: 'p1', blobPath: 'u1.jpg' },
        { id: 'p2', blobPath: 'u2.jpg' },
      ],
      deleteError: new Error('FK violation'),
    });
    const r = await purgeOrphanPhotos(deps);

    expect(r.candidates).toBe(2);
    expect(r.blobsDeleted).toBe(2);
    expect(r.dbErrorsIgnored).toBe(2);
    expect(r.rowsDeleted).toBe(0);
  });

  it('logue info en fin de run avec le résultat', async () => {
    const deps = makeDeps({
      candidates: [{ id: 'p1', blobPath: 'u.jpg' }],
    });
    await purgeOrphanPhotos(deps);
    expect(deps.logger.info).toHaveBeenCalledWith(
      'purge: terminé',
      expect.objectContaining({ candidates: 1, rowsDeleted: 1 }),
    );
  });

  it("requête findMany filtre deletedAt: { not: null, lt: cutoff }", async () => {
    const deps = makeDeps({ candidates: [] });
    await purgeOrphanPhotos(deps);
    expect(deps.capturedWhere!.deletedAt.not).toBe(null);
    expect(deps.capturedWhere!.deletedAt.lt).toBeInstanceOf(Date);
  });

  it('ordre stable : Blob deleted AVANT la row DB (réduit fenêtre où on a une row vivante pointant vers un Blob orphelin)', async () => {
    const deps = makeDeps({
      candidates: [{ id: 'p1', blobPath: 'u.jpg' }],
    });
    await purgeOrphanPhotos(deps);
    // 1 appel de chaque, dans le bon ordre.
    expect(deps.blobCalls).toEqual(['u.jpg']);
    expect(deps.deleteCalls).toEqual(['p1']);
  });
});
