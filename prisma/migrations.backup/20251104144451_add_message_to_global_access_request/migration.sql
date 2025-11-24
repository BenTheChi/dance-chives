-- CreateEnum (if it doesn't exist)
DO $$ BEGIN
 CREATE TYPE "RequestStatus" AS ENUM('PENDING', 'APPROVED', 'DENIED', 'CANCELLED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateTable (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "GlobalAccessRequest" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (if they don't exist)
CREATE INDEX IF NOT EXISTS "GlobalAccessRequest_senderId_idx" ON "GlobalAccessRequest"("senderId");
CREATE INDEX IF NOT EXISTS "GlobalAccessRequest_status_idx" ON "GlobalAccessRequest"("status");

-- AddForeignKey (if it doesn't exist)
DO $$ BEGIN
 ALTER TABLE "GlobalAccessRequest" ADD CONSTRAINT "GlobalAccessRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AlterTable: Add message column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'GlobalAccessRequest' AND column_name = 'message'
    ) THEN
        ALTER TABLE "GlobalAccessRequest" ADD COLUMN "message" TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- Update existing records with a placeholder message if needed
UPDATE "GlobalAccessRequest" SET "message" = 'No message provided' WHERE "message" = '';
