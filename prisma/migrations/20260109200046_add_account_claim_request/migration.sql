-- CreateTable
CREATE TABLE "AccountClaimRequest" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "instagramHandle" TEXT NOT NULL,
    "tagCount" INTEGER NOT NULL DEFAULT 0,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountClaimRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountClaimRequest_senderId_idx" ON "AccountClaimRequest"("senderId");

-- CreateIndex
CREATE INDEX "AccountClaimRequest_targetUserId_idx" ON "AccountClaimRequest"("targetUserId");

-- CreateIndex
CREATE INDEX "AccountClaimRequest_instagramHandle_idx" ON "AccountClaimRequest"("instagramHandle");

-- CreateIndex
CREATE INDEX "AccountClaimRequest_status_idx" ON "AccountClaimRequest"("status");

-- AddForeignKey
ALTER TABLE "AccountClaimRequest" ADD CONSTRAINT "AccountClaimRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
