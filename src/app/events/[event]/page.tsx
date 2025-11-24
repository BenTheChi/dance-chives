import { Button } from "@/components/ui/button";
import { Event } from "@/types/event";
import {
  Award,
  Building,
  Calendar,
  DollarSign,
  FileText,
  Gift,
  MapPin,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { AppNavbar } from "@/components/AppNavbar";
import { getEvent } from "@/db/queries/event";
import { notFound } from "next/navigation";
import { DeleteCompetitionButton } from "@/components/DeleteCompetitionButton";
import { auth } from "@/auth";
import { isEventCreator, isTeamMember } from "@/db/queries/team-member";
import { TagSelfButton } from "@/components/events/TagSelfButton";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";
import { StyleBadge } from "@/components/ui/style-badge";
import { Badge } from "@/components/ui/badge";
import { PhotoGallery } from "@/components/PhotoGallery";
import { PosterImage } from "@/components/PosterImage";
import {
  canUpdateEvent,
  canDeleteEvent,
  AUTH_LEVELS,
} from "@/lib/utils/auth-utils";
import { getUser } from "@/db/queries/user";
import { getEventTeamMembers } from "@/db/queries/team-member";
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

  // Check if user can delete the event
  const canDelete =
    session?.user?.id && session?.user?.auth !== undefined
      ? canDeleteEvent(
          session.user.auth,
          {
            eventId: event.id,
            eventCreatorId: event.eventDetails.creatorId,
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

  // Fetch creator and team members for Team Members section
  const creator = event.eventDetails.creatorId
    ? await getUser(event.eventDetails.creatorId)
    : null;
  const teamMemberIds = await getEventTeamMembers(event.id);
  const teamMembers = await Promise.all(teamMemberIds.map((id) => getUser(id)));
  const validTeamMembers = teamMembers.filter(
    (member): member is NonNullable<typeof member> => member !== null
  );

  // Get all dates to display
  const eventDetails = event.eventDetails;
  const eventDates =
    eventDetails.dates && eventDetails.dates.length > 0
      ? eventDetails.dates
      : [];

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col justify-center items-center gap-2 py-5 px-15">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 auto-rows-min w-full">
          <div className="flex flex-row justify-between items-center mb-2 w-full col-span-1 md:col-span-2 xl:col-span-4 auto-rows-min">
            <Link href="/events" className="hover:underline">
              {`Back to Events`}
            </Link>
            {canEdit && (
              <Button asChild>
                <Link href={`/events/${event.id}/edit`}>Edit</Link>
              </Button>
            )}
            {canDelete && <DeleteCompetitionButton competitionId={event.id} />}
          </div>

          <PosterImage
            poster={event.eventDetails.poster ?? null}
            className="md:col-span-1 xl:col-span-1"
          />

          <div className="flex flex-col gap-4 md:col-span-1 xl:col-span-1">
            {/* Event Details */}
            <section className="bg-blue-100 p-4 rounded-md flex flex-col gap-2">
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
              {event.eventDetails.address && (
                <div className="flex flex-row gap-2">
                  <div className="flex flex-row gap-2">
                    <MapPin />
                    <b>Location:</b>
                  </div>
                  <div className="whitespace-pre-wrap">
                    {event.eventDetails.address}
                  </div>
                </div>
              )}
              {eventDetails.prize && (
                <div className="flex flex-row gap-2">
                  <Gift />
                  <b>Prize:</b> {eventDetails.prize}
                </div>
              )}
              {eventDetails.entryCost && (
                <div className="flex flex-row gap-2">
                  <DollarSign />
                  <b>Entry Cost:</b> {eventDetails.entryCost}
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
            <section className="p-4 rounded-md bg-green-100 flex flex-col gap-2">
              <h2 className="text-xl font-bold mb-2">Event Roles</h2>
              {Array.from(rolesByTitle.entries()).map(([roleTitle, roles]) => (
                <div
                  key={roleTitle}
                  className="flex flex-row gap-2 items-center flex-wrap"
                >
                  <span>{fromNeo4jRoleFormat(roleTitle) || roleTitle}: </span>
                  {roles.map((role, index) => (
                    <Badge
                      key={`${role.id}-${index}`}
                      variant="secondary"
                      asChild
                    >
                      {role.user?.username ? (
                        <Link href={`/profiles/${role.user.username}`}>
                          {role.user.displayName || role.user.username}
                        </Link>
                      ) : (
                        <span>
                          {role.user?.displayName || role.user?.username}
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
              ))}
              <TagSelfButton
                eventId={event.id}
                currentUserRoles={currentUserRoles}
                isTeamMember={isEventTeamMember}
                canTagDirectly={canTagDirectly}
              />
            </section>

            {/* Team Members Section */}
            {(creator || validTeamMembers.length > 0) && (
              <section className="bg-green-100 p-4 rounded-md">
                <h2 className="text-xl font-bold mb-2">Team Members</h2>
                <div className="flex flex-col gap-2">
                  {creator && (
                    <div className="flex flex-row gap-2 items-center flex-wrap">
                      <span>Creator: </span>
                      <Badge variant="secondary" asChild>
                        {creator.username ? (
                          <Link href={`/profiles/${creator.username}`}>
                            {creator.displayName || creator.username}
                          </Link>
                        ) : (
                          <span>{creator.displayName || creator.username}</span>
                        )}
                      </Badge>
                    </div>
                  )}
                  {validTeamMembers.length > 0 && (
                    <div className="flex flex-row gap-2 items-center flex-wrap">
                      {validTeamMembers.map((member) => (
                        <Badge key={member.id} variant="secondary" asChild>
                          {member.username ? (
                            <Link href={`/profiles/${member.username}`}>
                              {member.displayName || member.username}
                            </Link>
                          ) : (
                            <span>{member.displayName || member.username}</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Description */}
          {event.eventDetails.description && (
            <section className="flex flex-col gap-2 p-4 bg-red-100 rounded-md md:col-span-1 xl:col-span-1">
              <div className="flex flex-row justify-center items-center gap-2 font-bold text-2xl">
                <FileText />
                Description:
              </div>
              <div className="whitespace-pre-wrap max-w-[500px]">
                {event.eventDetails.description}
              </div>
            </section>
          )}

          {/* Schedule */}
          {event.eventDetails.schedule && (
            <section className="flex flex-col gap-2 bg-purple-100 rounded-md p-4 md:col-span-1 xl:col-span-1">
              <div className="flex flex-row justify-center items-center gap-2 font-bold text-2xl">
                <Calendar />
                Schedule:
              </div>
              <div className="whitespace-pre-wrap">
                {event.eventDetails.schedule}
              </div>
            </section>
          )}

          {/* Sections */}
          {event.sections && event.sections.length > 0 && (
            <section className="flex flex-col gap-2 bg-green-300 rounded-md p-4 w-full md:col-span-1 xl:col-span-2 shadow-md">
              <div className="w-full">
                <Link href={`/events/${event.id}/sections`} className="w-full">
                  <h2 className="text-2xl font-bold mb-4 text-center">
                    Sections
                  </h2>
                </Link>

                <div className="flex flex-col gap-4">
                  {event.sections.map((section) => (
                    <div
                      key={section.id}
                      className="bg-white rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/events/${event.id}/sections/${section.id}`}
                            className="text-xl font-semibold text-gray-800 hover:text-blue-600 hover:underline transition-colors"
                          >
                            {section.title}
                          </Link>
                          {section.sectionType && (
                            <Badge variant="outline" className="text-xs">
                              {section.sectionType}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {section.videos.length}{" "}
                          {section.videos.length === 1 ? "video" : "videos"}
                        </span>
                      </div>
                      {/* Display section winners */}
                      {section.winners && section.winners.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center mb-2">
                          <span className="text-lg font-bold">Winner:</span>
                          {Array.from(
                            new Map(
                              section.winners
                                .filter((w) => w && w.id)
                                .map((w) => [w.id, w])
                            ).values()
                          ).map((winner) => (
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
                            {section.styles.map((style) => (
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
                          section.videos.forEach((video) => {
                            if (video.styles) {
                              video.styles.forEach((style) =>
                                videoStyles.add(style)
                              );
                            }
                          });
                          section.brackets.forEach((bracket) => {
                            bracket.videos.forEach((video) => {
                              if (video.styles) {
                                video.styles.forEach((style) =>
                                  videoStyles.add(style)
                                );
                              }
                            });
                          });
                          const stylesArray = Array.from(videoStyles);
                          return stylesArray.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {stylesArray.map((style) => (
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
                          <div className="text-sm text-gray-600 mb-2">
                            Brackets:
                          </div>
                          {section.brackets.map((bracket) => (
                            <div
                              key={bracket.id}
                              className="bg-gray-50 rounded p-2 flex justify-between items-center"
                            >
                              <span className="font-medium text-gray-700">
                                {bracket.title}
                              </span>
                              <span className="text-sm text-gray-500">
                                {bracket.videos.length}{" "}
                                {bracket.videos.length === 1
                                  ? "video"
                                  : "videos"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600 italic">
                          No brackets - direct video collection
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Photo Gallery */}
          {event.gallery.length > 0 && (
            <section className="flex flex-col bg-red-100 rounded-md p-4 w-full md:col-span-2 xl:col-span-4">
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
