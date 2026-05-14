import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  prisma: { workshop: { findUnique: vi.fn(), update: vi.fn() } },
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { linkWorkshopToOrgAction } from './actions';

const mockAuth = vi.mocked(auth);

function fd(values: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
}

beforeEach(() => {
  mockAuth.mockResolvedValue({ userId: 'user_TEST', orgId: 'org_TEST' } as never);
});

afterEach(() => vi.clearAllMocks());

describe('linkWorkshopToOrgAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null, orgId: null } as never);
    expect(
      await linkWorkshopToOrgAction(null, fd({ workshopId: 'w', clerkOrgId: 'o' })),
    ).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshopId manquant', async () => {
    expect(
      await linkWorkshopToOrgAction(null, fd({ workshopId: '', clerkOrgId: 'o' })),
    ).toEqual({ error: 'Paramètres manquants' });
  });

  it('refuse si clerkOrgId manquant', async () => {
    expect(
      await linkWorkshopToOrgAction(null, fd({ workshopId: 'w', clerkOrgId: '' })),
    ).toEqual({ error: 'Paramètres manquants' });
  });

  it("refuse si l'org cible n'est pas l'org active (vol potentiel)", async () => {
    const r = await linkWorkshopToOrgAction(
      null,
      fd({ workshopId: 'w_TEST', clerkOrgId: 'org_AUTRE' }),
    );
    expect(r.error).toContain("org actuellement active");
  });

  it('refuse si workshop introuvable', async () => {
    vi.mocked(prisma.workshop.findUnique).mockResolvedValueOnce(null);
    const r = await linkWorkshopToOrgAction(
      null,
      fd({ workshopId: 'w_orphan', clerkOrgId: 'org_TEST' }),
    );
    expect(r).toEqual({ error: 'Workshop introuvable' });
  });

  it('refuse si workshop déjà lié à une autre org', async () => {
    vi.mocked(prisma.workshop.findUnique).mockResolvedValueOnce({
      id: 'w_TEST',
      clerkOrgId: 'org_AUTRE',
    } as never);
    const r = await linkWorkshopToOrgAction(
      null,
      fd({ workshopId: 'w_TEST', clerkOrgId: 'org_TEST' }),
    );
    expect(r.error).toContain('déjà lié à une autre org');
  });

  it("refuse si l'org cible a déjà un autre workshop", async () => {
    vi.mocked(prisma.workshop.findUnique)
      .mockResolvedValueOnce({ id: 'w_TEST', clerkOrgId: null } as never)
      .mockResolvedValueOnce({ id: 'w_AUTRE', name: 'Atelier B', clerkOrgId: 'org_TEST' } as never);
    const r = await linkWorkshopToOrgAction(
      null,
      fd({ workshopId: 'w_TEST', clerkOrgId: 'org_TEST' }),
    );
    expect(r.error).toContain('Atelier B');
  });

  it('accepte si workshop non lié et org libre', async () => {
    vi.mocked(prisma.workshop.findUnique)
      .mockResolvedValueOnce({ id: 'w_TEST', clerkOrgId: null } as never)
      .mockResolvedValueOnce(null);
    vi.mocked(prisma.workshop.update).mockResolvedValueOnce({} as never);

    const r = await linkWorkshopToOrgAction(
      null,
      fd({ workshopId: 'w_TEST', clerkOrgId: 'org_TEST' }),
    );

    expect(r).toEqual({ success: true });
    expect(vi.mocked(prisma.workshop.update).mock.calls[0]![0]).toEqual({
      where: { id: 'w_TEST' },
      data: { clerkOrgId: 'org_TEST' },
    });
  });

  it("idempotent : workshop déjà lié à la même org → re-lié (no-op effectif)", async () => {
    vi.mocked(prisma.workshop.findUnique)
      .mockResolvedValueOnce({ id: 'w_TEST', clerkOrgId: 'org_TEST' } as never)
      .mockResolvedValueOnce({ id: 'w_TEST', clerkOrgId: 'org_TEST' } as never);
    vi.mocked(prisma.workshop.update).mockResolvedValueOnce({} as never);

    const r = await linkWorkshopToOrgAction(
      null,
      fd({ workshopId: 'w_TEST', clerkOrgId: 'org_TEST' }),
    );

    expect(r).toEqual({ success: true });
  });
});
