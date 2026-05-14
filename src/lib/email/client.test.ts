import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('getEmailProvider', () => {
  it('GMAIL si Gmail configuré (peu importe Resend)', async () => {
    vi.resetModules();
    vi.stubEnv('GMAIL_USER', 'yako@gmail.com');
    vi.stubEnv('GMAIL_APP_PASSWORD', 'pass');
    vi.stubEnv('RESEND_API_KEY', 're_test');

    const { getEmailProvider } = await import('./client');
    expect(getEmailProvider()).toBe('GMAIL');
  });

  it('RESEND si Gmail absent mais Resend présent', async () => {
    vi.resetModules();
    vi.stubEnv('GMAIL_USER', '');
    vi.stubEnv('GMAIL_APP_PASSWORD', '');
    vi.stubEnv('RESEND_API_KEY', 're_test');

    const { getEmailProvider } = await import('./client');
    expect(getEmailProvider()).toBe('RESEND');
  });

  it("NONE si rien n'est configuré", async () => {
    vi.resetModules();
    vi.stubEnv('GMAIL_USER', '');
    vi.stubEnv('GMAIL_APP_PASSWORD', '');
    vi.stubEnv('RESEND_API_KEY', '');

    const { getEmailProvider } = await import('./client');
    expect(getEmailProvider()).toBe('NONE');
  });
});

describe('isEmailConfigured', () => {
  it('true si au moins un provider', async () => {
    vi.resetModules();
    vi.stubEnv('GMAIL_USER', 'yako@gmail.com');
    vi.stubEnv('GMAIL_APP_PASSWORD', 'pass');

    const { isEmailConfigured } = await import('./client');
    expect(isEmailConfigured()).toBe(true);
  });

  it('false si NONE', async () => {
    vi.resetModules();
    vi.stubEnv('GMAIL_USER', '');
    vi.stubEnv('GMAIL_APP_PASSWORD', '');
    vi.stubEnv('RESEND_API_KEY', '');

    const { isEmailConfigured } = await import('./client');
    expect(isEmailConfigured()).toBe(false);
  });
});

describe('getResend', () => {
  it('throw si RESEND_API_KEY manquant', async () => {
    vi.resetModules();
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('GMAIL_USER', '');
    vi.stubEnv('GMAIL_APP_PASSWORD', '');

    const { getResend } = await import('./client');
    expect(() => getResend()).toThrow(/RESEND_API_KEY/);
  });
});
