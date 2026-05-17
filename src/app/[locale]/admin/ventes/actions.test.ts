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
  markVentePayeeAction,
  archiveVenteAction,
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

describe('markVentePayeeAction (cluster 4 item m)', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await markVentePayeeAction('vd_x', true)).toEqual({
      error: 'Non authentifié',
    });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await markVentePayeeAction('vd_x', true)).toEqual({
      error: 'Aucun workshop actif',
    });
  });

  it('refuse si vente introuvable', async () => {
    vi.mocked(prisma.venteDirecte.findFirst).mockResolvedValueOnce(null);
    expect(await markVentePayeeAction('vd_x', true)).toEqual({
      error: 'Vente introuvable',
    });
  });

  it('refuse si vente non facturée', async () => {
    vi.mocked(prisma.venteDirecte.findFirst).mockResolvedValueOnce({
      id: 'vd_x',
      factureNumero: null,
    } as never);
    const r = await markVentePayeeAction('vd_x', true);
    expect(r.error).toContain('non facturée');
    expect(vi.mocked(prisma.venteDirecte.update)).not.toHaveBeenCalled();
  });

  it('paid=true → paidAt set à NOW', async () => {
    vi.mocked(prisma.venteDirecte.findFirst).mockResolvedValueOnce({
      id: 'vd_x',
      factureNumero: 'V42',
    } as never);
    vi.mocked(prisma.venteDirecte.update).mockResolvedValueOnce({} as never);
    const r = await markVentePayeeAction('vd_x', true);
    expect(r.error).toBeUndefined();
    expect(r.paidAt).toBeTruthy();
    const data = vi.mocked(prisma.venteDirecte.update).mock.calls[0]![0].data;
    expect(data.paidAt).toBeInstanceOf(Date);
  });

  it('paid=false → paidAt set à null', async () => {
    vi.mocked(prisma.venteDirecte.findFirst).mockResolvedValueOnce({
      id: 'vd_x',
      factureNumero: 'V42',
    } as never);
    vi.mocked(prisma.venteDirecte.update).mockResolvedValueOnce({} as never);
    const r = await markVentePayeeAction('vd_x', false);
    expect(r.paidAt).toBeNull();
    const data = vi.mocked(prisma.venteDirecte.update).mock.calls[0]![0].data;
    expect(data.paidAt).toBeNull();
  });
});

describe('archiveVenteAction (cluster 4 item m)', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await archiveVenteAction('vd_x')).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si vente non facturée', async () => {
    vi.mocked(prisma.venteDirecte.findFirst).mockResolvedValueOnce({
      id: 'vd_x',
      factureNumero: null,
      paidAt: null,
    } as never);
    const r = await archiveVenteAction('vd_x');
    expect(r.error).toContain('Supprimer');
  });

  it('refuse si vente facturée pas payée', async () => {
    vi.mocked(prisma.venteDirecte.findFirst).mockResolvedValueOnce({
      id: 'vd_x',
      factureNumero: 'V42',
      paidAt: null,
    } as never);
    const r = await archiveVenteAction('vd_x');
    expect(r.error).toContain('payée');
    expect(vi.mocked(prisma.venteDirecte.update)).not.toHaveBeenCalled();
  });

  it('archive (soft-delete) si facturée + payée', async () => {
    vi.mocked(prisma.venteDirecte.findFirst).mockResolvedValueOnce({
      id: 'vd_x',
      factureNumero: 'V42',
      paidAt: new Date(),
    } as never);
    vi.mocked(prisma.venteDirecte.update).mockResolvedValueOnce({} as never);
    const r = await archiveVenteAction('vd_x');
    expect(r.error).toBeUndefined();
    expect(
      vi.mocked(prisma.venteDirecte.update).mock.calls[0]![0].data.deletedAt,
    ).toBeInstanceOf(Date);
  });
});
