import { Button } from "@/components/ui/button";
import { Event } from "@/types/event";
import {
  Award,
  Building,
  Calendar,
  DollarSign,
  FileText,
  MapPin,
  Settings,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { AppNavbar } from "@/components/AppNavbar";
import { getEvent } from "@/db/queries/event";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { isEventCreator, isTeamMember } from "@/db/queries/team-member";
import { TagSelfButton } from "@/components/events/TagSelfButton";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";
import { StyleBadge } from "@/components/ui/style-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PhotoGallery } from "@/components/PhotoGallery";
import { PosterImage } from "@/components/PosterImage";
import { SectionCard } from "@/components/ui/section-card";
import { canUpdateEvent } from "@/lib/utils/auth-utils";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { getUser } from "@/db/queries/user";
import { formatTimeToAMPM } from "@/lib/utils/calendar-utils";

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

  // Get all dates to display
  const eventDetails = event.eventDetails;
  const eventDates =
    eventDetails.dates && eventDetails.dates.length > 0
      ? eventDetails.dates
      : [];

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col justify-center items-center gap-2 py-5 px-3 sm:px-10 lg:px-15">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 auto-rows-min w-full max-w-[600px] md:max-w-6xl">
          <div className="flex flex-row justify-between items-center mb-2 w-full col-span-1 md:col-span-2 auto-rows-min">
            <Link href="/events" className="hover:underline">
              {`Back to Events`}
            </Link>
            {(canEdit || isCreator) && (
              <div className="flex gap-2">
                {isCreator && (
                  <Button asChild variant="outline" size="icon">
                    <Link href={`/events/${event.id}/settings`}>
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {(canEdit || isCreator) && (
                  <Button asChild>
                    <Link href={`/events/${event.id}/edit`}>Edit</Link>
                  </Button>
                )}
              </div>
            )}
          </div>

          <PosterImage
            poster={event.eventDetails.poster ?? null}
            className="col-span-1 md:col-span-1"
          />

          <div className="flex flex-col gap-4 col-span-1 md:col-span-1">
            {/* Event Details */}
            <section className="bg-misty-seafoam p-4 rounded-md flex flex-col gap-2 border border-black">
              <h1 className="text-2xl font-bold">{event.eventDetails.title}</h1>
              {event.eventDetails.eventType && (
                <div className="flex flex-row gap-2">
                  <Award />
                  <b>Type:</b> {event.eventDetails.eventType}
                </div>
              )}
              {eventDates.length > 0 && (
                <div className="flex flex-col gap-2">
                  {eventDates.map((dateEntry, index) => (
                    <div key={index} className="flex flex-row gap-2">
                      <Calendar />
                      <b>
                        Date {eventDates.length > 1 ? `${index + 1}:` : ":"}
                      </b>
                      <span>
                        {dateEntry.date}
                        {dateEntry.startTime && dateEntry.endTime && (
                          <span className="ml-2">
                            ({formatTimeToAMPM(dateEntry.startTime)} -{" "}
                            {formatTimeToAMPM(dateEntry.endTime)})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-row gap-2">
                <Building />
                <b>City:</b>{" "}
                {event.eventDetails.city.id ? (
                  <Link
                    href={`/cities/${event.eventDetails.city.id}`}
                    className="hover:text-blue-600 hover:underline transition-colors"
                  >
                    {event.eventDetails.city.name}
                    {event.eventDetails.city.countryCode &&
                      `, ${event.eventDetails.city.countryCode}`}
                  </Link>
                ) : (
                  <>
                    {event.eventDetails.city.name}
                    {event.eventDetails.city.countryCode &&
                      `, ${event.eventDetails.city.countryCode}`}
                  </>
                )}
              </div>
              {event.eventDetails.location && (
                <div className="flex flex-row gap-2">
                  <div className="flex flex-row gap-2">
                    <MapPin />
                    <b>Location:</b>
                  </div>
                  <div className="whitespace-pre-wrap">
                    {event.eventDetails.location}
                  </div>
                </div>
              )}
              {event.eventDetails.cost && (
                <div className="flex flex-row gap-2">
                  <DollarSign />
                  <b>Cost:</b> {event.eventDetails.cost}
                </div>
              )}
              {eventStyles.length > 0 && (
                <div className="flex flex-row gap-2 items-center">
                  <Tag />
                  <b>Styles:</b>
                  <div className="flex flex-wrap gap-1">
                    {eventStyles.map((style) => (
                      <StyleBadge key={style} style={style} />
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Event Roles */}
            <section className="p-4 rounded-md bg-misty-seafoam flex flex-col gap-2 border border-black">
              <h2 className="text-xl font-bold mb-2">Event Roles</h2>
              {creator && (
                <div className="flex flex-row gap-2 items-center flex-wrap">
                  <span>Creator: </span>
                  <UserAvatar
                    username={creator.username || ""}
                    displayName={creator.displayName || creator.username || ""}
                    avatar={(creator as any).avatar}
                    image={(creator as any).image}
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
                        avatar={(role.user as any).avatar}
                        image={(role.user as any).image}
                      />
                    ) : (
                      <span key={`${role.id}-${index}`}>
                        {role.user?.displayName || role.user?.username}
                      </span>
                    )
                  )}
                </div>
              ))}
              <TagSelfButton
                eventId={event.id}
                currentUserRoles={currentUserRoles}
                isTeamMember={isEventTeamMember}
                canTagDirectly={canTagDirectly}
              />
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
