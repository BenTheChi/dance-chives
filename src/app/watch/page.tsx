import { VideoGallery } from "@/components/VideoGallery";
import { HideFooterOnMobile } from "./hide-footer";
import { getAllBattleSections } from "@/db/queries/event";
import { unstable_cache } from "next/cache";

// ISR configuration: revalidate every 1 hour
export const revalidate = 3600;

// Cache the sections fetch with tag for revalidation
async function getCachedSections(limit: number, offset: number) {
  return unstable_cache(
    async () => {
      return await getAllBattleSections(limit, offset);
    },
    [`watch-sections-${limit}-${offset}`],
    {
      revalidate: 3600,
      tags: ["watch-sections"],
    },
  )();
}

export default async function WatchPage() {
  // Fetch initial sections server-side
  const initialSections = await getCachedSections(10, 0);

  return (
    <>
      <HideFooterOnMobile />
      <div className="flex flex-col justify-center items-center bg-black h-full">
        <div className="relative w-full flex flex-col items-center justify-center bg-black">
          <VideoGallery initialSections={initialSections} />
        </div>
      </div>
    </>
  );
}
