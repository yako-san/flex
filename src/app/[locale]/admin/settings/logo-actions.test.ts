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
import { removeLogoAction, uploadLogoAction } from './logo-actions';

const mockAuth = vi.mocked(auth);
const mockGetWorkshop = vi.mocked(getActiveWorkshop);
const WORKSHOP = { id: 'workshop_TEST' } as unknown as Awaited<
  ReturnType<typeof getActiveWorkshop>
>;

function makeFile({
  type = 'image/png',
  size = 1024,
}: { type?: string; size?: number } = {}) {
  return new File([new Uint8Array(size)], 'logo.png', { type });
}

beforeEach(() => {
  mockAuth.mockResolvedValue({ userId: 'user_TEST' } as never);
  mockGetWorkshop.mockResolvedValue(WORKSHOP);
});

afterEach(() => vi.clearAllMocks());

describe('uploadLogoAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    const fd = new FormData();
    fd.set('logo', makeFile());
    expect(await uploadLogoAction(null, fd)).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    const fd = new FormData();
    fd.set('logo', makeFile());
    expect(await uploadLogoAction(null, fd)).toEqual({ error: 'Aucun workshop actif' });
  });

  it('refuse si fichier vide', async () => {
    const fd = new FormData();
    fd.set('logo', new File([new Uint8Array(0)], 'empty.png', { type: 'image/png' }));
    expect(await uploadLogoAction(null, fd)).toEqual({
      error: 'Aucun fichier sélectionné',
    });
  });

  it('refuse si fichier absent', async () => {
    const fd = new FormData();
    expect(await uploadLogoAction(null, fd)).toEqual({
      error: 'Aucun fichier sélectionné',
    });
  });

  it('refuse si fichier > 500 KB', async () => {
    const fd = new FormData();
    fd.set('logo', makeFile({ size: 600_000 }));
    const r = await uploadLogoAction(null, fd);
    expect(r.error).toContain('Fichier trop gros');
  });

  it('refuse si type non-image', async () => {
    const fd = new FormData();
    fd.set('logo', makeFile({ type: 'application/pdf' }));
    const r = await uploadLogoAction(null, fd);
    expect(r.error).toContain('non supporté');
    expect(r.error).toContain('application/pdf');
  });

  it('stocke le logo en base64 data URL', async () => {
    vi.mocked(prisma.workshop.update).mockResolvedValueOnce({} as never);
    const fd = new FormData();
    fd.set('logo', makeFile({ type: 'image/png', size: 100 }));

    const r = await uploadLogoAction(null, fd);

    expect(r).toEqual({ success: true });
    const data = vi.mocked(prisma.workshop.update).mock.calls[0]![0].data;
    expect(data.logoBase64).toMatch(/^data:image\/png;base64,/);
  });
});

describe('removeLogoAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await removeLogoAction()).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await removeLogoAction()).toEqual({ error: 'Aucun workshop actif' });
  });

  it('set logoBase64 à null', async () => {
    vi.mocked(prisma.workshop.update).mockResolvedValueOnce({} as never);
    const r = await removeLogoAction();
    expect(r).toEqual({ success: true });
    expect(vi.mocked(prisma.workshop.update).mock.calls[0]![0].data.logoBase64).toBeNull();
  });
});
