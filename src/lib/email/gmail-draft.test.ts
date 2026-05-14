import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./google-oauth', () => ({
  refreshAccessToken: vi.fn(),
}));

import { refreshAccessToken } from './google-oauth';
import { createGmailDraft } from './gmail-draft';

const mockRefresh = vi.mocked(refreshAccessToken);

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

const BASE = {
  refreshToken: 'rt_x',
  to: 'client@example.com',
  from: 'shop@yako.cc',
  subject: 'Test',
  htmlBody: '<p>Hi</p>',
};

describe('createGmailDraft', () => {
  it('refresh échoue → error renvoyé sans appel API', async () => {
    mockRefresh.mockRejectedValueOnce(new Error('invalid_grant'));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const r = await createGmailDraft(BASE);

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain('Refresh token invalide');
      expect(r.error).toContain('invalid_grant');
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('happy path : draftId + messageId retournés', async () => {
    mockRefresh.mockResolvedValueOnce({ access_token: 'at_x' } as never);
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'd_42', message: { id: 'm_99' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const r = await createGmailDraft(BASE);

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.draftId).toBe('d_42');
      expect(r.messageId).toBe('m_99');
    }
  });

  it('utilise Bearer accessToken depuis refreshAccessToken', async () => {
    mockRefresh.mockResolvedValueOnce({ access_token: 'at_NEW' } as never);
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'd', message: { id: 'm' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await createGmailDraft(BASE);

    const init = fetchMock.mock.calls[0]![1];
    expect(init.headers.Authorization).toBe('Bearer at_NEW');
  });

  it('POST sur le drafts endpoint', async () => {
    mockRefresh.mockResolvedValueOnce({ access_token: 'at' } as never);
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'd', message: { id: 'm' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await createGmailDraft(BASE);

    expect(fetchMock.mock.calls[0]![0]).toBe(
      'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
    );
    expect(fetchMock.mock.calls[0]![1].method).toBe('POST');
  });

  it('body contient un message.raw base64url-encodé', async () => {
    mockRefresh.mockResolvedValueOnce({ access_token: 'at' } as never);
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'd', message: { id: 'm' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await createGmailDraft(BASE);

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
    expect(body.message.raw).toBeDefined();
    // base64url : pas de +, /, ni =
    expect(body.message.raw).not.toContain('+');
    expect(body.message.raw).not.toContain('/');
    expect(body.message.raw).not.toContain('=');
  });

  it("MIME décodé contient les headers To/From/Subject", async () => {
    mockRefresh.mockResolvedValueOnce({ access_token: 'at' } as never);
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'd', message: { id: 'm' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await createGmailDraft({
      ...BASE,
      to: 'foo@x.com',
      from: 'bar@y.com',
      subject: 'Hello',
    });

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
    // Reverse base64url → base64 → decode
    const b64 = body.message.raw
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(body.message.raw.length + ((4 - (body.message.raw.length % 4)) % 4), '=');
    const decoded = Buffer.from(b64, 'base64').toString('utf-8');
    expect(decoded).toContain('To: foo@x.com');
    expect(decoded).toContain('From: bar@y.com');
    expect(decoded).toContain('Subject: Hello');
    expect(decoded).toContain('Content-Type: multipart/mixed');
  });

  it("subject non-ASCII encodé RFC 2047 (B-encoding)", async () => {
    mockRefresh.mockResolvedValueOnce({ access_token: 'at' } as never);
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'd', message: { id: 'm' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await createGmailDraft({ ...BASE, subject: 'Évaluation #0042' });

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
    const b64 = body.message.raw
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(body.message.raw.length + ((4 - (body.message.raw.length % 4)) % 4), '=');
    const decoded = Buffer.from(b64, 'base64').toString('utf-8');
    expect(decoded).toContain('Subject: =?UTF-8?B?');
  });

  it("attachment ajouté : MIME contient Content-Disposition: attachment", async () => {
    mockRefresh.mockResolvedValueOnce({ access_token: 'at' } as never);
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'd', message: { id: 'm' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await createGmailDraft({
      ...BASE,
      attachments: [
        {
          filename: 'eval-0042.pdf',
          content: Buffer.from('%PDF-fake'),
        },
      ],
    });

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
    const b64 = body.message.raw
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(body.message.raw.length + ((4 - (body.message.raw.length % 4)) % 4), '=');
    const decoded = Buffer.from(b64, 'base64').toString('utf-8');
    expect(decoded).toContain('Content-Disposition: attachment; filename="eval-0042.pdf"');
    expect(decoded).toContain('Content-Type: application/pdf');
  });

  it("guess content-type PDF par défaut", async () => {
    mockRefresh.mockResolvedValueOnce({ access_token: 'at' } as never);
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'd', message: { id: 'm' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await createGmailDraft({
      ...BASE,
      attachments: [{ filename: 'invoice.pdf', content: Buffer.from('x') }],
    });
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
    const decoded = Buffer.from(
      body.message.raw.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf-8');
    expect(decoded).toContain('application/pdf');
  });

  it("guess content-type image PNG", async () => {
    mockRefresh.mockResolvedValueOnce({ access_token: 'at' } as never);
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'd', message: { id: 'm' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await createGmailDraft({
      ...BASE,
      attachments: [{ filename: 'logo.PNG', content: Buffer.from('x') }],
    });
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
    const decoded = Buffer.from(
      body.message.raw.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf-8');
    expect(decoded).toContain('image/png');
  });

  it("contentType custom respecté", async () => {
    mockRefresh.mockResolvedValueOnce({ access_token: 'at' } as never);
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'd', message: { id: 'm' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await createGmailDraft({
      ...BASE,
      attachments: [
        {
          filename: 'data.bin',
          content: Buffer.from('x'),
          contentType: 'application/custom',
        },
      ],
    });
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
    const decoded = Buffer.from(
      body.message.raw.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf-8');
    expect(decoded).toContain('application/custom');
  });

  it('API error 4xx → ok:false avec message tronqué', async () => {
    mockRefresh.mockResolvedValueOnce({ access_token: 'at' } as never);
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'a'.repeat(500), // texte long
    });
    vi.stubGlobal('fetch', fetchMock);

    const r = await createGmailDraft(BASE);

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain('403');
      // Tronqué à 200 chars
      expect(r.error.length).toBeLessThan(250);
    }
  });
});
