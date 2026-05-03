-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "workshop_role" AS ENUM ('OWNER', 'ADMIN', 'MECANO');

-- CreateEnum
CREATE TYPE "translation_entity_type" AS ENUM ('SERVICE', 'PIECE', 'FORFAIT', 'MARQUE');

-- CreateEnum
CREATE TYPE "translation_source" AS ENUM ('USER', 'DEEPL', 'LLM');

-- CreateEnum
CREATE TYPE "comm_pref" AS ENUM ('EMAIL', 'SMS', 'TELEPHONE', 'AUCUN');

-- CreateEnum
CREATE TYPE "velo_status" AS ENUM ('RV', 'RECU', 'EN_ATTENTE', 'EVAL', 'APPROUVE', 'ON_BENCH', 'CTRL_QLTE', 'FINI', 'LIVRE', 'FACTURER', 'FACTURE');

-- CreateEnum
CREATE TYPE "bdc_eval_status" AS ENUM ('EN_ATTENTE', 'APPROUVE', 'REDUX', 'REFUSE');

-- CreateEnum
CREATE TYPE "bdc_archive_status" AS ENUM ('ACTIF', 'ARCHIVE_FACTURE', 'ARCHIVE_A_FACTURER', 'ARCHIVE_REFUSE', 'ARCHIVE_CTRL_QLTE', 'ARCHIVE_EVAL', 'ARCHIVE_LEGACY');

-- CreateEnum
CREATE TYPE "remise_type" AS ENUM ('PCT', 'FIXED');

-- CreateEnum
CREATE TYPE "bdc_item_kind" AS ENUM ('SERVICE', 'PIECE', 'FORFAIT');

-- CreateEnum
CREATE TYPE "bdc_item_task_status" AS ENUM ('TODO', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "mode_paiement" AS ENUM ('COMPTANT', 'INTERAC', 'CARTE', 'AUTRE');

-- CreateEnum
CREATE TYPE "facture_type" AS ENUM ('BDC', 'VENTE_DIRECTE', 'LEGACY', 'NOTE_CREDIT');

-- CreateEnum
CREATE TYPE "facture_statut" AS ENUM ('EMIS', 'PAYE', 'ANNULE');

-- CreateEnum
CREATE TYPE "po_status" AS ENUM ('EN_ATTENTE', 'PARTIEL', 'RECU', 'ANNULE');

-- CreateEnum
CREATE TYPE "stock_movement_type" AS ENUM ('PO_RECEIVED', 'BDC_INVOICED', 'SALE_INVOICED', 'MANUAL_ADJUSTMENT', 'RESERVATION', 'RELEASE');

-- CreateEnum
CREATE TYPE "counter_kind" AS ENUM ('FACTURE_SEQUENCE', 'VELO_SEQUENCE', 'PO_SEQUENCE');

-- CreateEnum
CREATE TYPE "audit_action" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'STOCK_MOVEMENT', 'INVOICE_EMITTED', 'INVOICE_VOIDED', 'ROLE_CHANGE', 'TRANSLATION_REVIEWED');

