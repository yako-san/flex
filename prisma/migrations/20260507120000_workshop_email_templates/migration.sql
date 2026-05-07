-- Workshop.emailTemplates : templates personnalisés des courriels client.
-- Forme : { eval: { subject, body }, facture: { subject, body } }
-- Body accepte HTML + placeholders {{clientPrenom}}, {{bdcShortId}}, etc.

ALTER TABLE "workshop" ADD COLUMN IF NOT EXISTS "email_templates" JSONB;
