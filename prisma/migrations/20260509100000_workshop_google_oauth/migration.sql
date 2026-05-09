-- Sprint 2.7 — Workshop OAuth Google (Gmail draft)
--
-- Stocke le refresh_token Google OAuth pour permettre la création de
-- brouillons Gmail via Gmail API (scope gmail.compose). googleEmail
-- = adresse du compte connecté, affichée dans Settings.

ALTER TABLE workshop
  ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS google_email TEXT;
