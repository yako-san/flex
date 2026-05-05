'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

// Lie le workshop fourni à l'org Clerk actuellement active.
// Garde-fous :
// - User authentifié (Clerk auth())
// - L'org passée doit être l'org active du user (sinon il pourrait
//   "voler" un workshop pour une org dont il n'est pas membre)
// - Le workshop ne doit pas être déjà lié à une autre org
export async function linkWorkshopToOrgAction(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const { userId, orgId: activeOrgId } = await auth();
  if (!userId) return { error: 'Non authentifié' };

  const workshopId = String(formData.get('workshopId') ?? '');
  const targetOrgId = String(formData.get('clerkOrgId') ?? '');
  if (!workshopId || !targetOrgId) {
    return { error: 'Paramètres manquants' };
  }

  if (targetOrgId !== activeOrgId) {
    return {
      error: 'L\'org cible doit être l\'org actuellement active dans la sidebar',
    };
  }

  const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });
  if (!workshop) return { error: 'Workshop introuvable' };

  if (workshop.clerkOrgId && workshop.clerkOrgId !== targetOrgId) {
    return {
      error: `Workshop déjà lié à une autre org (${workshop.clerkOrgId})`,
    };
  }

  // Vérifier que l'org cible n'a pas déjà un autre workshop
  const existing = await prisma.workshop.findUnique({
    where: { clerkOrgId: targetOrgId },
  });
  if (existing && existing.id !== workshopId) {
    return {
      error: `Cette org est déjà liée au workshop "${existing.name}" (${existing.id})`,
    };
  }

  await prisma.workshop.update({
    where: { id: workshopId },
    data: { clerkOrgId: targetOrgId },
  });

  revalidatePath('/[locale]/admin', 'layout');
  return { success: true };
}
