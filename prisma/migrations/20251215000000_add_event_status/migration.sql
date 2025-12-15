-- AlterTable
ALTER TABLE "event_cards" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'visible';

-- CreateIndex
CREATE INDEX "event_cards_status_idx" ON "event_cards"("status");

