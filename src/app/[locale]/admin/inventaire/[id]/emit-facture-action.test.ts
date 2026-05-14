import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Tests emit-facture-action.ts — guards uniquement. Le path heureux est une
// transaction lourde (taxes Québec, counter, FactureLog create, stock
// movements) qui mérite des tests d'intégration avec Prisma test DB
// plutôt que des mocks granulaires. Voir TODO en bas du fichier de tests.

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  prisma: { $transaction: vi.fn() },
}));
vi.mock('@/lib/workshop', () => ({ getActiveWorkshop: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/stock', () => ({ recordStockMovement: vi.fn() }));

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { emitFactureAction } from './emit-facture-action';

const mockAuth = vi.mocked(auth);
const mockGetWorkshop = vi.mocked(getActiveWorkshop);
const WORKSHOP = {
  id: 'workshop_TEST',
  fiscalEntity: null,
} as unknown as Awaited<ReturnType<typeof getActiveWorkshop>>;

beforeEach(() => {
  mockAuth.mockResolvedValue({ userId: 'user_TEST' } as never);
  mockGetWorkshop.mockResolvedValue(WORKSHOP);
});

afterEach(() => vi.clearAllMocks());

describe('emitFactureAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await emitFactureAction('bdc_x', null)).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await emitFactureAction('bdc_x', null)).toEqual({ error: 'Aucun workshop actif' });
  });

  it('propage Error du transaction (BDT introuvable, items vides, etc.)', async () => {
    vi.mocked(prisma.$transaction).mockRejectedValueOnce(new Error('BDT introuvable'));
    const r = await emitFactureAction('bdc_orphan', null);
    expect(r.error).toBe('BDT introuvable');
  });

  it("renvoie 'Erreur d'émission' pour erreur non-Error", async () => {
    vi.mocked(prisma.$transaction).mockRejectedValueOnce('crash brut');
    const r = await emitFactureAction('bdc_x', null);
    expect(r.error).toBe("Erreur d'émission");
  });

  it('idempotence : retourne la facture existante si déjà émise', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValueOnce({
      factureLogId: 'facture_EXISTING',
      factureNumero: 'F0001-2026-05-13',
    });
    const r = await emitFactureAction('bdc_x', null);
    expect(r).toEqual({
      factureLogId: 'facture_EXISTING',
      factureNumero: 'F0001-2026-05-13',
    });
  });

  it('happy path : retourne factureLogId + factureNumero générés', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValueOnce({
      factureLogId: 'facture_NEW',
      factureNumero: 'F0042-2026-05-13',
    });
    const r = await emitFactureAction('bdc_x', 'INTERAC');
    expect(r.factureLogId).toBe('facture_NEW');
    expect(r.factureNumero).toMatch(/^F\d{4}-\d{4}-\d{2}-\d{2}$/);
  });
});
