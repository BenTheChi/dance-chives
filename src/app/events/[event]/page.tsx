//THIS PAGE IS NOT USING ISR.  IF WE WANT TO USE ISR AGAIN IT WILL EFFECT THE HIDE/VISIBLE FUNCTIONALITY.

import React from "react";
import { AppNavbar } from "@/components/AppNavbar";
import { getEvent } from "@/db/queries/event";
import { notFound } from "next/navigation";
import { StyleBadge } from "@/components/ui/style-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PhotoGallery } from "@/components/PhotoGallery";
import { PosterImage } from "@/components/PosterImage";
import { SectionCard } from "@/components/ui/section-card";
import { getUser } from "@/db/queries/user";
import { EventDatesDialog } from "@/components/events/EventDatesDialog";
import { enrichUserWithCardData } from "@/db/queries/user-cards";
import { EventShareSaveButtonsWrapper, EventEditButtons } from "./event-client";
import { RequestOwnershipButton } from "@/components/events/RequestOwnershipButton";
import { TeamMembersDisplay } from "@/components/events/TeamMembersDisplay";
import { getEventTeamMembers, isTeamMember } from "@/db/queries/team-member";
import { EventRoles } from "./event-roles";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { RequestTeamMemberButton } from "@/components/events/RequestTeamMemberButton";
import { MessageTemplateDialog } from "@/components/events/MessageTemplateDialog";
import { LinkifiedText } from "@/components/LinkifiedText";
import { Globe, Instagram, Youtube, Facebook } from "lucide-react";

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

