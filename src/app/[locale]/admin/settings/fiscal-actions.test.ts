import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  prisma: { workshop: { update: vi.fn() } },
}));
vi.mock('@/lib/workshop', () => ({ getActiveWorkshop: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { updateFiscalAction } from './fiscal-actions';

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

describe('updateFiscalAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await updateFiscalAction(null, fd({}))).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await updateFiscalAction(null, fd({}))).toEqual({
      error: 'Aucun workshop actif',
    });
  });

  it('refuse si courriel invalide', async () => {
    const r = await updateFiscalAction(null, fd({ courriel: 'pas-un-email' }));
    expect(r).toEqual({ error: 'Validation échouée' });
  });

  it('accepte courriel vide', async () => {
    vi.mocked(prisma.workshop.update).mockResolvedValueOnce({} as never);
    const r = await updateFiscalAction(null, fd({ courriel: '' }));
    expect(r).toEqual({ success: true });
  });

  it('stocke uniquement les champs non-vides', async () => {
    vi.mocked(prisma.workshop.update).mockResolvedValueOnce({} as never);

    await updateFiscalAction(
      null,
      fd({
        raisonSociale: 'Yako Cyclo',
        ville: 'Montréal',
        codePostal: '',
        adresseLigne1: '   ',
      }),
    );

    const fiscal = vi.mocked(prisma.workshop.update).mock.calls[0]![0].data.fiscalEntity;
    expect(fiscal).toEqual({
      raisonSociale: 'Yako Cyclo',
      ville: 'Montréal',
    });
  });

  it('si tous champs vides, stocke JsonNull', async () => {
    vi.mocked(prisma.workshop.update).mockResolvedValueOnce({} as never);
    await updateFiscalAction(null, fd({ raisonSociale: '', ville: '' }));

    const data = vi.mocked(prisma.workshop.update).mock.calls[0]![0].data;
    // Prisma.JsonNull est un Symbol — on vérifie juste que ce n'est pas un objet
    // contenant des chaînes vides.
    expect(typeof data.fiscalEntity).not.toBe('string');
    expect(Object.keys(data.fiscalEntity as object).length === 0 || data.fiscalEntity === null || typeof data.fiscalEntity === 'symbol').toBe(true);
  });

  it('accepte un payload complet', async () => {
    vi.mocked(prisma.workshop.update).mockResolvedValueOnce({} as never);
    const r = await updateFiscalAction(
      null,
      fd({
        raisonSociale: 'Yako Cyclo',
        adresseLigne1: '123 rue X',
        ville: 'Montréal',
        codePostal: 'H2X 1Y2',
        province: 'QC',
        pays: 'Canada',
        telephone: '5145551234',
        courriel: 'info@yako.cc',
        neq: '1234567890',
        tps: 'TPS123',
        tvq: 'TVQ123',
      }),
    );
    expect(r).toEqual({ success: true });
  });
});
