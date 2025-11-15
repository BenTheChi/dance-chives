-- AlterTable
ALTER TABLE "TaggingRequest" ADD COLUMN "sessionId" TEXT;
ALTER TABLE "TaggingRequest" ALTER COLUMN "eventId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "TaggingRequest_sessionId_idx" ON "TaggingRequest"("sessionId");