// Generate metadata for the event page
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const paramResult = await params;

  // Validate the event ID before trying to fetch it
  if (!isValidEventId(paramResult.event)) {
    return {
      title: "Event Not Found",
      description: "The requested event could not be found.",
    };
  }

  // Get event without auth (for static generation - hidden events will be filtered)
  const event = await getEvent(paramResult.event);

  // If event is null, it means it's hidden (or doesn't exist)
  if (!event) {
    return {
      title: "Event Not Found",
      description: "The requested event could not be found.",
    };
  }

  const { eventDetails } = event;
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.dancechives.com";

  // Build description from available event information
  const descriptionParts: string[] = [];

  if (eventDetails.description) {
    // Use first 150 characters of description
    const desc = eventDetails.description.replace(/\n/g, " ").trim();
    descriptionParts.push(
      desc.length > 150 ? desc.substring(0, 147) + "..." : desc
    );
  } else {
    // Fallback description
    descriptionParts.push(
      `${eventDetails.eventType} in ${eventDetails.city.name}`
    );
  }

  // Add styles if available
  if (eventDetails.styles && eventDetails.styles.length > 0) {
    descriptionParts.push(`Styles: ${eventDetails.styles.join(", ")}`);
  }

  // Add location if available
  if (eventDetails.location) {
    descriptionParts.push(`Location: ${eventDetails.location}`);
  }

  // Add dates information
  if (eventDetails.dates && eventDetails.dates.length > 0) {
    const upcomingDates = eventDetails.dates.filter((d) => {
      const dateStr = d.date;
      const date = dateStr.includes("-")
        ? new Date(dateStr)
        : (() => {
            const [month, day, year] = dateStr.split("/").map(Number);
            return new Date(year, month - 1, day);
          })();
      return date >= new Date(new Date().setHours(0, 0, 0, 0));
    });

    if (upcomingDates.length > 0) {
      const nextDate = upcomingDates[0];
      const dateStr = nextDate.endTime
        ? `${nextDate.date} (${nextDate.startTime} - ${nextDate.endTime})`
        : nextDate.startTime
        ? `${nextDate.date} (${nextDate.startTime})`
        : nextDate.date;
      descriptionParts.push(`Next date: ${dateStr}`);
    }
  }

  const description = descriptionParts.join(" • ");

  // Build title
  const title = `${eventDetails.title} - ${eventDetails.city.name}${
    eventDetails.eventType ? ` • ${eventDetails.eventType}` : ""
  }`;

  // Get poster image URL for Open Graph
  const posterUrl = eventDetails.poster?.url
    ? eventDetails.poster.url.startsWith("http")
      ? eventDetails.poster.url
      : `${baseUrl}${eventDetails.poster.url}`
    : undefined;

  // Count sections and videos for additional context
  const sectionCount = event.sections?.length || 0;
  const videoCount =
    event.sections?.reduce(
      (acc, section) =>
        acc +
        (section.videos?.length || 0) +
        (section.brackets?.reduce(
          (bAcc, bracket) => bAcc + (bracket.videos?.length || 0),
          0
        ) || 0),
      0
    ) || 0;

  // Build enhanced description with stats
  let enhancedDescription = description;
  if (sectionCount > 0 || videoCount > 0) {
    const stats: string[] = [];
    if (sectionCount > 0) {
      stats.push(`${sectionCount} section${sectionCount !== 1 ? "s" : ""}`);
    }
    if (videoCount > 0) {
      stats.push(`${videoCount} video${videoCount !== 1 ? "s" : ""}`);
    }
    enhancedDescription = `${description} • ${stats.join(", ")}`;
  }

  // Get creator info for author metadata
  const creator = eventDetails.creatorId
    ? await getUser(eventDetails.creatorId)
    : null;

  // Format author name: "displayName - username" or fallback to available fields
  let authorName: string | undefined;
  if (creator) {
    if (creator.displayName && creator.username) {
      authorName = `${creator.displayName} - ${creator.username}`;
    } else if (creator.displayName) {
      authorName = creator.displayName;
    } else if (creator.username) {
      authorName = creator.username;
    }
  }

  const authorUrl = creator?.username
    ? `${baseUrl}/profiles/${creator.username}`
    : undefined;

  // Format publish date (createdAt)
  const publishedTime = event.createdAt
    ? new Date(event.createdAt).toISOString()
    : undefined;

  // Format modified date (updatedAt)
  const modifiedTime = event.updatedAt
    ? new Date(event.updatedAt).toISOString()
    : undefined;

  // Build keywords from event data
  const keywords: string[] = [
    "street dance",
    "dance battles",
    "dance events",
    eventDetails.eventType || "dance event",
    eventDetails.city.name,
  ];
  if (eventDetails.styles && eventDetails.styles.length > 0) {
    keywords.push(...eventDetails.styles);
  }
  if (eventDetails.city.region) {
    keywords.push(eventDetails.city.region);
  }

  // Build image metadata
  const imageMetadata = posterUrl
    ? {
        url: posterUrl,
        secureUrl: posterUrl.startsWith("https")
          ? posterUrl
          : posterUrl.replace("http://", "https://"),
        type: posterUrl.endsWith(".png")
          ? "image/png"
          : posterUrl.endsWith(".jpg") || posterUrl.endsWith(".jpeg")
          ? "image/jpeg"
          : posterUrl.endsWith(".webp")
          ? "image/webp"
          : "image/png",
      }
    : undefined;

  return {
    title,
    description: enhancedDescription,
    keywords: keywords.join(", "),
    authors: authorName ? [{ name: authorName, url: authorUrl }] : undefined,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title,
      description: enhancedDescription,
      images: posterUrl ? [posterUrl] : undefined,
      type: "website",
      url: `${baseUrl}/events/${paramResult.event}`,
      siteName: "Dance Chives",
    },
    other: {
      ...(publishedTime && {
        "article:published_time": publishedTime,
      }),
      ...(modifiedTime && {
        "article:modified_time": modifiedTime,
      }),
      ...(authorName && {
        "article:author": authorName,
      }),
      ...(eventDetails.eventType && {
        "article:section": eventDetails.eventType,
      }),
      ...(eventDetails.styles &&
        eventDetails.styles.length > 0 && {
          "article:tag": eventDetails.styles.join(", "),
        }),
      ...(imageMetadata && {
        "og:image:type": imageMetadata.type,
        "og:image:secure_url": imageMetadata.secureUrl,
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: enhancedDescription,
      images: posterUrl ? [posterUrl] : undefined,
    },
    alternates: {
      canonical: `${baseUrl}/events/${paramResult.event}`,
    },
  };
}

