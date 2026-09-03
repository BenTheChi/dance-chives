import { prisma } from "@/lib/primsa";
import { EventType, TEventCard } from "@/types/event";
import { normalizeStyleNames } from "@/lib/utils/style-utils";
import { formatCityDisplayLabel } from "@/lib/utils/city-display";

/**
 * The numbers on the homepage.
 *
 * These are the product. The site is a machine-built historical archive, and
 * its scale is the single most persuasive thing about it — so they are read
 * live from the read model rather than hard-coded, and they will be wrong the
 * moment they stop being computed.
 */
export interface ArchiveStats {
  videoCount: number;
  eventCount: number;
  cityCount: number;
  /** Events with no real city — the sentinels are not cities. */
  missingCityCount: number;
  /** Events whose date is only known to the month or the year. */
  impreciseDateCount: number;
}

/**
 * One round trip. Every figure comes from `event_cards`, which already carries
 * the rolled-up counts, so this is a scan of 1,073 rows rather than a join
 * across the video tree.
 *
 * Sentinel cities are excluded from the city count for the same reason they
 * count as gaps: `unknown` and `online` are stand-ins, not places, and
 * including them would inflate the headline figure with two non-cities.
 */
export async function getArchiveStats(): Promise<ArchiveStats> {
  const [row] = await prisma.$queryRaw<
    Array<{
      videos: bigint | number | null;
      events: bigint | number | null;
      cities: bigint | number | null;
      missing_city: bigint | number | null;
      imprecise_date: bigint | number | null;
    }>
  >`
    SELECT
      COALESCE(SUM("videoCount"), 0)                       AS videos,
      COUNT(*)                                             AS events,
      COUNT(DISTINCT "cityId") FILTER (
        WHERE "cityId" IS NOT NULL AND "cityId" NOT IN ('unknown', 'online')
      )                                                    AS cities,
      COUNT(*) FILTER (
        WHERE "cityId" IS NULL OR "cityId" = 'unknown'
      )                                                    AS missing_city,
      COUNT(*) FILTER (WHERE "datePrecision" <> 'day')     AS imprecise_date
    FROM "event_cards"
    WHERE status = 'visible'
  `;

  // COUNT/SUM come back as bigint through the adapter; these are all well
  // inside Number's safe range.
  const toNumber = (value: bigint | number | null): number =>
    value === null ? 0 : Number(value);

  return {
    videoCount: toNumber(row?.videos ?? 0),
    eventCount: toNumber(row?.events ?? 0),
    cityCount: toNumber(row?.cities ?? 0),
    missingCityCount: toNumber(row?.missing_city ?? 0),
    impreciseDateCount: toNumber(row?.imprecise_date ?? 0),
  };
}

export interface BrowseFacet {
  label: string;
  count: number;
  href: string;
}

/**
 * The most-represented styles and cities, as browse entry points.
 *
 * Real counts rather than a curated list: the archive's shape should decide
 * what the homepage offers, so a channel intake that shifts the corpus shifts
 * these too.
 */
