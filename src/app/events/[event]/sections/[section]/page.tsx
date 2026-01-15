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
import { Button } from "@/components/ui/button";
import { Pencil, Settings } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getUser } from "@/db/queries/user";
import { enrichUserWithCardData } from "@/db/queries/user-cards";
import { RequestOwnershipButton } from "@/components/events/RequestOwnershipButton";
import { canUpdateEvent } from "@/lib/utils/auth-utils";
import { extractYouTubeVideoId } from "@/lib/utils";
import { Section, Video } from "@/types/event";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ event: string; section: string }>;
  searchParams: Promise<{ video?: string }>;
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

// Helper function to find video in section (direct videos or bracket videos)
function findVideoInSection(
  section: Section,
  videoId: string
): { video: Video | null; isInBracket: boolean; bracketId?: string } {
  // Check direct videos first
  const directVideo = section.videos?.find((v) => v.id === videoId);
  if (directVideo) {
    return { video: directVideo, isInBracket: false };
  }

  // Check bracket videos
  if (section.brackets) {
    for (const bracket of section.brackets) {
      const bracketVideo = bracket.videos?.find((v) => v.id === videoId);
      if (bracketVideo) {
        return {
          video: bracketVideo,
          isInBracket: true,
          bracketId: bracket.id,
        };
      }
    }
  }

  return { video: null, isInBracket: false };
}

// Generate metadata for the page
export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const paramResult = await params;
  const searchParamsResult = await searchParams;
  const videoId = searchParamsResult.video;
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.dancechives.com";

  // Get event and section data
  const event = await getEvent(paramResult.event, undefined, 0);
  if (!event) {
    return {
      title: "Section Not Found",
      description: "The requested section could not be found.",
    };
  }

  const section = event.sections.find((s) => s.id === paramResult.section);
  if (!section) {
    return {
      title: "Section Not Found",
      description: "The requested section could not be found.",
    };
  }

  // If video param exists, generate video-specific metadata
  if (videoId) {
    const { video } = findVideoInSection(section, videoId);
    if (video) {
      const youtubeId = extractYouTubeVideoId(video.src);
      const thumbnailUrl = youtubeId
        ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
        : undefined;

      // Build description with tagged users
      const taggedDancers = video.taggedDancers || [];
      const dancerNames = taggedDancers
        .map((d) => d.displayName || d.username)
        .slice(0, 3)
        .join(", ");
      const description = dancerNames
        ? `Watch ${video.title} featuring ${dancerNames}${
            taggedDancers.length > 3
              ? ` and ${taggedDancers.length - 3} more`
              : ""
          } from ${event.eventDetails.title}`
        : `Watch ${video.title} from ${event.eventDetails.title}`;

      return {
        title: `${video.title} - ${event.eventDetails.title}`,
        description,
        openGraph: {
          title: `${video.title} - ${event.eventDetails.title}`,
          description,
          images: thumbnailUrl ? [thumbnailUrl] : undefined,
          type: "video.other",
          videos: [video.src],
          url: `${baseUrl}/events/${paramResult.event}/sections/${paramResult.section}?video=${videoId}`,
        },
        twitter: {
          card: "player",
          title: video.title,
          description,
          images: thumbnailUrl ? [thumbnailUrl] : undefined,
        },
      };
    }
  }

  // Default section metadata
  const title = `${section.title} - ${event.eventDetails.title}`;
  const description =
    section.description ||
    `View videos from ${section.title} at ${event.eventDetails.title}`;

  const sectionPosterUrl = section.poster?.url
    ? section.poster.url.startsWith("http")
      ? section.poster.url
      : `${baseUrl}${section.poster.url}`
    : undefined;

  // Fallback to event poster if section poster isn't set
  const eventPosterUrl = event.eventDetails.poster?.url
    ? event.eventDetails.poster.url.startsWith("http")
      ? event.eventDetails.poster.url
      : `${baseUrl}${event.eventDetails.poster.url}`
    : undefined;

  const shareImageUrl = sectionPosterUrl || eventPosterUrl;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${baseUrl}/events/${paramResult.event}/sections/${paramResult.section}`,
      siteName: "Dance Chives",
      images: shareImageUrl ? [shareImageUrl] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: shareImageUrl ? [shareImageUrl] : undefined,
    },
  };
}

export default async function SectionPage({ params, searchParams }: PageProps) {
  const paramResult = await params;
  const searchParamsResult = await searchParams;

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

  // Check if user can edit the event
  const canEdit =
    session?.user?.id && session?.user?.auth !== undefined
      ? canUpdateEvent(
          session.user.auth,
          {
            eventId: event.id,
            eventCreatorId: event.eventDetails.creatorId,
            isTeamMember: isEventTeamMember,
          },
          session.user.id
        )
      : false;

  // Check if user can tag directly
  const canTagDirectly =
    (session?.user?.auth ?? 0) >= AUTH_LEVELS.MODERATOR ||
    isEventTeamMember ||
    isCreator;

  // Fetch creator for footer and enrich with Postgres data
  const creatorRaw = event.eventDetails.creatorId
    ? await getUser(event.eventDetails.creatorId)
    : null;
  const creator = creatorRaw
    ? await enrichUserWithCardData({
        id: creatorRaw.id,
        username: creatorRaw.username,
        displayName: creatorRaw.displayName,
        avatar: creatorRaw.avatar,
        image: creatorRaw.image,
      })
    : null;

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
      <div className="flex flex-col min-h-[calc(100vh-4.5rem)]">
        <h1 className="py-7 border-b-2 border-primary-light bg-charcoal">
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
                    type="section"
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
                  canEdit={canEdit}
                />
              </div>
            </div>

            {/* Row 3: Brackets/Video Gallery */}
            <div className="w-full">
              <SectionBracketTabSelector
                section={section}
                eventTitle={event.eventDetails.title}
                eventId={event.id}
                canEdit={canEdit}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center w-full mt-auto">
          <div className="w-full max-w-[920px]">
            <hr className="border-primary-light my-4" />
            <div className="flex flex-row gap-10 items-center justify-center mb-4 flex-wrap">
              {creator && (
                <div className="flex flex-row gap-2 items-center">
                  <span className="text-sm">Page Owner: </span>
                  <UserAvatar
                    username={creator.username || ""}
                    displayName={creator.displayName || creator.username || ""}
                    avatar={(creator as { avatar?: string | null }).avatar}
                    image={(creator as { image?: string | null }).image}
                    isSmall={true}
                    showHoverCard
                    city={creator.city || ""}
                    styles={creator.styles}
                  />
                  <RequestOwnershipButton
                    eventId={event.id}
                    creatorId={creator.id}
                  />
                </div>
              )}

              {/* Settings and Edit buttons - top right row */}
              {(canEdit || isCreator) && (
                <div className="flex gap-2">
                  {(isCreator || authLevel >= AUTH_LEVELS.MODERATOR) && (
                    <Button
                      asChild
                      size="icon"
                      className="bg-periwinkle text-black border-black"
                    >
                      <Link href={`/events/${event.id}/settings`}>
                        <Settings className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  {(canEdit || isCreator) && (
                    <Button
                      asChild
                      size="icon"
                      className="bg-periwinkle text-black border-black"
                    >
                      <Link href={`/events/${event.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
