import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Tests maintenance/actions.ts — focus sur deleteBdcByIdAction.
// recomputeStockAction itère sur les StockMovement pour reconstruire les
// caches — TODO une session avec mocks plus profonds.

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  prisma: { bdc: { findFirst: vi.fn(), update: vi.fn() } },
}));
vi.mock('@/lib/workshop', () => ({ getActiveWorkshop: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { deleteBdcByIdAction } from './actions';

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

describe('deleteBdcByIdAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(
      await deleteBdcByIdAction(null, fd({ bdcId: 'bdc_x', confirmation: 'SUPPRIMER' })),
    ).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(
      await deleteBdcByIdAction(null, fd({ bdcId: 'bdc_x', confirmation: 'SUPPRIMER' })),
    ).toEqual({ error: 'Aucun workshop actif' });
  });

  it('refuse si bdcId vide', async () => {
    const r = await deleteBdcByIdAction(null, fd({ bdcId: '', confirmation: 'SUPPRIMER' }));
    expect(r.error).toBe('ID requis');
  });

  it('refuse si confirmation != "SUPPRIMER"', async () => {
    const r = await deleteBdcByIdAction(null, fd({ bdcId: 'bdc_x', confirmation: 'oui' }));
    expect(r.error).toContain('SUPPRIMER');
  });

  it('refuse si confirmation en minuscules', async () => {
    const r = await deleteBdcByIdAction(
      null,
      fd({ bdcId: 'bdc_x', confirmation: 'supprimer' }),
    );
    expect(r.error).toContain('majuscules');
  });

  it('refuse si BDT introuvable', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce(null);
    const r = await deleteBdcByIdAction(
      null,
      fd({ bdcId: 'bdc_orphan', confirmation: 'SUPPRIMER' }),
    );
    expect(r.error).toContain('introuvable');
  });

  it('refuse si BDT a des factures émises', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({
      id: 'bdc_x',
      factures: [{ id: 'f1' }, { id: 'f2' }],
    } as never);

    const r = await deleteBdcByIdAction(
      null,
      fd({ bdcId: 'bdc_x', confirmation: 'SUPPRIMER' }),
    );

    expect(r.error).toContain('2 facture');
    expect(r.error).toContain('intégrité comptable');
    expect(vi.mocked(prisma.bdc.update)).not.toHaveBeenCalled();
  });

  it('soft-delete si 0 facture', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({
      id: 'bdc_x',
      factures: [],
    } as never);
    vi.mocked(prisma.bdc.update).mockResolvedValueOnce({} as never);

    const r = await deleteBdcByIdAction(
      null,
      fd({ bdcId: 'bdc_x', confirmation: 'SUPPRIMER' }),
    );

    expect(r.success).toContain('marqué comme supprimé');
    const data = vi.mocked(prisma.bdc.update).mock.calls[0]![0].data;
    expect(data.deletedAt).toBeInstanceOf(Date);
    expect(data.updatedById).toBe('user_TEST');
  });
});
