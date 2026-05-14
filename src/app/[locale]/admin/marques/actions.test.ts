import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  prisma: { marque: { findFirst: vi.fn(), update: vi.fn() } },
}));
vi.mock('@/lib/workshop', () => ({ getActiveWorkshop: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import {
  createMarqueAction,
  deleteMarqueAction,
  updateMarqueAction,
} from './actions';

const mockAuth = vi.mocked(auth);
const mockGetWorkshop = vi.mocked(getActiveWorkshop);
const WORKSHOP = { id: 'workshop_TEST' } as unknown as Awaited<
  ReturnType<typeof getActiveWorkshop>
>;

function fd(values: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
}

beforeEach(() => {
  mockAuth.mockResolvedValue({ userId: 'user_TEST' } as never);
  mockGetWorkshop.mockResolvedValue(WORKSHOP);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('createMarqueAction', () => {
  it('refuse si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await createMarqueAction(null, fd({ nom: 'Trek' }))).toEqual({
      error: 'Non authentifié',
    });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await createMarqueAction(null, fd({ nom: 'Trek' }))).toEqual({
      error: 'Aucun workshop actif',
    });
  });

  it('refuse si nom vide', async () => {
    const r = await createMarqueAction(null, fd({ nom: '' }));
    expect(r.error).toBe('Validation');
    expect(r.fieldErrors?.nom).toBeDefined();
  });

  it('refuse si marque déjà existante', async () => {
    vi.mocked(prisma.marque.findFirst).mockResolvedValueOnce({
      id: 'marque_x',
    } as never);
    const r = await createMarqueAction(null, fd({ nom: 'Trek' }));
    expect(r.error).toContain('déjà existante');
  });
});

describe('updateMarqueAction', () => {
  it('refuse si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await updateMarqueAction('marque_x', null, fd({ nom: 'Trek' }))).toEqual({
      error: 'Non authentifié',
    });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await updateMarqueAction('marque_x', null, fd({ nom: 'Trek' }))).toEqual({
      error: 'Aucun workshop actif',
    });
  });

  it('refuse si nom vide', async () => {
    const r = await updateMarqueAction('marque_x', null, fd({ nom: '' }));
    expect(r.error).toBe('Validation');
  });
});

describe('deleteMarqueAction', () => {
  it('refuse si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await deleteMarqueAction('marque_x')).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await deleteMarqueAction('marque_x')).toEqual({ error: 'Aucun workshop actif' });
  });

  it('refuse si marque introuvable', async () => {
    vi.mocked(prisma.marque.findFirst).mockResolvedValueOnce(null);
    expect(await deleteMarqueAction('marque_x')).toEqual({ error: 'Marque introuvable' });
  });

  it('refuse si vélos utilisent la marque', async () => {
    vi.mocked(prisma.marque.findFirst).mockResolvedValueOnce({
      id: 'marque_x',
      _count: { velos: 5 },
    } as never);
    const r = await deleteMarqueAction('marque_x');
    expect(r.error).toContain('5 vélo');
  });

  it('soft-delete si 0 vélos (throw NEXT_REDIRECT après update)', async () => {
    vi.mocked(prisma.marque.findFirst).mockResolvedValueOnce({
      id: 'marque_x',
      _count: { velos: 0 },
    } as never);
    vi.mocked(prisma.marque.update).mockResolvedValueOnce({} as never);
    await expect(deleteMarqueAction('marque_x')).rejects.toThrow('NEXT_REDIRECT');
    expect(
      vi.mocked(prisma.marque.update).mock.calls[0]![0].data.deletedAt,
    ).toBeInstanceOf(Date);
  });
});
