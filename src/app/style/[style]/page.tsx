import { AppNavbar } from "@/components/AppNavbar";
import { getStyleData } from "@/db/queries/event";
import { notFound } from "next/navigation";
import Eventcard from "@/components/cards";
import { SectionCard } from "@/components/ui/section-card";
import { StyleVideoGallery } from "@/components/ui/style-video-gallery";
import { formatStyleNameForDisplay } from "@/lib/utils/style-utils";

type PageProps = {
  params: Promise<{ style: string }>;
};

export default async function StylePage({ params }: PageProps) {
  const paramResult = await params;
  const styleName = decodeURIComponent(paramResult.style);

  const styleData = await getStyleData(styleName);

  if (!styleData) {
    notFound();
  }

  // Format style name for display (first letter uppercase)
  const displayStyleName = formatStyleNameForDisplay(styleData.styleName);

  return (
    <>
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">{displayStyleName}</h1>
        <p className="text-muted-foreground mb-8">
          Explore events, sections, and videos tagged with this dance style
        </p>

        {/* Events Section */}
        {styleData.events.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Events</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {styleData.events.map((event) => (
                <Eventcard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  series={event.series}
                  imageUrl={event.imageUrl}
                  date={event.date}
                  city={event.city}
                  styles={event.styles}
                />
              ))}
            </div>
          </section>
        )}

        {/* Sections Section */}
        {styleData.sections.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Sections</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {styleData.sections.map((section) => (
                <SectionCard
                  key={section.id}
                  id={section.id}
                  title={section.title}
                  eventId={section.eventId}
                  eventTitle={section.eventTitle}
                />
              ))}
            </div>
          </section>
        )}

        {/* Videos Section */}
        {styleData.videos.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Videos</h2>
            <StyleVideoGallery videos={styleData.videos} />
          </section>
        )}

        {styleData.events.length === 0 &&
          styleData.sections.length === 0 &&
          styleData.videos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No events, sections, or videos found for this style.
              </p>
            </div>
          )}
      </div>
    </>
  );
}

