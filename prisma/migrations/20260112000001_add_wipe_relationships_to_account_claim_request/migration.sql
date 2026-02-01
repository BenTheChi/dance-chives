-- Add wipeRelationships column to AccountClaimRequest table
ALTER TABLE "AccountClaimRequest"
ADD COLUMN IF NOT EXISTS "wipeRelationships" BOOLEAN NOT NULL DEFAULT false;
