import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Tests pos/actions.ts — focus sur deletePoAction. receivePoAction et
// createAdhocPoAction utilisent transactions complexes (StockMovement,
// generateId multiple) — TODO future session.

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  prisma: { po: { findFirst: vi.fn(), update: vi.fn() } },
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
import { deletePoAction } from './actions';

const mockAuth = vi.mocked(auth);
const mockGetWorkshop = vi.mocked(getActiveWorkshop);
const WORKSHOP = { id: 'workshop_TEST' } as unknown as Awaited<
  ReturnType<typeof getActiveWorkshop>
>;

beforeEach(() => {
  mockAuth.mockResolvedValue({ userId: 'user_TEST' } as never);
  mockGetWorkshop.mockResolvedValue(WORKSHOP);
});

afterEach(() => vi.clearAllMocks());

describe('deletePoAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await deletePoAction('po_x')).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await deletePoAction('po_x')).toEqual({ error: 'Aucun workshop actif' });
  });

  it('refuse si PO introuvable', async () => {
    vi.mocked(prisma.po.findFirst).mockResolvedValueOnce(null);
    expect(await deletePoAction('po_x')).toEqual({ error: 'PO introuvable' });
  });

  it('refuse si PO déjà reçu', async () => {
    vi.mocked(prisma.po.findFirst).mockResolvedValueOnce({
      id: 'po_x',
      status: 'RECU',
    } as never);
    const r = await deletePoAction('po_x');
    expect(r.error).toContain('déjà reçu');
    expect(vi.mocked(prisma.po.update)).not.toHaveBeenCalled();
  });

  it('soft-delete si PO non reçu', async () => {
    vi.mocked(prisma.po.findFirst).mockResolvedValueOnce({
      id: 'po_x',
      status: 'EN_COMMANDE',
    } as never);
    vi.mocked(prisma.po.update).mockResolvedValueOnce({} as never);
    await expect(deletePoAction('po_x')).rejects.toThrow('NEXT_REDIRECT');
    expect(
      vi.mocked(prisma.po.update).mock.calls[0]![0].data.deletedAt,
    ).toBeInstanceOf(Date);
  });
});
