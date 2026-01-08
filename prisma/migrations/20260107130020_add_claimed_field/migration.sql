-- Add claimed column to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "claimed" BOOLEAN NOT NULL DEFAULT true;

-- Update existing users to ensure they are marked as claimed
-- (The default should handle this, but this ensures consistency)
UPDATE "User" 
SET "claimed" = true 
WHERE "claimed" IS NULL;


