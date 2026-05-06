'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { generateId } from '@/lib/ids/generate-id';

const schema = z.object({ nom: z.string().trim().min(1, 'Nom requis') });

export type MarqueFormState = { error?: string; fieldErrors?: Record<string, string> };

function fe(parsed: ReturnType<typeof schema.safeParse>): Record<string, string> {
  if (parsed.success) return {};
  const fe: Record<string, string> = {};
  for (const i of parsed.error.issues) {
    const k = String(i.path[0] ?? '_');
    if (!fe[k]) fe[k] = i.message;
  }
  return fe;
}

export async function createMarqueAction(
  _p: MarqueFormState | null,
  formData: FormData,
): Promise<MarqueFormState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = schema.safeParse({ nom: formData.get('nom') });
  if (!parsed.success) return { error: 'Validation', fieldErrors: fe(parsed) };

  const existing = await prisma.marque.findFirst({
    where: { workshopId: workshop.id, nom: parsed.data.nom, deletedAt: null },
  });
  if (existing) return { error: `Marque "${parsed.data.nom}" déjà existante` };

  await prisma.marque.create({
    data: {
      id: generateId('marque'),
      workshopId: workshop.id,
      nom: parsed.data.nom,
    },
  });
  revalidatePath('/[locale]/admin/marques', 'page');
  redirect('/fr-CA/admin/marques');
}

export async function updateMarqueAction(
  marqueId: string,
  _p: MarqueFormState | null,
  formData: FormData,
): Promise<MarqueFormState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = schema.safeParse({ nom: formData.get('nom') });
  if (!parsed.success) return { error: 'Validation', fieldErrors: fe(parsed) };

  await prisma.marque.update({
    where: { id: marqueId },
    data: { nom: parsed.data.nom },
  });
  revalidatePath('/[locale]/admin/marques', 'page');
  redirect('/fr-CA/admin/marques');
}

export async function deleteMarqueAction(marqueId: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const m = await prisma.marque.findFirst({
    where: { id: marqueId, workshopId: workshop.id, deletedAt: null },
    include: { _count: { select: { velos: true } } },
  });
  if (!m) return { error: 'Marque introuvable' };
  if (m._count.velos > 0) {
    return { error: `Impossible : ${m._count.velos} vélo(s) utilisent cette marque.` };
  }
  await prisma.marque.update({
    where: { id: marqueId },
    data: { deletedAt: new Date() },
  });
  revalidatePath('/[locale]/admin/marques', 'page');
  redirect('/fr-CA/admin/marques');
}
