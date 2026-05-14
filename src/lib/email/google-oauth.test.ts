import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.stubEnv('GOOGLE_CLIENT_ID', 'fake_client_id');
  vi.stubEnv('GOOGLE_CLIENT_SECRET', 'fake_secret');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('googleClientId / googleClientSecret', () => {
  it('renvoient les valeurs env si présentes', async () => {
    const { googleClientId, googleClientSecret } = await import('./google-oauth');
    expect(googleClientId()).toBe('fake_client_id');
    expect(googleClientSecret()).toBe('fake_secret');
  });

  it('throw si GOOGLE_CLIENT_ID manquant', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', '');
    const { googleClientId } = await import('./google-oauth');
    expect(() => googleClientId()).toThrow(/GOOGLE_CLIENT_ID/);
  });

  it('throw si GOOGLE_CLIENT_SECRET manquant', async () => {
    vi.stubEnv('GOOGLE_CLIENT_SECRET', '');
    const { googleClientSecret } = await import('./google-oauth');
    expect(() => googleClientSecret()).toThrow(/GOOGLE_CLIENT_SECRET/);
  });
});

describe('googleScopes', () => {
  it("défaut = gmail.compose (sans envoi automatique)", async () => {
    const { googleScopes } = await import('./google-oauth');
    expect(googleScopes()).toBe('https://www.googleapis.com/auth/gmail.compose');
  });

  it('override via GOOGLE_OAUTH_SCOPES env', async () => {
    vi.stubEnv('GOOGLE_OAUTH_SCOPES', 'custom.scope.x');
    const { googleScopes } = await import('./google-oauth');
    expect(googleScopes()).toBe('custom.scope.x');
  });
});

describe('buildRedirectUri', () => {
  it("utilise url.host par défaut (pas de x-forwarded-*)", async () => {
    const { buildRedirectUri } = await import('./google-oauth');
    const req = new Request('https://flex.app/api/auth/google/start');
    expect(buildRedirectUri(req)).toBe(
      'https://flex.app/api/auth/google/callback',
    );
  });

  it("respecte x-forwarded-host (prod Vercel)", async () => {
    const { buildRedirectUri } = await import('./google-oauth');
    const req = new Request('https://internal:3000/api/auth/google/start', {
      headers: { 'x-forwarded-host': 'flex-tan.vercel.app' },
    });
    expect(buildRedirectUri(req)).toMatch(
      /^https?:\/\/flex-tan\.vercel\.app\/api\/auth\/google\/callback$/,
    );
  });

  it("respecte x-forwarded-proto (https derrière proxy)", async () => {
    const { buildRedirectUri } = await import('./google-oauth');
    const req = new Request('http://insecure.example/api/x', {
      headers: { 'x-forwarded-proto': 'https' },
    });
    expect(buildRedirectUri(req).startsWith('https://')).toBe(true);
  });
});

describe('buildAuthUrl', () => {
  it('contient les params OAuth obligatoires', async () => {
    const { buildAuthUrl } = await import('./google-oauth');
    const url = buildAuthUrl({
      redirectUri: 'https://flex.app/api/auth/google/callback',
      state: 'state_xyz',
    });
    expect(url).toContain('accounts.google.com/o/oauth2/v2/auth');
    expect(url).toContain('client_id=fake_client_id');
    expect(url).toContain('response_type=code');
    expect(url).toContain('access_type=offline');
    expect(url).toContain('prompt=consent');
    expect(url).toContain('state=state_xyz');
    expect(url).toContain('include_granted_scopes=true');
  });

  it('encode redirectUri', async () => {
    const { buildAuthUrl } = await import('./google-oauth');
    const url = buildAuthUrl({
      redirectUri: 'https://flex.app/api/auth/google/callback?x=1',
      state: 's',
    });
    expect(url).toContain('redirect_uri=https%3A%2F%2Fflex.app');
  });

  it('inclut login_hint si fourni', async () => {
    const { buildAuthUrl } = await import('./google-oauth');
    const url = buildAuthUrl({
      redirectUri: 'https://x',
      state: 's',
      loginHint: 'yako@gmail.com',
    });
    expect(url).toContain('login_hint=yako%40gmail.com');
  });

  it("pas de login_hint si absent", async () => {
    const { buildAuthUrl } = await import('./google-oauth');
    const url = buildAuthUrl({ redirectUri: 'https://x', state: 's' });
    expect(url).not.toContain('login_hint');
  });
});

