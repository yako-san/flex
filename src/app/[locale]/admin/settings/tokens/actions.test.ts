import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks AVANT import du SUT (Vitest hoist).
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: 'user_test' })),
}));
vi.mock('@/lib/workshop', () => ({
  getActiveWorkshop: vi.fn(async () => ({ id: 'ws_test', name: 'Test', theme: null })),
}));
vi.mock('@/lib/db', () => ({
  prisma: { workshop: { update: vi.fn(async () => ({})) } },
}));
vi.mock('@prisma/client', () => ({
  Prisma: { JsonNull: Symbol('JsonNull') },
}));

import { saveTokensAction } from './actions';
import { prisma } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { getActiveWorkshop } from '@/lib/workshop';

describe('saveTokensAction', () => {
  beforeEach(() => {
    vi.mocked(prisma.workshop.update).mockClear();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test' } as unknown as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
    vi.mocked(getActiveWorkshop).mockResolvedValue({ id: 'ws_test', name: 'Test', theme: null } as unknown as Awaited<ReturnType<typeof getActiveWorkshop>>);
  });

  it('refuse si pas authentifié', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as unknown as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
    const r = await saveTokensAction({ jaune: '#fff056' });
    expect(r).toEqual({ ok: false, error: 'Non authentifié' });
  });

  it('refuse si pas de workshop', async () => {
    vi.mocked(getActiveWorkshop).mockResolvedValueOnce(null as Awaited<ReturnType<typeof getActiveWorkshop>>);
    const r = await saveTokensAction({ jaune: '#fff056' });
    expect(r).toEqual({ ok: false, error: 'Aucun workshop actif' });
  });

  it('normalise les clés `--t-*` en clés `WorkshopTheme`', async () => {
    const r = await saveTokensAction({
      '--t-jaune': '#fff056',
      '--t-h1-size': '50px',
      '--t-h1-weight': '300',
      '--t-h1-caps': 'uppercase',
      '--t-overlay-step': '0.20',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.theme).toEqual({
      jaune: '#fff056',
      'h1-size': '50px',
      'h1-weight': '300',
      'h1-caps': 'uppercase',
      'overlay-step': '0.20',
    });
  });

  it('rejette les valeurs invalides (couleur foireuse, weight hors enum, caps hors keyword)', async () => {
    const r = await saveTokensAction({
      jaune: 'rgb(invalid)',         // mauvais format couleur
      'h1-weight': '350',            // pas un multiple de 100
      'h1-caps': 'random',           // pas dans le whitelist
      'h2-size': '42rem',            // valide
      brun: '#806642',               // valide
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Les invalides sont silencieusement filtrées.
    expect(r.theme).toEqual({ 'h2-size': '42rem', brun: '#806642' });
  });

  it('refuse un payload non objet', async () => {
    const r = await saveTokensAction(null as unknown as Record<string, string>);
    expect(r).toEqual({ ok: false, error: 'Payload invalide' });
  });

  it('persiste sur Prisma avec le tenant actif', async () => {
    await saveTokensAction({ jaune: '#fff056' });
    expect(prisma.workshop.update).toHaveBeenCalledWith({
      where: { id: 'ws_test' },
      data: { theme: { jaune: '#fff056' } },
    });
  });
});
