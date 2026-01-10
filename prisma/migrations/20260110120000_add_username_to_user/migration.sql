-- Add username column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;

-- Enforce uniqueness (allows multiple NULLs by Postgres semantics)
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");



