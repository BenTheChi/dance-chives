import { getStyleData } from "@/db/queries/event";
import { notFound } from "next/navigation";
import { formatStyleNameForDisplay } from "@/lib/utils/style-utils";
import { StyleClient } from "./style-client";

type PageProps = {
  params: Promise<{ style: string }>;
};

// Enable static generation with revalidation
export const revalidate = 3600; // Revalidate every hour

export default async function StylePage({ params }: PageProps) {
  const paramResult = await params;
  const styleName = decodeURIComponent(paramResult.style);

  // Fetch style data without auth (static generation)
  const styleData = await getStyleData(styleName);

  if (!styleData) {
    notFound();
  }

  // Format style name for display (first letter uppercase)
  const displayStyleName = formatStyleNameForDisplay(styleData.styleName);

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">{displayStyleName}</h1>
        <p className="text-muted-foreground mb-8">
          Explore events, videos, users, workshops, and sessions tagged with
          this dance style
        </p>

        {/* Client component handles auth-dependent features */}
        <StyleClient
          cityFilteredEvents={styleData.cityFilteredEvents}
          cityFilteredUsers={styleData.cityFilteredUsers}
          allEvents={styleData.events}
        />

        {/* Videos Section - always visible */}
        {styleData.videos.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Videos</h2>
          </section>
        )}
      </div>
    </>
  );
}
