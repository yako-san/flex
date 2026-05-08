-- Sprint 2.5 — courriel de suivi post-livraison
--
-- 1. Bdc.cbSuiviEnvoye : flag indiquant que le courriel de suivi a été envoyé
-- 2. EmailKind.BDT_SUIVI : nouveau type d'email pour audit/log

ALTER TABLE "bdc"
  ADD COLUMN IF NOT EXISTS "cb_suivi_envoye" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TYPE "email_kind" ADD VALUE IF NOT EXISTS 'BDT_SUIVI';
