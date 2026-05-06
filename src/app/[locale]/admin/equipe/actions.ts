'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { generateId } from '@/lib/ids/generate-id';

const schema = z.object({
  prenom: z.string().trim().min(1, 'Prénom requis'),
  nom: z.string().trim().min(1, 'Nom requis'),
  surnom: z.string().trim().min(1, 'Surnom requis (court, ex "yako")'),
  courriel: z.string().trim().email('Courriel invalide').optional().or(z.literal('')),
  telephone: z.string().trim().optional().nullable(),
  indicatif: z.string().trim().optional().nullable(),
  lang: z.string().trim().min(2),
  role: z.string().trim().optional().nullable(),
  active: z.coerce.boolean(),
  notes: z.string().optional().nullable(),
});

export type EquipeFormState = { error?: string; fieldErrors?: Record<string, string> };

function clean(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function fe(parsed: ReturnType<typeof schema.safeParse>): Record<string, string> {
  if (parsed.success) return {};
  const fe: Record<string, string> = {};
  for (const i of parsed.error.issues) {
    const k = String(i.path[0] ?? '_');
    if (!fe[k]) fe[k] = i.message;
  }
  return fe;
}

function parseInput(formData: FormData) {
  return schema.safeParse({
    prenom: clean(formData.get('prenom')) ?? '',
    nom: clean(formData.get('nom')) ?? '',
    surnom: clean(formData.get('surnom')) ?? '',
    courriel: clean(formData.get('courriel')) ?? '',
    telephone: clean(formData.get('telephone')),
    indicatif: clean(formData.get('indicatif')),
    lang: formData.get('lang') ?? 'fr-CA',
    role: clean(formData.get('role')),
    active: formData.get('active') === 'on',
    notes: clean(formData.get('notes')),
  });
}

export async function createEquipeAction(
  _p: EquipeFormState | null,
  formData: FormData,
): Promise<EquipeFormState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = parseInput(formData);
  if (!parsed.success) return { error: 'Validation', fieldErrors: fe(parsed) };
  const d = parsed.data;

  await prisma.equipeMember.create({
    data: {
      id: generateId('eq'),
      workshopId: workshop.id,
      prenom: d.prenom,
      nom: d.nom,
      surnom: d.surnom,
      courriel: d.courriel || null,
      telephone: d.telephone || null,
      indicatif: d.indicatif || null,
      lang: d.lang,
      role: d.role || null,
      active: d.active,
      notes: d.notes || null,
    },
  });
  revalidatePath('/[locale]/admin/equipe', 'page');
  redirect('/fr-CA/admin/equipe');
}

export async function updateEquipeAction(
  id: string,
  _p: EquipeFormState | null,
  formData: FormData,
): Promise<EquipeFormState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = parseInput(formData);
  if (!parsed.success) return { error: 'Validation', fieldErrors: fe(parsed) };
  const d = parsed.data;

  await prisma.equipeMember.update({
    where: { id },
    data: {
      prenom: d.prenom,
      nom: d.nom,
      surnom: d.surnom,
      courriel: d.courriel || null,
      telephone: d.telephone || null,
      indicatif: d.indicatif || null,
      lang: d.lang,
      role: d.role || null,
      active: d.active,
      notes: d.notes || null,
    },
  });
  revalidatePath('/[locale]/admin/equipe', 'page');
  redirect('/fr-CA/admin/equipe');
}

export async function deleteEquipeAction(id: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  // EquipeMember n'a pas de soft delete dans le schéma. On set active=false
  // pour préserver l'historique des BDT (FK vers eval_mecano_id, etc.).
  await prisma.equipeMember.update({
    where: { id },
    data: { active: false },
  });
  revalidatePath('/[locale]/admin/equipe', 'page');
  redirect('/fr-CA/admin/equipe');
}
