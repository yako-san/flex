import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  prisma: { equipeMember: { update: vi.fn() } },
}));
vi.mock('@/lib/workshop', () => ({ getActiveWorkshop: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); }),
}));

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import {
  createEquipeAction,
  deleteEquipeAction,
  updateEquipeAction,
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

const VALID = {
  prenom: 'Yako',
  nom: 'Mécano',
  surnom: 'yako',
  lang: 'fr-CA',
  active: 'on',
};

beforeEach(() => {
  mockAuth.mockResolvedValue({ userId: 'user_TEST' } as never);
  mockGetWorkshop.mockResolvedValue(WORKSHOP);
});

afterEach(() => vi.clearAllMocks());

describe('createEquipeAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await createEquipeAction(null, fd(VALID))).toEqual({
      error: 'Non authentifié',
    });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await createEquipeAction(null, fd(VALID))).toEqual({
      error: 'Aucun workshop actif',
    });
  });

  it('refuse si prénom vide', async () => {
    const r = await createEquipeAction(null, fd({ ...VALID, prenom: '' }));
    expect(r.error).toBe('Validation');
    expect(r.fieldErrors?.prenom).toBeDefined();
  });

  it('refuse si surnom vide', async () => {
    const r = await createEquipeAction(null, fd({ ...VALID, surnom: '' }));
    expect(r.error).toBe('Validation');
    expect(r.fieldErrors?.surnom).toBeDefined();
  });

  it('refuse si courriel invalide (mais accepte vide)', async () => {
    const r = await createEquipeAction(
      null,
      fd({ ...VALID, courriel: 'pas-un-email' }),
    );
    expect(r.error).toBe('Validation');
    expect(r.fieldErrors?.courriel).toBeDefined();
  });
});

describe('updateEquipeAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await updateEquipeAction('eq_x', null, fd(VALID))).toEqual({
      error: 'Non authentifié',
    });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await updateEquipeAction('eq_x', null, fd(VALID))).toEqual({
      error: 'Aucun workshop actif',
    });
  });

  it('refuse si validation échoue', async () => {
    const r = await updateEquipeAction('eq_x', null, fd({ ...VALID, prenom: '' }));
    expect(r.error).toBe('Validation');
  });
});

describe('deleteEquipeAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await deleteEquipeAction('eq_x')).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await deleteEquipeAction('eq_x')).toEqual({ error: 'Aucun workshop actif' });
  });

  it('set active=false (PAS de soft delete, pour préserver FK BDT)', async () => {
    vi.mocked(prisma.equipeMember.update).mockResolvedValueOnce({} as never);
    await expect(deleteEquipeAction('eq_x')).rejects.toThrow('NEXT_REDIRECT');
    expect(vi.mocked(prisma.equipeMember.update).mock.calls[0]![0]).toEqual({
      where: { id: 'eq_x' },
      data: { active: false },
    });
  });
});
