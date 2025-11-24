/*
  Warnings:

  - A unique constraint covering the columns `[eventId]` on the table `Event` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "GlobalAccessRequest" ALTER COLUMN "message" DROP DEFAULT;

-- CreateTable
CREATE TABLE "TaggingRequest" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "videoId" TEXT,
    "senderId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "role" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaggingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMemberRequest" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMemberRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthLevelChangeRequest" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "requestedLevel" INTEGER NOT NULL,
    "currentLevel" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthLevelChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestApproval" (
    "id" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedRequestType" TEXT,
    "relatedRequestId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaggingRequest_eventId_idx" ON "TaggingRequest"("eventId");

-- CreateIndex
CREATE INDEX "TaggingRequest_senderId_idx" ON "TaggingRequest"("senderId");

-- CreateIndex
CREATE INDEX "TaggingRequest_targetUserId_idx" ON "TaggingRequest"("targetUserId");

-- CreateIndex
CREATE INDEX "TaggingRequest_status_idx" ON "TaggingRequest"("status");

-- CreateIndex
CREATE INDEX "TeamMemberRequest_eventId_idx" ON "TeamMemberRequest"("eventId");

-- CreateIndex
CREATE INDEX "TeamMemberRequest_senderId_idx" ON "TeamMemberRequest"("senderId");

-- CreateIndex
CREATE INDEX "TeamMemberRequest_status_idx" ON "TeamMemberRequest"("status");

-- CreateIndex
CREATE INDEX "AuthLevelChangeRequest_senderId_idx" ON "AuthLevelChangeRequest"("senderId");

-- CreateIndex
CREATE INDEX "AuthLevelChangeRequest_targetUserId_idx" ON "AuthLevelChangeRequest"("targetUserId");

-- CreateIndex
CREATE INDEX "AuthLevelChangeRequest_status_idx" ON "AuthLevelChangeRequest"("status");

-- CreateIndex
CREATE INDEX "RequestApproval_requestType_requestId_idx" ON "RequestApproval"("requestType", "requestId");

-- CreateIndex
CREATE INDEX "RequestApproval_approverId_idx" ON "RequestApproval"("approverId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "City_cityId_idx" ON "City"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_eventId_key" ON "Event"("eventId");

-- AddForeignKey
ALTER TABLE "TaggingRequest" ADD CONSTRAINT "TaggingRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaggingRequest" ADD CONSTRAINT "TaggingRequest_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMemberRequest" ADD CONSTRAINT "TeamMemberRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthLevelChangeRequest" ADD CONSTRAINT "AuthLevelChangeRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthLevelChangeRequest" ADD CONSTRAINT "AuthLevelChangeRequest_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestApproval" ADD CONSTRAINT "RequestApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
