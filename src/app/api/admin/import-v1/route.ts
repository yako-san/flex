import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { handleImportV1 } from '@/lib/import/import-v1-handler';

// Endpoint dédié à l'import du dump v1.
// Usage: POST /api/admin/import-v1
//   Headers: x-admin-token: <IMPORT_V1_ADMIN_TOKEN env>
//   Body: V1Dump JSON (cf src/lib/import/import-v1.ts)
//
// Garde double : session Clerk + token admin. Le token évite qu'un compte
// utilisateur compromis puisse déclencher un import. Une fois la couche
// rôles/permissions implémentée, on remplacera le token par un check
// orgRole === 'admin'.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // jamais cacher / prerender

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const adminToken = req.headers.get('x-admin-token');

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Body JSON invalide' },
      { status: 400 },
    );
  }

  const result = await handleImportV1(prisma, {
    userId,
    adminToken,
    expectedAdminToken: process.env['IMPORT_V1_ADMIN_TOKEN'],
    rawBody,
  });

  return NextResponse.json(result.body, { status: result.status });
}
