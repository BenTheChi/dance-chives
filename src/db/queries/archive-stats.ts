import { prisma } from "@/lib/primsa";

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
  /** Inclusive span of event years, for the "2013–2026" strip. */
  firstYear: number | null;
  lastYear: number | null;
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
      first_year: string | null;
      last_year: string | null;
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
      MIN(RIGHT("displayDateLocal", 4)) FILTER (
        WHERE "displayDateLocal" IS NOT NULL
      )                                                    AS first_year,
      MAX(RIGHT("displayDateLocal", 4)) FILTER (
        WHERE "displayDateLocal" IS NOT NULL
      )                                                    AS last_year,
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

  const toYear = (value: string | null): number | null => {
    if (!value) return null;
    const year = Number(value);
    return Number.isFinite(year) && year > 1900 ? year : null;
  };

  return {
    videoCount: toNumber(row?.videos ?? 0),
    eventCount: toNumber(row?.events ?? 0),
    cityCount: toNumber(row?.cities ?? 0),
    firstYear: toYear(row?.first_year ?? null),
    lastYear: toYear(row?.last_year ?? null),
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
      Array<{ city: string; slug: string | null; count: bigint | number }>
    >`
      SELECT ec."cityName" AS city, c.slug AS slug, COUNT(*) AS count
      FROM "event_cards" ec
      LEFT JOIN "cities" c ON c.id = ec."cityId"
      WHERE ec.status = 'visible'
        AND ec."cityId" IS NOT NULL
        AND ec."cityId" NOT IN ('unknown', 'online')
        AND ec."cityName" IS NOT NULL
      GROUP BY ec."cityName", c.slug
      ORDER BY count DESC
      LIMIT ${limit}
    `,
  ]);

  return {
    styles: styleRows.map((row) => ({
      label: row.style,
      count: Number(row.count),
      // /styles/[style] takes the decoded style name, not a slug.
      href: `/styles/${encodeURIComponent(row.style)}`,
    })),
    cities: cityRows
      // A city with no slug has no page to link to; dropping it is better than
      // offering a link that 404s.
      .filter((row) => row.slug)
      .map((row) => ({
        label: row.city,
        count: Number(row.count),
        href: `/cities/${row.slug}`,
      })),
  };
}
