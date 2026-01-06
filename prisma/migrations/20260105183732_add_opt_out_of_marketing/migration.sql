-- Add optOutOfMarketing column to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "optOutOfMarketing" BOOLEAN NOT NULL DEFAULT false;

