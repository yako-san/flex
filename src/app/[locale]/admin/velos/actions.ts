'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { generateId } from '@/lib/ids/generate-id';

const veloSchema = z.object({
  clientId: z.string().trim().min(1, 'Client requis'),
  marqueId: z.string().trim().optional().nullable(),
  veloNumero: z.coerce.number().int().positive().optional(),
  modele: z.string().optional().nullable(),
  couleur: z.string().optional().nullable(),
  taille: z.string().optional().nullable(),
  numeroSerie: z.string().optional().nullable(),
  status: z.enum([
    'RV',
    'RECU',
    'EN_ATTENTE',
    'EVAL',
    'APPROUVE',
    'ON_BENCH',
    'CTRL_QLTE',
    'FINI',
    'LIVRE',
    'FACTURER',
    'FACTURE',
  ]),
  evalMecanoId: z.string().optional().nullable(),
  mecaMecanoId: z.string().optional().nullable(),
  ctrlMecanoId: z.string().optional().nullable(),
  noteVelo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type VeloFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function clean(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function parseInput(formData: FormData) {
  return veloSchema.safeParse({
    clientId: clean(formData.get('clientId')) ?? '',
    marqueId: clean(formData.get('marqueId')),
    veloNumero: clean(formData.get('veloNumero')) ?? undefined,
    modele: clean(formData.get('modele')),
    couleur: clean(formData.get('couleur')),
    taille: clean(formData.get('taille')),
    numeroSerie: clean(formData.get('numeroSerie')),
    status: formData.get('status') ?? 'RV',
    evalMecanoId: clean(formData.get('evalMecanoId')),
    mecaMecanoId: clean(formData.get('mecaMecanoId')),
    ctrlMecanoId: clean(formData.get('ctrlMecanoId')),
    noteVelo: clean(formData.get('noteVelo')),
    notes: clean(formData.get('notes')),
  });
}

function fieldErrorsFromZod(parsed: ReturnType<typeof parseInput>): Record<string, string> {
  if (parsed.success) return {};
  const fe: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? '_');
    if (!fe[key]) fe[key] = issue.message;
  }
  return fe;
}

export async function createVeloAction(
  _prev: VeloFormState | null,
  formData: FormData,
): Promise<VeloFormState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = parseInput(formData);
  if (!parsed.success) {
    return { error: 'Validation échouée', fieldErrors: fieldErrorsFromZod(parsed) };
  }
  const data = parsed.data;

  const id = generateId('velo');

  await prisma.$transaction(async (tx) => {
    let veloNumero = data.veloNumero;

    // Auto-increment via Counter si non fourni
    if (!veloNumero) {
      const counter = await tx.counter.findFirst({
        where: { workshopId: workshop.id, kind: 'VELO_SEQUENCE' },
      });
      const next = (counter?.current ?? 0) + 1;
      if (counter) {
        await tx.counter.update({
          where: { id: counter.id },
          data: { current: next },
        });
      } else {
        await tx.counter.create({
          data: {
            id: generateId('ctr'),
            workshopId: workshop.id,
            kind: 'VELO_SEQUENCE',
            current: next,
          },
        });
      }
      veloNumero = next;
    } else {
      // Si l'utilisateur a fourni un numero, push le counter à au moins ce niveau
      const counter = await tx.counter.findFirst({
        where: { workshopId: workshop.id, kind: 'VELO_SEQUENCE' },
      });
      if (counter && counter.current < veloNumero) {
        await tx.counter.update({
          where: { id: counter.id },
          data: { current: veloNumero },
        });
      }
    }

    await tx.velo.create({
      data: {
        id,
        workshopId: workshop.id,
        clientId: data.clientId,
        marqueId: data.marqueId || null,
        veloNumero,
        status: data.status,
        modele: data.modele || null,
        couleur: data.couleur || null,
        taille: data.taille || null,
        numeroSerie: data.numeroSerie || null,
        evalMecanoId: data.evalMecanoId || null,
        mecaMecanoId: data.mecaMecanoId || null,
        ctrlMecanoId: data.ctrlMecanoId || null,
        noteVelo: data.noteVelo || null,
        notes: data.notes || null,
      },
    });
  });

  revalidatePath('/[locale]/admin/velos', 'page');
  redirect(`/fr-CA/admin/velos/${id}`);
}

export async function updateVeloAction(
  veloId: string,
  _prev: VeloFormState | null,
  formData: FormData,
): Promise<VeloFormState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const existing = await prisma.velo.findFirst({
    where: { id: veloId, workshopId: workshop.id, deletedAt: null },
  });
  if (!existing) return { error: 'Vélo introuvable' };

  const parsed = parseInput(formData);
  if (!parsed.success) {
    return { error: 'Validation échouée', fieldErrors: fieldErrorsFromZod(parsed) };
  }
  const data = parsed.data;

  await prisma.velo.update({
    where: { id: veloId },
    data: {
      clientId: data.clientId,
      marqueId: data.marqueId || null,
      veloNumero: data.veloNumero ?? existing.veloNumero,
      status: data.status,
      modele: data.modele || null,
      couleur: data.couleur || null,
      taille: data.taille || null,
      numeroSerie: data.numeroSerie || null,
      evalMecanoId: data.evalMecanoId || null,
      mecaMecanoId: data.mecaMecanoId || null,
      ctrlMecanoId: data.ctrlMecanoId || null,
      noteVelo: data.noteVelo || null,
      notes: data.notes || null,
    },
  });

  revalidatePath('/[locale]/admin/velos', 'page');
  revalidatePath(`/[locale]/admin/velos/${veloId}`, 'page');
  redirect(`/fr-CA/admin/velos/${veloId}`);
}

export async function deleteVeloAction(veloId: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const existing = await prisma.velo.findFirst({
    where: { id: veloId, workshopId: workshop.id, deletedAt: null },
    include: { _count: { select: { bdcs: true } } },
  });
  if (!existing) return { error: 'Vélo introuvable' };

  if (existing._count.bdcs > 0) {
    return {
      error: `Impossible de supprimer : ${existing._count.bdcs} BDT associé(s). Supprime ou archive les BDT d'abord.`,
    };
  }

  await prisma.velo.update({
    where: { id: veloId },
    data: { deletedAt: new Date() },
  });

  revalidatePath('/[locale]/admin/velos', 'page');
  redirect(`/fr-CA/admin/velos`);
}
