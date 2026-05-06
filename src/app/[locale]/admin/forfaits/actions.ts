'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { generateId } from '@/lib/ids/generate-id';

const schema = z.object({
  legacyCode: z.string().trim().optional().nullable(),
  labelCanonical: z.string().trim().min(1, 'Libellé requis'),
  prix: z.string().trim().min(1, 'Prix requis'),
  dureeMinutes: z.coerce.number().int().min(0).optional().nullable(),
  taxable: z.coerce.boolean(),
  // Sous-tâches : tableau de strings (nettoyées) — on les remplace en bloc.
  tasks: z.array(z.string().trim().min(1)).default([]),
});

export type ForfaitFormState = { error?: string; fieldErrors?: Record<string, string> };

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
  const dureeRaw = formData.get('dureeMinutes');
  const tasksRaw = formData.getAll('tasks');
  const tasks = tasksRaw
    .map((t) => String(t).trim())
    .filter((t) => t.length > 0);
  return schema.safeParse({
    legacyCode: clean(formData.get('legacyCode')),
    labelCanonical: clean(formData.get('labelCanonical')) ?? '',
    prix: clean(formData.get('prix')) ?? '',
    dureeMinutes: dureeRaw === null || dureeRaw === '' ? undefined : dureeRaw,
    taxable: formData.get('taxable') === 'on',
    tasks,
  });
}

export async function createForfaitAction(
  _p: ForfaitFormState | null,
  formData: FormData,
): Promise<ForfaitFormState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = parseInput(formData);
  if (!parsed.success) return { error: 'Validation', fieldErrors: fe(parsed) };
  const d = parsed.data;

  const forfaitId = generateId('forfait');
  await prisma.$transaction(async (tx) => {
    await tx.forfait.create({
      data: {
        id: forfaitId,
        workshopId: workshop.id,
        legacyCode: d.legacyCode || null,
        labelCanonical: d.labelCanonical,
        prix: new Prisma.Decimal(d.prix),
        dureeMinutes: d.dureeMinutes ?? null,
        taxable: d.taxable,
      },
    });
    if (d.tasks.length > 0) {
      await tx.forfaitTaskTemplate.createMany({
        data: d.tasks.map((label, idx) => ({
          id: generateId('ftt'),
          forfaitId,
          labelCanonical: label,
          position: idx + 1,
        })),
      });
    }
  });

  revalidatePath('/[locale]/admin/forfaits', 'page');
  redirect('/fr-CA/admin/forfaits');
}

export async function updateForfaitAction(
  id: string,
  _p: ForfaitFormState | null,
  formData: FormData,
): Promise<ForfaitFormState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = parseInput(formData);
  if (!parsed.success) return { error: 'Validation', fieldErrors: fe(parsed) };
  const d = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.forfait.update({
      where: { id },
      data: {
        legacyCode: d.legacyCode || null,
        labelCanonical: d.labelCanonical,
        prix: new Prisma.Decimal(d.prix),
        dureeMinutes: d.dureeMinutes ?? null,
        taxable: d.taxable,
      },
    });
    // Replace all task templates (les tasks BDT instanciées sont snapshot et
    // ne sont pas affectées par ce changement de template).
    await tx.forfaitTaskTemplate.deleteMany({ where: { forfaitId: id } });
    if (d.tasks.length > 0) {
      await tx.forfaitTaskTemplate.createMany({
        data: d.tasks.map((label, idx) => ({
          id: generateId('ftt'),
          forfaitId: id,
          labelCanonical: label,
          position: idx + 1,
        })),
      });
    }
  });

  revalidatePath('/[locale]/admin/forfaits', 'page');
  redirect('/fr-CA/admin/forfaits');
}

export async function deleteForfaitAction(id: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const f = await prisma.forfait.findFirst({
    where: { id, workshopId: workshop.id, deletedAt: null },
    include: { _count: { select: { bdcItems: true } } },
  });
  if (!f) return { error: 'Forfait introuvable' };
  if (f._count.bdcItems > 0) {
    return { error: `Impossible : ${f._count.bdcItems} BDT items utilisent ce forfait.` };
  }
  await prisma.forfait.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidatePath('/[locale]/admin/forfaits', 'page');
  redirect('/fr-CA/admin/forfaits');
}