export async function getBrowseFacets(limit: number = 8): Promise<{
  styles: BrowseFacet[];
  cities: BrowseFacet[];
}> {
  const [styleRows, cityRows] = await Promise.all([
    prisma.$queryRaw<Array<{ style: string; count: bigint | number }>>`
      SELECT unnest(styles) AS style, COUNT(*) AS count
      FROM "event_cards"
      WHERE status = 'visible' AND array_length(styles, 1) > 0
      GROUP BY style
      ORDER BY count DESC
      LIMIT ${limit}
    `,
    prisma.$queryRaw<
      Array<{ city: string; cityId: string; count: bigint | number }>
    >`
      SELECT ec."cityName" AS city, ec."cityId" AS "cityId", COUNT(*) AS count
      FROM "event_cards" ec
      WHERE ec.status = 'visible'
        AND ec."cityId" IS NOT NULL
        AND ec."cityId" NOT IN ('unknown', 'online')
        AND ec."cityName" IS NOT NULL
      GROUP BY ec."cityName", ec."cityId"
      ORDER BY count DESC
      LIMIT ${limit}
    `,
  ]);

  return {
    // Both point at /events with a filter applied rather than at the
    // /styles/[style] and /cities/[slug] pages. Those are separate surfaces
    // with their own layouts; the browse chips are navigation INTO the
    // archive, so they should land on the archive itself with the filter set,
    // where every other control (search, sort, the other filters) is to hand.
    styles: styleRows.map((row) => ({
      label: row.style,
      count: Number(row.count),
      href: `/events?style=${encodeURIComponent(row.style)}`,
    })),
    // Filtered by cityId, which is what the events page matches on — the
    // display name is ambiguous across countries, the id never is.
    cities: cityRows.map((row) => ({
      label: row.city,
      count: Number(row.count),
      href: `/events?city=${encodeURIComponent(row.cityId)}`,
    })),
  };
}

/**
 * The most recent events by EVENT DATE, not by ingest time.
 *
 * The homepage used to show "Recently Added", which ordered by `updatedAt` —
 * that is when the pipeline happened to reach an event, so a 2013 jam ingested
 * yesterday outranked a jam from last month. Ordering by the date the event
 * actually happened answers the question a visitor is really asking.
 *
 * Only events with at least one video, since the card links into footage.
 * Dates come from `event_dates` (the authoritative instants), and an event
 * with several takes its latest.
 */
export async function getRecentEventCards(
  limit: number = 6,
): Promise<TEventCard[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      eventId: string;
      title: string;
      series: string | null;
      posterUrl: string | null;
      displayDateLocal: string | null;
      datePrecision: string | null;
      cityId: string | null;
      cityName: string | null;
      region: string | null;
      countryCode: string | null;
      styles: string[] | null;
      eventType: string | null;
      thumbnailVideoSrc: string | null;
      thumbnailTier: string | null;
      videoCount: number | null;
      sectionCount: number | null;
    }>
  >`
    SELECT ec."eventId", ec.title, ec.series, ec."posterUrl",
           ec."displayDateLocal", ec."datePrecision",
           ec."cityId", ec."cityName", ec.region, ec."countryCode",
           ec.styles, ec."eventType",
           ec."thumbnailVideoSrc", ec."thumbnailTier",
           ec."videoCount", ec."sectionCount"
    FROM "event_cards" ec
    JOIN (
      SELECT "eventId", MAX("startUtc") AS started
      FROM "event_dates"
      GROUP BY "eventId"
    ) d ON d."eventId" = ec."eventId"
    WHERE ec.status = 'visible'
      AND ec."videoCount" > 0
    ORDER BY d.started DESC
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    id: r.eventId,
    title: r.title,
    series: r.series ?? undefined,
    imageUrl: r.posterUrl ?? undefined,
    date: r.displayDateLocal ?? "",
    datePrecision: (r.datePrecision ?? "day") as TEventCard["datePrecision"],
    city: r.cityName
      ? formatCityDisplayLabel({
          id: r.cityId ?? undefined,
          name: r.cityName,
          region: r.region ?? "",
          countryCode: r.countryCode ?? "",
        })
      : "",
    cityId: r.cityId ?? undefined,
    countryCode: r.countryCode ?? undefined,
    styles: normalizeStyleNames(r.styles ?? [], { strict: false }),
    eventType: r.eventType ? (r.eventType as unknown as EventType) : undefined,
    status: "visible" as const,
    hasVideos: true,
    thumbnailVideoSrc: r.thumbnailVideoSrc ?? undefined,
    thumbnailTier: (r.thumbnailTier ?? undefined) as TEventCard["thumbnailTier"],
    videoCount: r.videoCount ?? 0,
    sectionCount: r.sectionCount ?? 0,
  }));
}
