/*
  Warnings:

  - You are about to drop the column `sessionId` on the `TaggingRequest` table. All the data in the column will be lost.

*/
-- DropIndex (only if exists)
DROP INDEX IF EXISTS "TaggingRequest_sessionId_idx";

-- AlterTable (only if column exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'TaggingRequest' AND column_name = 'sessionId'
    ) THEN
        ALTER TABLE "TaggingRequest" DROP COLUMN "sessionId";
    END IF;
END $$;

-- CreateTable
CREATE TABLE "OwnershipRequest" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnershipRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OwnershipRequest_eventId_idx" ON "OwnershipRequest"("eventId");

-- CreateIndex
CREATE INDEX "OwnershipRequest_senderId_idx" ON "OwnershipRequest"("senderId");

-- CreateIndex
CREATE INDEX "OwnershipRequest_status_idx" ON "OwnershipRequest"("status");

-- AddForeignKey
ALTER TABLE "OwnershipRequest" ADD CONSTRAINT "OwnershipRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
