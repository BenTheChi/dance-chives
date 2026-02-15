-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('waiting', 'reviewing', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'waiting',
    "email" TEXT,
    "igPostUrl" TEXT,
    "blob" TEXT,
    "eventId" TEXT,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviewing" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submission_id" TEXT NOT NULL,
    "event_json" JSONB NOT NULL,

    CONSTRAINT "reviewing_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "event_cards" ADD COLUMN "igPostUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "event_cards_igPostUrl_key" ON "event_cards"("igPostUrl");

-- CreateIndex
CREATE INDEX "submissions_status_idx" ON "submissions"("status");

-- CreateIndex
CREATE INDEX "submissions_createdAt_idx" ON "submissions"("createdAt");

-- CreateIndex
CREATE INDEX "submissions_updatedAt_idx" ON "submissions"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_active_igPostUrl_key"
ON "submissions"("igPostUrl")
WHERE "igPostUrl" IS NOT NULL
  AND "status" IN ('waiting', 'reviewing');

-- CreateIndex
CREATE UNIQUE INDEX "reviewing_submission_id_key" ON "reviewing"("submission_id");

-- AddForeignKey
ALTER TABLE "reviewing" ADD CONSTRAINT "reviewing_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
