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
  categorie: z.string().trim().optional().nullable(),
  categoriePrio: z.string().trim().optional().nullable(),
  dureeMinutes: z.coerce.number().int().min(0).optional().nullable(),
  prix: z.string().trim().min(1, 'Prix requis'),
  taxable: z.coerce.boolean(),
});

export type ServiceFormState = { error?: string; fieldErrors?: Record<string, string> };

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
  return schema.safeParse({
    legacyCode: clean(formData.get('legacyCode')),
    labelCanonical: clean(formData.get('labelCanonical')) ?? '',
    categorie: clean(formData.get('categorie')),
    categoriePrio: clean(formData.get('categoriePrio')),
    dureeMinutes: dureeRaw === null || dureeRaw === '' ? undefined : dureeRaw,
    prix: clean(formData.get('prix')) ?? '',
    taxable: formData.get('taxable') === 'on',
  });
}

export async function createServiceAction(
  _p: ServiceFormState | null,
  formData: FormData,
): Promise<ServiceFormState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = parseInput(formData);
  if (!parsed.success) return { error: 'Validation', fieldErrors: fe(parsed) };
  const d = parsed.data;

  await prisma.service.create({
    data: {
      id: generateId('service'),
      workshopId: workshop.id,
      legacyCode: d.legacyCode || null,
      labelCanonical: d.labelCanonical,
      categorie: d.categorie || null,
      categoriePrio: d.categoriePrio || null,
      dureeMinutes: d.dureeMinutes ?? null,
      prix: new Prisma.Decimal(d.prix),
      taxable: d.taxable,
    },
  });
  revalidatePath('/[locale]/admin/services', 'page');
  redirect('/fr-CA/admin/services');
}

export async function updateServiceAction(
  id: string,
  _p: ServiceFormState | null,
  formData: FormData,
): Promise<ServiceFormState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = parseInput(formData);
  if (!parsed.success) return { error: 'Validation', fieldErrors: fe(parsed) };
  const d = parsed.data;

  await prisma.service.update({
    where: { id },
    data: {
      legacyCode: d.legacyCode || null,
      labelCanonical: d.labelCanonical,
      categorie: d.categorie || null,
      categoriePrio: d.categoriePrio || null,
      dureeMinutes: d.dureeMinutes ?? null,
      prix: new Prisma.Decimal(d.prix),
      taxable: d.taxable,
    },
  });
  revalidatePath('/[locale]/admin/services', 'page');
  redirect('/fr-CA/admin/services');
}

export async function deleteServiceAction(id: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const svc = await prisma.service.findFirst({
    where: { id, workshopId: workshop.id, deletedAt: null },
    include: { _count: { select: { bdcItems: true } } },
  });
  if (!svc) return { error: 'Service introuvable' };
  if (svc._count.bdcItems > 0) {
    return {
      error: `Impossible : ${svc._count.bdcItems} BDT items utilisent ce service. Soft delete via deletedAt seulement.`,
    };
  }
  await prisma.service.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidatePath('/[locale]/admin/services', 'page');
  redirect('/fr-CA/admin/services');
}
