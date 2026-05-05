'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';

const MAX_LOGO_BYTES = 500_000; // 500 KB cap (raisonnable pour PNG)

export type LogoState = { error?: string; success?: boolean };

export async function uploadLogoAction(
  _prev: LogoState | null,
  formData: FormData,
): Promise<LogoState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const file = formData.get('logo');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Aucun fichier sélectionné' };
  }

  if (file.size > MAX_LOGO_BYTES) {
    return { error: `Fichier trop gros (${(file.size / 1024).toFixed(0)} KB > 500 KB max)` };
  }

  if (!file.type.startsWith('image/')) {
    return { error: `Type de fichier non supporté : ${file.type}` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;

  await prisma.workshop.update({
    where: { id: workshop.id },
    data: { logoBase64: dataUrl },
  });

  revalidatePath('/[locale]/admin/settings', 'page');
  revalidatePath('/api/workshop/logo', 'page');
  return { success: true };
}

export async function removeLogoAction(): Promise<LogoState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  await prisma.workshop.update({
    where: { id: workshop.id },
    data: { logoBase64: null },
  });

  revalidatePath('/[locale]/admin/settings', 'page');
  revalidatePath('/api/workshop/logo', 'page');
  return { success: true };
}
