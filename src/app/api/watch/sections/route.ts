import { NextRequest, NextResponse } from "next/server";
import { getAllBattleSections } from "@/db/queries/event";
import { auth } from "@/auth";
import { prisma } from "@/lib/primsa";
import { unstable_cache } from "next/cache";
import { DEFAULT_VIDEO_FILTERS, VideoFilters } from "@/types/video-filter";
import {
  normalizeFilters,
  parseFiltersFromSearchParams,
} from "@/lib/utils/video-filters";
import { WATCH_SECTIONS_FETCH_LIMIT } from "@/constants/watch-sections";

const CACHE_LIFETIME = 86400;

// Force dynamic rendering since we use searchParams
export const dynamic = "force-dynamic";

const normalizeFiltersForCache = (filters: VideoFilters) =>
  normalizeFilters({ ...DEFAULT_VIDEO_FILTERS, ...filters });

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const parsedFilters = parseFiltersFromSearchParams(searchParams);

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
        return getAllBattleSections(
          WATCH_SECTIONS_FETCH_LIMIT,
          offset,
          filters
        );
      },
      [`watch-sections-${offset}-${cacheKeySuffix}`],
      {
        revalidate: CACHE_LIFETIME,
        tags: ["watch-sections"],
      }
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
      { status: 500 }
    );
  }
}
