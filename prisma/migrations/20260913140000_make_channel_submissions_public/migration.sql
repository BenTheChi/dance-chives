-- Open channel submissions to the public.
--
-- The review status was always the real gate: nothing acts on a submitted row
-- until a human accepts it in the manager, and that review queue now exists.
-- Membership was a second, redundant gate, and the evidence is that it
-- suppressed the feature entirely -- the members-only form produced zero
-- submissions in the time it was live.
--
-- userId is dropped rather than made nullable. "Detached" is the intent, and a
-- nullable FK invites re-coupling later while still carrying the ON DELETE
-- CASCADE problem below.

-- The cascade is itself a reason to drop this. A submission is an archival
-- claim about the world -- "this channel posts battle footage" -- and that
-- claim does not stop being true because an account was deleted. Under the FK
-- it would have silently vanished.
ALTER TABLE "channel_submissions" DROP CONSTRAINT IF EXISTS "channel_submissions_userId_fkey";

-- The old key meant "the same member's second submission is the same claim".
-- With no member, the natural key is the channel itself.
DROP INDEX IF EXISTS "channel_submissions_userId_channelUrl_key";

ALTER TABLE "channel_submissions" DROP COLUMN IF EXISTS "userId";

-- Optional, and only for abuse triage. Never shown in the UI, never used to
-- identify a person.
ALTER TABLE "channel_submissions" ADD COLUMN IF NOT EXISTS "submitterIp" TEXT;

-- One row per channel: a second submitter updates the existing claim rather
-- than stacking another. This is also what makes rejection stable -- the
-- manager suppresses future submissions by youtubeChannelId, so that value has
-- to identify the channel's standing decision.
--
-- PARTIAL, because youtubeChannelId is null whenever the YouTube lookup failed
-- (no API key, API down, quota gone). Refusing those submissions would throw
-- away leads for a reason the submitter can neither see nor fix, so they are
-- accepted and deduped by eye in review instead.
-- Prisma cannot express a partial index, so the schema declares a plain
-- @@index on this column and the uniqueness lives here. Postgres treats nulls
-- as distinct, so a plain unique index would behave identically -- the WHERE
-- clause states the intent rather than changing it.
CREATE UNIQUE INDEX IF NOT EXISTS "channel_submissions_youtubeChannelId_key"
    ON "channel_submissions"("youtubeChannelId")
    WHERE "youtubeChannelId" IS NOT NULL;

-- The fallback matching key for those unresolved rows. Not unique: two
-- unresolved rows for one channel is a real possibility and a human resolves
-- it, rather than the insert failing under a stranger.
CREATE INDEX IF NOT EXISTS "channel_submissions_channelUrl_idx"
    ON "channel_submissions"("channelUrl");
