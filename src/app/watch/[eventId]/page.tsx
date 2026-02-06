import { VideoGallery } from "@/components/VideoGallery";
import { HideFooterOnMobile } from "../hide-footer";
import { getEventSections } from "@/db/queries/event";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { DEFAULT_VIDEO_FILTERS } from "@/types/video-filter";

// ISR configuration: revalidate every 1 hour
export const revalidate = 3600;

// Cache the sections fetch with tag for revalidation
async function getCachedEventSections(eventId: string) {
  return unstable_cache(
    async () => {
      return await getEventSections(eventId);
    },
    [`watch-event-sections-${eventId}`],
    {
      revalidate: 3600,
      tags: ["watch-event-sections", `watch-event-${eventId}`],
    },
  )();
}

export default async function WatchEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ video?: string }>;
}) {
  const { eventId } = await params;
  const { video } = await searchParams;

  // Fetch all sections for the event
  const sections = await getCachedEventSections(eventId);

  // If no sections with videos, return 404
  if (sections.length === 0) {
    notFound();
  }

  return (
    <>
      <HideFooterOnMobile />
      <div className="flex flex-col justify-center items-center bg-black h-full">
        <div className="relative w-full flex flex-col items-center justify-center bg-black">
          <VideoGallery
            initialSections={sections}
            filters={DEFAULT_VIDEO_FILTERS}
            eventId={eventId}
          />
        </div>
      </div>
    </>
  );
}
