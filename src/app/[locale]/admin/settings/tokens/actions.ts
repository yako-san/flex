'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { sanitizeTheme, type WorkshopTheme } from '@/lib/theme/types';

export type SaveTokensInput = Record<string, string>;
export type SaveTokensResult = { ok: true; theme: WorkshopTheme } | { ok: false; error: string };

/**
 * Reçoit un JSON de tokens depuis l'éditeur `/admin/settings/tokens`.
 * Les clés peuvent être préfixées `--t-` (convention de l'éditeur
 * standalone) ou non — on normalise en retirant `--t-` puis `--`.
 *
 * Validation via `sanitizeTheme` : clés/valeurs non conformes sont
 * silencieusement écartées. La sortie est ce qui sera effectivement
 * persisté + appliqué par `<TenantThemeStyle>`.
 */
export async function saveTokensAction(input: SaveTokensInput): Promise<SaveTokensResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { ok: false, error: 'Aucun workshop actif' };

  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Payload invalide' };
  }

  // Normalise les clés : --t-jaune → jaune, --jaune → jaune, jaune → jaune.
  const normalized: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) {
    if (typeof v !== 'string') continue;
    const key = k.replace(/^--t-/, '').replace(/^--/, '');
    normalized[key] = v;
  }

  const sanitized = sanitizeTheme(normalized);

  await prisma.workshop.update({
    where: { id: workshop.id },
    data: { theme: sanitized as object },
  });

  revalidatePath('/[locale]/admin', 'layout');
  return { ok: true, theme: sanitized };
}

export async function resetTokensAction(): Promise<SaveTokensResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { ok: false, error: 'Aucun workshop actif' };

  await prisma.workshop.update({
    where: { id: workshop.id },
    data: { theme: Prisma.JsonNull },
  });

  revalidatePath('/[locale]/admin', 'layout');
  return { ok: true, theme: {} };
}
