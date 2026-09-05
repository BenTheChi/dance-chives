-- CreateTable
CREATE TABLE "contributions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT NOT NULL,
    "sectionId" TEXT,
    "videoId" TEXT,
    "field" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB NOT NULL,
    "evidence" TEXT,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "revertedBy" TEXT,
    "revertedAt" TIMESTAMP(3),

    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contributions_eventId_idx" ON "contributions"("eventId");

-- CreateIndex
CREATE INDEX "contributions_userId_idx" ON "contributions"("userId");

-- CreateIndex
CREATE INDEX "contributions_field_createdAt_idx" ON "contributions"("field", "createdAt");

-- CreateIndex
CREATE INDEX "contributions_status_idx" ON "contributions"("status");

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_revertedBy_fkey" FOREIGN KEY ("revertedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
