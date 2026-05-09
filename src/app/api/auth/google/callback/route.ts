import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import {
  buildRedirectUri,
  exchangeCodeForTokens,
  fetchUserInfo,
} from '@/lib/email/google-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Callback OAuth Google. Reçoit `code` et `state`, échange contre tokens,
// extrait l'email, persiste refresh_token + email sur Workshop. Redirect
// vers /admin/settings avec un toast de succès / erreur.
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });
  const workshop = await getActiveWorkshop();
  if (!workshop) return new NextResponse('No active workshop', { status: 403 });

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  const settingsUrl = (msg: string, ok = false) => {
    const u = new URL('/fr-CA/admin/settings', url.origin);
    u.searchParams.set(ok ? 'gmail_ok' : 'gmail_err', msg);
    return NextResponse.redirect(u);
  };

  if (errorParam) {
    return settingsUrl(`Google OAuth refusé: ${errorParam}`);
  }
  if (!code || !state) {
    return settingsUrl('Réponse OAuth incomplète (code/state manquant)');
  }

  // Vérifie le state cookie (CSRF)
  const cookieStore = await cookies();
  const expectedState = cookieStore.get('google_oauth_state')?.value;
  if (!expectedState || expectedState !== state) {
    return settingsUrl('State OAuth invalide (CSRF protection)');
  }
  // Vérifie que le state correspond bien au workshop actif
  const [stateWorkshopId] = state.split('.');
  if (stateWorkshopId !== workshop.id) {
    return settingsUrl('Workshop différent entre démarrage OAuth et retour');
  }

  try {
    const tokens = await exchangeCodeForTokens({
      code,
      redirectUri: buildRedirectUri(req),
    });
    if (!tokens.refresh_token) {
      return settingsUrl(
        "Aucun refresh_token reçu — déconnecte d'abord l'app dans tes permissions Google puis réessaie",
      );
    }
    const info = await fetchUserInfo(tokens.access_token);

    await prisma.workshop.update({
      where: { id: workshop.id },
      data: {
        googleRefreshToken: tokens.refresh_token,
        googleEmail: info.email,
      },
    });

    const res = settingsUrl(`Connecté à ${info.email}`, true);
    res.cookies.delete('google_oauth_state');
    return res;
  } catch (err) {
    return settingsUrl(
      `Échec OAuth: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
