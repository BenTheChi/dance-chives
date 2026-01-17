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
      <div className="flex flex-col">
        <div className=" landscape:hidden">
          <AppNavbar />
        </div>
        <div
          className="relative w-full landscape:!h-full"
          style={{ height: "calc(100vh - 4.5rem)" }}
        >
          {/* TV Client takes full available height (viewport minus navbar h-18 = 4.5rem) */}
          <TVClient initialSections={initialSections} />
        </div>
      </div>
    </>
  );
}
