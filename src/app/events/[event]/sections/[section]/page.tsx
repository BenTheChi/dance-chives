import { AppNavbar } from "@/components/AppNavbar";
import SectionBracketTabSelector from "@/components/SectionBracketTabSelector";
import { getEvent } from "@/db/queries/event";
import { notFound } from "next/navigation";
import { PosterImage } from "@/components/PosterImage";
import { auth } from "@/auth";
import { isEventCreator, isTeamMember } from "@/db/queries/team-member";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { SectionDetails } from "@/components/sections/SectionDetails";
import { DescriptionWinnerColumns } from "@/components/sections/DescriptionWinnerColumns";

type PageProps = {
  params: Promise<{ event: string; section: string }>;
};

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  // UUID v4 format: 8-4-4-4-12 hexadecimal characters
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Helper function to validate event ID format
function isValidEventId(id: string): boolean {
  const invalidPatterns = [
    /\.(svg|png|jpg|jpeg|gif|ico|css|js|json|xml|txt|pdf|doc|docx)$/i,
    /^(logo|favicon|robots|sitemap|manifest)/i,
  ];

  return !invalidPatterns.some((pattern) => pattern.test(id));
}

export default async function SectionPage({ params }: PageProps) {
  const paramResult = await params;

  // Validate inputs
  if (!isValidUUID(paramResult.section) || !isValidEventId(paramResult.event)) {
    notFound();
  }

  // Check authentication and permissions
  const session = await auth();
  const userId = session?.user?.id;
  const authLevel = session?.user?.auth ?? 0;

  // Get event and find the section (with authorization check)
  const event = await getEvent(paramResult.event, userId, authLevel);

  // If event is null, it means it's hidden and user is not authorized
  if (!event) {
    notFound();
  }

  const section = event.sections.find((s) => s.id === paramResult.section);

  if (!section) {
    notFound();
  }
  const isCreator = session?.user?.id
    ? await isEventCreator(event.id, session.user.id)
    : false;
  const isEventTeamMember = session?.user?.id
    ? await isTeamMember(event.id, session.user.id)
    : false;

  // Check if user can tag directly
  const canTagDirectly =
    (session?.user?.auth ?? 0) >= AUTH_LEVELS.MODERATOR ||
    isEventTeamMember ||
    isCreator;

  // Aggregate styles from section or videos
  const displayStyles =
    section.applyStylesToVideos && section.styles && section.styles.length > 0
      ? section.styles
      : (() => {
          const videoStyles = new Set<string>();
          section.videos?.forEach((video) => {
            video.styles?.forEach((style) => videoStyles.add(style));
          });
          section.brackets?.forEach((bracket) => {
            bracket.videos?.forEach((video) => {
              video.styles?.forEach((style) => videoStyles.add(style));
            });
          });
          return Array.from(videoStyles);
        })();

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col">
        <h1 className="py-7 border-b-2 border-primary-light">
          {section.title}
        </h1>
        <div className="flex justify-center flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-8 py-5 px-3 sm:px-10 lg:px-15 max-w-[500px] sm:max-w-[1000px] lg:max-w-[1200px] w-full">
            {/* Row 1: Image + Details - using flex for exact sizing */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              {/* Image */}
              <div className="w-full sm:flex-1 lg:max-w-[400px]">
                <div className="w-full aspect-square">
                  <PosterImage
                    poster={section.poster ?? null}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {/* Section Details, Description, and Winner/Judge */}
              <div className="w-full sm:flex-1 lg:max-w-[800px] flex flex-col gap-4">
                <SectionDetails
                  section={section}
                  displayStyles={displayStyles}
                  eventId={event.id}
                  eventTitle={event.eventDetails.title}
                  canTagDirectly={canTagDirectly}
                  currentUserId={session?.user?.id}
                />
                <DescriptionWinnerColumns
                  section={section}
                  eventId={event.id}
                  canTagDirectly={canTagDirectly}
                  currentUserId={session?.user?.id}
                />
              </div>
            </div>

            {/* Row 3: Brackets/Video Gallery */}
            <div className="w-full">
              <SectionBracketTabSelector
                section={section}
                eventTitle={event.eventDetails.title}
                eventId={event.id}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
