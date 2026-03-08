-- CreateEnum
CREATE TYPE "PlaylistSubmissionStatus" AS ENUM ('waiting', 'parsing', 'reviewing', 'failed', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "PlaylistParserMode" AS ENUM ('segment', 'ai');

-- CreateTable
CREATE TABLE "playlist_submissions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "PlaylistSubmissionStatus" NOT NULL DEFAULT 'waiting',
    "parserMode" "PlaylistParserMode",
    "parseAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastParseStartedAt" TIMESTAMP(3),
    "lastParseFinishedAt" TIMESTAMP(3),
    "lastParseErrorCode" TEXT,
    "lastParseErrorMessage" TEXT,
    "lastParserProviders" JSONB,
    "playlistUrl" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "eventId" TEXT,

    CONSTRAINT "playlist_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_reviewing" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submission_id" TEXT NOT NULL,
    "event_json" JSONB NOT NULL,
    "parse_json" JSONB,

    CONSTRAINT "playlist_reviewing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "playlist_submissions_playlistId_key" ON "playlist_submissions"("playlistId");

-- CreateIndex
CREATE INDEX "playlist_submissions_status_idx" ON "playlist_submissions"("status");

-- CreateIndex
CREATE INDEX "playlist_submissions_createdAt_idx" ON "playlist_submissions"("createdAt");

-- CreateIndex
CREATE INDEX "playlist_submissions_updatedAt_idx" ON "playlist_submissions"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_reviewing_submission_id_key" ON "playlist_reviewing"("submission_id");

-- CreateIndex
CREATE INDEX "playlist_reviewing_parse_json_gin" ON "playlist_reviewing" USING gin ("parse_json");

-- AddForeignKey
ALTER TABLE "playlist_reviewing" ADD CONSTRAINT "playlist_reviewing_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "playlist_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
