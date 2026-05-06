-- EmailLog : audit trail des courriels envoyés via Resend
-- (éval client, facture, vélo prêt, etc.)

CREATE TYPE "email_kind" AS ENUM ('BDT_EVAL', 'BDT_FACTURE', 'CLIENT_PICKUP_READY', 'OTHER');
CREATE TYPE "email_status" AS ENUM ('PENDING', 'SENT', 'FAILED', 'BOUNCED');

CREATE TABLE "email_log" (
  "id" TEXT NOT NULL,
  "workshop_id" TEXT NOT NULL,
  "kind" "email_kind" NOT NULL,
  "status" "email_status" NOT NULL DEFAULT 'PENDING',
  "to_email" TEXT NOT NULL,
  "from_email" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body_html" TEXT,
  "bdc_id" TEXT,
  "facture_log_id" TEXT,
  "client_id" TEXT,
  "provider_msg_id" TEXT,
  "provider_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sent_at" TIMESTAMP(3),
  "created_by_id" TEXT,

  CONSTRAINT "email_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_log_workshop_id_created_at_idx" ON "email_log"("workshop_id", "created_at");
CREATE INDEX "email_log_bdc_id_idx" ON "email_log"("bdc_id");
CREATE INDEX "email_log_facture_log_id_idx" ON "email_log"("facture_log_id");

ALTER TABLE "email_log"
  ADD CONSTRAINT "email_log_workshop_id_fkey"
  FOREIGN KEY ("workshop_id") REFERENCES "workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
