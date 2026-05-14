import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  prisma: { factureLog: { findFirst: vi.fn(), update: vi.fn() } },
}));
vi.mock('@/lib/workshop', () => ({ getActiveWorkshop: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { setFactureStatutAction } from './actions';

const mockAuth = vi.mocked(auth);
const mockGetWorkshop = vi.mocked(getActiveWorkshop);
const mockRevalidate = vi.mocked(revalidatePath);
const WORKSHOP = { id: 'workshop_TEST' } as unknown as Awaited<
  ReturnType<typeof getActiveWorkshop>
>;

beforeEach(() => {
  mockAuth.mockResolvedValue({ userId: 'user_TEST' } as never);
  mockGetWorkshop.mockResolvedValue(WORKSHOP);
});

afterEach(() => vi.clearAllMocks());

describe('setFactureStatutAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await setFactureStatutAction('f_x', 'PAYE', null)).toEqual({
      error: 'Non authentifié',
    });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await setFactureStatutAction('f_x', 'PAYE', null)).toEqual({
      error: 'Aucun workshop actif',
    });
  });

  it('refuse si statut invalide', async () => {
    const r = await setFactureStatutAction('f_x', 'BIDON' as never, null);
    expect(r.error).toBeDefined();
  });

  it('refuse si facture introuvable', async () => {
    vi.mocked(prisma.factureLog.findFirst).mockResolvedValueOnce(null);
    expect(await setFactureStatutAction('f_orphan', 'PAYE', null)).toEqual({
      error: 'Facture introuvable',
    });
  });

  it('met à jour statut + mode paiement', async () => {
    vi.mocked(prisma.factureLog.findFirst).mockResolvedValueOnce({
      id: 'f_x',
      bdcId: 'bdc_x',
      venteId: null,
      clientId: 'cli_x',
      statut: 'EMIS',
    } as never);
    vi.mocked(prisma.factureLog.update).mockResolvedValueOnce({} as never);

    const r = await setFactureStatutAction('f_x', 'PAYE', 'INTERAC');

    expect(r).toEqual({ ok: true });
    const data = vi.mocked(prisma.factureLog.update).mock.calls[0]![0].data;
    expect(data.statut).toBe('PAYE');
    expect(data.modePaiement).toBe('INTERAC');
  });

  it('revalidate path BDT si la facture est liée à un BDT', async () => {
    vi.mocked(prisma.factureLog.findFirst).mockResolvedValueOnce({
      id: 'f_x',
      bdcId: 'bdc_X',
      venteId: null,
      clientId: 'cli_x',
      statut: 'EMIS',
    } as never);
    vi.mocked(prisma.factureLog.update).mockResolvedValueOnce({} as never);

    await setFactureStatutAction('f_x', 'PAYE', null);

    expect(mockRevalidate).toHaveBeenCalledWith(
      '/[locale]/admin/bdcs/bdc_X',
      'page',
    );
  });

  it('revalidate path vente si la facture est liée à une vente', async () => {
    vi.mocked(prisma.factureLog.findFirst).mockResolvedValueOnce({
      id: 'f_x',
      bdcId: null,
      venteId: 'vd_X',
      clientId: 'cli_x',
      statut: 'EMIS',
    } as never);
    vi.mocked(prisma.factureLog.update).mockResolvedValueOnce({} as never);

    await setFactureStatutAction('f_x', 'PAYE', null);

    expect(mockRevalidate).toHaveBeenCalledWith(
      '/[locale]/admin/ventes/vd_X',
      'page',
    );
  });

  it('accepte les 3 statuts canoniques', async () => {
    vi.mocked(prisma.factureLog.findFirst).mockResolvedValue({
      id: 'f_x',
      bdcId: null,
      venteId: null,
      clientId: null,
      statut: 'EMIS',
    } as never);
    vi.mocked(prisma.factureLog.update).mockResolvedValue({} as never);

    for (const s of ['EMIS', 'PAYE', 'ANNULE'] as const) {
      const r = await setFactureStatutAction('f_x', s, null);
      expect(r).toEqual({ ok: true });
    }
  });

  it('accepte les 4 modes de paiement canoniques', async () => {
    vi.mocked(prisma.factureLog.findFirst).mockResolvedValue({
      id: 'f_x',
      bdcId: null,
      venteId: null,
      clientId: null,
      statut: 'EMIS',
    } as never);
    vi.mocked(prisma.factureLog.update).mockResolvedValue({} as never);

    for (const m of ['COMPTANT', 'INTERAC', 'CARTE', 'AUTRE'] as const) {
      const r = await setFactureStatutAction('f_x', 'PAYE', m);
      expect(r).toEqual({ ok: true });
    }
  });
});
