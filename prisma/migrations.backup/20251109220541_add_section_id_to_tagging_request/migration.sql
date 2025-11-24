-- AlterTable
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'TaggingRequest' AND column_name = 'sectionId'
    ) THEN
        ALTER TABLE "TaggingRequest" ADD COLUMN "sectionId" TEXT;
    END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TaggingRequest_sectionId_idx" ON "TaggingRequest"("sectionId");

