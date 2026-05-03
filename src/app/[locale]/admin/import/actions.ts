'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { handleImportV1, type ImportV1HandlerResult } from '@/lib/import/import-v1-handler';

// Server action invoquée par le formulaire d'upload admin.
// Pas besoin du token x-admin-token : la garde Clerk (userId) suffit côté UI
// authentifiée. Le token reste obligatoire pour les appels REST directs à
// /api/admin/import-v1 (scénarios CI, scripts).
export async function importDumpAction(
  _prev: ImportV1HandlerResult | null,
  formData: FormData,
): Promise<ImportV1HandlerResult> {
  const file = formData.get('dump');
  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      status: 400,
      body: { error: 'Aucun fichier sélectionné' },
    };
  }

  let rawBody: unknown;
  try {
    const text = await file.text();
    rawBody = JSON.parse(text);
  } catch (err) {
    return {
      ok: false,
      status: 400,
      body: {
        error: 'Fichier JSON invalide',
        details: err instanceof Error ? err.message : String(err),
      },
    };
  }

  const { userId } = await auth();
  const adminToken = process.env['IMPORT_V1_ADMIN_TOKEN'];

  // On passe le token attendu en tant que token reçu : la garde token est
  // contournée puisqu'on est dans le contexte UI authentifié.
  return handleImportV1(prisma, {
    userId,
    adminToken: adminToken ?? null,
    expectedAdminToken: adminToken,
    rawBody,
  });
}
