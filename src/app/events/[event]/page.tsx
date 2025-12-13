import { Button } from "@/components/ui/button";
import { Event } from "@/types/event";
import { DollarSign, MapPin, Pencil, Settings } from "lucide-react";
import Link from "next/link";
import { AppNavbar } from "@/components/AppNavbar";
import { getEvent } from "@/db/queries/event";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { isEventCreator, isTeamMember } from "@/db/queries/team-member";
import { TagSelfCircleButton } from "@/components/events/TagSelfCircleButton";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";
import { StyleBadge } from "@/components/ui/style-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PhotoGallery } from "@/components/PhotoGallery";
import { PosterImage } from "@/components/PosterImage";
import { SectionCard } from "@/components/ui/section-card";
import { canUpdateEvent } from "@/lib/utils/auth-utils";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { getUser } from "@/db/queries/user";
import { EventDatesDialog } from "@/components/events/EventDatesDialog";

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

export default async function EventPage({ params }: PageProps) {
  const paramResult = await params;

  // Validate the event ID before trying to fetch it
  if (!isValidEventId(paramResult.event)) {
    notFound();
  }

  const event = (await getEvent(paramResult.event)) as Event;

  // Check if current user is the creator
  const session = await auth();
  const isCreator = session?.user?.id
    ? await isEventCreator(event.id, session.user.id)
    : false;

  // Check if user is a team member
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

  // Check if user can tag directly (for role tagging)
  const canTagDirectly =
    (session?.user?.auth ?? 0) >= AUTH_LEVELS.MODERATOR ||
    isEventTeamMember ||
    isCreator;

  // Get current user's roles for this event (convert from Neo4j format to display format)
  // Exclude TEAM_MEMBER - team members are shown separately
  const currentUserRoles = event.roles
    .filter(
      (role) =>
        role.user?.id === session?.user?.id && role.title !== "TEAM_MEMBER"
    )
    .map((role) => fromNeo4jRoleFormat(role.title))
    .filter((role): role is string => role !== null);

  // Aggregate all unique styles from event, sections, and videos
  const allStyles = new Set<string>();

  // Add event-level styles first
  if (event.eventDetails.styles && event.eventDetails.styles.length > 0) {
    event.eventDetails.styles.forEach((style) => allStyles.add(style));
  }

  // Then aggregate from sections and videos
  event.sections.forEach((section) => {
    // If applyStylesToVideos is true, use section styles
    if (section.applyStylesToVideos && section.styles) {
      section.styles.forEach((style) => allStyles.add(style));
    } else {
      // Otherwise, aggregate from videos
      section.videos.forEach((video) => {
        if (video.styles) {
          video.styles.forEach((style) => allStyles.add(style));
        }
      });
      section.brackets.forEach((bracket) => {
        bracket.videos.forEach((video) => {
          if (video.styles) {
            video.styles.forEach((style) => allStyles.add(style));
          }
        });
      });
    }
  });
  const eventStyles = Array.from(allStyles);

  // Group roles by title (exclude TEAM_MEMBER - team members are shown separately)
  const rolesByTitle = new Map<string, Array<(typeof event.roles)[0]>>();
  event.roles.forEach((role) => {
    if (role.user && role.title !== "TEAM_MEMBER") {
      const title = role.title;
      if (!rolesByTitle.has(title)) {
        rolesByTitle.set(title, []);
      }
      rolesByTitle.get(title)!.push(role);
    }
  });

  // Fetch creator for Event Roles section
  const creator = event.eventDetails.creatorId
    ? await getUser(event.eventDetails.creatorId)
    : null;

  // Get timezone for date display
  const eventTimezone = event.eventDetails.city.timezone || "UTC";

  // Helper to parse date string (MM/DD/YYYY or YYYY-MM-DD format)
  const parseEventDate = (dateStr: string): Date => {
    if (dateStr.includes("-")) {
      return new Date(dateStr);
    }
    const [month, day, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
  };

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Process dates from Neo4j event data
  const eventDates = event.eventDetails.dates || [];

  // Sort all dates chronologically and separate into upcoming/past
  const sortedDates = [...eventDates].sort((a, b) => {
    return parseEventDate(a.date).getTime() - parseEventDate(b.date).getTime();
  });

  const allUpcoming = sortedDates.filter(
    (d) => parseEventDate(d.date) >= today
  );
  const allPast = sortedDates
    .filter((d) => parseEventDate(d.date) < today)
    .reverse(); // Most recent past first

  // Take up to 3 upcoming and 1 past
  const upcomingDates = allUpcoming.slice(0, 3);
  const pastDates = allPast.slice(0, 1);

  // Show "More dates" button if there are more than 3 upcoming OR more than 1 past
  const showMoreDatesButton = allUpcoming.length > 3 || allPast.length > 1;

  // Format a date entry for display
  const formatEventDateRow = (dateEntry: {
    date: string;
    startTime?: string;
    endTime?: string;
  }) => {
    const isAllDay = !dateEntry.startTime && !dateEntry.endTime;
    if (isAllDay) return `${dateEntry.date}`;
    const timeStr = dateEntry.endTime
      ? `${dateEntry.startTime} - ${dateEntry.endTime}`
      : dateEntry.startTime;
    return `${dateEntry.date} (${timeStr})`;
  };

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col justify-center items-center gap-2 py-5 px-3 sm:px-10 lg:px-15">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 auto-rows-min w-full max-w-[600px] md:max-w-6xl">
          <PosterImage
            poster={event.eventDetails.poster ?? null}
            className="col-span-1 md:col-span-1"
          />

          <div className="flex flex-col gap-4 col-span-1 md:col-span-1">
            {/* Event Details */}
            <section className="bg-misty-seafoam p-6 rounded-md flex flex-col gap-4 border border-black">
              <div>
                {/* Mobile: buttons above title */}
                {(canEdit || isCreator) && (
                  <div className="flex gap-2 mb-2 sm:hidden">
                    {isCreator && (
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
                {/* Larger screens: title and buttons on same row */}
                <div className="hidden sm:flex sm:flex-row sm:justify-between sm:items-start sm:gap-4">
                  <h1 className="text-3xl font-bold">
                    {event.eventDetails.title}
                  </h1>
                  {(canEdit || isCreator) && (
                    <div className="flex gap-2">
                      {isCreator && (
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
                {/* Mobile: title shown separately */}
                <h1 className="text-3xl font-bold sm:hidden">
                  {event.eventDetails.title}
                </h1>

                <div className="text-xl text-muted-foreground font-semibold">
                  {event.eventDetails.city.id ? (
                    <Link
                      href={`/cities/${event.eventDetails.city.id}`}
                      className="text-gray-600 hover:text-blue-600 hover:underline transition-colors"
                    >
                      {event.eventDetails.city.name}
                    </Link>
                  ) : (
                    event.eventDetails.city.name
                  )}

                  {event.eventDetails.eventType && (
                    <span className="text-muted-foreground">
                      {` | `}
                      {event.eventDetails.eventType}
                    </span>
                  )}
                </div>
              </div>

              {(pastDates.length > 0 || upcomingDates.length > 0) && (
                <div className="flex flex-col gap-3">
                  {pastDates.length > 0 && (
                    <div className="flex flex-col">
                      <span className="text-md font-semibold">Past Date</span>
                      <div className="flex flex-col text-sm">
                        {pastDates.map((d, idx) => (
                          <span key={`past-${d.date}-${idx}`}>
                            {formatEventDateRow(d)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {upcomingDates.length > 0 && (
                    <div className="flex flex-col">
                      <span className="text-md font-semibold">
                        Future Date(s)
                      </span>
                      <div className="flex flex-col text-sm">
                        {upcomingDates.map((d, idx) => (
                          <span key={`upcoming-${d.date}-${idx}`}>
                            {formatEventDateRow(d)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {showMoreDatesButton && (
                    <EventDatesDialog eventId={event.id} />
                  )}
                </div>
              )}

              {eventStyles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {eventStyles.map((style) => (
                    <StyleBadge key={style} style={style} />
                  ))}
                </div>
              )}

              {event.eventDetails.location && (
                <div className="flex flex-row gap-2 items-start">
                  <MapPin className="mt-1 shrink-0" size={18} />
                  <div className="whitespace-pre-wrap">
                    {event.eventDetails.location}
                  </div>
                </div>
              )}

              {event.eventDetails.cost && (
                <div className="flex flex-row gap-2 items-center">
                  <DollarSign size={18} />
                  <span>{event.eventDetails.cost}</span>
                </div>
              )}
            </section>

            {/* Event Roles */}
            <section className="p-4 rounded-md bg-misty-seafoam flex flex-col border border-black">
              <div className="flex flex-row justify-between items-baseline">
                <h2 className="text-xl font-bold mb-2">Event Roles</h2>
                <TagSelfCircleButton
                  eventId={event.id}
                  currentUserRoles={currentUserRoles}
                  isTeamMember={isEventTeamMember}
                  canTagDirectly={canTagDirectly}
                />
              </div>
              {creator && (
                <div className="flex flex-row gap-2 items-center flex-wrap">
                  <span className="text-sm text-muted-foreground">
                    Page Owner:{" "}
                  </span>
                  <UserAvatar
                    username={creator.username || ""}
                    displayName={creator.displayName || creator.username || ""}
                    avatar={(creator as { avatar?: string | null }).avatar}
                    image={(creator as { image?: string | null }).image}
                    isSmall={true}
                  />
                </div>
              )}
              {Array.from(rolesByTitle.entries()).map(([roleTitle, roles]) => (
                <div
                  key={roleTitle}
                  className="flex flex-row gap-2 items-center flex-wrap"
                >
                  <span>{fromNeo4jRoleFormat(roleTitle) || roleTitle}: </span>
                  {roles.map((role, index) =>
                    role.user?.username ? (
                      <UserAvatar
                        key={`${role.id}-${index}`}
                        username={role.user.username}
                        displayName={
                          role.user.displayName || role.user.username
                        }
                        avatar={
                          (role.user as { avatar?: string | null }).avatar
                        }
                        image={(role.user as { image?: string | null }).image}
                      />
                    ) : (
                      <span key={`${role.id}-${index}`}>
                        {role.user?.displayName || role.user?.username}
                      </span>
                    )
                  )}
                </div>
              ))}
            </section>
          </div>

          {/* Description */}
          {event.eventDetails.description && (
            <section className="flex flex-col gap-2 p-4 bg-misty-seafoam rounded-md col-span-1 md:col-span-2 border border-black">
              <div className="flex flex-row items-center gap-2 font-semibold text-2xl">
                Description
              </div>
              <div className="whitespace-pre-wrap">
                {event.eventDetails.description}
              </div>
              <div className="flex flex-row items-center gap-2 font-semibold text-2xl">
                Schedule
              </div>
              <div className="whitespace-pre-wrap">
                {event.eventDetails.schedule || "No schedule available"}
              </div>
            </section>
          )}

          {/* Sections */}
          {event.sections && event.sections.length > 0 && (
            <section className="col-span-1 md:col-span-2">
              <h2 className="text-2xl font-bold mb-4 text-center">Sections</h2>

              <div className="flex flex-wrap justify-center gap-2">
                {event.sections.map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    eventId={event.id}
                    eventTitle={event.eventDetails.title}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Photo Gallery */}
          {event.gallery.length > 0 && (
            <section className="flex flex-col bg-misty-seafoam rounded-md p-4 w-full col-span-1 md:col-span-2">
              <h2 className="text-2xl font-bold mb-2 text-center">
                Photo Gallery
              </h2>
              <PhotoGallery images={event.gallery} />
            </section>
          )}
        </div>
      </div>
    </>
  );
}
