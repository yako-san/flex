import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getActiveWorkshop } from '@/lib/workshop';
import { buildAuthUrl, buildRedirectUri } from '@/lib/email/google-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Démarre le flow OAuth Google : génère un state aléatoire signé, le
// stocke en cookie HttpOnly, redirect vers Google. Le callback vérifiera
// le state pour CSRF + extraira le workshopId.
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });
  const workshop = await getActiveWorkshop();
  if (!workshop) return new NextResponse('No active workshop', { status: 403 });

  // state = workshopId.nonce — vérifie au callback que le state est intact
  const nonce = crypto.randomBytes(16).toString('hex');
  const state = `${workshop.id}.${nonce}`;
  const redirectUri = buildRedirectUri(req);
  const authUrl = buildAuthUrl({
    redirectUri,
    state,
    // login_hint si l'admin a déjà connecté un Gmail au workshop
    loginHint: workshop.googleEmail ?? undefined,
  });

  const res = NextResponse.redirect(authUrl);
  // Cookie HttpOnly pour valider le state au retour (protection CSRF)
  res.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 min
    path: '/',
  });
  return res;
}
