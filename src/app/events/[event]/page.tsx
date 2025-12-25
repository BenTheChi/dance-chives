import React from "react";
import { AppNavbar } from "@/components/AppNavbar";
import { getEvent } from "@/db/queries/event";
import { notFound } from "next/navigation";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";
import { StyleBadge } from "@/components/ui/style-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PhotoGallery } from "@/components/PhotoGallery";
import { PosterImage } from "@/components/PosterImage";
import { SectionCard } from "@/components/ui/section-card";
import { getUser } from "@/db/queries/user";
import { EventDatesDialog } from "@/components/events/EventDatesDialog";
import { enrichUserWithCardData } from "@/db/queries/user-cards";
import {
  EventShareSaveButtonsWrapper,
  EventTagSelfButton,
  EventEditButtons,
} from "./event-client";

type PageProps = {
  params: Promise<{ event: string }>;
};

// Enable static generation with revalidation (ISR)
export const revalidate = 3600; // Revalidate every hour

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

  // Get event without auth (for static generation - hidden events will be filtered)
  const event = await getEvent(paramResult.event);

  // If event is null, it means it's hidden (or doesn't exist)
  if (!event) {
    notFound();
  }

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

  // Fetch creator for Event Roles section and enrich with Postgres data
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
      <div className="flex flex-col">
        <h1 className="py-7 border-b-2 border-primary-light">
          {event.eventDetails.title}
        </h1>
        <div className="mt-0 sm:mt-4">
          {event.eventDetails.status === "hidden" && (
            <p className="text-medium mt-1 text-center">(hidden)</p>
          )}
        </div>
        <div className="flex justify-center flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-8 py-5 px-3 sm:px-10 lg:px-15 max-w-[500px] sm:max-w-[1000px] lg:max-w-[1200px] w-full">
            {/* Row 1: Image + Details - using flex for exact sizing */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              {/* Image */}
              <div className="w-full sm:flex-1 lg:max-w-[400px]">
                <div className="w-full aspect-square">
                  <PosterImage
                    poster={event.eventDetails.poster ?? null}
                    originalPoster={event.eventDetails.originalPoster ?? null}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                    eventTitle={event.eventDetails.title}
                  />
                </div>
              </div>
              {/* Event Details */}
              <div className="w-full sm:flex-1 lg:max-w-[800px]">
                <section className="border-4 border-primary-light py-4 px-4 bg-primary-dark rounded-sm w-full flex flex-col">
                  <div className="flex flex-col">
                    {/* City | Event type */}
                    <div className="flex flex-row gap-1 items-center justify-center mb-4">
                      {event.eventDetails.city.name && (
                        <h2>{event.eventDetails.city.name}</h2>
                      )}

                      {event.eventDetails.eventType && (
                        <h2>
                          {` | `}
                          {event.eventDetails.eventType}
                        </h2>
                      )}
                    </div>

                    {/* Style badges */}
                    {eventStyles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6 sm:mb-10 justify-center">
                        {eventStyles.map((style) => (
                          <StyleBadge key={style} style={style} />
                        ))}
                      </div>
                    )}

                    {/* Dates, Location, Cost, Prize - dynamic layout */}
                    {(() => {
                      const hasDates =
                        pastDates.length > 0 || upcomingDates.length > 0;
                      const hasLocation = !!event.eventDetails.location;
                      const hasCost = !!event.eventDetails.cost;
                      const hasPrize = !!event.eventDetails.prize;

                      const items: Array<{
                        key: string;
                        content: React.ReactElement;
                      }> = [];

                      if (hasDates) {
                        items.push({
                          key: "dates",
                          content: (
                            <div className="flex flex-col gap-3">
                              {showMoreDatesButton && (
                                <EventDatesDialog eventId={event.id} />
                              )}
                              {pastDates.length > 0 && (
                                <div className="flex flex-col justify-center gap-1">
                                  <h3 className="text-center underline">
                                    Past Date
                                  </h3>
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
                                <div className="flex flex-col justify-center gap-1">
                                  <h3 className="text-center underline">
                                    Future Date(s)
                                  </h3>
                                  <div className="flex flex-col text-sm text-center">
                                    {upcomingDates.map((d, idx) => (
                                      <span key={`upcoming-${d.date}-${idx}`}>
                                        {formatEventDateRow(d)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ),
                        });
                      }

                      if (hasLocation) {
                        items.push({
                          key: "location",
                          content: (
                            <div className="flex flex-col gap-1">
                              <h3 className="text-center underline">
                                Location
                              </h3>
                              <p className="text-left">
                                {event.eventDetails.location}
                              </p>
                            </div>
                          ),
                        });
                      }

                      if (hasCost) {
                        items.push({
                          key: "cost",
                          content: (
                            <div className="flex flex-col gap-1">
                              <h3 className="text-center underline">Cost</h3>
                              <p className="text-left">
                                {event.eventDetails.cost}
                              </p>
                            </div>
                          ),
                        });
                      }

                      if (hasPrize) {
                        items.push({
                          key: "prize",
                          content: (
                            <div className="flex flex-col gap-1">
                              <h3 className="text-center underline">Prize</h3>
                              <p className="text-left">
                                {event.eventDetails.prize}
                              </p>
                            </div>
                          ),
                        });
                      }

                      const itemCount = items.length;

                      if (itemCount === 0) return null;

                      if (itemCount === 1) {
                        return (
                          <div className="flex justify-center">
                            <div className="w-full max-w-md">
                              {items[0].content}
                            </div>
                          </div>
                        );
                      }

                      if (itemCount === 2) {
                        return (
                          <div className="grid grid-cols-2 gap-5">
                            {items.map((item) => (
                              <div
                                key={item.key}
                                className="flex justify-center"
                              >
                                {item.content}
                              </div>
                            ))}
                          </div>
                        );
                      }

                      // 3 or more items - use 2x2 grid
                      return (
                        <div className="grid grid-cols-2 gap-5">
                          {items.map((item) => (
                            <div
                              key={item.key}
                              className="flex justify-center mb-3"
                            >
                              {item.content}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  {/* Share and Save buttons - handled by client component */}
                  <EventShareSaveButtonsWrapper eventId={event.id} />
                </section>
              </div>
            </div>

            {/* Row 2: Description (2 cols) + Schedule (2 cols) + Roles (2 cols) */}
            <div className="grid grid-cols-6 gap-5 w-full items-start">
              <div className="col-span-6 sm:col-span-2 flex flex-col gap-4 p-4 bg-primary-dark rounded-sm border-2 border-primary-light">
                <h2 className="text-center mx-auto underline">Description</h2>
                {event.eventDetails.description && (
                  <div className="text-sm whitespace-pre-wrap">
                    {event.eventDetails.description}
                  </div>
                )}
              </div>
              <div className="col-span-6 sm:col-span-2 flex flex-col gap-4 p-4 bg-primary-dark rounded-sm border-2 border-primary-light">
                <h2 className="text-center mx-auto underline">Schedule</h2>
                {event.eventDetails.schedule && (
                  <div className="text-sm whitespace-pre-wrap">
                    {event.eventDetails.schedule}
                  </div>
                )}
              </div>
              <div className="col-span-6 sm:col-span-2 flex flex-col gap-4 p-4 bg-primary-dark rounded-sm border-2 border-primary-light">
                <div className="flex gap-2 justify-center items-center">
                  <h2 className="text-center mx-auto underline">Roles</h2>
                  <EventTagSelfButton eventId={event.id} />
                </div>
                {Array.from(rolesByTitle.entries()).map(
                  ([roleTitle, roles]) => (
                    <div
                      key={roleTitle}
                      className="flex flex-row  flex-wrap gap-2 items-center"
                    >
                      <h3>{fromNeo4jRoleFormat(roleTitle) || roleTitle}</h3>
                      <div className="flex flex-row gap-2 items-center flex-wrap">
                        {roles.map((role, index) => (
                          <UserAvatar
                            key={`${role.id}-${index}`}
                            username={role.user?.username ?? ""}
                            displayName={
                              role.user?.displayName ??
                              role.user?.username ??
                              ""
                            }
                            avatar={
                              (role.user as { avatar?: string | null }).avatar
                            }
                            image={
                              (role.user as { image?: string | null }).image
                            }
                            showHoverCard
                            city={(role.user as { city?: string }).city || ""}
                            styles={(role.user as { styles?: string[] }).styles}
                            isSmall={true}
                          />
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Sections - each takes up full width */}
            {event.sections && event.sections.length > 0 && (
              <>
                {event.sections.map((section) => (
                  <div key={section.id} className="w-full">
                    <SectionCard
                      section={section}
                      eventId={event.id}
                      eventTitle={event.eventDetails.title}
                    />
                  </div>
                ))}
              </>
            )}

            {/* Photo Gallery - takes up full width */}
            {event.gallery.length > 0 && (
              <section className="flex flex-col bg-primary rounded-sm p-4 w-full border-2 border-black">
                <h2 className="text-2xl font-bold mb-2 text-center">
                  Photo Gallery
                </h2>
                <PhotoGallery images={event.gallery} />
              </section>
            )}
          </div>
        </div>
        <div className="flex justify-center w-full">
          <div className="w-full max-w-[920px]">
            <hr className="border-primary-light my-4" />
            <div className="flex flex-row gap-10 items-center justify-center mb-4">
              {creator && (
                <div className="flex flex-row gap-2 items-center">
                  <span className="text-sm text-muted-foreground">
                    Page Owner:{" "}
                  </span>
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
                </div>
              )}
              {/* Settings and Edit buttons - handled by client component */}
              <EventEditButtons eventId={event.id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
