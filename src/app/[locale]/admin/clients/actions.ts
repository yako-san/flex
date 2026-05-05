'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { generateId } from '@/lib/ids/generate-id';

const clientSchema = z.object({
  prenom: z.string().trim().min(1, 'Le prénom est requis'),
  nom: z.string().trim().min(1, 'Le nom est requis'),
  telephone: z.string().trim().optional().nullable(),
  indicatif: z.string().trim().optional().nullable(),
  courriel: z.string().trim().email('Courriel invalide').optional().or(z.literal('')),
  commPref: z.enum(['EMAIL', 'SMS', 'TELEPHONE', 'AUCUN']),
  lang: z.string().trim().min(2),
  lead: z.string().trim().optional().nullable(),
  remiseDefault: z.string().trim().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type ClientFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function clean(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

export async function createClientAction(
  _prev: ClientFormState | null,
  formData: FormData,
): Promise<ClientFormState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = clientSchema.safeParse({
    prenom: clean(formData.get('prenom')),
    nom: clean(formData.get('nom')) ?? '',
    telephone: clean(formData.get('telephone')),
    indicatif: clean(formData.get('indicatif')),
    courriel: clean(formData.get('courriel')) ?? '',
    commPref: formData.get('commPref') ?? 'EMAIL',
    lang: formData.get('lang') ?? 'fr-CA',
    lead: clean(formData.get('lead')),
    remiseDefault: clean(formData.get('remiseDefault')),
    notes: clean(formData.get('notes')),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '_');
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: 'Validation échouée', fieldErrors };
  }

  const data = parsed.data;
  const id = generateId('client');

  await prisma.client.create({
    data: {
      id,
      workshopId: workshop.id,
      prenom: data.prenom,
      nom: data.nom,
      telephone: data.telephone || null,
      indicatif: data.indicatif || null,
      courriel: data.courriel || null,
      commPref: data.commPref,
      lang: data.lang,
      lead: data.lead || null,
      remiseDefault: data.remiseDefault || null,
      notes: data.notes || null,
    },
  });

  revalidatePath('/[locale]/admin/clients', 'page');
  redirect(`/fr-CA/admin/clients/${id}`);
}

export async function updateClientAction(
  clientId: string,
  _prev: ClientFormState | null,
  formData: FormData,
): Promise<ClientFormState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const existing = await prisma.client.findFirst({
    where: { id: clientId, workshopId: workshop.id, deletedAt: null },
  });
  if (!existing) return { error: 'Client introuvable' };

  const parsed = clientSchema.safeParse({
    prenom: clean(formData.get('prenom')),
    nom: clean(formData.get('nom')) ?? '',
    telephone: clean(formData.get('telephone')),
    indicatif: clean(formData.get('indicatif')),
    courriel: clean(formData.get('courriel')) ?? '',
    commPref: formData.get('commPref') ?? 'EMAIL',
    lang: formData.get('lang') ?? 'fr-CA',
    lead: clean(formData.get('lead')),
    remiseDefault: clean(formData.get('remiseDefault')),
    notes: clean(formData.get('notes')),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '_');
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: 'Validation échouée', fieldErrors };
  }

  const data = parsed.data;
  await prisma.client.update({
    where: { id: clientId },
    data: {
      prenom: data.prenom,
      nom: data.nom,
      telephone: data.telephone || null,
      indicatif: data.indicatif || null,
      courriel: data.courriel || null,
      commPref: data.commPref,
      lang: data.lang,
      lead: data.lead || null,
      remiseDefault: data.remiseDefault || null,
      notes: data.notes || null,
    },
  });

  revalidatePath('/[locale]/admin/clients', 'page');
  revalidatePath(`/[locale]/admin/clients/${clientId}`, 'page');
  redirect(`/fr-CA/admin/clients/${clientId}`);
}

export async function deleteClientAction(clientId: string): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const existing = await prisma.client.findFirst({
    where: { id: clientId, workshopId: workshop.id, deletedAt: null },
    include: { _count: { select: { velos: true } } },
  });
  if (!existing) return { error: 'Client introuvable' };

  if (existing._count.velos > 0) {
    return {
      error: `Impossible de supprimer : ${existing._count.velos} vélo(s) associé(s). Supprime ou réassigne les vélos d'abord.`,
    };
  }

  await prisma.client.update({
    where: { id: clientId },
    data: { deletedAt: new Date() },
  });

  revalidatePath('/[locale]/admin/clients', 'page');
  redirect(`/fr-CA/admin/clients`);
}
