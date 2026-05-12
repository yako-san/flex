import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { deleteBdcPhoto } from '@/lib/storage/blob';
import { purgeOrphanPhotos } from '@/lib/storage/purge';

// Cron Vercel — exécute la purge périodique des photos BDT soft-supprimées.
//
// Déclenchement :
// - Vercel Cron via vercel.json (1×/jour, ex 03:00 UTC).
// - Vercel injecte le header `Authorization: Bearer <CRON_SECRET>` pour les
//   cron jobs. La var d'env `CRON_SECRET` doit être configurée côté Vercel.
//
// Sécurité : refuse 401 si pas le bon Bearer. En local on peut court-
// circuiter avec ?token=<secret> pour faciliter les tests manuels.

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Pas de secret configuré : on autorise (dev). Logger pour visibilité.
    console.warn('cron/purge-photos: CRON_SECRET non configuré — accès libre.');
    return true;
  }

  const auth = request.headers.get('authorization') ?? '';
  if (auth === `Bearer ${secret}`) return true;

  // Fallback querystring pour curl manuel pendant les tests.
  const url = new URL(request.url);
  if (url.searchParams.get('token') === secret) return true;

  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const olderThanDaysRaw = url.searchParams.get('olderThanDays');
  const olderThanDays = olderThanDaysRaw
    ? Math.max(1, Number(olderThanDaysRaw))
    : undefined;

  const result = await purgeOrphanPhotos(
    {
      prisma,
      deleteBlob: deleteBdcPhoto,
      logger: {
        warn: (msg, meta) => console.warn(msg, meta),
        info: (msg, meta) => console.log(msg, meta),
      },
    },
    olderThanDays ? { olderThanDays } : undefined,
  );

  return NextResponse.json({ ok: true, ...result });
}
