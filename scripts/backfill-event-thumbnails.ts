#!/usr/bin/env tsx

/**
 * Fill `EventCard.thumbnailVideoSrc` / `thumbnailTier` for events that have no
 * thumbnail resolved yet, and re-roll up `videoCount` / `sectionCount`.
 *
 * Neo4j is the source of truth for structure, so the ladder runs against the
 * graph and Postgres receives the answer. The manager's publish path will set
 * these columns for new events; until it does, re-run this after a publish.
 *
 * Dry-run by default; pass `--apply` to write. `--force` re-resolves events
 * that already have a thumbnail (use after changing the ladder).
 *
 *   npx tsx scripts/backfill-event-thumbnails.ts            # preview
 *   npx tsx scripts/backfill-event-thumbnails.ts --apply
 */

import driver from "../src/db/driver";
import { prisma } from "../src/lib/primsa";
import {
  resolveEventThumbnail,
  type ThumbnailEvent,
  type ThumbnailTier,
} from "../src/lib/utils/event-thumbnail";

const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");
const PREVIEW_LIMIT = 15;

/**
 * One row per event, carrying the whole section/bracket/video tree the ladder
 * needs. Collected in a single query rather than per event: 1,073 round trips
 * to Aura would dominate the runtime.
 *
 * Videos are gathered from both places they can live — directly under a
 * section, and under a bracket — because the ladder has to see both.
 *
 * `type` is carried because the trailer rung matches on it. It is read from
 * the `type` property rather than the node label: publish writes both, and the
 * property is the one the app's own Video type mirrors.
 */
const STRUCTURE_QUERY = `
MATCH (e:Event)
OPTIONAL MATCH (e)<-[:IN]-(sec:Section)
OPTIONAL MATCH (sec)<-[:IN]-(sv:Video)
WITH e, sec, collect(DISTINCT {src: sv.src, position: sv.position, type: sv.type}) AS directVideos
OPTIONAL MATCH (sec)<-[:IN]-(br:Bracket)
OPTIONAL MATCH (br)<-[:IN]-(bv:Video)
WITH e, sec, directVideos, br,
     collect(DISTINCT {src: bv.src, position: bv.position, type: bv.type}) AS bracketVideos
WITH e, sec, directVideos,
     collect(CASE WHEN br IS NULL THEN NULL ELSE
       {title: br.title, position: br.position, videos: bracketVideos}
     END) AS brackets
WITH e, collect(CASE WHEN sec IS NULL THEN NULL ELSE {
       title: sec.title,
       position: sec.position,
       videos: directVideos,
       brackets: [b IN brackets WHERE b IS NOT NULL]
     } END) AS sections
RETURN e.id AS eventId,
       [s IN sections WHERE s IS NOT NULL] AS sections
`;

