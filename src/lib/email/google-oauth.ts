// Helpers pour le flow OAuth Google (Gmail draft).
//
// Le scope minimal nécessaire est `https://www.googleapis.com/auth/gmail.compose`
// qui permet de créer/modifier des brouillons côté boîte de l'utilisateur
// connecté, mais PAS d'envoyer de courriels (l'utilisateur valide manuellement
// dans Gmail). C'est volontaire pour préserver le filet de relecture.
//
// Le refresh_token reçu lors du premier consent permet de générer des
// access_token frais sans demander à l'utilisateur de se reconnecter.

const GOOGLE_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export function googleClientId(): string {
  const v = process.env['GOOGLE_CLIENT_ID'];
  if (!v) throw new Error('GOOGLE_CLIENT_ID env var manquante');
  return v;
}

export function googleClientSecret(): string {
  const v = process.env['GOOGLE_CLIENT_SECRET'];
  if (!v) throw new Error('GOOGLE_CLIENT_SECRET env var manquante');
  return v;
}

export function googleScopes(): string {
  return (
    process.env['GOOGLE_OAUTH_SCOPES'] ?? 'https://www.googleapis.com/auth/gmail.compose'
  );
}

// L'URL de redirect doit matcher EXACTEMENT une des URIs autorisées côté
// Google Cloud Console. Construite à partir de la requête entrante pour
// supporter prod / preview / localhost.
export function buildRedirectUri(req: Request): string {
  const url = new URL(req.url);
  // En prod Vercel, x-forwarded-host est plus fiable
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto');
  const host = forwardedHost ?? url.host;
  const proto = forwardedProto ?? url.protocol.replace(':', '');
  return `${proto}://${host}/api/auth/google/callback`;
}

export function buildAuthUrl(opts: {
  redirectUri: string;
  state: string;
  loginHint?: string | undefined;
}): string {
  const params = new URLSearchParams({
    client_id: googleClientId(),
    redirect_uri: opts.redirectUri,
    response_type: 'code',
    scope: googleScopes(),
    access_type: 'offline', // pour recevoir un refresh_token
    prompt: 'consent', // force le consent screen pour avoir un nouveau refresh_token
    state: opts.state,
    include_granted_scopes: 'true',
  });
  if (opts.loginHint) params.set('login_hint', opts.loginHint);
  return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
}

export type GoogleTokens = {
  access_token: string;
  expires_in: number; // secondes
  refresh_token?: string; // présent au 1er consent uniquement
  scope: string;
  token_type: 'Bearer';
};

export async function exchangeCodeForTokens(opts: {
  code: string;
  redirectUri: string;
}): Promise<GoogleTokens> {
  const body = new URLSearchParams({
    code: opts.code,
    client_id: googleClientId(),
    client_secret: googleClientSecret(),
    redirect_uri: opts.redirectUri,
    grant_type: 'authorization_code',
  });
  const r = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Échange code → tokens échoué: ${r.status} ${err}`);
  }
  return (await r.json()) as GoogleTokens;
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: 'Bearer';
}> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: googleClientId(),
    client_secret: googleClientSecret(),
    grant_type: 'refresh_token',
  });
  const r = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Refresh token échoué: ${r.status} ${err}`);
  }
  return (await r.json()) as ReturnType<typeof refreshAccessToken> extends Promise<infer T> ? T : never;
}

export async function fetchUserInfo(accessToken: string): Promise<{
  id: string;
  email: string;
  verified_email: boolean;
}> {
  const r = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error(`UserInfo failed: ${r.status}`);
  return (await r.json()) as { id: string; email: string; verified_email: boolean };
}

// Révoque un token Google (refresh ou access). Best-effort — Google ne
// retourne pas toujours d'erreur même si le token n'existe plus.
export async function revokeToken(token: string): Promise<void> {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}
