-- Add new array columns (avoid in-place alter so we can migrate data safely)
ALTER TABLE "reacts" ADD COLUMN "fire_new" INTEGER[] NOT NULL DEFAULT '{}';
ALTER TABLE "reacts" ADD COLUMN "clap_new" INTEGER[] NOT NULL DEFAULT '{}';
ALTER TABLE "reacts" ADD COLUMN "wow_new" INTEGER[] NOT NULL DEFAULT '{}';
ALTER TABLE "reacts" ADD COLUMN "laugh_new" INTEGER[] NOT NULL DEFAULT '{}';

-- Backfill from existing columns (non-zero -> single-element array, zero -> empty array)
UPDATE "reacts"
SET
  "fire_new" = CASE WHEN "fire" != 0 THEN ARRAY["fire"] ELSE '{}' END,
  "clap_new" = CASE WHEN "clap" != 0 THEN ARRAY["clap"] ELSE '{}' END,
  "wow_new"  = CASE WHEN "wow"  != 0 THEN ARRAY["wow"]  ELSE '{}' END,
  "laugh_new" = CASE WHEN "laugh" != 0 THEN ARRAY["laugh"] ELSE '{}' END;

-- Drop old columns and rename new ones
ALTER TABLE "reacts" DROP COLUMN "fire";
ALTER TABLE "reacts" DROP COLUMN "clap";
ALTER TABLE "reacts" DROP COLUMN "wow";
ALTER TABLE "reacts" DROP COLUMN "laugh";

ALTER TABLE "reacts" RENAME COLUMN "fire_new" TO "fire";
ALTER TABLE "reacts" RENAME COLUMN "clap_new" TO "clap";
ALTER TABLE "reacts" RENAME COLUMN "wow_new" TO "wow";
ALTER TABLE "reacts" RENAME COLUMN "laugh_new" TO "laugh";
