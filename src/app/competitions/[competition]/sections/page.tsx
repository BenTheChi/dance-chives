import { AppNavbar } from "@/components/AppNavbar";
import { getCompetitionSections } from "@/db/queries/competition";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StyleBadge } from "@/components/ui/style-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section } from "@/types/event";

type PageProps = {
  params: Promise<{ competition: string }>;
};

// Helper function to validate competition ID format
function isValidCompetitionId(id: string): boolean {
  // Competition IDs should not contain file extensions or be static asset names
  const invalidPatterns = [
    /\.(svg|png|jpg|jpeg|gif|ico|css|js|json|xml|txt|pdf|doc|docx)$/i,
    /^(logo|favicon|robots|sitemap|manifest)/i,
  ];

  return !invalidPatterns.some((pattern) => pattern.test(id));
}

export default async function SectionsPage({ params }: PageProps) {
  const paramResult = await params;

  // Validate the competition ID before trying to fetch it
  if (!isValidCompetitionId(paramResult.competition)) {
    notFound();
  }

  const { sections, title } = await getCompetitionSections(paramResult.competition);

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
            <Link href={`/competitions/${paramResult.competition}`}>Back to {title}</Link>
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
                <div className="flex justify-between items-center mb-2">
                  <Link
                    href={`/competitions/${paramResult.competition}/sections/${section.id}`}
                    className="text-xl font-semibold text-gray-800 hover:text-blue-600 hover:underline transition-colors"
                  >
                    {section.title}
                  </Link>
                  <span className="text-sm text-gray-500">
                    {totalVideoCount}{" "}
                    {totalVideoCount === 1 ? "video" : "videos"}
                  </span>
                </div>
                {/* Display section winners */}
                {section.winners && section.winners.length > 0 && (
                  <div className="flex flex-wrap gap-1 items-center mb-2">
                    <span className="text-lg font-bold">Winner:</span>
                    {Array.from(
                      new Map(
                        section.winners
                          .filter((w: any) => w && w.id)
                          .map((w: any) => [w.id, w])
                      ).values()
                    ).map((winner: any) => (
                      <Badge
                        key={winner.id}
                        variant="secondary"
                        className="text-xs"
                        asChild
                      >
                        {winner.username ? (
                          <Link href={`/profiles/${winner.username}`}>
                            {winner.displayName}
                          </Link>
                        ) : (
                          <span>{winner.displayName}</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                )}
                {/* Display section styles */}
                {section.applyStylesToVideos &&
                  section.styles &&
                  section.styles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {section.styles.map((style: string) => (
                        <StyleBadge key={style} style={style} asLink={false} />
                      ))}
                    </div>
                  )}
                {/* Display aggregated video styles if applyStylesToVideos is false */}
                {!section.applyStylesToVideos &&
                  (() => {
                    const videoStyles = new Set<string>();
                    section.videos.forEach((video: any) => {
                      if (video.styles) {
                        video.styles.forEach((style: string) =>
                          videoStyles.add(style)
                        );
                      }
                    });
                    section.brackets.forEach((bracket: any) => {
                      bracket.videos.forEach((video: any) => {
                        if (video.styles) {
                          video.styles.forEach((style: string) =>
                            videoStyles.add(style)
                          );
                        }
                      });
                    });
                    const stylesArray = Array.from(videoStyles);
                    return stylesArray.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mb-2">
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

                {section.brackets.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 mb-2">Brackets:</div>
                    {section.brackets.map((bracket: any) => (
                      <div
                        key={bracket.id}
                        className="bg-gray-50 rounded p-2 flex justify-between items-center"
                      >
                        <span className="font-medium text-gray-700">
                          {bracket.title}
                        </span>
                        <span className="text-sm text-gray-500">
                          {bracket.videos.length}{" "}
                          {bracket.videos.length === 1 ? "video" : "videos"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 italic">
                    No brackets - direct video collection
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

