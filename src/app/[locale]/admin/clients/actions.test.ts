import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Tests Server Actions clients/actions.ts — focus sur les paths qui
// retournent (auth, workshop, validation Zod, deleteClient avec vélos).
// Les paths qui appellent redirect() ne sont pas couverts ici parce que
// redirect() throw une erreur Next interne que vitest ne peut pas distinguer
// sans mocker next/navigation, et le bénéfice marginal ne vaut pas la
// complexité ajoutée — la chaîne après validation est testée indirectement
// via build + e2e manuel sur Vercel preview.

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    client: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/workshop', () => ({
  getActiveWorkshop: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    // Mime le throw NEXT_REDIRECT de Next.js — permet aux tests de détecter
    // un redirect sans crasher le reste.
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import {
  createClientAction,
  deleteClientAction,
  updateClientAction,
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

const VALID_CLIENT_FORM = {
  prenom: 'Jean',
  nom: 'Tremblay',
  telephone: '5145551234',
  indicatif: '+1',
  courriel: 'jean@example.com',
  commPref: 'EMAIL',
  lang: 'fr-CA',
};

beforeEach(() => {
  mockAuth.mockResolvedValue({ userId: 'user_TEST' } as never);
  mockGetWorkshop.mockResolvedValue(WORKSHOP);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// createClientAction — paths d'erreur (le path succès redirige donc throw)
// ─────────────────────────────────────────────────────────────────────────────

describe('createClientAction', () => {
  it('refuse si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    const r = await createClientAction(null, fd(VALID_CLIENT_FORM));
    expect(r).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    const r = await createClientAction(null, fd(VALID_CLIENT_FORM));
    expect(r).toEqual({ error: 'Aucun workshop actif' });
  });

  it('refuse si prénom vide', async () => {
    const r = await createClientAction(
      null,
      fd({ ...VALID_CLIENT_FORM, prenom: '' }),
    );
    expect(r.error).toBe('Validation échouée');
    expect(r.fieldErrors?.prenom).toBeDefined();
  });

  it('refuse si nom vide', async () => {
    const r = await createClientAction(
      null,
      fd({ ...VALID_CLIENT_FORM, nom: '' }),
    );
    expect(r.error).toBe('Validation échouée');
    expect(r.fieldErrors?.nom).toBeDefined();
  });

  it('refuse si courriel invalide', async () => {
    const r = await createClientAction(
      null,
      fd({ ...VALID_CLIENT_FORM, courriel: 'pas-un-email' }),
    );
    expect(r.error).toBe('Validation échouée');
    expect(r.fieldErrors?.courriel).toBeDefined();
  });

  it('accepte courriel vide (optionnel)', async () => {
    // Path succès → throw NEXT_REDIRECT car Prisma create + redirect
    // déclenchent le redirect mock après create OK.
    // On ne mocke pas prisma.client.create donc le create lui-même throw
    // — on regarde juste qu'on ne s'est pas arrêté à la validation.
    const r = await createClientAction(
      null,
      fd({ ...VALID_CLIENT_FORM, courriel: '' }),
    ).catch((e) => ({ thrown: e instanceof Error ? e.message : String(e) }));
    // Soit on throw sur le prisma.create (qui n'est pas mocké), soit on
    // throw sur le redirect. Dans les 2 cas on a passé la validation Zod.
    expect((r as Record<string, unknown>).fieldErrors).toBeUndefined();
  });

  it('refuse si commPref invalide', async () => {
    const r = await createClientAction(
      null,
      fd({ ...VALID_CLIENT_FORM, commPref: 'BIDON' }),
    );
    expect(r.error).toBe('Validation échouée');
    expect(r.fieldErrors?.commPref).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateClientAction — paths d'erreur
// ─────────────────────────────────────────────────────────────────────────────

describe('updateClientAction', () => {
  it('refuse si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    const r = await updateClientAction('client_x', null, fd(VALID_CLIENT_FORM));
    expect(r).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    const r = await updateClientAction('client_x', null, fd(VALID_CLIENT_FORM));
    expect(r).toEqual({ error: 'Aucun workshop actif' });
  });

  it('refuse si client introuvable', async () => {
    vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(null);
    const r = await updateClientAction('client_orphan', null, fd(VALID_CLIENT_FORM));
    expect(r).toEqual({ error: 'Client introuvable' });
  });

  it('refuse si validation Zod échoue', async () => {
    vi.mocked(prisma.client.findFirst).mockResolvedValueOnce({
      id: 'client_x',
    } as never);
    const r = await updateClientAction(
      'client_x',
      null,
      fd({ ...VALID_CLIENT_FORM, prenom: '' }),
    );
    expect(r.error).toBe('Validation échouée');
    expect(r.fieldErrors?.prenom).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// deleteClientAction — la seule action testable côté happy path car la
// vérif vélos peut bloquer AVANT le redirect
// ─────────────────────────────────────────────────────────────────────────────

describe('deleteClientAction', () => {
  it('refuse si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    const r = await deleteClientAction('client_x');
    expect(r).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    const r = await deleteClientAction('client_x');
    expect(r).toEqual({ error: 'Aucun workshop actif' });
  });

  it('refuse si client introuvable', async () => {
    vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(null);
    const r = await deleteClientAction('client_orphan');
    expect(r).toEqual({ error: 'Client introuvable' });
  });

  it('refuse si vélos associés (avant le soft-delete)', async () => {
    vi.mocked(prisma.client.findFirst).mockResolvedValueOnce({
      id: 'client_x',
      _count: { velos: 3 },
    } as never);

    const r = await deleteClientAction('client_x');

    expect(r.error).toContain('3 vélo');
    expect(vi.mocked(prisma.client.update)).not.toHaveBeenCalled();
  });

  it('soft-delete si 0 vélos (atteint le redirect, donc throw NEXT_REDIRECT)', async () => {
    vi.mocked(prisma.client.findFirst).mockResolvedValueOnce({
      id: 'client_x',
      _count: { velos: 0 },
    } as never);
    vi.mocked(prisma.client.update).mockResolvedValueOnce({} as never);

    await expect(deleteClientAction('client_x')).rejects.toThrow('NEXT_REDIRECT');

    const updateCall = vi.mocked(prisma.client.update).mock.calls[0]![0];
    expect(updateCall.where).toEqual({ id: 'client_x' });
    expect(updateCall.data.deletedAt).toBeInstanceOf(Date);
  });
});
