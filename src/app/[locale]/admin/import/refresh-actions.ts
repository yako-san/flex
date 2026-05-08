'use server';

import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { transformTemplates } from '@/lib/import/transform/transform-templates';

export type RefreshState = {
  ok?: boolean;
  error?: string;
  details?: {
    templatesUpdated: boolean;
    taillesAppliedToMarques: number;
    parametresStored: boolean;
    schemaVersion: string | null;
  };
};

// Refresh partiel à partir d'un dump V1 1.1.0+ : ne touche QUE les nouveaux
// champs (Workshop.emailTemplates, Marque.taillesDisponibles,
// Workshop.legacyV1Extras.parametres). Ne re-importe PAS les clients,
// vélos, BDT, etc. — préserve toutes les modifications V2 effectuées
// depuis le premier import.
//
// Utilisation typique : V1 a livré schema 1.1.0 avec 3 nouvelles clés
// (templates, tailles, parametres) ; V2 veut hydrater ces champs sans
// recréer un workshop (échec slug unique).
export async function refreshFromDumpAction(
  _prev: RefreshState | null,
  formData: FormData,
): Promise<RefreshState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const file = formData.get('dump');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Aucun fichier sélectionné' };
  }

  let dump: {
    schemaVersion?: string;
    templates?: Record<string, string>;
    tailles?: readonly string[];
    parametres?: unknown;
  };
  try {
    const text = await file.text();
    dump = JSON.parse(text);
  } catch (err) {
    return { error: `JSON invalide : ${err instanceof Error ? err.message : String(err)}` };
  }

  const schemaVersion = typeof dump.schemaVersion === 'string' ? dump.schemaVersion : null;

  // 1. Workshop.emailTemplates ← dump.templates
  let templatesUpdated = false;
  const transformed = transformTemplates(dump.templates);
  if (transformed) {
    await prisma.workshop.update({
      where: { id: workshop.id },
      data: { emailTemplates: transformed as Prisma.InputJsonValue },
    });
    templatesUpdated = true;
  }

  // 2. Marque.taillesDisponibles ← dump.tailles (réplique sur chaque marque
  //    qui n'a pas encore de tailles définies — préserve les overrides v2)
  let taillesAppliedToMarques = 0;
  if (Array.isArray(dump.tailles) && dump.tailles.length > 0) {
    const tailles = dump.tailles
      .filter((t): t is string => typeof t === 'string' && t.trim() !== '')
      .map((t) => t.trim());

    if (tailles.length > 0) {
      const marquesSansTailles = await prisma.marque.findMany({
        where: {
          workshopId: workshop.id,
          deletedAt: null,
          OR: [
            { taillesDisponibles: { equals: Prisma.JsonNull } },
            { taillesDisponibles: { equals: Prisma.DbNull } },
          ],
        },
        select: { id: true },
      });
      for (const m of marquesSansTailles) {
        await prisma.marque.update({
          where: { id: m.id },
          data: { taillesDisponibles: tailles as Prisma.InputJsonValue },
        });
      }
      taillesAppliedToMarques = marquesSansTailles.length;
    }
  }

  // 3. Workshop.legacyV1Extras.parametres : merge dans la zone audit
  //    existante. Préserve les autres clés (workshop, catalogue, etc.).
  let parametresStored = false;
  if (dump.parametres !== undefined) {
    const currentExtras =
      (workshop.legacyV1Extras as Record<string, unknown> | null) ?? {};
    const merged = { ...currentExtras, parametres: dump.parametres };
    await prisma.workshop.update({
      where: { id: workshop.id },
      data: { legacyV1Extras: merged as Prisma.InputJsonValue },
    });
    parametresStored = true;
  }

  revalidatePath('/[locale]/admin/settings', 'page');
  revalidatePath('/[locale]/admin/settings/email-templates', 'page');
  revalidatePath('/[locale]/admin/marques', 'page');
  revalidatePath('/[locale]/admin/legacy-v1', 'page');
  revalidatePath('/[locale]/admin/import', 'page');

  return {
    ok: true,
    details: {
      templatesUpdated,
      taillesAppliedToMarques,
      parametresStored,
      schemaVersion,
    },
  };
}
