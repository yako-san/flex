import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Route publique : sert le logo du workshop "principal" (1er non-deleted) en PNG.
// Utilisée par <link rel="icon"> pour le favicon, et potentiellement page d'accueil.
//
// Pour multi-tenant futur : faire un sous-domaine ou paramètre query (workshop slug).
export async function GET() {
  const workshop = await prisma.workshop.findFirst({
    where: { deletedAt: null, logoBase64: { not: null } },
    select: { logoBase64: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!workshop?.logoBase64) {
    // Pas de logo configuré : 404 → le navigateur utilisera le favicon par défaut.
    return new NextResponse('No logo', { status: 404 });
  }

  const dataUrl = workshop.logoBase64;
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return new NextResponse('Invalid logo data', { status: 500 });
  const [, mime, b64] = match;
  const buffer = Buffer.from(b64!, 'base64');

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': mime!,
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  });
}
