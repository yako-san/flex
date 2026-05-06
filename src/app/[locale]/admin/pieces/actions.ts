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
  nomCanonical: z.string().trim().min(1, 'Nom requis'),
  sku: z.string().trim().optional().nullable(),
  codeBarre: z.string().trim().optional().nullable(),
  categorie: z.string().trim().optional().nullable(),
  fournisseur: z.string().trim().optional().nullable(),
  prixAchat: z.string().trim().optional().nullable(),
  prixBase: z.string().trim().optional().nullable(),
  prixVente: z.string().trim().min(1, 'Prix de vente requis'),
  prixCost: z.string().trim().optional().nullable(),
  prixBdc: z.string().trim().optional().nullable(),
  taxable: z.coerce.boolean(),
  stockPhysique: z.coerce.number().int().min(0).default(0),
  stockReserve: z.coerce.number().int().min(0).default(0),
});

export type PieceFormState = { error?: string; fieldErrors?: Record<string, string> };

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

function dec(s: string | null | undefined): Prisma.Decimal | null {
  if (!s || s.trim() === '') return null;
  return new Prisma.Decimal(s);
}

function parseInput(formData: FormData) {
  return schema.safeParse({
    legacyCode: clean(formData.get('legacyCode')),
    nomCanonical: clean(formData.get('nomCanonical')) ?? '',
    sku: clean(formData.get('sku')),
    codeBarre: clean(formData.get('codeBarre')),
    categorie: clean(formData.get('categorie')),
    fournisseur: clean(formData.get('fournisseur')),
    prixAchat: clean(formData.get('prixAchat')),
    prixBase: clean(formData.get('prixBase')),
    prixVente: clean(formData.get('prixVente')) ?? '',
    prixCost: clean(formData.get('prixCost')),
    prixBdc: clean(formData.get('prixBdc')),
    taxable: formData.get('taxable') === 'on',
    stockPhysique: formData.get('stockPhysique') ?? 0,
    stockReserve: formData.get('stockReserve') ?? 0,
  });
}

export async function createPieceAction(
  _p: PieceFormState | null,
  formData: FormData,
): Promise<PieceFormState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = parseInput(formData);
  if (!parsed.success) return { error: 'Validation', fieldErrors: fe(parsed) };
  const d = parsed.data;

  await prisma.piece.create({
    data: {
      id: generateId('piece'),
      workshopId: workshop.id,
      legacyCode: d.legacyCode || null,
      nomCanonical: d.nomCanonical,
      sku: d.sku || null,
      codeBarre: d.codeBarre || null,
      categorie: d.categorie || null,
      fournisseur: d.fournisseur || null,
      prixAchat: dec(d.prixAchat),
      prixBase: dec(d.prixBase),
      prixVente: new Prisma.Decimal(d.prixVente),
      prixCost: dec(d.prixCost),
      prixBdc: dec(d.prixBdc),
      taxable: d.taxable,
      stockPhysique: d.stockPhysique,
      stockReserve: d.stockReserve,
    },
  });
  revalidatePath('/[locale]/admin/pieces', 'page');
  redirect('/fr-CA/admin/pieces');
}

export async function updatePieceAction(
  id: string,
  _p: PieceFormState | null,
  formData: FormData,
): Promise<PieceFormState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = parseInput(formData);
  if (!parsed.success) return { error: 'Validation', fieldErrors: fe(parsed) };
  const d = parsed.data;

  await prisma.piece.update({
    where: { id },
    data: {
      legacyCode: d.legacyCode || null,
      nomCanonical: d.nomCanonical,
      sku: d.sku || null,
      codeBarre: d.codeBarre || null,
      categorie: d.categorie || null,
      fournisseur: d.fournisseur || null,
      prixAchat: dec(d.prixAchat),
      prixBase: dec(d.prixBase),
      prixVente: new Prisma.Decimal(d.prixVente),
      prixCost: dec(d.prixCost),
      prixBdc: dec(d.prixBdc),
      taxable: d.taxable,
      stockPhysique: d.stockPhysique,
      stockReserve: d.stockReserve,
    },
  });
  revalidatePath('/[locale]/admin/pieces', 'page');
  redirect('/fr-CA/admin/pieces');
}

export async function deletePieceAction(id: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const p = await prisma.piece.findFirst({
    where: { id, workshopId: workshop.id, deletedAt: null },
    include: { _count: { select: { bdcItems: true, venteItems: true, poItems: true } } },
  });
  if (!p) return { error: 'Pièce introuvable' };
  const refs = p._count.bdcItems + p._count.venteItems + p._count.poItems;
  if (refs > 0) {
    return { error: `Impossible : ${refs} références (BDT/ventes/POs) utilisent cette pièce.` };
  }
  await prisma.piece.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidatePath('/[locale]/admin/pieces', 'page');
  redirect('/fr-CA/admin/pieces');
}
