import { Prisma, type PrismaClient } from '@prisma/client';
import type { ImportV1Result } from './import-v1';

// =============================================================================
// Persistence v1 → DB
//
// Persiste un ImportV1Result via Prisma dans une transaction unique (atomicité
// par workshop). Les inserts sont chunkés (1000 records / createMany) pour
// éviter les limites de paramètres Postgres (~65k bind params).
//
// Ordre des inserts contraint par les FKs :
//   1. workshop                      (racine)
//   2. marques, equipe, services,    (FK = workshop seul)
//      forfaits, pieces, clients,
//      legacyMappings
//   3. forfaitTaskTemplates          (FK = forfait)
//   4. velos                         (FK = client + marque + equipe)
//   5. bdcs, ventes, pos             (FK = velo / client / etc.)
//   6. bdcItems, venteItems, poItems (FK = bdc / vente / po)
//   7. bdcItemTasks                  (FK = bdcItem)
//   8. translations                  (polymorphique : entityType + entityId)
// =============================================================================

const CHUNK_SIZE = 1000;

// Convertit une string ISO (YYYY-MM-DD ou ISO complet) en Date.
// Les transformeurs émettent des strings ; Prisma DateTime requiert des Date.
function toDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

async function chunkedCreateMany<T>(
  rows: T[],
  insert: (chunk: T[]) => Promise<unknown>,
): Promise<void> {
  if (rows.length === 0) return;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    await insert(rows.slice(i, i + CHUNK_SIZE));
  }
}

export type PersistStats = {
  workshop: 1;
  marques: number;
  equipe: number;
  services: number;
  forfaits: number;
  taskTemplates: number;
  pieces: number;
  clients: number;
  velos: number;
  bdcs: number;
  bdcItems: number;
  bdcItemTasks: number;
  ventes: number;
  venteItems: number;
  pos: number;
  poItems: number;
  translations: number;
  legacyMappings: number;
};

export async function persistImportV1(
  prisma: PrismaClient,
  result: ImportV1Result,
): Promise<PersistStats> {
  return prisma.$transaction(async (tx) => {
    // 1. Workshop racine
    await tx.workshop.create({
      data: {
        id: result.workshop.id,
        slug: result.workshop.slug,
        name: result.workshop.name,
        country: result.workshop.country,
        currency: result.workshop.currency,
        timezone: result.workshop.timezone,
        defaultLocale: result.workshop.defaultLocale,
        activeLocales: result.workshop.activeLocales as Prisma.InputJsonValue,
      },
    });

    // 2. Entités à FK simple (workshopId)
    await chunkedCreateMany(result.marques, (data) => tx.marque.createMany({ data }));
    await chunkedCreateMany(result.equipe, (data) => tx.equipeMember.createMany({ data }));
    await chunkedCreateMany(result.services, (data) =>
      tx.service.createMany({
        data: data.map((s) => ({ ...s, prix: s.prix })),
      }),
    );
    await chunkedCreateMany(result.forfaits, (data) => tx.forfait.createMany({ data }));
    await chunkedCreateMany(result.pieces, (data) => tx.piece.createMany({ data }));
    await chunkedCreateMany(result.clients, (data) =>
      tx.client.createMany({
        data: data.map((c) => ({
          ...c,
          adressePostale: c.adressePostale
            ? (c.adressePostale as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        })),
      }),
    );
    await chunkedCreateMany(result.legacyMappings, (data) =>
      tx.legacyIdMapping.createMany({ data }),
    );

    // 3. Forfait task templates (FK forfait)
    await chunkedCreateMany(result.taskTemplates, (data) =>
      tx.forfaitTaskTemplate.createMany({ data }),
    );

    // 4. Velos (FK client + marque + equipe)
    await chunkedCreateMany(result.velos, (data) =>
      tx.velo.createMany({
        data: data.map((v) => ({
          ...v,
          date1: toDate(v.date1),
          date2: toDate(v.date2),
          date3: toDate(v.date3),
        })),
      }),
    );

    // 5. Bdcs / Ventes / Pos (entêtes)
    await chunkedCreateMany(result.bdcs, (data) => tx.bdc.createMany({ data }));
    await chunkedCreateMany(result.ventes, (data) =>
      tx.venteDirecte.createMany({
        data: data.map((vt) => ({
          ...vt,
          date: toDate(vt.date) ?? new Date(0),
          factureDate: toDate(vt.factureDate),
        })),
      }),
    );
    await chunkedCreateMany(result.pos, (data) =>
      tx.po.createMany({
        data: data.map((p) => ({
          ...p,
          dateCommande: toDate(p.dateCommande) ?? new Date(0),
          dateReception: toDate(p.dateReception),
        })),
      }),
    );

    // 6. Items (FK entête)
    await chunkedCreateMany(result.bdcItems, (data) => tx.bdcItem.createMany({ data }));
    await chunkedCreateMany(result.venteItems, (data) =>
      tx.venteDirecteItem.createMany({ data }),
    );
    await chunkedCreateMany(result.poItems, (data) => tx.poItem.createMany({ data }));

    // 7. BdcItem tasks (FK bdcItem)
    await chunkedCreateMany(result.bdcItemTasks, (data) =>
      tx.bdcItemTask.createMany({ data }),
    );

    // 8. Translations
    await chunkedCreateMany(result.translations, (data) =>
      tx.translation.createMany({ data }),
    );

    return {
      workshop: 1 as const,
      marques: result.marques.length,
      equipe: result.equipe.length,
      services: result.services.length,
      forfaits: result.forfaits.length,
      taskTemplates: result.taskTemplates.length,
      pieces: result.pieces.length,
      clients: result.clients.length,
      velos: result.velos.length,
      bdcs: result.bdcs.length,
      bdcItems: result.bdcItems.length,
      bdcItemTasks: result.bdcItemTasks.length,
      ventes: result.ventes.length,
      venteItems: result.venteItems.length,
      pos: result.pos.length,
      poItems: result.poItems.length,
      translations: result.translations.length,
      legacyMappings: result.legacyMappings.length,
    };
  });
}

// Tx kept exported for potential future composition; void usage avoids unused warning.
export type { Tx };
