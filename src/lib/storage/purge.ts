// Sprint 2.8 (suite) — purge périodique des photos BDT soft-supprimées.
//
// Quand l'utilisateur clique « supprimer » sur une photo, on fait un soft-
// delete (`deletedAt = now()`) côté DB pour permettre la restauration en cas
// de doigt qui glisse. Mais le fichier Vercel Blob reste, ce qui coûte du
// stockage à long terme.
//
// Ce module expose `purgeOrphanPhotos(...)` : pour chaque BdcPhoto avec
// `deletedAt` plus vieux que N jours (30 par défaut), on supprime le fichier
// Blob puis on hard-delete la row. Le tout dans un mode résilient : si le
// Blob a déjà disparu (404), on log et on continue avec la suppression DB.
//
// La fonction est volontairement pure (prend prisma + deleteBlob en arg)
// pour pouvoir être testée sans toucher au vrai client Vercel Blob.

export type PurgePhotosDeps = {
  prisma: {
    bdcPhoto: {
      findMany: (args: {
        where: { deletedAt: { not: null; lt: Date } };
        select: { id: true; blobPath: true };
        take?: number;
      }) => Promise<{ id: string; blobPath: string }[]>;
      delete: (args: { where: { id: string } }) => Promise<unknown>;
    };
  };
  deleteBlob: (blobPath: string) => Promise<void>;
  now?: () => Date;
  logger?: {
    warn: (msg: string, meta?: unknown) => void;
    info?: (msg: string, meta?: unknown) => void;
  };
};

export type PurgePhotosOptions = {
  /** Photos `deletedAt` plus vieilles que ce nombre de jours sont éligibles. */
  olderThanDays?: number;
  /** Plafond par run (filet anti-runaway, ex. 5000). */
  maxPerRun?: number;
};

export type PurgePhotosResult = {
  /** Nombre de photos détectées comme candidates. */
  candidates: number;
  /** Rows DB effectivement supprimées (hard delete). */
  rowsDeleted: number;
  /** Fichiers Blob effectivement supprimés. */
  blobsDeleted: number;
  /** Erreurs Blob ignorées (404 et co — la row a quand même été deleted). */
  blobErrorsIgnored: number;
  /** Erreurs DB (la row n'a pas pu être deleted ; on l'ignore aussi pour ne
   *  pas bloquer le reste du run, mais on les compte). */
  dbErrorsIgnored: number;
};

const DEFAULT_OLDER_THAN_DAYS = 30;
const DEFAULT_MAX_PER_RUN = 5000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function purgeOrphanPhotos(
  deps: PurgePhotosDeps,
  opts: PurgePhotosOptions = {},
): Promise<PurgePhotosResult> {
  const olderThanDays = opts.olderThanDays ?? DEFAULT_OLDER_THAN_DAYS;
  const maxPerRun = opts.maxPerRun ?? DEFAULT_MAX_PER_RUN;
  const now = (deps.now ?? (() => new Date()))();
  const cutoff = new Date(now.getTime() - olderThanDays * MS_PER_DAY);

  const candidates = await deps.prisma.bdcPhoto.findMany({
    where: { deletedAt: { not: null, lt: cutoff } },
    select: { id: true, blobPath: true },
    take: maxPerRun,
  });

  const result: PurgePhotosResult = {
    candidates: candidates.length,
    rowsDeleted: 0,
    blobsDeleted: 0,
    blobErrorsIgnored: 0,
    dbErrorsIgnored: 0,
  };

  for (const photo of candidates) {
    try {
      await deps.deleteBlob(photo.blobPath);
      result.blobsDeleted += 1;
    } catch (e) {
      result.blobErrorsIgnored += 1;
      deps.logger?.warn?.('purge: deleteBlob a échoué (on continue)', {
        photoId: photo.id,
        blobPath: photo.blobPath,
        error: e instanceof Error ? e.message : String(e),
      });
    }

    try {
      await deps.prisma.bdcPhoto.delete({ where: { id: photo.id } });
      result.rowsDeleted += 1;
    } catch (e) {
      result.dbErrorsIgnored += 1;
      deps.logger?.warn?.('purge: prisma.bdcPhoto.delete a échoué (on continue)', {
        photoId: photo.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  deps.logger?.info?.('purge: terminé', result);
  return result;
}
