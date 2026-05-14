import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Tests Server Actions velos/actions.ts — focus sur les paths qui retournent
// (auth, workshop, validation Zod, deleteVelo avec BDT). Pattern identique
// à clients/actions.test.ts.

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    velo: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/workshop', () => ({
  getActiveWorkshop: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import {
  createVeloAction,
  deleteVeloAction,
  updateVeloAction,
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

const VALID_VELO_FORM = {
  clientId: 'client_x',
  status: 'RV',
};

beforeEach(() => {
  mockAuth.mockResolvedValue({ userId: 'user_TEST' } as never);
  mockGetWorkshop.mockResolvedValue(WORKSHOP);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('createVeloAction', () => {
  it('refuse si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    const r = await createVeloAction(null, fd(VALID_VELO_FORM));
    expect(r).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    const r = await createVeloAction(null, fd(VALID_VELO_FORM));
    expect(r).toEqual({ error: 'Aucun workshop actif' });
  });

  it('refuse si clientId vide', async () => {
    const r = await createVeloAction(null, fd({ clientId: '', status: 'RV' }));
    expect(r.error).toBe('Validation échouée');
    expect(r.fieldErrors?.clientId).toBeDefined();
  });

  it('refuse si status invalide', async () => {
    const r = await createVeloAction(
      null,
      fd({ ...VALID_VELO_FORM, status: 'BIDON' }),
    );
    expect(r.error).toBe('Validation échouée');
    expect(r.fieldErrors?.status).toBeDefined();
  });

  it('accepte les 11 statuts canoniques', async () => {
    // On veut juste valider que Zod accepte chaque statut. Le path post-
    // validation throw (transaction non mockée), donc on catch.
    const statuses = [
      'RV', 'RECU', 'EN_ATTENTE', 'EVAL', 'APPROUVE', 'ON_BENCH',
      'CTRL_QLTE', 'FINI', 'LIVRE', 'FACTURER', 'FACTURE',
    ];
    for (const s of statuses) {
      const r = await createVeloAction(null, fd({ ...VALID_VELO_FORM, status: s }))
        .catch(() => ({ thrown: true }));
      expect((r as { fieldErrors?: unknown }).fieldErrors).toBeUndefined();
    }
  });

  it('refuse si veloNumero non-entier positif', async () => {
    const r = await createVeloAction(
      null,
      fd({ ...VALID_VELO_FORM, veloNumero: '-5' }),
    );
    expect(r.error).toBe('Validation échouée');
    expect(r.fieldErrors?.veloNumero).toBeDefined();
  });
});

describe('updateVeloAction', () => {
  it('refuse si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    const r = await updateVeloAction('velo_x', null, fd(VALID_VELO_FORM));
    expect(r).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    const r = await updateVeloAction('velo_x', null, fd(VALID_VELO_FORM));
    expect(r).toEqual({ error: 'Aucun workshop actif' });
  });

  it('refuse si vélo introuvable', async () => {
    vi.mocked(prisma.velo.findFirst).mockResolvedValueOnce(null);
    const r = await updateVeloAction('velo_orphan', null, fd(VALID_VELO_FORM));
    expect(r).toEqual({ error: 'Vélo introuvable' });
  });

  it('refuse si validation échoue (clientId vide)', async () => {
    vi.mocked(prisma.velo.findFirst).mockResolvedValueOnce({ id: 'velo_x' } as never);
    const r = await updateVeloAction(
      'velo_x',
      null,
      fd({ clientId: '', status: 'RV' }),
    );
    expect(r.error).toBe('Validation échouée');
    expect(r.fieldErrors?.clientId).toBeDefined();
  });
});

describe('deleteVeloAction', () => {
  it('refuse si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    const r = await deleteVeloAction('velo_x');
    expect(r).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    const r = await deleteVeloAction('velo_x');
    expect(r).toEqual({ error: 'Aucun workshop actif' });
  });

  it('refuse si vélo introuvable', async () => {
    vi.mocked(prisma.velo.findFirst).mockResolvedValueOnce(null);
    const r = await deleteVeloAction('velo_orphan');
    expect(r).toEqual({ error: 'Vélo introuvable' });
  });

  it('refuse si BDT associés', async () => {
    vi.mocked(prisma.velo.findFirst).mockResolvedValueOnce({
      id: 'velo_x',
      _count: { bdcs: 2 },
    } as never);

    const r = await deleteVeloAction('velo_x');

    expect(r.error).toContain('2 BDT');
    expect(vi.mocked(prisma.velo.update)).not.toHaveBeenCalled();
  });

  it('soft-delete si 0 BDT (throw NEXT_REDIRECT après update)', async () => {
    vi.mocked(prisma.velo.findFirst).mockResolvedValueOnce({
      id: 'velo_x',
      _count: { bdcs: 0 },
    } as never);
    vi.mocked(prisma.velo.update).mockResolvedValueOnce({} as never);

    await expect(deleteVeloAction('velo_x')).rejects.toThrow('NEXT_REDIRECT');

    const updateCall = vi.mocked(prisma.velo.update).mock.calls[0]![0];
    expect(updateCall.where).toEqual({ id: 'velo_x' });
    expect(updateCall.data.deletedAt).toBeInstanceOf(Date);
  });
});
