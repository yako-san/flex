import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// On utilise vi.stubEnv plutôt que mocker process.env pour rester proche
// du comportement Vercel runtime.

describe('gmailFromAddress', () => {
  beforeEach(() => {
    vi.stubEnv('GMAIL_USER', 'yako.cyclo@gmail.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sans displayName → juste l'adresse GMAIL_USER", async () => {
    const { gmailFromAddress } = await import('./gmail');
    expect(gmailFromAddress()).toBe('yako.cyclo@gmail.com');
  });

  it('avec displayName → "Display <user@gmail.com>"', async () => {
    const { gmailFromAddress } = await import('./gmail');
    expect(gmailFromAddress('Yako Cyclo')).toBe('Yako Cyclo <yako.cyclo@gmail.com>');
  });

  it('displayName null traité comme absent', async () => {
    const { gmailFromAddress } = await import('./gmail');
    expect(gmailFromAddress(null)).toBe('yako.cyclo@gmail.com');
  });

  it("GMAIL_USER absent → chaîne vide (format invalide mais pas crash)", async () => {
    vi.stubEnv('GMAIL_USER', '');
    const { gmailFromAddress } = await import('./gmail');
    expect(gmailFromAddress()).toBe('');
    expect(gmailFromAddress('Yako')).toBe('Yako <>');
  });
});

describe('isGmailConfigured', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('GMAIL_USER + GMAIL_APP_PASSWORD présents → true', async () => {
    vi.stubEnv('GMAIL_USER', 'yako@gmail.com');
    vi.stubEnv('GMAIL_APP_PASSWORD', 'abcdefghijklmnop');
    const { isGmailConfigured } = await import('./gmail');
    expect(isGmailConfigured()).toBe(true);
  });

  it('GMAIL_USER seul → false', async () => {
    vi.stubEnv('GMAIL_USER', 'yako@gmail.com');
    vi.stubEnv('GMAIL_APP_PASSWORD', '');
    const { isGmailConfigured } = await import('./gmail');
    expect(isGmailConfigured()).toBe(false);
  });

  it('GMAIL_APP_PASSWORD seul → false', async () => {
    vi.stubEnv('GMAIL_USER', '');
    vi.stubEnv('GMAIL_APP_PASSWORD', 'abcdef');
    const { isGmailConfigured } = await import('./gmail');
    expect(isGmailConfigured()).toBe(false);
  });

  it('aucun → false', async () => {
    vi.stubEnv('GMAIL_USER', '');
    vi.stubEnv('GMAIL_APP_PASSWORD', '');
    const { isGmailConfigured } = await import('./gmail');
    expect(isGmailConfigured()).toBe(false);
  });
});

describe('getGmailTransporter', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('throw si GMAIL_USER manquant', async () => {
    vi.resetModules();
    vi.stubEnv('GMAIL_USER', '');
    vi.stubEnv('GMAIL_APP_PASSWORD', 'pass');
    const { getGmailTransporter } = await import('./gmail');
    expect(() => getGmailTransporter()).toThrow(/GMAIL_USER ou GMAIL_APP_PASSWORD/);
  });

  it('throw si GMAIL_APP_PASSWORD manquant', async () => {
    vi.resetModules();
    vi.stubEnv('GMAIL_USER', 'yako@gmail.com');
    vi.stubEnv('GMAIL_APP_PASSWORD', '');
    const { getGmailTransporter } = await import('./gmail');
    expect(() => getGmailTransporter()).toThrow(/GMAIL_USER ou GMAIL_APP_PASSWORD/);
  });
});
