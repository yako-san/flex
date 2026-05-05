import { auth } from '@clerk/nextjs/server';
import { prisma } from './db';
import type { Workshop } from '@prisma/client';

// =============================================================================
// Multi-tenant : résolution du Workshop actif depuis le contexte Clerk.
//
// 1. Si l'utilisateur a une org active (Clerk auth().orgId), on cherche le
//    Workshop dont clerkOrgId match. Mode normal pour multi-tenant.
//
// 2. Fallback "seed unlinked" : si aucune org active OU pas de match, on
//    retourne le 1er Workshop SANS clerkOrgId (workshop pré-Clerk Orgs,
//    en attente d'être linké par l'utilisateur via UI). Ça permet à yako-cyclo
//    (le workshop seed) de continuer à fonctionner avant l'activation Orgs.
//
// 3. Sinon : null. Le caller doit gérer l'absence (redirect vers onboarding).
// =============================================================================

export async function getActiveWorkshop(): Promise<Workshop | null> {
  const { userId, orgId } = await auth();
  if (!userId) return null;

  // 1. Lookup par Clerk Org active
  if (orgId) {
    const linked = await prisma.workshop.findUnique({
      where: { clerkOrgId: orgId, deletedAt: null },
    });
    if (linked) return linked;
  }

  // 2. Fallback : workshop seed non encore linké
  const unlinked = await prisma.workshop.findFirst({
    where: { clerkOrgId: null, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  return unlinked;
}

// Variante "throw" pour les pages qui requièrent un workshop : redirect plutôt
// que rendre une UI vide.
export async function requireActiveWorkshop(): Promise<Workshop> {
  const ws = await getActiveWorkshop();
  if (!ws) {
    throw new Error(
      'Aucun workshop actif. Activez Clerk Organizations + créez ou liez un workshop.',
    );
  }
  return ws;
}