describe('exchangeCodeForTokens', () => {
  it('POST le token endpoint et retourne le JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'at_x',
        refresh_token: 'rt_x',
        expires_in: 3600,
        scope: 'gmail.compose',
        token_type: 'Bearer',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { exchangeCodeForTokens } = await import('./google-oauth');
    const r = await exchangeCodeForTokens({
      code: 'code_abc',
      redirectUri: 'https://x/callback',
    });

    expect(r.access_token).toBe('at_x');
    expect(r.refresh_token).toBe('rt_x');

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://oauth2.googleapis.com/token');
    expect(init.method).toBe('POST');
    expect(init.body.toString()).toContain('code=code_abc');
    expect(init.body.toString()).toContain('grant_type=authorization_code');
  });

  it('throw si réponse non-ok', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'invalid_grant',
    });
    vi.stubGlobal('fetch', fetchMock);

    const { exchangeCodeForTokens } = await import('./google-oauth');
    await expect(
      exchangeCodeForTokens({ code: 'bad', redirectUri: 'x' }),
    ).rejects.toThrow(/400 invalid_grant/);
  });
});

describe('refreshAccessToken', () => {
  it('POST le token endpoint avec grant_type=refresh_token', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'at_new',
        expires_in: 3600,
        scope: 'gmail.compose',
        token_type: 'Bearer',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { refreshAccessToken } = await import('./google-oauth');
    const r = await refreshAccessToken('rt_x');

    expect(r.access_token).toBe('at_new');
    const init = fetchMock.mock.calls[0]![1];
    expect(init.body.toString()).toContain('refresh_token=rt_x');
    expect(init.body.toString()).toContain('grant_type=refresh_token');
  });

  it('throw si refresh refusé', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'invalid_token',
    });
    vi.stubGlobal('fetch', fetchMock);

    const { refreshAccessToken } = await import('./google-oauth');
    await expect(refreshAccessToken('rt_bad')).rejects.toThrow(/401 invalid_token/);
  });
});

describe('fetchUserInfo', () => {
  it('GET userinfo + Bearer header', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: '1234',
        email: 'yako@gmail.com',
        verified_email: true,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { fetchUserInfo } = await import('./google-oauth');
    const r = await fetchUserInfo('at_x');

    expect(r.email).toBe('yako@gmail.com');
    expect(fetchMock.mock.calls[0]![1].headers.Authorization).toBe('Bearer at_x');
  });

  it('throw si userinfo échoue', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false, status: 401 });
    vi.stubGlobal('fetch', fetchMock);

    const { fetchUserInfo } = await import('./google-oauth');
    await expect(fetchUserInfo('at_bad')).rejects.toThrow(/UserInfo failed: 401/);
  });
});

describe('revokeToken', () => {
  it('POST sur le revoke endpoint avec token encodé', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const { revokeToken } = await import('./google-oauth');
    await revokeToken('rt with spaces');

    const url = fetchMock.mock.calls[0]![0] as string;
    expect(url).toContain('https://oauth2.googleapis.com/revoke?token=');
    expect(url).toContain('rt%20with%20spaces');
  });

  it("ignore silencieusement les erreurs (best-effort)", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false, status: 400 });
    vi.stubGlobal('fetch', fetchMock);

    const { revokeToken } = await import('./google-oauth');
    await expect(revokeToken('rt_x')).resolves.toBeUndefined();
  });
});
