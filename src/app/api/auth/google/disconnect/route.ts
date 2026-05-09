import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { revokeToken } from '@/lib/email/google-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/auth/google/disconnect — révoque le refresh_token côté Google
// et supprime googleRefreshToken + googleEmail du Workshop.
export async function POST() {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });
  const workshop = await getActiveWorkshop();
  if (!workshop) return new NextResponse('No active workshop', { status: 403 });

  if (workshop.googleRefreshToken) {
    await revokeToken(workshop.googleRefreshToken);
  }
  await prisma.workshop.update({
    where: { id: workshop.id },
    data: { googleRefreshToken: null, googleEmail: null },
  });
  return NextResponse.json({ ok: true });
}