export default async function EventPage({ params }: PageProps) {
  const paramResult = await params;

  // Validate the event ID before trying to fetch it
  if (!isValidEventId(paramResult.event)) {
    notFound();
  }

  // Get current user session for role removal functionality
  const session = await auth();
  const currentUserId = session?.user?.id;

  // Get event with auth context to allow access to hidden events for authorized users
  // Hidden events are accessible to: admins, moderators, team members, and page owners (creators)
  const event = await getEvent(
    paramResult.event,
    currentUserId,
    session?.user?.auth
  );

  // If event is null, it means it's hidden (or doesn't exist) and user is not authorized
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

  // Fetch team members and enrich with user data
  const teamMemberIds = await getEventTeamMembers(event.id);
  const teamMembersRaw = await Promise.all(
    teamMemberIds.map(async (id) => {
      const user = await getUser(id);
      if (!user) return null;
      return user;
    })
  );
  const teamMembersValid = teamMembersRaw.filter(
    (member): member is NonNullable<typeof member> => member !== null
  );
  const teamMembers = await Promise.all(
    teamMembersValid.map(async (member) => {
      const enriched = await enrichUserWithCardData({
        id: member.id,
        username: member.username,
        displayName: member.displayName,
        avatar: member.avatar,
        image: member.image,
      });
      return enriched;
    })
  );

  // Check if current user is a team member
  const isCurrentUserTeamMember = currentUserId
    ? await isTeamMember(event.id, currentUserId)
    : false;

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

  // Convert 24-hour time (HH:mm) to 12-hour format with AM/PM
  const convertTo12Hour = (time24: string): string => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col">
        <h1 className="py-7 border-b-2 border-primary-light bg-charcoal">
          {event.eventDetails.title}
        </h1>
        <div className="mt-0 sm:mt-4">
          {event.eventDetails.status === "hidden" && (
            <p className="text-medium mt-1 text-center">(hidden)</p>
          )}
        </div>
        <div className="flex justify-center flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-col py-10 pt-5 px-3 gap-5 sm:px-10 lg:px-15 max-w-[500px] sm:max-w-[1000px] lg:max-w-[1200px] w-full">
            {/* Row 1: Image + Details - using flex for exact sizing */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              {/* Image */}
              <div className="w-full sm:flex-2 lg:max-w-[400px]">
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
              <div className="w-full sm:flex-2 lg:max-w-[800px]">
                <section className="border-2 border-primary-light py-4 px-4 bg-primary-dark rounded-sm w-full flex flex-col">
                  <div className="flex flex-col">
                    {/* City | Event type */}
                    <div className="flex flex-row gap-5 items-center justify-center mb-4">
                      {event.eventDetails.city.name && (
                        <h2 className="!font-extrabold">
                          {event.eventDetails.city.name}
                        </h2>
                      )}

                      {event.eventDetails.eventType && (
                        <h3>{event.eventDetails.eventType}</h3>
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
                        const hasBothTypes =
                          pastDates.length > 0 && upcomingDates.length > 0;
                        items.push({
                          key: "dates",
                          content: (
                            <div className="flex flex-col">
                              {showMoreDatesButton && (
                                <EventDatesDialog eventId={event.id} />
                              )}
                              {pastDates.length > 0 && (
                                <div className="flex flex-col justify-center gap-2">
                                  <h3 className="text-center underline">
                                    {hasBothTypes ? "Past Date" : "Date"}
                                  </h3>
                                  <div className="flex flex-col text-center gap-2">
                                    {pastDates.map((d, idx) => {
                                      const isAllDay =
                                        !d.startTime && !d.endTime;
                                      const timeStr = d.endTime
                                        ? `${convertTo12Hour(
                                            d.startTime || ""
                                          )} - ${convertTo12Hour(d.endTime)}`
                                        : convertTo12Hour(d.startTime || "");
                                      return (
                                        <div
                                          key={`past-${d.date}-${idx}`}
                                          className="flex flex-col leading-tight"
                                        >
                                          <span>{d.date}</span>
                                          {!isAllDay && (
                                            <span className="!text-[15px] italic">
                                              {timeStr}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {upcomingDates.length > 0 && (
                                <div className="flex flex-col justify-center gap-2">
                                  <h3 className="text-center underline">
                                    {hasBothTypes ? "Future Date(s)" : "Date"}
                                  </h3>
                                  <div className="flex flex-col gap-2 text-sm text-center leading-tight">
                                    {upcomingDates.map((d, idx) => {
                                      const isAllDay =
                                        !d.startTime && !d.endTime;
                                      const timeStr = d.endTime
                                        ? `${convertTo12Hour(
                                            d.startTime || ""
                                          )} - ${convertTo12Hour(d.endTime)}`
                                        : convertTo12Hour(d.startTime || "");
                                      return (
                                        <div
                                          key={`upcoming-${d.date}-${idx}`}
                                          className="flex flex-col"
                                        >
                                          <span>{d.date}</span>
                                          {!isAllDay && (
                                            <span className="!text-[15px] italic">
                                              {timeStr}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
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
                            <div className="flex flex-col gap-2">
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
                            <div className="flex flex-col gap-2">
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
                            <div className="flex flex-col gap-2">
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
                  {/* Share/Save buttons and Social Media Links */}
                  <div className="flex justify-around items-center flex-wrap gap-4 mt-10">
                    {/* Social Media Links */}
                    {(event.eventDetails.website ||
                      event.eventDetails.instagram ||
                      event.eventDetails.youtube ||
                      event.eventDetails.facebook) && (
                      <div className="flex flex-row gap-4 items-center">
                        {event.eventDetails.website && (
                          <a
                            href={event.eventDetails.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center h-10 w-10 bg-accent-blue text-black border border-black shadow-hover transition-opacity rounded-sm"
                            aria-label="Website"
                          >
                            <Globe className="h-5 w-5" />
                          </a>
                        )}
                        {event.eventDetails.instagram && (
                          <a
                            href={
                              event.eventDetails.instagram.startsWith("http")
                                ? event.eventDetails.instagram
                                : `https://instagram.com/${event.eventDetails.instagram.replace(
                                    /^@/,
                                    ""
                                  )}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center h-10 w-10 bg-accent-blue text-black border border-black shadow-hover transition-opacity rounded-sm"
                            aria-label="Instagram"
                          >
                            <Instagram className="h-5 w-5" />
                          </a>
                        )}
                        {event.eventDetails.youtube && (
                          <a
                            href={
                              event.eventDetails.youtube.startsWith("http")
                                ? event.eventDetails.youtube
                                : `https://youtube.com/@${event.eventDetails.youtube.replace(
                                    /^@/,
                                    ""
                                  )}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center h-10 w-10 bg-accent-blue text-black border border-black shadow-hover transition-opacity rounded-sm"
                            aria-label="YouTube"
                          >
                            <Youtube className="h-5 w-5" />
                          </a>
                        )}
                        {event.eventDetails.facebook && (
                          <a
                            href={
                              event.eventDetails.facebook.startsWith("http")
                                ? event.eventDetails.facebook
                                : `https://facebook.com/${event.eventDetails.facebook.replace(
                                    /^@/,
                                    ""
                                  )}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center h-10 w-10 bg-accent-blue text-black border border-black shadow-hover transition-opacity rounded-sm"
                            aria-label="Facebook"
                          >
                            <Facebook className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    )}
                    {/* Share and Save buttons - handled by client component */}
                    <EventShareSaveButtonsWrapper eventId={event.id} />
                  </div>
                </section>
              </div>
              <EventRoles
                eventId={event.id}
                rolesByTitle={rolesByTitle}
                currentUserId={currentUserId}
              />
            </div>

            {/* Row 2: Description (2 cols) + Schedule (2 cols) + Roles (2 cols) */}
            <div className="grid grid-cols-3 gap-5 w-full items-start">
              <div className="col-span-3 sm:col-span-2 flex flex-col gap-4 p-4 bg-primary-dark rounded-sm border-2 border-primary-light">
                <h2 className="text-center mx-auto underline">Description</h2>
                {event.eventDetails.description && (
                  <LinkifiedText
                    text={event.eventDetails.description}
                    className="text-sm whitespace-pre-wrap"
                  />
                )}
              </div>

              <div className="col-span-3 sm:col-span-1 flex flex-col gap-4 p-4 bg-primary-dark rounded-sm border-2 border-primary-light">
                <h2 className="text-center mx-auto underline">Schedule</h2>
                {event.eventDetails.schedule && (
                  <LinkifiedText
                    text={event.eventDetails.schedule}
                    className="text-sm whitespace-pre-wrap"
                  />
                )}
              </div>
            </div>

            {/* Sections - grid layout */}
            {event.sections && event.sections.length > 0 && (
              <div className="mt-[100px] sections-grid w-full">
                {event.sections.map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    eventId={event.id}
                    eventTitle={event.eventDetails.title}
                  />
                ))}
              </div>
            )}

            {/* Photo Gallery - takes up full width */}
            {event.gallery.length > 0 && (
              <section className="flex flex-col bg-primary rounded-sm p-4 w-full border-2 border-primary-light">
                <h2 className="text-2xl font-bold mb-4 text-center">
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
            <div className="flex flex-row gap-4 sm:gap-10 items-center justify-center mb-4 flex-wrap">
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
              <div className="flex flex-row gap-2 items-center">
                <span className="text-sm min-w-[100px]">Team Members: </span>

                {teamMembers.length > 0 && (
                  <TeamMembersDisplay
                    teamMembers={teamMembers.filter(
                      (member): member is typeof member & { id: string } =>
                        !!member.id
                    )}
                    eventId={event.id}
                    creatorId={creator?.id}
                    currentUserId={currentUserId}
                    isCurrentUserTeamMember={isCurrentUserTeamMember}
                  />
                )}
                {!isCurrentUserTeamMember && (
                  <RequestTeamMemberButton
                    eventId={event.id}
                    creatorId={creator?.id}
                    isTeamMember={isCurrentUserTeamMember}
                  />
                )}
              </div>
              {/* Message template button - super admin only */}
              <MessageTemplateDialog
                eventId={event.id}
                eventTitle={event.eventDetails.title}
              />
              {/* Settings and Edit buttons - handled by client component */}
              <EventEditButtons eventId={event.id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
