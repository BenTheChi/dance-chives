-- Add parsing/failed statuses for submission processing lifecycle
ALTER TYPE "SubmissionStatus" ADD VALUE 'parsing' AFTER 'waiting';
ALTER TYPE "SubmissionStatus" ADD VALUE 'failed' AFTER 'reviewing';

-- Add submission processing ops metadata
ALTER TABLE "submissions"
ADD COLUMN "parseAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastParseStartedAt" TIMESTAMP(3),
ADD COLUMN "lastParseFinishedAt" TIMESTAMP(3),
ADD COLUMN "lastParseErrorCode" TEXT,
ADD COLUMN "lastParseErrorMessage" TEXT,
ADD COLUMN "lastParserProviders" JSONB;
