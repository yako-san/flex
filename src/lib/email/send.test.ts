import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    emailLog: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('./client', () => ({
  getEmailProvider: vi.fn(),
  getResend: vi.fn(),
}));

vi.mock('./gmail', () => ({
  getGmailTransporter: vi.fn(),
}));

vi.mock('./gmail-draft', () => ({
  createGmailDraft: vi.fn(),
}));

import { prisma } from '@/lib/db';
import { getEmailProvider, getResend } from './client';
import { getGmailTransporter } from './gmail';
import { createGmailDraft } from './gmail-draft';
import { sendEmail } from './send';

const mockProvider = vi.mocked(getEmailProvider);
const mockGetResend = vi.mocked(getResend);
const mockGmailTransport = vi.mocked(getGmailTransporter);
const mockCreateDraft = vi.mocked(createGmailDraft);

const BASE = {
  workshopId: 'w_x',
  kind: 'BDT_EVAL' as never,
  to: 'client@example.com',
  from: 'shop@yako.cc',
  subject: 'Test',
  html: '<p>Hi</p>',
};

beforeEach(() => {
  mockProvider.mockReturnValue('GMAIL');
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('sendEmail mode=draft', () => {
  it('refuse si refreshToken absent → status FAILED', async () => {
    vi.mocked(prisma.emailLog.create).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.emailLog.update).mockResolvedValueOnce({} as never);

    const r = await sendEmail({ ...BASE, mode: 'draft' });

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain('Gmail non connecté');
    }
    expect(vi.mocked(prisma.emailLog.update).mock.calls[0]![0].data.status).toBe(
      'FAILED',
    );
    expect(mockCreateDraft).not.toHaveBeenCalled();
  });

  it('createGmailDraft échoue → status FAILED', async () => {
    vi.mocked(prisma.emailLog.create).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.emailLog.update).mockResolvedValueOnce({} as never);
    mockCreateDraft.mockResolvedValueOnce({ ok: false, error: 'Google 401' });

    const r = await sendEmail({
      ...BASE,
      mode: 'draft',
      googleRefreshToken: 'rt_x',
    });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('Google 401');
  });

  it('succès draft → status DRAFT + providerMsgId préfixé draft_', async () => {
    vi.mocked(prisma.emailLog.create).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.emailLog.update).mockResolvedValueOnce({} as never);
    mockCreateDraft.mockResolvedValueOnce({
      ok: true,
      draftId: 'd_ABC',
      messageId: 'msg_X',
    });

    const r = await sendEmail({
      ...BASE,
      mode: 'draft',
      googleRefreshToken: 'rt_x',
    });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.mode).toBe('draft');
      expect(r.providerMsgId).toBe('d_ABC');
    }
    const updateData = vi.mocked(prisma.emailLog.update).mock.calls[0]![0].data;
    expect(updateData.status).toBe('DRAFT');
    expect(updateData.providerMsgId).toBe('draft_d_ABC');
  });
});

describe('sendEmail mode=send', () => {
  it('provider NONE → status FAILED', async () => {
    mockProvider.mockReturnValueOnce('NONE');
    vi.mocked(prisma.emailLog.create).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.emailLog.update).mockResolvedValueOnce({} as never);

    const r = await sendEmail(BASE);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('Service courriel');
  });

  it('GMAIL : appelle transport.sendMail + status SENT', async () => {
    vi.mocked(prisma.emailLog.create).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.emailLog.update).mockResolvedValueOnce({} as never);
    const sendMail = vi.fn().mockResolvedValueOnce({ messageId: 'gmail_1' });
    mockGmailTransport.mockReturnValueOnce({ sendMail } as never);

    const r = await sendEmail(BASE);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.providerMsgId).toBe('gmail_1');
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'shop@yako.cc',
        to: 'client@example.com',
        subject: 'Test',
      }),
    );
    expect(vi.mocked(prisma.emailLog.update).mock.calls[0]![0].data.status).toBe(
      'SENT',
    );
  });

  it('RESEND : appelle resend.emails.send', async () => {
    mockProvider.mockReturnValueOnce('RESEND');
    vi.mocked(prisma.emailLog.create).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.emailLog.update).mockResolvedValueOnce({} as never);
    const send = vi
      .fn()
      .mockResolvedValueOnce({ data: { id: 're_msg_1' }, error: null });
    mockGetResend.mockReturnValueOnce({ emails: { send } } as never);

    const r = await sendEmail(BASE);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.providerMsgId).toBe('re_msg_1');
    expect(send).toHaveBeenCalled();
  });

  it("RESEND : si result.error → throw remonté en FAILED", async () => {
    mockProvider.mockReturnValueOnce('RESEND');
    vi.mocked(prisma.emailLog.create).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.emailLog.update).mockResolvedValueOnce({} as never);
    const send = vi.fn().mockResolvedValueOnce({
      data: null,
      error: { message: 'Resend bad domain' },
    });
    mockGetResend.mockReturnValueOnce({ emails: { send } } as never);

    const r = await sendEmail(BASE);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('Resend bad domain');
  });

  it('GMAIL : exception transport → FAILED', async () => {
    vi.mocked(prisma.emailLog.create).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.emailLog.update).mockResolvedValueOnce({} as never);
    const sendMail = vi.fn().mockRejectedValueOnce(new Error('SMTP timeout'));
    mockGmailTransport.mockReturnValueOnce({ sendMail } as never);

    const r = await sendEmail(BASE);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('SMTP timeout');
    expect(vi.mocked(prisma.emailLog.update).mock.calls[0]![0].data.status).toBe(
      'FAILED',
    );
  });

  it('exception non-Error → message générique', async () => {
    vi.mocked(prisma.emailLog.create).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.emailLog.update).mockResolvedValueOnce({} as never);
    const sendMail = vi.fn().mockRejectedValueOnce('panic');
    mockGmailTransport.mockReturnValueOnce({ sendMail } as never);

    const r = await sendEmail(BASE);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('Erreur provider inconnue');
  });

  it("crée toujours un EmailLog PENDING avant tentative", async () => {
    vi.mocked(prisma.emailLog.create).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.emailLog.update).mockResolvedValueOnce({} as never);
    const sendMail = vi.fn().mockResolvedValueOnce({ messageId: 'x' });
    mockGmailTransport.mockReturnValueOnce({ sendMail } as never);

    await sendEmail(BASE);

    const createCall = vi.mocked(prisma.emailLog.create).mock.calls[0]![0];
    expect(createCall.data.status).toBe('PENDING');
    expect(createCall.data.workshopId).toBe('w_x');
    expect(createCall.data.toEmail).toBe('client@example.com');
  });
});
