import { TVClient } from "./tv-client";
import { HideFooterOnMobile } from "./hide-footer";
import { AppNavbar } from "@/components/AppNavbar";
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
    [`tv-sections-${limit}-${offset}`],
    {
      revalidate: 3600,
      tags: ["tv-sections"],
    }
  )();
}

export default async function TVPage() {
  // Fetch initial sections server-side
  const initialSections = await getCachedSections(10, 0);

  return (
    <>
      <HideFooterOnMobile />
      <div className="flex flex-col">
        <AppNavbar />
        <div className="relative w-full tv-container-height">
          <TVClient initialSections={initialSections} />
        </div>
      </div>
    </>
  );
}
