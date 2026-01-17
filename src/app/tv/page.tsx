import { getAllBattleSections } from "@/db/queries/event";
import { TVClient } from "./tv-client";
import { HideFooterOnMobile } from "./hide-footer";
import { AppNavbar } from "@/components/AppNavbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chives TV | Dance Chives",
  description: "Watch battle videos in an infinite scroll interface",
};

export default async function TVPage() {
  // Fetch initial battle sections
  const initialSections = await getAllBattleSections(10, 0);

  return (
    <>
      <HideFooterOnMobile />
      <div className="flex flex-col h-screen landscape:h-auto">
        <AppNavbar />
        <div className="relative w-full flex-1 min-h-0 landscape:flex-none">
          {/* TV Client takes full available height (viewport minus navbar h-18 = 4.5rem) */}
          <TVClient initialSections={initialSections} />
        </div>
      </div>
    </>
  );
}
