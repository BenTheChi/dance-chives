import { VideoGallery } from "@/components/VideoGallery";
import { HideFooterOnMobile } from "./hide-footer";
import {
  getAllBattleSections,
  getFilterOptionsFromEvents,
  getSavedFilterPreferences,
} from "@/db/queries/event";
import { unstable_cache } from "next/cache";
import { WATCH_INITIAL_SECTION_LIMIT } from "@/constants/watch-sections";
import { auth } from "@/auth";
import {
  DEFAULT_VIDEO_FILTERS,
  VideoFilters,
} from "@/types/video-filter";
import {
  normalizeFilters,
  parseFiltersFromSearchParams,
} from "@/lib/utils/video-filters";

// ISR configuration: revalidate every 1 hour
export const revalidate = 3600;

// Cache the sections fetch with tag for revalidation
async function getCachedSections(offset: number, filters: VideoFilters) {
  const normalizedFilters = normalizeFilters(filters);
  const cacheKeySuffix = JSON.stringify(normalizedFilters);
  return unstable_cache(
    async () => {
      return await getAllBattleSections(
        WATCH_INITIAL_SECTION_LIMIT,
        offset,
        normalizedFilters
      );
    },
    [`watch-sections-${offset}-${cacheKeySuffix}`],
    {
      revalidate: 3600,
      tags: ["watch-sections"],
    }
  )();
}

async function getCachedFilterOptions() {
  return unstable_cache(
    async () => getFilterOptionsFromEvents(),
    ["watch-filter-options"],
    {
      revalidate: 3600,
      tags: ["watch-sections"],
    }
  )();
}

type WatchSearchParams = Record<string, string | string[] | undefined>;

const toUrlSearchParams = (params: WatchSearchParams): URLSearchParams => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === "string") {
          searchParams.append(key, item);
        }
      });
    } else if (typeof value === "string") {
      searchParams.set(key, value);
    }
  }
  return searchParams;
};

export default async function WatchPage({
  searchParams,
}: {
  searchParams: Promise<WatchSearchParams>;
}) {
  const params = await searchParams;
  const urlSearchParams = toUrlSearchParams(params);
  const urlFilters = parseFiltersFromSearchParams(urlSearchParams);
  const hasUrlFilters = Object.keys(urlFilters).length > 0;

  let filters: VideoFilters = { ...DEFAULT_VIDEO_FILTERS, ...urlFilters };

  if (!hasUrlFilters) {
    const session = await auth();
    if (session?.user?.id) {
      const savedPrefs = await getSavedFilterPreferences(session.user.id);
      if (savedPrefs) {
        filters = { ...DEFAULT_VIDEO_FILTERS, ...savedPrefs };
      }
    }
  }

  // Fetch initial sections and filter options server-side
  const [
    initialSections,
    { cities: availableCities, styles: availableStyles },
  ] = await Promise.all([
    getCachedSections(0, filters),
    getCachedFilterOptions(),
  ]);

  return (
    <>
      <HideFooterOnMobile />
      <div className="flex flex-col justify-center items-center bg-black h-full">
        <div className="relative w-full flex flex-col items-center justify-center bg-black">
          <VideoGallery
            initialSections={initialSections}
            filters={filters}
            availableCities={availableCities}
            availableStyles={availableStyles}
          />
        </div>
      </div>
    </>
  );
}
