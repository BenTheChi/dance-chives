import { AppNavbar } from "@/components/AppNavbar";
import SectionBracketTabSelector from "@/components/SectionBracketTabSelector";
import { getEvent } from "@/db/queries/event";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PosterImage } from "@/components/PosterImage";
import { auth } from "@/auth";
import { isEventCreator, isTeamMember } from "@/db/queries/team-member";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { SectionDetails } from "@/components/sections/SectionDetails";

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

  // Get event and find the section
  const event = await getEvent(paramResult.event);
  const section = event.sections.find((s) => s.id === paramResult.section);

  if (!section) {
    notFound();
  }

  // Check authentication and permissions
  const session = await auth();
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
      <div className="flex flex-col justify-center items-center gap-2 py-5 px-15">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 auto-rows-min w-full">
          <div className="flex flex-row justify-between items-center mb-2 w-full col-span-1 md:col-span-2 auto-rows-min">
            <Link href={`/events/${event.id}`} className="hover:underline">
              Back to {event.eventDetails.title}
            </Link>
          </div>

          <PosterImage
            poster={section.poster ?? null}
            className="md:col-span-1"
          />

          <div className="flex flex-col gap-4 md:col-span-1">
            <SectionDetails
              section={section}
              displayStyles={displayStyles}
              eventId={event.id}
              canTagDirectly={canTagDirectly}
              currentUserId={session?.user?.id}
            />
          </div>

          {/* Brackets/Video Gallery */}
          <div className="w-full col-span-1 md:col-span-2">
            <SectionBracketTabSelector
              section={section}
              eventTitle={event.eventDetails.title}
              eventId={event.id}
            />
          </div>
        </div>
      </div>
    </>
  );
}
