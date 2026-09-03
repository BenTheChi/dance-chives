-- Member-submitted YouTube channels.
--
-- This does NOT write into `channel_discovery_channel`. That table has no
-- proposed/pending state: `is_active` is a claim about the world (the manager
-- sets it on INSERT only, precisely so a re-run cannot resurrect a channel
-- someone marked dead) and RulesEngine gates ingest on it. A public write
-- there would put an unvetted channel straight into the pipeline. Submissions
-- land here and a human promotes them.
CREATE TYPE "ChannelSubmissionStatus" AS ENUM ('pending', 'accepted', 'rejected', 'duplicate');

CREATE TABLE "channel_submissions" (
    "id"               TEXT NOT NULL,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,
    "channelUrl"       TEXT NOT NULL,
    "rawInput"         TEXT NOT NULL,
    "youtubeChannelId" TEXT,
    "channelName"      TEXT,
    "videoCount"       INTEGER,
    "alreadyArchived"  BOOLEAN NOT NULL DEFAULT false,
    "userId"           TEXT NOT NULL,
    "status"           "ChannelSubmissionStatus" NOT NULL DEFAULT 'pending',
    "notes"            TEXT,

    CONSTRAINT "channel_submissions_pkey" PRIMARY KEY ("id")
);

-- One submission per member per channel: a second submit is the same claim,
-- not a new one, and should update rather than pile up.
CREATE UNIQUE INDEX "channel_submissions_userId_channelUrl_key"
    ON "channel_submissions"("userId", "channelUrl");
CREATE INDEX "channel_submissions_status_idx"    ON "channel_submissions"("status");
CREATE INDEX "channel_submissions_createdAt_idx" ON "channel_submissions"("createdAt");

ALTER TABLE "channel_submissions"
    ADD CONSTRAINT "channel_submissions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
