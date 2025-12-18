/*
  Warnings:

  - You are about to drop the column `sessionId` on the `TaggingRequest` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "TaggingRequest_sessionId_idx";

-- AlterTable
ALTER TABLE "TaggingRequest" DROP COLUMN "sessionId";

-- AlterTable
ALTER TABLE "event_cards" ALTER COLUMN "cityId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "user_cards" ALTER COLUMN "cityId" SET DATA TYPE TEXT;
