-- Workshop.clerkOrgId : lien 1:1 vers Clerk Organization (multi-tenant).
-- Nullable pour permettre un workshop seed pré-Clerk Orgs, à linker
-- ensuite via UI.

ALTER TABLE "workshop" ADD COLUMN "clerk_org_id" TEXT;
CREATE UNIQUE INDEX "workshop_clerk_org_id_key" ON "workshop"("clerk_org_id");
