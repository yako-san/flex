import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('./db', () => ({
  prisma: {
    workshop: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import { auth } from '@clerk/nextjs/server';
import { prisma } from './db';
import { getActiveWorkshop, requireActiveWorkshop } from './workshop';

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.workshop.findUnique);
const mockFindFirst = vi.mocked(prisma.workshop.findFirst);

beforeEach(() => {
  mockAuth.mockResolvedValue({ userId: 'user_x', orgId: 'org_x' } as never);
});

afterEach(() => vi.clearAllMocks());

describe('getActiveWorkshop', () => {
  it('null si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null, orgId: null } as never);
    expect(await getActiveWorkshop()).toBeNull();
  });

  it('1. lookup par Clerk Org active si match', async () => {
    const ws = { id: 'w_linked', clerkOrgId: 'org_x' } as never;
    mockFindUnique.mockResolvedValueOnce(ws);

    const r = await getActiveWorkshop();

    expect(r).toBe(ws);
    expect(mockFindUnique.mock.calls[0]![0].where).toEqual({
      clerkOrgId: 'org_x',
      deletedAt: null,
    });
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it('2. fallback unlinked si org active sans match', async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    const seed = { id: 'w_seed', clerkOrgId: null } as never;
    mockFindFirst.mockResolvedValueOnce(seed);

    const r = await getActiveWorkshop();

    expect(r).toBe(seed);
    expect(mockFindFirst.mock.calls[0]![0]).toEqual({
      where: { clerkOrgId: null, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('2. fallback unlinked si pas d\'orgId du tout', async () => {
    mockAuth.mockResolvedValueOnce({ userId: 'user_x', orgId: null } as never);
    const seed = { id: 'w_seed', clerkOrgId: null } as never;
    mockFindFirst.mockResolvedValueOnce(seed);

    const r = await getActiveWorkshop();

    expect(r).toBe(seed);
    // Pas de lookup findUnique car pas d'orgId
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('3. null si auth ok mais aucun workshop (linked ni unlinked)', async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    mockFindFirst.mockResolvedValueOnce(null);
    expect(await getActiveWorkshop()).toBeNull();
  });
});

describe('requireActiveWorkshop', () => {
  it('renvoie le workshop si trouvé', async () => {
    const ws = { id: 'w_x' } as never;
    mockFindUnique.mockResolvedValueOnce(ws);

    expect(await requireActiveWorkshop()).toBe(ws);
  });

  it('throw si aucun workshop actif', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null, orgId: null } as never);
    await expect(requireActiveWorkshop()).rejects.toThrow(/Aucun workshop actif/);
  });
});
