-- Drop the playlist submission queue.
--
-- The flow is deprecated: playlists reach the archive through the
-- auto-manager's channel discovery pipeline, not through a public submit form.
-- The homepage form, its server action (submitHomepagePlaylistSubmission), the
-- youtube-playlist URL helper and both Prisma models are removed in the same
-- change, so nothing can write here any more. The general
-- HomeSubmissionForm -> `submissions` flow is untouched.
--
-- Verified before dropping: all three tables held 0 rows in production, and
-- the only foreign key was playlist_reviewing -> playlist_submissions (both
-- dropped here). Nothing outside this pair referenced them.
--
-- Undoing this means restoring 20260307103000_add_playlist_submission_queue,
-- which is kept in the migration history for exactly that reason.

-- playlist_reviewing first: it owns the FK onto playlist_submissions.
DROP TABLE IF EXISTS "playlist_reviewing";

DROP TABLE IF EXISTS "playlist_submissions";

-- Enums are only referenced by the table just dropped.
DROP TYPE IF EXISTS "PlaylistParserMode";

DROP TYPE IF EXISTS "PlaylistSubmissionStatus";

-- Leftover from the retired Django ingestion app: never in the Prisma schema,
-- no code reference in either repo, no inbound foreign keys, 0 rows. It stored
-- per-submission LLM confidence scores for the same abandoned parse pipeline.
DROP TABLE IF EXISTS "playlist_ingestion_playlistconfidencescore";
