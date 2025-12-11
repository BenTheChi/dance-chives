import { AppNavbar } from "@/components/AppNavbar";
import { getEvent } from "@/db/queries/event";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StyleBadge } from "@/components/ui/style-badge";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Bracket, Section, Video } from "@/types/event";
import { UserSearchItem } from "@/types/user";
import NextImage from "next/image";

type PageProps = {
  params: Promise<{ event: string }>;
};

// Helper function to validate event ID format
function isValidEventId(id: string): boolean {
  const invalidPatterns = [
    /\.(svg|png|jpg|jpeg|gif|ico|css|js|json|xml|txt|pdf|doc|docx)$/i,
    /^(logo|favicon|robots|sitemap|manifest)/i,
  ];

  return !invalidPatterns.some((pattern) => pattern.test(id));
}

export default async function SectionsPage({ params }: PageProps) {
  const paramResult = await params;

  // Validate the event ID before trying to fetch it
  if (!isValidEventId(paramResult.event)) {
    notFound();
  }

  const event = await getEvent(paramResult.event);
  const sections = event.sections;
  const title = event.eventDetails.title;

  return (
    <>
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            asChild
            variant="secondary"
            className="hover:bg-gray-300 hover:shadow-none hover:cursor-pointer shadow-md"
          >
            <Link href={`/events/${paramResult.event}`}>Back to {title}</Link>
          </Button>
          <h1 className="text-3xl font-bold">Sections</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {sections.map((section: Section) => {
            // Calculate total video count
            const directVideoCount = section.videos.length;
            const bracketVideoCount = section.brackets.reduce(
              (sum: number, bracket) => sum + bracket.videos.length,
              0
            );
            const totalVideoCount = directVideoCount + bracketVideoCount;

            return (
              <div
                key={section.id}
                className="bg-white rounded-lg p-4 shadow-sm"
              >
                <div className="flex gap-4">
                  {/* Poster on left - 1/2 width */}
                  <div className="w-1/2">
                    {section.poster?.url ? (
                      <NextImage
                        src={section.poster.url}
                        alt={section.poster.title || section.title}
                        width={200}
                        height={200}
                        className="w-full h-auto object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No poster</span>
                      </div>
                    )}
                  </div>

                  {/* Content on right - 1/2 width */}
                  <div className="w-1/2 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/events/${paramResult.event}/sections/${section.id}`}
                        className="text-xl font-semibold text-gray-800 hover:text-blue-600 hover:underline transition-colors"
                      >
                        {section.title}
                      </Link>
                    </div>
                    {section.sectionType && (
                      <Badge variant="outline" className="text-xs w-fit">
                        {section.sectionType}
                      </Badge>
                    )}
                    {/* Display section styles */}
                    {section.applyStylesToVideos &&
                      section.styles &&
                      section.styles.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {section.styles.map((style: string) => (
                            <StyleBadge
                              key={style}
                              style={style}
                              asLink={false}
                            />
                          ))}
                        </div>
                      )}
                    {/* Display aggregated video styles if applyStylesToVideos is false */}
                    {!section.applyStylesToVideos &&
                      (() => {
                        const videoStyles = new Set<string>();
                        section.videos.forEach((video: Video) => {
                          if (video.styles) {
                            video.styles.forEach((style: string) =>
                              videoStyles.add(style)
                            );
                          }
                        });
                        section.brackets.forEach((bracket: Bracket) => {
                          bracket.videos.forEach((video: Video) => {
                            if (video.styles) {
                              video.styles.forEach((style: string) =>
                                videoStyles.add(style)
                              );
                            }
                          });
                        });
                        const stylesArray = Array.from(videoStyles);
                        return stylesArray.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {stylesArray.map((style: string) => (
                              <StyleBadge
                                key={style}
                                style={style}
                                asLink={false}
                              />
                            ))}
                          </div>
                        ) : null;
                      })()}
                    <span className="text-sm text-gray-500">
                      {totalVideoCount}{" "}
                      {totalVideoCount === 1 ? "video" : "videos"}
                    </span>
                  </div>
                </div>
                {/* Display section winners */}
                {section.winners && section.winners.length > 0 && (
                  <div className="flex flex-wrap gap-1 items-center mt-2">
                    <span className="text-lg font-bold">Winner:</span>
                    {Array.from(
                      new Map(
                        section.winners
                          .filter((w: UserSearchItem) => w && w.id)
                          .map((w: UserSearchItem) => [w.id, w])
                      ).values()
                    ).map((winner: UserSearchItem) => (
                      winner.username ? (
                        <UserAvatar
                          key={winner.id}
                          username={winner.username}
                          displayName={winner.displayName}
                          avatar={(winner as any).avatar}
                          image={(winner as any).image}
                        />
                      ) : (
                        <span key={winner.id}>{winner.displayName}</span>
                      )
                    ))}
                  </div>
                )}

                {section.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {section.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        {sections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No sections found.</p>
          </div>
        )}
      </div>
    </>
  );
}
