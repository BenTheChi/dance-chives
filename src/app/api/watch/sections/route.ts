import { NextRequest, NextResponse } from "next/server";
import { getAllBattleSections } from "@/db/queries/event";
import { auth } from "@/auth";
import { prisma } from "@/lib/primsa";
import { unstable_cache } from "next/cache";
import { DEFAULT_VIDEO_FILTERS, VideoFilters } from "@/types/video-filter";
import { WATCH_SECTIONS_FETCH_LIMIT } from "@/constants/watch-sections";

const CACHE_LIFETIME = 86400;

// Force dynamic rendering since we use searchParams
export const dynamic = "force-dynamic";

/**
 * Deserialize filters from URL search params (client and API use similar logic).
 */
const parseFiltersFromParams = (params: URLSearchParams): VideoFilters => {
  const filters: VideoFilters = {};

  const yearFrom = params.get("yearFrom");
  if (yearFrom && /^\d{4}$/.test(yearFrom)) {
    filters.yearFrom = Number(yearFrom);
  }

  const yearTo = params.get("yearTo");
  if (yearTo && /^\d{4}$/.test(yearTo)) {
    filters.yearTo = Number(yearTo);
  }

  const cities = params.get("cities");
  if (cities) {
    const list = cities
      .split(",")
      .map((city) => city.trim())
      .filter((city) => city.length > 0);
    if (list.length > 0) {
      filters.cities = list;
    }
  }

  const styles = params.get("styles");
  if (styles) {
    const list = styles
      .split(",")
      .map((style) => style.trim())
      .filter((style) => style.length > 0);
    if (list.length > 0) {
      filters.styles = list;
    }
  }

  if (params.get("finalsOnly") === "true") {
    filters.finalsOnly = true;
  }

  if (params.get("noPrelims") === "true") {
    filters.noPrelims = true;
  }

  const sortOrder = params.get("sortOrder");
  if (sortOrder === "asc" || sortOrder === "desc") {
    filters.sortOrder = sortOrder;
  }

  return filters;
};

const normalizeFiltersForCache = (filters: VideoFilters) => {
  const normalized: Record<string, unknown> = {};
  if (typeof filters.yearFrom === "number") {
    normalized.yearFrom = filters.yearFrom;
  }
  if (typeof filters.yearTo === "number") {
    normalized.yearTo = filters.yearTo;
  }
  if (filters.cities && filters.cities.length > 0) {
    normalized.cities = Array.from(
      new Set(filters.cities.map((city) => city.trim()).filter(Boolean)),
    ).sort();
  }
  if (filters.styles && filters.styles.length > 0) {
    normalized.styles = Array.from(
      new Set(filters.styles.map((style) => style.trim()).filter(Boolean)),
    ).sort();
  }
  if (filters.finalsOnly) {
    normalized.finalsOnly = true;
  }
  if (filters.noPrelims) {
    normalized.noPrelims = true;
  }
  normalized.sortOrder = filters.sortOrder ?? DEFAULT_VIDEO_FILTERS.sortOrder;
  return normalized;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const parsedFilters = parseFiltersFromParams(searchParams);

    const session = await auth();
    let savedPreferences: VideoFilters | null = null;
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { filterPreferences: true },
      });
      savedPreferences = (user?.filterPreferences as VideoFilters) ?? null;
    }

    const mergedFilters: VideoFilters = {
      ...DEFAULT_VIDEO_FILTERS,
      ...(savedPreferences ?? {}),
      ...parsedFilters,
    };

    const normalizedFiltersForCache = normalizeFiltersForCache(mergedFilters);
    const cacheKeySuffix = JSON.stringify(normalizedFiltersForCache);

    const getCachedSections = unstable_cache(
      async (offset: number, filters: VideoFilters) => {
        return getAllBattleSections(WATCH_SECTIONS_FETCH_LIMIT, offset, filters);
      },
      [`watch-sections-${offset}-${cacheKeySuffix}`],
      {
        revalidate: CACHE_LIFETIME,
        tags: ["watch-sections"],
      },
    );

    const sections = await getCachedSections(offset, mergedFilters);

    return NextResponse.json(sections, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_LIFETIME}, stale-while-revalidate=${CACHE_LIFETIME}`,
      },
    });
  } catch (error) {
    console.error("Error fetching battle sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch sections" },
      { status: 500 },
    );
  }
}
