import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  prisma: { service: { findFirst: vi.fn(), update: vi.fn() } },
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
  createServiceAction,
  deleteServiceAction,
  updateServiceAction,
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

const VALID = { labelCanonical: 'Mise au point', prix: '50', taxable: 'on' };

beforeEach(() => {
  mockAuth.mockResolvedValue({ userId: 'user_TEST' } as never);
  mockGetWorkshop.mockResolvedValue(WORKSHOP);
});

afterEach(() => vi.clearAllMocks());

describe('createServiceAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await createServiceAction(null, fd(VALID))).toEqual({
      error: 'Non authentifié',
    });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await createServiceAction(null, fd(VALID))).toEqual({
      error: 'Aucun workshop actif',
    });
  });

  it('refuse si labelCanonical vide', async () => {
    const r = await createServiceAction(null, fd({ ...VALID, labelCanonical: '' }));
    expect(r.error).toBe('Validation');
    expect(r.fieldErrors?.labelCanonical).toBeDefined();
  });

  it('refuse si prix vide', async () => {
    const r = await createServiceAction(null, fd({ ...VALID, prix: '' }));
    expect(r.error).toBe('Validation');
    expect(r.fieldErrors?.prix).toBeDefined();
  });
});

describe('updateServiceAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await updateServiceAction('svc_x', null, fd(VALID))).toEqual({
      error: 'Non authentifié',
    });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await updateServiceAction('svc_x', null, fd(VALID))).toEqual({
      error: 'Aucun workshop actif',
    });
  });

  it('refuse si validation échoue', async () => {
    const r = await updateServiceAction('svc_x', null, fd({ ...VALID, prix: '' }));
    expect(r.error).toBe('Validation');
  });
});

describe('deleteServiceAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await deleteServiceAction('svc_x')).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await deleteServiceAction('svc_x')).toEqual({ error: 'Aucun workshop actif' });
  });

  it('refuse si service introuvable', async () => {
    vi.mocked(prisma.service.findFirst).mockResolvedValueOnce(null);
    expect(await deleteServiceAction('svc_x')).toEqual({ error: 'Service introuvable' });
  });

  it('refuse si BDT items utilisent le service', async () => {
    vi.mocked(prisma.service.findFirst).mockResolvedValueOnce({
      id: 'svc_x',
      _count: { bdcItems: 7 },
    } as never);
    const r = await deleteServiceAction('svc_x');
    expect(r.error).toContain('7 BDT items');
  });

  it('soft-delete si 0 BDT items', async () => {
    vi.mocked(prisma.service.findFirst).mockResolvedValueOnce({
      id: 'svc_x',
      _count: { bdcItems: 0 },
    } as never);
    vi.mocked(prisma.service.update).mockResolvedValueOnce({} as never);
    await expect(deleteServiceAction('svc_x')).rejects.toThrow('NEXT_REDIRECT');
    expect(
      vi.mocked(prisma.service.update).mock.calls[0]![0].data.deletedAt,
    ).toBeInstanceOf(Date);
  });
});
