'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';

const fiscalSchema = z.object({
  raisonSociale: z.string().trim().optional().nullable(),
  tagline: z.string().trim().optional().nullable(),
  adresseLigne1: z.string().trim().optional().nullable(),
  adresseLigne2: z.string().trim().optional().nullable(),
  ville: z.string().trim().optional().nullable(),
  codePostal: z.string().trim().optional().nullable(),
  province: z.string().trim().optional().nullable(),
  pays: z.string().trim().optional().nullable(),
  telephone: z.string().trim().optional().nullable(),
  courriel: z.string().trim().email().optional().or(z.literal('')),
  siteWeb: z.string().trim().optional().nullable(),
  neq: z.string().trim().optional().nullable(),
  tps: z.string().trim().optional().nullable(),
  tvq: z.string().trim().optional().nullable(),
  footerText: z.string().optional().nullable(),
});

export type FiscalState = { error?: string; success?: boolean };

function clean(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

export async function updateFiscalAction(
  _prev: FiscalState | null,
  formData: FormData,
): Promise<FiscalState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = fiscalSchema.safeParse({
    raisonSociale: clean(formData.get('raisonSociale')),
    tagline: clean(formData.get('tagline')),
    adresseLigne1: clean(formData.get('adresseLigne1')),
    adresseLigne2: clean(formData.get('adresseLigne2')),
    ville: clean(formData.get('ville')),
    codePostal: clean(formData.get('codePostal')),
    province: clean(formData.get('province')),
    pays: clean(formData.get('pays')),
    telephone: clean(formData.get('telephone')),
    courriel: clean(formData.get('courriel')) ?? '',
    siteWeb: clean(formData.get('siteWeb')),
    neq: clean(formData.get('neq')),
    tps: clean(formData.get('tps')),
    tvq: clean(formData.get('tvq')),
    footerText: clean(formData.get('footerText')),
  });

  if (!parsed.success) return { error: 'Validation échouée' };

  // Stocke uniquement les champs non-null (clean JSON)
  const fiscalEntity: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v && typeof v === 'string') fiscalEntity[k] = v;
  }

  await prisma.workshop.update({
    where: { id: workshop.id },
    data: {
      fiscalEntity:
        Object.keys(fiscalEntity).length > 0
          ? (fiscalEntity as Prisma.InputJsonValue)
          : Prisma.JsonNull,
    },
  });

  revalidatePath('/[locale]/admin/settings', 'page');
  return { success: true };
}
