import { VideoGallery } from "@/components/VideoGallery";
import { HideFooterOnMobile } from "./hide-footer";
import {
  getAllBattleSections,
  getFilterOptionsFromEvents,
} from "@/db/queries/event";
import { unstable_cache } from "next/cache";
import { WATCH_INITIAL_SECTION_LIMIT } from "@/constants/watch-sections";

// ISR configuration: revalidate every 1 hour
export const revalidate = 3600;

// Cache the sections fetch with tag for revalidation
async function getCachedSections(offset: number) {
  return unstable_cache(
    async () => {
      return await getAllBattleSections(WATCH_INITIAL_SECTION_LIMIT, offset);
    },
    [`watch-sections-${offset}`],
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

export default async function WatchPage() {
  // Fetch initial sections and filter options server-side
  const [
    initialSections,
    { cities: availableCities, styles: availableStyles },
  ] = await Promise.all([getCachedSections(0), getCachedFilterOptions()]);

  return (
    <>
      <HideFooterOnMobile />
      <div className="flex flex-col justify-center items-center bg-black h-full">
        <div className="relative w-full flex flex-col items-center justify-center bg-black">
          <VideoGallery
            initialSections={initialSections}
            availableCities={availableCities}
            availableStyles={availableStyles}
          />
        </div>
      </div>
    </>
  );
}