-- CreateTable
CREATE TABLE "workshop" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" VARCHAR(2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "default_locale" VARCHAR(10) NOT NULL,
    "active_locales" JSONB NOT NULL,
    "fiscal_entity" JSONB,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "workshop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "full_name" TEXT,
    "default_locale" VARCHAR(10) NOT NULL DEFAULT 'fr-CA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_member" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "workshop_role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "workshop_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "entity_type" "translation_entity_type" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "value" TEXT NOT NULL,
    "source" "translation_source" NOT NULL,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marque" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "nom" CITEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "marque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "legacy_code" TEXT,
    "label_canonical" TEXT NOT NULL,
    "categorie" TEXT,
    "categorie_prio" TEXT,
    "duree_minutes" INTEGER,
    "prix" DECIMAL(12,2) NOT NULL,
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "piece" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "legacy_code" TEXT,
    "nom_canonical" TEXT NOT NULL,
    "sku" TEXT,
    "code_barre" TEXT,
    "categorie" TEXT,
    "fournisseur" TEXT,
    "prix_achat" DECIMAL(12,2),
    "prix_base" DECIMAL(12,2),
    "prix_vente" DECIMAL(12,2) NOT NULL,
    "prix_cost" DECIMAL(12,2),
    "prix_bdc" DECIMAL(12,2),
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "stock_physique" INTEGER NOT NULL DEFAULT 0,
    "stock_reserve" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "piece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forfait" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "legacy_code" TEXT,
    "label_canonical" TEXT NOT NULL,
    "prix" DECIMAL(12,2) NOT NULL,
    "duree_minutes" INTEGER,
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "forfait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forfait_task_template" (
    "id" TEXT NOT NULL,
    "forfait_id" TEXT NOT NULL,
    "label_canonical" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "forfait_task_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT,
    "indicatif" VARCHAR(5),
    "courriel" CITEXT,
    "comm_pref" "comm_pref" NOT NULL DEFAULT 'EMAIL',
    "lang" VARCHAR(10) NOT NULL,
    "lead" TEXT,
    "remise_default" DECIMAL(5,2),
    "adresse_postale" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "velo" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "marque_id" TEXT,
    "velo_numero" INTEGER NOT NULL,
    "status" "velo_status" NOT NULL DEFAULT 'RV',
    "date1" TIMESTAMP(3),
    "date2" TIMESTAMP(3),
    "date3" TIMESTAMP(3),
    "modele" TEXT,
    "couleur" TEXT,
    "taille" TEXT,
    "numero_serie" TEXT,
    "eval_mecano_id" TEXT,
    "meca_mecano_id" TEXT,
    "ctrl_mecano_id" TEXT,
    "note_velo" TEXT,
    "note_client_eval" TEXT,
    "note_client_facture" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "velo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bdc" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "velo_id" TEXT NOT NULL,
    "eval_status" "bdc_eval_status" NOT NULL DEFAULT 'EN_ATTENTE',
    "archive_status" "bdc_archive_status" NOT NULL DEFAULT 'ACTIF',
    "cb_eval_envoye" BOOLEAN NOT NULL DEFAULT false,
    "cb_eval" BOOLEAN NOT NULL DEFAULT false,
    "cb_bon_sortie" BOOLEAN NOT NULL DEFAULT false,
    "cb_archiver" BOOLEAN NOT NULL DEFAULT false,
    "remise_svc_type" "remise_type",
    "remise_svc_value" DECIMAL(12,2),
    "remise_pce_type" "remise_type",
    "remise_pce_value" DECIMAL(12,2),
    "total_services" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_pieces" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "bdc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bdc_item" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "bdc_id" TEXT NOT NULL,
    "kind" "bdc_item_kind" NOT NULL,
    "position" INTEGER NOT NULL,
    "service_id" TEXT,
    "piece_id" TEXT,
    "forfait_id" TEXT,
    "label_snapshot" TEXT NOT NULL,
    "unit_price_snapshot" DECIMAL(12,2) NOT NULL,
    "taxable_snapshot" BOOLEAN NOT NULL,
    "qty" DECIMAL(10,3) NOT NULL DEFAULT 1,
    "total" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "bdc_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bdc_item_task" (
    "id" TEXT NOT NULL,
    "bdc_item_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "label_snapshot" TEXT NOT NULL,
    "status" "bdc_item_task_status" NOT NULL DEFAULT 'TODO',
    "done_at" TIMESTAMP(3),
    "done_by_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bdc_item_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vente_directe" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "client_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "facture_numero" TEXT,
    "facture_date" TIMESTAMP(3),
    "facture_url" TEXT,
    "modePaiement" "mode_paiement",
    "remise_type" "remise_type",
    "remise_value" DECIMAL(12,2),
    "total_pieces" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "vente_directe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vente_directe_item" (
    "id" TEXT NOT NULL,
    "vente_id" TEXT NOT NULL,
    "piece_id" TEXT,
    "position" INTEGER NOT NULL,
    "sku_snapshot" TEXT,
    "nom_snapshot" TEXT NOT NULL,
    "qty" DECIMAL(10,3) NOT NULL DEFAULT 1,
    "unit_price_snapshot" DECIMAL(12,2) NOT NULL,
    "taxable_snapshot" BOOLEAN NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vente_directe_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facture_log" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "type" "facture_type" NOT NULL,
    "facture_numero" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "modePaiement" "mode_paiement",
    "statut" "facture_statut" NOT NULL DEFAULT 'EMIS',
    "bdc_id" TEXT,
    "vente_id" TEXT,
    "note_credit_cible_id" TEXT,
    "client_id" TEXT,
    "tax_rates_snapshot" JSONB NOT NULL,
    "lines_snapshot" JSONB NOT NULL,
    "fiscal_snapshot" JSONB,
    "total_services" DECIMAL(12,2) NOT NULL,
    "total_pieces" DECIMAL(12,2) NOT NULL,
    "sous_total" DECIMAL(12,2) NOT NULL,
    "tps" DECIMAL(12,2) NOT NULL,
    "tvq" DECIMAL(12,2) NOT NULL,
    "taxes" DECIMAL(12,2) NOT NULL,
    "grand_total" DECIMAL(12,2) NOT NULL,
    "validation" JSONB,
    "notes" TEXT,
    "pdf_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "facture_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "po" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "po_numero" TEXT NOT NULL,
    "fournisseur" TEXT NOT NULL,
    "date_commande" TIMESTAMP(3) NOT NULL,
    "date_reception" TIMESTAMP(3),
    "status" "po_status" NOT NULL DEFAULT 'EN_ATTENTE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "po_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "po_item" (
    "id" TEXT NOT NULL,
    "po_id" TEXT NOT NULL,
    "piece_id" TEXT,
    "position" INTEGER NOT NULL,
    "sku_snapshot" TEXT,
    "nom_snapshot" TEXT NOT NULL,
    "qty_commandee" DECIMAL(10,3) NOT NULL,
    "qty_recue" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "po_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movement" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "piece_id" TEXT NOT NULL,
    "type" "stock_movement_type" NOT NULL,
    "delta" DECIMAL(10,3) NOT NULL,
    "reason" TEXT,
    "bdc_item_id" TEXT,
    "vente_item_id" TEXT,
    "po_item_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,

    CONSTRAINT "stock_movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counter" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "kind" "counter_kind" NOT NULL,
    "prefix" TEXT,
    "current" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipe_member" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "surnom" TEXT NOT NULL,
    "courriel" CITEXT,
    "telephone" TEXT,
    "indicatif" VARCHAR(5),
    "lang" VARCHAR(10) NOT NULL DEFAULT 'fr-CA',
    "role" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "equipe_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" "audit_action" NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legacy_id_mapping" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "legacy_id" TEXT NOT NULL,
    "new_id" TEXT NOT NULL,
    "legacy_sku" TEXT,
    "legacy_nom" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legacy_id_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workshop_slug_key" ON "workshop"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_stripe_customer_id_key" ON "workshop"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_stripe_subscription_id_key" ON "workshop"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "workshop_deleted_at_idx" ON "workshop"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_clerk_user_id_key" ON "user"("clerk_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "workshop_member_user_id_idx" ON "workshop_member"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_member_workshop_id_user_id_key" ON "workshop_member"("workshop_id", "user_id");

-- CreateIndex
CREATE INDEX "translation_workshop_id_entity_type_entity_id_idx" ON "translation"("workshop_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "translation_reviewed_at_idx" ON "translation"("reviewed_at");

-- CreateIndex
CREATE UNIQUE INDEX "translation_workshop_id_entity_type_entity_id_field_locale_key" ON "translation"("workshop_id", "entity_type", "entity_id", "field", "locale");

-- CreateIndex
CREATE INDEX "marque_deleted_at_idx" ON "marque"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "marque_workshop_id_nom_key" ON "marque"("workshop_id", "nom");

-- CreateIndex
CREATE INDEX "service_workshop_id_deleted_at_idx" ON "service"("workshop_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "service_workshop_id_legacy_code_key" ON "service"("workshop_id", "legacy_code");

-- CreateIndex
CREATE INDEX "piece_workshop_id_deleted_at_idx" ON "piece"("workshop_id", "deleted_at");

-- CreateIndex
CREATE INDEX "piece_workshop_id_code_barre_idx" ON "piece"("workshop_id", "code_barre");

-- CreateIndex
CREATE UNIQUE INDEX "piece_workshop_id_legacy_code_key" ON "piece"("workshop_id", "legacy_code");

-- CreateIndex
CREATE UNIQUE INDEX "piece_workshop_id_sku_key" ON "piece"("workshop_id", "sku");

-- CreateIndex
CREATE INDEX "forfait_workshop_id_deleted_at_idx" ON "forfait"("workshop_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "forfait_workshop_id_legacy_code_key" ON "forfait"("workshop_id", "legacy_code");

-- CreateIndex
CREATE UNIQUE INDEX "forfait_task_template_forfait_id_position_key" ON "forfait_task_template"("forfait_id", "position");

-- CreateIndex
CREATE INDEX "client_workshop_id_deleted_at_idx" ON "client"("workshop_id", "deleted_at");

-- CreateIndex
CREATE INDEX "client_workshop_id_courriel_idx" ON "client"("workshop_id", "courriel");

-- CreateIndex
CREATE INDEX "client_workshop_id_telephone_idx" ON "client"("workshop_id", "telephone");

-- CreateIndex
CREATE INDEX "velo_workshop_id_status_idx" ON "velo"("workshop_id", "status");

-- CreateIndex
CREATE INDEX "velo_client_id_idx" ON "velo"("client_id");

-- CreateIndex
CREATE INDEX "velo_workshop_id_deleted_at_idx" ON "velo"("workshop_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "velo_workshop_id_velo_numero_key" ON "velo"("workshop_id", "velo_numero");

-- CreateIndex
CREATE UNIQUE INDEX "bdc_velo_id_key" ON "bdc"("velo_id");

-- CreateIndex
CREATE INDEX "bdc_workshop_id_eval_status_idx" ON "bdc"("workshop_id", "eval_status");

-- CreateIndex
CREATE INDEX "bdc_workshop_id_archive_status_idx" ON "bdc"("workshop_id", "archive_status");

-- CreateIndex
CREATE INDEX "bdc_workshop_id_deleted_at_idx" ON "bdc"("workshop_id", "deleted_at");

-- CreateIndex
CREATE INDEX "bdc_item_bdc_id_position_idx" ON "bdc_item"("bdc_id", "position");

-- CreateIndex
CREATE INDEX "bdc_item_workshop_id_piece_id_idx" ON "bdc_item"("workshop_id", "piece_id");

-- CreateIndex
CREATE INDEX "bdc_item_task_bdc_item_id_position_idx" ON "bdc_item_task"("bdc_item_id", "position");

-- CreateIndex
CREATE INDEX "vente_directe_workshop_id_deleted_at_idx" ON "vente_directe"("workshop_id", "deleted_at");

-- CreateIndex
CREATE INDEX "vente_directe_workshop_id_facture_numero_idx" ON "vente_directe"("workshop_id", "facture_numero");

-- CreateIndex
CREATE INDEX "vente_directe_item_vente_id_position_idx" ON "vente_directe_item"("vente_id", "position");

-- CreateIndex
CREATE INDEX "facture_log_workshop_id_date_idx" ON "facture_log"("workshop_id", "date");

-- CreateIndex
CREATE INDEX "facture_log_workshop_id_statut_idx" ON "facture_log"("workshop_id", "statut");

-- CreateIndex
CREATE INDEX "facture_log_client_id_idx" ON "facture_log"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "facture_log_workshop_id_facture_numero_key" ON "facture_log"("workshop_id", "facture_numero");

-- CreateIndex
CREATE INDEX "po_workshop_id_status_idx" ON "po"("workshop_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "po_workshop_id_po_numero_key" ON "po"("workshop_id", "po_numero");

-- CreateIndex
CREATE INDEX "po_item_po_id_position_idx" ON "po_item"("po_id", "position");

-- CreateIndex
CREATE INDEX "stock_movement_workshop_id_piece_id_created_at_idx" ON "stock_movement"("workshop_id", "piece_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movement_type_idx" ON "stock_movement"("type");

-- CreateIndex
CREATE UNIQUE INDEX "counter_workshop_id_kind_key" ON "counter"("workshop_id", "kind");

-- CreateIndex
CREATE INDEX "equipe_member_workshop_id_active_idx" ON "equipe_member"("workshop_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "equipe_member_workshop_id_surnom_key" ON "equipe_member"("workshop_id", "surnom");

-- CreateIndex
CREATE INDEX "audit_log_workshop_id_entity_type_entity_id_idx" ON "audit_log"("workshop_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_workshop_id_at_idx" ON "audit_log"("workshop_id", "at");

-- CreateIndex
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log"("actor_id");

-- CreateIndex
CREATE INDEX "legacy_id_mapping_workshop_id_entity_type_legacy_id_idx" ON "legacy_id_mapping"("workshop_id", "entity_type", "legacy_id");

-- CreateIndex
CREATE INDEX "legacy_id_mapping_workshop_id_entity_type_new_id_idx" ON "legacy_id_mapping"("workshop_id", "entity_type", "new_id");

-- CreateIndex
CREATE INDEX "legacy_id_mapping_workshop_id_entity_type_legacy_id_legacy__idx" ON "legacy_id_mapping"("workshop_id", "entity_type", "legacy_id", "legacy_sku");

-- AddForeignKey
ALTER TABLE "workshop_member" ADD CONSTRAINT "workshop_member_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_member" ADD CONSTRAINT "workshop_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation" ADD CONSTRAINT "translation_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marque" ADD CONSTRAINT "marque_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piece" ADD CONSTRAINT "piece_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forfait" ADD CONSTRAINT "forfait_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forfait_task_template" ADD CONSTRAINT "forfait_task_template_forfait_id_fkey" FOREIGN KEY ("forfait_id") REFERENCES "forfait"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client" ADD CONSTRAINT "client_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "velo" ADD CONSTRAINT "velo_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "velo" ADD CONSTRAINT "velo_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "velo" ADD CONSTRAINT "velo_marque_id_fkey" FOREIGN KEY ("marque_id") REFERENCES "marque"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "velo" ADD CONSTRAINT "velo_eval_mecano_id_fkey" FOREIGN KEY ("eval_mecano_id") REFERENCES "equipe_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "velo" ADD CONSTRAINT "velo_meca_mecano_id_fkey" FOREIGN KEY ("meca_mecano_id") REFERENCES "equipe_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "velo" ADD CONSTRAINT "velo_ctrl_mecano_id_fkey" FOREIGN KEY ("ctrl_mecano_id") REFERENCES "equipe_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bdc" ADD CONSTRAINT "bdc_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bdc" ADD CONSTRAINT "bdc_velo_id_fkey" FOREIGN KEY ("velo_id") REFERENCES "velo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bdc_item" ADD CONSTRAINT "bdc_item_bdc_id_fkey" FOREIGN KEY ("bdc_id") REFERENCES "bdc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bdc_item" ADD CONSTRAINT "bdc_item_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bdc_item" ADD CONSTRAINT "bdc_item_piece_id_fkey" FOREIGN KEY ("piece_id") REFERENCES "piece"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bdc_item" ADD CONSTRAINT "bdc_item_forfait_id_fkey" FOREIGN KEY ("forfait_id") REFERENCES "forfait"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bdc_item_task" ADD CONSTRAINT "bdc_item_task_bdc_item_id_fkey" FOREIGN KEY ("bdc_item_id") REFERENCES "bdc_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vente_directe" ADD CONSTRAINT "vente_directe_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vente_directe" ADD CONSTRAINT "vente_directe_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vente_directe_item" ADD CONSTRAINT "vente_directe_item_vente_id_fkey" FOREIGN KEY ("vente_id") REFERENCES "vente_directe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vente_directe_item" ADD CONSTRAINT "vente_directe_item_piece_id_fkey" FOREIGN KEY ("piece_id") REFERENCES "piece"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facture_log" ADD CONSTRAINT "facture_log_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facture_log" ADD CONSTRAINT "facture_log_bdc_id_fkey" FOREIGN KEY ("bdc_id") REFERENCES "bdc"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facture_log" ADD CONSTRAINT "facture_log_vente_id_fkey" FOREIGN KEY ("vente_id") REFERENCES "vente_directe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facture_log" ADD CONSTRAINT "facture_log_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facture_log" ADD CONSTRAINT "facture_log_note_credit_cible_id_fkey" FOREIGN KEY ("note_credit_cible_id") REFERENCES "facture_log"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po" ADD CONSTRAINT "po_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_item" ADD CONSTRAINT "po_item_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "po"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_item" ADD CONSTRAINT "po_item_piece_id_fkey" FOREIGN KEY ("piece_id") REFERENCES "piece"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_piece_id_fkey" FOREIGN KEY ("piece_id") REFERENCES "piece"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counter" ADD CONSTRAINT "counter_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipe_member" ADD CONSTRAINT "equipe_member_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legacy_id_mapping" ADD CONSTRAINT "legacy_id_mapping_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

