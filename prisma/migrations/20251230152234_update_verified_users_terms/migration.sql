-- Add columns if they don't exist (schema migration)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "contentUsageAcceptedAt" TIMESTAMP(3);

-- Update all verified users to have terms acceptance dates set to now()
-- This migration updates termsAcceptedAt and contentUsageAcceptedAt for all existing verified users
-- to reflect that they have accepted the updated terms as of this migration date

UPDATE "User"
SET 
  "termsAcceptedAt" = NOW(),
  "contentUsageAcceptedAt" = NOW()
WHERE 
  "accountVerified" IS NOT NULL;