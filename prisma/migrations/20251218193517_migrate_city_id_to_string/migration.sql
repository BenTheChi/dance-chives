-- AlterTable
-- Only change cityId types, skip sessionId operations that don't exist
ALTER TABLE "event_cards" ALTER COLUMN "cityId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "user_cards" ALTER COLUMN "cityId" SET DATA TYPE TEXT;
