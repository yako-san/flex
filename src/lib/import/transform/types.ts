// Types partagés pour les transformateurs v1 → v2.
// On reste dans le domaine fonctionnel pur (pas de Prisma client).
// La couche persistence se charge de mapper vers Prisma.<Model>UncheckedCreateInput.

export type ImportContext = {
  workshopId: string;
  defaultLocale: string; // ex 'fr-CA'
  activeLocales: string[]; // ordonnée, première = défaut
};

export type SkippedItem = {
  reason: string;
  entityType: string;
  raw: unknown;
};

export type ImportResult<T> = {
  records: T[];
  translations: V2TranslationDraft[];
  skipped: SkippedItem[];
};

// Snapshot minimal d'une entité v2 prête à être insérée.
// Les FK sont des string IDs (préfixés ULID). Les Decimal sont stockés en string
// pour rester lisible et sérialisable (la couche Prisma fait le cast Decimal).

export type V2TranslationDraft = {
  id: string;
  workshopId: string;
  entityType: 'SERVICE' | 'PIECE' | 'FORFAIT' | 'MARQUE';
  entityId: string;
  field: string;
  locale: string;
  value: string;
  source: 'USER' | 'DEEPL' | 'LLM';
  reviewedAt: Date | null;
  reviewedById: string | null;
};

export type V2MarqueDraft = {
  id: string;
  workshopId: string;
  nom: string; // slug canonique (case-insensitive en DB via Citext)
};
