-- Add filterPreferences JSON column to User table
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "filterPreferences" JSONB;

