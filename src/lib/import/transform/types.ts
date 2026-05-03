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

export type V2EquipeMemberDraft = {
  id: string;
  workshopId: string;
  prenom: string;
  nom: string;
  surnom: string;
  courriel: string | null;
  telephone: string | null;
  indicatif: string | null;
  lang: string; // BCP 47
  role: string | null;
  active: boolean;
  notes: string | null;
};

export type V2ServiceDraft = {
  id: string;
  workshopId: string;
  legacyCode: string | null; // ex 'S00001'
  labelCanonical: string;
  categorie: string | null;
  categoriePrio: string | null;
  dureeMinutes: number | null;
  prix: string; // Decimal stringifié
  taxable: boolean;
};

export type V2ForfaitDraft = {
  id: string;
  workshopId: string;
  legacyCode: string | null;
  labelCanonical: string;
  prix: string; // Decimal stringifié
  dureeMinutes: number | null;
  taxable: boolean;
};

export type V2ForfaitTaskTemplateDraft = {
  id: string;
  forfaitId: string;
  labelCanonical: string;
  position: number;
};

export type V2ClientDraft = {
  id: string;
  workshopId: string;
  prenom: string;
  nom: string;
  telephone: string | null;
  indicatif: string | null;
  courriel: string | null;
  commPref: 'EMAIL' | 'SMS' | 'TELEPHONE' | 'AUCUN';
  lang: string; // BCP 47
  lead: string | null;
  remiseDefault: string | null; // Decimal stringifié, % (ex "15" pour 15%)
  adressePostale: Record<string, unknown> | null;
  notes: string | null;
};

export type V2PieceDraft = {
  id: string;
  workshopId: string;
  legacyCode: string | null;
  nomCanonical: string;
  sku: string | null;
  codeBarre: string | null;
  categorie: string | null;
  fournisseur: string | null;
  prixAchat: string | null;
  prixBase: string | null;
  prixVente: string;
  prixCost: string | null;
  prixBdc: string | null;
  taxable: boolean;
  stockPhysique: number;
  stockReserve: number;
};

export type CatalogueImportResult = {
  services: V2ServiceDraft[];
  forfaits: V2ForfaitDraft[];
  taskTemplates: V2ForfaitTaskTemplateDraft[];
  translations: V2TranslationDraft[];
  skipped: SkippedItem[];
};
