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
import { updateEmailTemplatesAction } from './email-templates-actions';

const mockAuth = vi.mocked(auth);
const mockGetWorkshop = vi.mocked(getActiveWorkshop);

function withWorkshop(emailTemplates: Record<string, unknown> | null = null) {
  return {
    id: 'workshop_TEST',
    emailTemplates,
  } as unknown as Awaited<ReturnType<typeof getActiveWorkshop>>;
}

function fd(values: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
}

beforeEach(() => {
  mockAuth.mockResolvedValue({ userId: 'user_TEST' } as never);
  mockGetWorkshop.mockResolvedValue(withWorkshop());
});

afterEach(() => vi.clearAllMocks());

describe('updateEmailTemplatesAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await updateEmailTemplatesAction(null, fd({}))).toEqual({
      error: 'Non authentifié',
    });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await updateEmailTemplatesAction(null, fd({}))).toEqual({
      error: 'Aucun workshop actif',
    });
  });

  it('payload vide → JsonNull (rien à stocker)', async () => {
    vi.mocked(prisma.workshop.update).mockResolvedValueOnce({} as never);
    const r = await updateEmailTemplatesAction(null, fd({}));

    expect(r).toEqual({ success: true });
    // Quand result est vide, prisma reçoit Prisma.JsonNull (impossible à
    // détecter comme objet) — on vérifie juste qu'on n'a pas mis un objet
    // avec des clés.
    const data = vi.mocked(prisma.workshop.update).mock.calls[0]![0].data;
    const tpls = data.emailTemplates;
    if (typeof tpls === 'object' && tpls !== null) {
      expect(Object.keys(tpls as object)).toHaveLength(0);
    }
  });

  it('structure ${kind}_${field}_${locale} construit le bon JSON', async () => {
    vi.mocked(prisma.workshop.update).mockResolvedValueOnce({} as never);

    await updateEmailTemplatesAction(
      null,
      fd({
        eval_subject_fr: 'Évaluation prête',
        eval_subject_en: 'Estimate ready',
        eval_body_fr: 'Bonjour,',
        facture_intro_fr: 'Voici la facture',
      }),
    );

    const tpls = vi.mocked(prisma.workshop.update).mock.calls[0]![0].data
      .emailTemplates as Record<string, unknown>;
    expect(tpls.eval).toEqual({
      subject: { fr: 'Évaluation prête', en: 'Estimate ready' },
      body: { fr: 'Bonjour,' },
    });
    expect(tpls.facture).toEqual({
      intro: { fr: 'Voici la facture' },
    });
  });

  it('SMS rappel + suivi (body uniquement)', async () => {
    vi.mocked(prisma.workshop.update).mockResolvedValueOnce({} as never);

    await updateEmailTemplatesAction(
      null,
      fd({
        smsRappel_body_fr: 'RV demain 10h',
        smsSuivi_body_en: 'How is your bike?',
      }),
    );

    const tpls = vi.mocked(prisma.workshop.update).mock.calls[0]![0].data
      .emailTemplates as Record<string, unknown>;
    expect(tpls.smsRappel).toEqual({ body: { fr: 'RV demain 10h' } });
    expect(tpls.smsSuivi).toEqual({ body: { en: 'How is your bike?' } });
  });

  it('outro global et signatures', async () => {
    vi.mocked(prisma.workshop.update).mockResolvedValueOnce({} as never);

    await updateEmailTemplatesAction(
      null,
      fd({
        outro_fr: 'Merci !',
        outro_en: 'Thanks!',
        signatures_yako: '— Yako',
        signatures_cf: '— CF',
      }),
    );

    const tpls = vi.mocked(prisma.workshop.update).mock.calls[0]![0].data
      .emailTemplates as Record<string, unknown>;
    expect(tpls.outro).toEqual({ fr: 'Merci !', en: 'Thanks!' });
    expect(tpls.signatures).toEqual({ yako: '— Yako', cf: '— CF' });
  });

  it('préserve _unmapped existant (clés V1 inconnues)', async () => {
    mockGetWorkshop.mockResolvedValueOnce(
      withWorkshop({ _unmapped: { legacyKey: 'value' } }),
    );
    vi.mocked(prisma.workshop.update).mockResolvedValueOnce({} as never);

    await updateEmailTemplatesAction(
      null,
      fd({ eval_subject_fr: 'Test' }),
    );

    const tpls = vi.mocked(prisma.workshop.update).mock.calls[0]![0].data
      .emailTemplates as Record<string, unknown>;
    expect(tpls._unmapped).toEqual({ legacyKey: 'value' });
  });

  it('strings vides sont droppées (pas mises à null mais simplement absentes)', async () => {
    vi.mocked(prisma.workshop.update).mockResolvedValueOnce({} as never);

    await updateEmailTemplatesAction(
      null,
      fd({
        eval_subject_fr: 'Avec contenu',
        eval_subject_en: '',
        eval_body_fr: '   ',
      }),
    );

    const tpls = vi.mocked(prisma.workshop.update).mock.calls[0]![0].data
      .emailTemplates as Record<string, unknown>;
    expect(tpls.eval).toEqual({
      subject: { fr: 'Avec contenu' },
    });
  });
});
