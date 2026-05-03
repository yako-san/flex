import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { importV1, type V1Dump, type ImportV1Options } from './import-v1';
import { persistImportV1, type PersistStats } from './persist-import-v1';

// =============================================================================
// Handler pur pour l'endpoint /api/admin/import-v1.
// Découplé de Next.js (NextRequest/NextResponse) pour permettre des tests
// d'intégration sans framework.
// =============================================================================

const v1DumpSchema = z.object({
  schemaVersion: z.string(),
  exportedAt: z.string(),
  appVersion: z.string(),
  workshop: z.object({
    id: z.string(),
    name: z.string(),
    lang: z.string(),
    currency: z.string(),
    timezone: z.string(),
  }),
  counters: z.object({ veloId: z.number(), factureNumero: z.number() }),
  // Listes : on accepte n'importe quel array d'objets — la validation fine
  // est déléguée aux transformateurs (qui collectent les invalides dans
  // `skipped` plutôt que d'échouer toute l'import).
  marques: z.array(z.unknown()),
  clients: z.array(z.unknown()),
  velos: z.array(z.unknown()),
  bdcs: z.array(z.unknown()),
  bdcsArchives: z.array(z.unknown()),
  ventes: z.array(z.unknown()),
  ventesArchives: z.array(z.unknown()),
  catalogue: z.object({
    pieces: z.array(z.unknown()),
    services: z.array(z.unknown()),
  }),
  pos: z.array(z.unknown()),
  equipe: z.array(z.unknown()),
});

export type ImportV1HandlerOk = {
  ok: true;
  status: 200;
  body: {
    workshopId: string;
    stats: PersistStats;
    skippedCount: number;
  };
};

export type ImportV1HandlerErr = {
  ok: false;
  status: 400 | 401 | 403 | 500;
  body: { error: string; details?: unknown };
};

export type ImportV1HandlerResult = ImportV1HandlerOk | ImportV1HandlerErr;

export type ImportV1HandlerInput = {
  userId: string | null; // résultat de auth() côté Clerk
  adminToken: string | null; // header x-admin-token
  expectedAdminToken: string | undefined; // env IMPORT_V1_ADMIN_TOKEN
  rawBody: unknown;
  options?: ImportV1Options;
};

export async function handleImportV1(
  prisma: PrismaClient,
  input: ImportV1HandlerInput,
): Promise<ImportV1HandlerResult> {
  // 1. Auth Clerk
  if (!input.userId) {
    return { ok: false, status: 401, body: { error: 'Authentification requise' } };
  }

  // 2. Token admin (deuxième barrière contre les imports accidentels)
  if (!input.expectedAdminToken) {
    return {
      ok: false,
      status: 500,
      body: { error: 'IMPORT_V1_ADMIN_TOKEN non configuré côté serveur' },
    };
  }
  if (input.adminToken !== input.expectedAdminToken) {
    return { ok: false, status: 403, body: { error: 'Token admin invalide' } };
  }

  // 3. Validation du dump
  const parsed = v1DumpSchema.safeParse(input.rawBody);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      body: { error: 'Dump v1 invalide', details: parsed.error.flatten() },
    };
  }

  // 4. Transformation + persistence
  try {
    const result = importV1(parsed.data as V1Dump, input.options);
    const stats = await persistImportV1(prisma, result);
    return {
      ok: true,
      status: 200,
      body: {
        workshopId: result.workshop.id,
        stats,
        skippedCount: result.skipped.length,
      },
    };
  } catch (err) {
    return {
      ok: false,
      status: 500,
      body: {
        error: 'Échec de l\'import',
        details: err instanceof Error ? err.message : String(err),
      },
    };
  }
}
