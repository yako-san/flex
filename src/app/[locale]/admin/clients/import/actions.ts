'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { generateId } from '@/lib/ids/generate-id';
import { parseCsv, autoMapColumns } from '@/lib/import/parse-csv';

export type ImportPreview = {
  error?: string;
  headers?: string[];
  totalRows?: number;
  mapping?: Record<string, string>;
  sample?: Record<string, string>[];
  csvContent?: string;
};

// Étape 1 : parse le CSV uploadé et affiche un preview avec mapping auto.
export async function previewClientsCsvAction(
  _prev: ImportPreview | null,
  formData: FormData,
): Promise<ImportPreview> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const file = formData.get('csvFile');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Sélectionne un fichier CSV.' };
  }
  if (file.size > 5_000_000) {
    return { error: 'Fichier trop gros (max 5 Mo).' };
  }

  const text = await file.text();
  const parsed = parseCsv(text);
  if (parsed.headers.length === 0) {
    return { error: 'CSV vide ou invalide.' };
  }

  return {
    headers: parsed.headers,
    totalRows: parsed.rows.length,
    mapping: autoMapColumns(parsed.headers),
    sample: parsed.rows.slice(0, 5),
    csvContent: text,
  };
}

export type ImportResult = {
  error?: string;
  inserted?: number;
  skipped?: number;
  updated?: number;
  errors?: string[];
};

// Étape 2 : import effectif. Anti-doublons sur (prenom, nom) ou courriel.
// dryRun=true → ne touche pas à la BD, juste compte.
export async function executeClientsImportAction(
  _prev: ImportResult | null,
  formData: FormData,
): Promise<ImportResult> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const csvContent = formData.get('csvContent');
  if (typeof csvContent !== 'string' || csvContent.length === 0) {
    return { error: 'Contenu CSV manquant — refais le preview.' };
  }
  const dryRun = formData.get('dryRun') === '1';

  // Récupère le mapping field → header CSV depuis le form
  const mapping: Record<string, string> = {};
  for (const field of ['prenom', 'nom', 'courriel', 'telephone', 'indicatif', 'notes', 'lang', 'commPref', 'lead']) {
    const v = formData.get(`map_${field}`);
    if (typeof v === 'string' && v.trim() !== '') mapping[field] = v;
  }

  if (!mapping['prenom'] || !mapping['nom']) {
    return { error: 'Les colonnes Prénom et Nom doivent être mappées.' };
  }

  const parsed = parseCsv(csvContent);
  let inserted = 0;
  let skipped = 0;
  let updated = 0;
  const errors: string[] = [];

  // Cache des clients existants (par courriel et par nom complet) pour
  // détection de doublons en mémoire (évite N requêtes).
  const existing = await prisma.client.findMany({
    where: { workshopId: workshop.id, deletedAt: null },
    select: { id: true, prenom: true, nom: true, courriel: true },
  });
  const byEmail = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const c of existing) {
    if (c.courriel) byEmail.set(c.courriel.toLowerCase(), c.id);
    byName.set(`${c.prenom.toLowerCase()}|${c.nom.toLowerCase()}`, c.id);
  }

  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i];
    if (!row) continue;
    const get = (field: string): string | null => {
      const header = mapping[field];
      if (!header) return null;
      const v = row[header]?.trim();
      return v && v !== '' ? v : null;
    };

    const prenom = get('prenom');
    const nom = get('nom');
    if (!prenom || !nom) {
      skipped += 1;
      continue;
    }

    const courriel = get('courriel');
    const key = `${prenom.toLowerCase()}|${nom.toLowerCase()}`;
    const existingId = (courriel && byEmail.get(courriel.toLowerCase())) || byName.get(key);

    if (existingId) {
      skipped += 1;
      continue; // pas de mise à jour automatique pour éviter d'écraser
    }

    if (dryRun) {
      inserted += 1;
      continue;
    }

    try {
      const id = generateId('client');
      const lang = get('lang') ?? 'fr-CA';
      const commPref = get('commPref') ?? 'EMAIL';
      const validCommPref = ['EMAIL', 'SMS', 'TELEPHONE', 'AUCUN'].includes(commPref)
        ? commPref
        : 'EMAIL';
      const validLang = ['fr-CA', 'en-CA'].includes(lang) ? lang : 'fr-CA';

      await prisma.client.create({
        data: {
          id,
          workshopId: workshop.id,
          prenom,
          nom,
          courriel,
          telephone: get('telephone'),
          indicatif: get('indicatif') ?? '+1',
          lang: validLang as 'fr-CA' | 'en-CA',
          commPref: validCommPref as 'EMAIL' | 'SMS' | 'TELEPHONE' | 'AUCUN',
          lead: get('lead'),
          notes: get('notes'),
          createdById: userId,
        },
      });
      inserted += 1;
      // Met à jour le cache pour que les doublons internes au CSV soient détectés
      if (courriel) byEmail.set(courriel.toLowerCase(), id);
      byName.set(key, id);
    } catch (err) {
      errors.push(`Ligne ${i + 2} : ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (!dryRun) {
    revalidatePath('/[locale]/admin/clients', 'page');
  }

  return { inserted, skipped, updated, errors };
}
