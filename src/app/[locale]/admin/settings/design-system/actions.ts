'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { sanitizeTheme, type WorkshopTheme } from '@/lib/theme/types';

export type ThemeState = { error?: string; success?: boolean };

// Sous-ensemble des clés exposées dans l'éditeur Design System. On ne
// laisse pas l'éditeur écraser toute la palette (statuts, étapes…) tant
// que ces sliders ne sont pas dans l'UI — juste les bases demandées.
const ALLOWED_KEYS = new Set<keyof WorkshopTheme>([
  'jaune',
  'app-bg',
  'app-bg-light',
  'h1-size', 'h1-color', 'h1-weight',
  'h2-size', 'h2-color', 'h2-weight',
  'h3-size', 'h3-color', 'h3-weight',
  'h4-size', 'h4-color', 'h4-weight',
  'h5-size', 'h5-color', 'h5-weight',
]);

export async function saveDesignSystemAction(
  _prev: ThemeState | null,
  formData: FormData,
): Promise<ThemeState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  // Construit un objet brut à partir du FormData puis passe par
  // `sanitizeTheme` (rejette clés/valeurs invalides). Une valeur vide
  // signifie « supprimer cet override » — on l'omet.
  const raw: Record<string, string> = {};
  for (const key of ALLOWED_KEYS) {
    const v = formData.get(key);
    if (typeof v !== 'string' || v.trim() === '') continue;
    raw[key] = v.trim();
  }
  const sanitized = sanitizeTheme(raw);

  await prisma.workshop.update({
    where: { id: workshop.id },
    data: { theme: sanitized as object },
  });

  revalidatePath('/[locale]/admin', 'layout');
  return { success: true };
}

export async function resetDesignSystemAction(): Promise<ThemeState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  await prisma.workshop.update({
    where: { id: workshop.id },
    data: { theme: Prisma.JsonNull },
  });

  revalidatePath('/[locale]/admin', 'layout');
  return { success: true };
}
