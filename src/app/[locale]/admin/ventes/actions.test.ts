import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Tests Server Actions ventes/actions.ts — focus sur les guards et delete.
// addVenteItemAction et emitVenteFactureAction sont complexes (transactions
// stock + tax + counter), TODO pour une future session avec mocks profonds.

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  prisma: { venteDirecte: { findFirst: vi.fn(), update: vi.fn() } },
}));
vi.mock('@/lib/workshop', () => ({ getActiveWorkshop: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); }),
}));
vi.mock('@/lib/stock', () => ({ recordStockMovement: vi.fn() }));

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import {
  createVenteAction,
  deleteVenteAction,
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

afterEach(() => vi.clearAllMocks());

describe('createVenteAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await createVenteAction(null, fd({}))).toEqual({
      error: 'Non authentifié',
    });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await createVenteAction(null, fd({}))).toEqual({
      error: 'Aucun workshop actif',
    });
  });
});

describe('deleteVenteAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await deleteVenteAction('vd_x')).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await deleteVenteAction('vd_x')).toEqual({ error: 'Aucun workshop actif' });
  });

  it('refuse si vente introuvable', async () => {
    vi.mocked(prisma.venteDirecte.findFirst).mockResolvedValueOnce(null);
    expect(await deleteVenteAction('vd_x')).toEqual({ error: 'Vente introuvable' });
  });

  it('refuse si vente déjà facturée', async () => {
    vi.mocked(prisma.venteDirecte.findFirst).mockResolvedValueOnce({
      id: 'vd_x',
      factureNumero: 'V42',
    } as never);
    const r = await deleteVenteAction('vd_x');
    expect(r.error).toContain('déjà facturée');
    expect(vi.mocked(prisma.venteDirecte.update)).not.toHaveBeenCalled();
  });

  it('soft-delete si pas facturée', async () => {
    vi.mocked(prisma.venteDirecte.findFirst).mockResolvedValueOnce({
      id: 'vd_x',
      factureNumero: null,
    } as never);
    vi.mocked(prisma.venteDirecte.update).mockResolvedValueOnce({} as never);
    await expect(deleteVenteAction('vd_x')).rejects.toThrow('NEXT_REDIRECT');
    expect(
      vi.mocked(prisma.venteDirecte.update).mock.calls[0]![0].data.deletedAt,
    ).toBeInstanceOf(Date);
  });
});
