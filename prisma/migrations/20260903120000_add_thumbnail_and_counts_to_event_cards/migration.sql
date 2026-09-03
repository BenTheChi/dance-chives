-- Thumbnail resolution, computed at publish time rather than at render.
--
-- Every one of the 1,073 published events has at least one video and every
-- video carries a bare YouTube id in `src`, so a thumbnail needs no new API
-- call and no storage — only a decision about WHICH video represents the
-- event. That decision is a graph traversal, which is why it is stored here
-- instead of being made per row while rendering the list.
--
-- `thumbnailTier` records which rung of the ladder chose the video, so a
-- backfill can be re-run selectively and the mix can be audited.
ALTER TABLE "event_cards"
  ADD COLUMN "thumbnailVideoSrc" TEXT,
  ADD COLUMN "thumbnailTier"     TEXT;

-- Rolled-up counts. `totalVideoCount` exists per SectionCard already; the list
-- view needs the event-level total, and an aggregate per row does not scale.
ALTER TABLE "event_cards"
  ADD COLUMN "videoCount"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "sectionCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill the counts from the section cards that are already correct. The
-- thumbnail columns need the Neo4j structure and are filled by
-- `scripts/backfill-event-thumbnails.ts`, not here.
UPDATE "event_cards" ec
SET "videoCount"   = COALESCE(s.videos, 0),
    "sectionCount" = COALESCE(s.sections, 0)
FROM (
  SELECT "eventId",
         SUM("totalVideoCount")::int AS videos,
         COUNT(*)::int               AS sections
  FROM "section_cards"
  GROUP BY "eventId"
) s
WHERE ec."eventId" = s."eventId";
