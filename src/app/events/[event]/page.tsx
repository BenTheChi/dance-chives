import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Event } from "@/types/event";
import {
  Building,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Gift,
  MapPin,
  Tag,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AppNavbar } from "@/components/AppNavbar";
import { getEvent } from "@/db/queries/event";
import { notFound } from "next/navigation";
import { DeleteEventButton } from "@/components/DeleteEventButton";
import { auth } from "@/auth";
import { isEventCreator } from "@/db/queries/team-member";
import { TagSelfDropdown } from "@/components/events/TagSelfDropdown";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";
import { StyleBadge } from "@/components/ui/style-badge";
import { Badge } from "@/components/ui/badge";
import { canUpdateEvent, canDeleteEvent } from "@/lib/utils/auth-utils";
import { Card, CardContent } from "@/components/ui/card";

type PageProps = {
  params: Promise<{ event: string }>;
};

// Helper function to validate event ID format
function isValidEventId(id: string): boolean {
  // Event IDs should not contain file extensions or be static asset names
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

  // Check if user can edit the event
  const canEdit =
    session?.user?.id && session?.user?.auth !== undefined
      ? canUpdateEvent(
          session.user.auth,
          {
            eventId: event.id,
            eventCreatorId: event.eventDetails.creatorId,
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

  // Get current user's roles for this event (convert from Neo4j format to display format)
  const currentUserRoles = event.roles
    .filter((role) => role.user?.id === session?.user?.id)
    .map((role) => fromNeo4jRoleFormat(role.title))
    .filter((role): role is string => role !== null);

  // Aggregate all unique styles from sections and videos
  const allStyles = new Set<string>();
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
            {canDelete && <DeleteEventButton eventId={event.id} />}
          </div>

          {event.eventDetails.poster ? (
            <Image
              src={event.eventDetails.poster.url}
              alt={event.eventDetails.poster.title}
              width={500}
              height={500}
              className="object-contain rounded-md w-full md:col-span-1 xl:col-span-1"
            />
          ) : (
            <div className="w-full h-[300px] md:h-[400px] bg-gray-300 text-center m-auto flex items-center justify-center md:col-span-1 xl:col-span-1">
              No poster
            </div>
          )}

          <div className="flex flex-col gap-4 md:col-span-1 xl:col-span-1">
            {/* Event Details */}
            <section className="bg-blue-100 p-4 rounded-md flex flex-col gap-2">
              <h1 className="text-2xl font-bold">{event.eventDetails.title}</h1>
              <div className="flex flex-row gap-2">
                <Calendar />
                <b>Date:</b>
                {event.eventDetails.startDate}
              </div>
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
              {event.eventDetails.startTime && event.eventDetails.endTime && (
                <div className="flex flex-row gap-2">
                  <Clock />
                  <b>Time:</b> {event.eventDetails.startTime} -{" "}
                  {event.eventDetails.endTime}
                </div>
              )}
              {event.eventDetails.prize && (
                <div className="flex flex-row gap-2">
                  <Gift />
                  <b>Prize:</b> {event.eventDetails.prize}
                </div>
              )}
              {event.eventDetails.entryCost && (
                <div className="flex flex-row gap-2">
                  <DollarSign />
                  <b>Entry Cost:</b> {event.eventDetails.entryCost}
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

            {/* Roles */}
            <section className="p-4 rounded-md bg-green-100 flex flex-col gap-2">
              <TagSelfDropdown
                eventId={event.id}
                currentUserRoles={currentUserRoles}
              />
              {event.roles.map((role) => (
                <div key={role.id} className="flex flex-col gap-2">
                  {role.user && (
                    <div className="flex flex-row gap-1 items-center">
                      <span className="text-lg font-bold">
                        {fromNeo4jRoleFormat(role.title) || role.title}:
                      </span>
                      {role.user.username ? (
                        <Link href={`/profiles/${role.user.username}`}>
                          <span className="text-blue-500 hover:text-blue-700 hover:underline">
                            {role.user.displayName}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-blue-500">
                          {role.user.displayName}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </section>
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
          <section className="flex flex-col gap-2 bg-green-300 rounded-md p-4 w-full md:col-span-1 xl:col-span-2 shadow-md hover:bg-green-200 hover:cursor-pointer hover:shadow-none">
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
                    className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {section.title}
                      </h3>
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
                            <StyleBadge key={style} style={style} />
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
                              <StyleBadge key={style} style={style} />
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
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Sub Events */}
          <section className="w-full bg-yellow-100 rounded-md p-4 md:col-span-1 xl:col-span-2">
            <h2 className="text-2xl font-bold mb-2 text-center">Sub Events</h2>
            <Accordion type="single" collapsible>
              {event.subEvents.map((subEvent) => (
                <AccordionItem
                  value={subEvent.id}
                  key={subEvent.id}
                  className="border-x-2 border-t-2 border-gray-300 rounded-md my-2 first:rounded-t-md last:rounded-b-md last:border-2 w-full bg-violet-100"
                >
                  <AccordionTrigger className="px-5 cursor-pointer hover:no-underline">
                    <div className="flex flex-row gap-2 items-center">
                      <span className="text-lg font-bold">
                        {subEvent.title}
                      </span>
                      <span>- {subEvent.startDate}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 flex flex-row gap-2">
                    <div className="flex flex-col gap-2">
                      {subEvent.poster && (
                        <Image
                          src={subEvent.poster.url}
                          alt={subEvent.poster.title}
                          width={500}
                          height={500}
                          className="object-contain rounded-md w-full max-w-[500px] h-auto"
                        />
                      )}

                      <div className="flex flex-col gap-2 bg-orange-100 rounded-md p-4">
                        <div className="flex flex-row gap-2">
                          <Calendar /> <b>Date:</b> {subEvent.startDate}
                        </div>
                        {subEvent.startTime && subEvent.endTime && (
                          <div className="flex flex-row gap-2">
                            <Clock /> <b>Time:</b> {subEvent.startTime} -{" "}
                            {subEvent.endTime}
                          </div>
                        )}
                        {subEvent.address && (
                          <div className="flex flex-row gap-2">
                            <MapPin /> <b>Location:</b> {subEvent.address}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row gap-2">
                      {subEvent.description && (
                        <div className="flex flex-col gap-2 bg-red-100 rounded-md p-4">
                          <div className="flex flex-row justify-center items-center gap-2 font-bold text-2xl">
                            <FileText />
                            Description:
                          </div>
                          <div className="whitespace-pre-wrap max-w-[500px]">
                            {subEvent.description}
                          </div>
                        </div>
                      )}
                      {subEvent.schedule && (
                        <div className="flex flex-col gap-2 bg-blue-100 rounded-md p-4">
                          <div className="flex flex-row justify-center items-center gap-2 font-bold text-2xl">
                            <Calendar />
                            Schedule:
                          </div>
                          <div className="whitespace-pre-wrap max-w-[500px]">
                            {subEvent.schedule}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Workshops */}
            {event.workshops && event.workshops.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-bold mb-4 text-center">
                  Workshops
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {event.workshops.map((workshop) => (
                    <Link
                      key={workshop.id}
                      href={`/workshops/${workshop.id}`}
                      className="group"
                    >
                      <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02] h-full">
                        <CardContent className="p-0">
                          <div className="relative aspect-video overflow-hidden rounded-t-lg">
                            {workshop.workshopDetails.poster ? (
                              <Image
                                src={workshop.workshopDetails.poster.url}
                                alt={workshop.workshopDetails.poster.title}
                                fill
                                className="object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                No poster
                              </div>
                            )}
                          </div>
                          <div className="p-4 space-y-2">
                            <h4 className="font-semibold text-base line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {workshop.workshopDetails.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {workshop.workshopDetails.startDate}
                            </p>
                            {workshop.workshopDetails.cost && (
                              <p className="text-sm font-medium">
                                {workshop.workshopDetails.cost}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Photo Gallery */}
          <section className="flex flex-col bg-red-100 rounded-md p-4 w-full md:col-span-2 xl:col-span-4">
            <h2 className="text-2xl font-bold mb-2 text-center">
              Photo Gallery
            </h2>
            <div className="flex flex-row gap-5 flex-wrap justify-center">
              {event.gallery.map((image) => (
                <Image
                  key={image.id}
                  src={image.url}
                  alt={image.title}
                  width={100}
                  height={100}
                  className="object-contain w-full max-w-[200px] h-auto"
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
