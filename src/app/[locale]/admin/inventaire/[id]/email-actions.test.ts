import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Tests email-actions.ts — guards uniquement. Le path heureux génère PDF
// + email via plusieurs lib externes (sendEmail, loadBdcPdfContext,
// htmlToPdf, etc.) qui mériteraient des tests d'intégration. Ici on couvre :
// auth, workshop, ressource introuvable, client sans courriel.

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  prisma: {
    factureLog: { findFirst: vi.fn() },
    client: { findUnique: vi.fn() },
    bdc: { findFirst: vi.fn(), findUnique: vi.fn() },
  },
}));
vi.mock('@/lib/workshop', () => ({ getActiveWorkshop: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// Mocks des dépendances externes appelées dans les paths heureux.
// On les laisse vides : si un test atteint ces lignes, il échouera de
// manière prévisible (et signalera qu'on a couvert plus que les guards).
vi.mock('@/lib/email/send', () => ({ sendEmail: vi.fn() }));
vi.mock('@/lib/email/templates', () => ({
  evalEmailTemplate: vi.fn(),
  evalEmailSubject: vi.fn(),
  factureEmailTemplate: vi.fn(),
  factureEmailSubject: vi.fn(),
  suiviEmailTemplate: vi.fn(),
  suiviEmailSubject: vi.fn(),
}));
vi.mock('@/lib/email/render-template', () => ({ getEmailTemplates: vi.fn() }));
vi.mock('@/lib/email/client', () => ({ getEmailProvider: vi.fn(() => 'RESEND') }));
vi.mock('@/lib/email/gmail', () => ({ gmailFromAddress: vi.fn() }));
vi.mock('@/lib/pdf-html/load-bdc-context', () => ({ loadBdcPdfContext: vi.fn() }));
vi.mock('@/lib/pdf-html/templates/eval', () => ({ buildEvalHtml: vi.fn() }));
vi.mock('@/lib/pdf-html/templates/facture', () => ({ buildFactureHtml: vi.fn() }));
vi.mock('@/lib/pdf-html/render', () => ({ htmlToPdf: vi.fn() }));

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { loadBdcPdfContext } from '@/lib/pdf-html/load-bdc-context';
import {
  sendEvalEmailAction,
  sendFactureEmailAction,
  sendSuiviEmailAction,
} from './email-actions';

const mockAuth = vi.mocked(auth);
const mockGetWorkshop = vi.mocked(getActiveWorkshop);
const mockLoadCtx = vi.mocked(loadBdcPdfContext);
const WORKSHOP = {
  id: 'workshop_TEST',
  name: 'Yako Cyclo',
  fiscalEntity: null,
  emailTemplates: null,
  logoBase64: null,
} as unknown as Awaited<ReturnType<typeof getActiveWorkshop>>;

beforeEach(() => {
  mockAuth.mockResolvedValue({ userId: 'user_TEST' } as never);
  mockGetWorkshop.mockResolvedValue(WORKSHOP);
});

afterEach(() => vi.clearAllMocks());

describe('sendEvalEmailAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await sendEvalEmailAction('bdc_x', null)).toEqual({
      error: 'Non authentifié',
    });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await sendEvalEmailAction('bdc_x', null)).toEqual({
      error: 'Aucun workshop actif',
    });
  });

  it('refuse si BDT introuvable (loadBdcPdfContext renvoie null)', async () => {
    mockLoadCtx.mockResolvedValueOnce(null);
    expect(await sendEvalEmailAction('bdc_orphan', null)).toEqual({
      error: 'BDT introuvable',
    });
  });

  it('refuse si client sans courriel', async () => {
    mockLoadCtx.mockResolvedValueOnce({
      client: { courriel: null },
      // Le reste du ctx n'est pas lu avant l'early return.
    } as never);
    const r = await sendEvalEmailAction('bdc_x', null);
    expect(r.error).toContain('courriel');
  });
});

describe('sendFactureEmailAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await sendFactureEmailAction('f_x', null)).toEqual({
      error: 'Non authentifié',
    });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await sendFactureEmailAction('f_x', null)).toEqual({
      error: 'Aucun workshop actif',
    });
  });

  it('refuse si facture introuvable', async () => {
    vi.mocked(prisma.factureLog.findFirst).mockResolvedValueOnce(null);
    expect(await sendFactureEmailAction('f_orphan', null)).toEqual({
      error: 'Facture introuvable',
    });
  });

  it('refuse si facture sans clientId (donc pas de client à emailer)', async () => {
    vi.mocked(prisma.factureLog.findFirst).mockResolvedValueOnce({
      id: 'f_x',
      clientId: null,
    } as never);
    const r = await sendFactureEmailAction('f_x', null);
    expect(r.error).toContain('courriel');
  });

  it('refuse si client sans courriel', async () => {
    vi.mocked(prisma.factureLog.findFirst).mockResolvedValueOnce({
      id: 'f_x',
      clientId: 'cli_x',
    } as never);
    vi.mocked(prisma.client.findUnique).mockResolvedValueOnce({
      id: 'cli_x',
      courriel: null,
    } as never);
    const r = await sendFactureEmailAction('f_x', null);
    expect(r.error).toContain('courriel');
  });
});

describe('sendSuiviEmailAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await sendSuiviEmailAction('bdc_x', null)).toEqual({
      error: 'Non authentifié',
    });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await sendSuiviEmailAction('bdc_x', null)).toEqual({
      error: 'Aucun workshop actif',
    });
  });

  it('refuse si BDT introuvable', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce(null);
    const r = await sendSuiviEmailAction('bdc_orphan', null);
    expect(r.error).toBeDefined();
  });
});
