import { prisma } from "@/lib/primsa";

/**
 * The channels the archive has ingested, with how much of each is live.
 *
 * Shown beside the "know a channel we're missing?" form so the ask has context:
 * a visitor can see what is already covered before suggesting something, and
 * the list doubles as proof the submission box leads somewhere real.
 */
export interface ArchivedChannel {
  id: string;
  name: string;
  url: string | null;
  /** Videos published into the archive — not everything ingested. */
  videoCount: number;
}

/**
 * Ordered by published video count, descending.
 *
 * `published` rather than total ingested is deliberate. A channel's total
 * includes videos Stage 2 discarded as non-event footage, so it overstates what
 * a visitor can actually watch; the published count is the number behind every
 * link on the site. Ordering by it also puts the channels that carry the
 * archive at the top, which is what someone scanning the list wants to see.
 *
 * Inactive channels are excluded: `is_active` gates real ingest, so an inactive
 * row is a channel we are not archiving, and listing it would answer the
 * visitor's question wrongly.
 */
export async function getArchivedChannels(): Promise<ArchivedChannel[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: bigint | number;
      channel_name: string | null;
      channel_url: string | null;
      published: bigint | number | null;
    }>
  >`
    SELECT
      c.id,
      c.channel_name,
      c.channel_url,
      COUNT(v.id) FILTER (WHERE v.neo4j_event_id IS NOT NULL) AS published
    FROM channel_discovery_channel c
    LEFT JOIN channel_discovery_video v ON v.channel_id = c.id
    WHERE c.is_active
    GROUP BY c.id, c.channel_name, c.channel_url
    ORDER BY published DESC, c.channel_name ASC
  `;

  return rows
    .filter((row) => row.channel_name?.trim())
    .map((row) => ({
      id: String(row.id),
      // Channel names arrive from YouTube and some carry trailing spaces
      // ("No Limits "), which would render as a ragged list.
      name: (row.channel_name ?? "").trim(),
      url: row.channel_url,
      videoCount: Number(row.published ?? 0),
    }));
}
