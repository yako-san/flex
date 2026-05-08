-- Sprint 2.6 — PO ADHOC + champs PoItem (categorie, notes)
--
-- ADHOC : workflow V1 où on crée un PO directement à la réception sans
-- commande préalable (achat dépannage, impulse buy). poNumero préfixé
-- par 'ADHOC-'. Peut être fusionné dans un PO normal plus tard.

ALTER TABLE "po"
  ADD COLUMN IF NOT EXISTS "is_adhoc" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "po_item"
  ADD COLUMN IF NOT EXISTS "categorie" TEXT,
  ADD COLUMN IF NOT EXISTS "notes" TEXT;