/** Neo4j integers arrive as {low, high}; positions are small so `low` is exact. */
function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "object" && "low" in (value as Record<string, unknown>)) {
    return Number((value as { low: number }).low);
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

interface RawVideo {
  src?: string | null;
  position?: unknown;
  type?: string | null;
}
interface RawBracket {
  title?: string | null;
  position?: unknown;
  videos?: RawVideo[] | null;
}
interface RawSection {
  title?: string | null;
  position?: unknown;
  videos?: RawVideo[] | null;
  brackets?: RawBracket[] | null;
}

/** A video with no `src` cannot produce a thumbnail, so it is dropped here
 *  rather than being carried through the ladder as a null. */
function normalizeVideos(videos: RawVideo[] | null | undefined) {
  return (videos ?? [])
    .filter((video) => typeof video.src === "string" && video.src.trim() !== "")
    .map((video) => ({
      src: video.src as string,
      position: toNumber(video.position),
      type: video.type ?? null,
    }));
}

function normalizeSections(sections: RawSection[]): ThumbnailEvent {
  return {
    sections: sections.map((section) => ({
      title: section.title ?? null,
      position: toNumber(section.position),
      videos: normalizeVideos(section.videos),
      brackets: (section.brackets ?? []).map((bracket) => ({
        title: bracket.title ?? null,
        position: toNumber(bracket.position),
        videos: normalizeVideos(bracket.videos),
      })),
    })),
  };
}

async function main() {
  console.log(
    `[thumbnails] mode=${APPLY ? "apply" : "dry-run"}${FORCE ? " force" : ""}`,
  );

  const session = driver.session();

  const resolved: Array<{
    eventId: string;
    videoSrc: string;
    tier: ThumbnailTier;
  }> = [];
  const unresolved: string[] = [];

  try {
    const result = await session.run(STRUCTURE_QUERY);
    console.log(`[thumbnails] events_in_graph=${result.records.length}`);

    for (const record of result.records) {
      const eventId = record.get("eventId") as string;
      const sections = (record.get("sections") ?? []) as RawSection[];

      const thumbnail = resolveEventThumbnail(normalizeSections(sections));
      if (!thumbnail) {
        unresolved.push(eventId);
        continue;
      }

      resolved.push({
        eventId,
        videoSrc: thumbnail.videoSrc,
        tier: thumbnail.tier,
      });
    }
  } finally {
    await session.close();
    await driver.close();
  }

  // Tier mix is the audit: rung 4 (no video at all) must stay empty, which is
  // the acceptance test for "every event shows a real thumbnail".
  const byTier = resolved.reduce<Record<string, number>>((acc, row) => {
    acc[row.tier] = (acc[row.tier] ?? 0) + 1;
    return acc;
  }, {});
  console.log(
    `[thumbnails] resolved: trailer=${byTier.trailer ?? 0} bracket=${byTier.bracket ?? 0} any=${byTier.any ?? 0} none=${unresolved.length}`,
  );
  if (unresolved.length > 0) {
    console.log(
      `[thumbnails] NO VIDEO (would fall back to mascot): ${unresolved.slice(0, PREVIEW_LIMIT).join(", ")}`,
    );
  }

  // Only touch rows that actually change, so a re-run is cheap and the report
  // reflects real work rather than the size of the corpus.
  const existing = await prisma.eventCard.findMany({
    select: { eventId: true, thumbnailVideoSrc: true, thumbnailTier: true },
  });
  const existingById = new Map(existing.map((row) => [row.eventId, row]));

  const pending = resolved.filter((row) => {
    const current = existingById.get(row.eventId);
    if (!current) return false; // in the graph but not in Postgres — not ours to create
    if (!FORCE && current.thumbnailVideoSrc) return false;
    return (
      current.thumbnailVideoSrc !== row.videoSrc ||
      current.thumbnailTier !== row.tier
    );
  });

  console.log(`[thumbnails] rows_to_update=${pending.length}`);
  for (const row of pending.slice(0, PREVIEW_LIMIT)) {
    console.log(`- ${row.eventId} tier=${row.tier} src=${row.videoSrc}`);
  }

  if (!APPLY) {
    console.log("[thumbnails] dry run — pass --apply to write");
    await prisma.$disconnect();
    return;
  }

  for (const row of pending) {
    await prisma.eventCard.update({
      where: { eventId: row.eventId },
      data: { thumbnailVideoSrc: row.videoSrc, thumbnailTier: row.tier },
    });
  }
  console.log(`[thumbnails] updated=${pending.length}`);

  // Counts come from the section cards, which are already correct — this is a
  // roll-up, not a recount, and keeps the columns true after a re-publish.
  const counts = await prisma.$executeRaw`
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
    WHERE ec."eventId" = s."eventId"
      AND (ec."videoCount" IS DISTINCT FROM COALESCE(s.videos, 0)
        OR ec."sectionCount" IS DISTINCT FROM COALESCE(s.sections, 0))
  `;
  console.log(`[thumbnails] counts_updated=${counts}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[thumbnails] failed:", error);
  await prisma.$disconnect();
  process.exit(1);
});
