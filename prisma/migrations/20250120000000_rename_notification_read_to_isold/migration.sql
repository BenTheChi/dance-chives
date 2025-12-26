-- Rename column from "read" to "isOld" in Notification table
ALTER TABLE "Notification" RENAME COLUMN "read" TO "isOld";

-- Drop the old index
DROP INDEX IF EXISTS "Notification_read_idx";

-- Create the new index (it should already exist from db:push, but ensure it's there)
CREATE INDEX IF NOT EXISTS "Notification_isOld_idx" ON "Notification"("isOld");

