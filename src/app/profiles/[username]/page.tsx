import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/server_actions/auth_actions";
import { getSavedEventIds } from "@/lib/server_actions/event_actions";
import { AppNavbar } from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";
import { StyleBadge } from "@/components/ui/style-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Image from "next/image";
import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { TaggedVideosGrid } from "@/components/profile/TaggedVideosGrid";
import { SectionCard } from "@/components/ui/section-card";
import { Event, Role, Section } from "@/types/event";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const paramResult = await params;
  const username = paramResult.username;

  const session = await auth();
  const profileResult = await getUserProfile(username);

  if (!profileResult.success || !profileResult.profile) {
    notFound();
  }

  const profile = profileResult.profile;
  const isOwnProfile = session?.user?.username === username;

  const savedResult = session?.user?.id
    ? await getSavedEventIds()
    : { status: 200, eventIds: [] };
  const savedEventIds = new Set(
    savedResult.status === 200 && "eventIds" in savedResult
      ? savedResult.eventIds
      : []
  );

  // Group events with roles by role type
  const eventsByRole = new Map<string, Event[]>();
  if (profile.eventsWithRoles) {
    profile.eventsWithRoles.forEach((event: Event) => {
      event.roles.forEach((role: Role) => {
        const roleTitle = role.title;
        const displayRole = fromNeo4jRoleFormat(roleTitle) || roleTitle;
        if (!eventsByRole.has(displayRole)) {
          eventsByRole.set(displayRole, []);
        }
        // Only add event if it's not already in this role's array
        const roleEvents = eventsByRole.get(displayRole)!;
        if (!roleEvents.find((e) => e.id === event.id)) {
          roleEvents.push(event);
        }
      });
    });
  }

  // Sort roles alphabetically for consistent tab order
  const sortedRoles = Array.from(eventsByRole.keys()).sort();

  return (
    <>
      <AppNavbar />
      <div className="flex justify-center">
        <div className="flex flex-col justify-center items-center gap-2 py-5 px-3 sm:px-10 lg:px-15 max-w-[1200px]">
          {/* Profile Header */}
          <section className="bg-misty-seafoam p-4 rounded-sm flex flex-col gap-4 border border-black w-full">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                {profile.image ? (
                  <div className="relative w-[250px] h-[350px] overflow-hidden rounded-sm border-2 border-black flex-shrink-0">
                    <Image
                      src={profile.image}
                      alt={profile.displayName || profile.username}
                      width={250}
                      height={350}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-[250px] h-[350px] rounded-sm border-2 border-black bg-gray-200 flex items-center justify-center text-4xl flex-shrink-0">
                    {profile.displayName || profile.username || "U"}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h1 className="text-3xl font-bold">
                        {profile.displayName || profile.username}
                      </h1>
                      <p className="text-lg mt-1 text-muted-foreground">
                        @{profile.username}
                      </p>
                    </div>
                    {isOwnProfile && (
                      <Button asChild className="flex-shrink-0">
                        <Link href={`/profiles/${username}/edit`}>
                          Edit Profile
                        </Link>
                      </Button>
                    )}
                  </div>
                  {profile.bio && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {profile.bio}
                    </p>
                  )}
                  <div className="flex gap-4 mt-4">
                    {profile.city && (
                      <div className="text-sm text-muted-foreground">
                        <span className="text-gray-600">
                          📍{" "}
                          {typeof profile.city === "object"
                            ? `${profile.city.name}${
                                profile.city.region
                                  ? `, ${profile.city.region}`
                                  : ""
                              }`
                            : profile.city}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2">
                    {profile.instagram && (
                      <a
                        href={`https://instagram.com/${profile.instagram.replace(
                          /^@/,
                          ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Instagram: @{profile.instagram.replace(/^@/, "")}
                      </a>
                    )}
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Website
                      </a>
                    )}
                  </div>
                  {profile.styles && profile.styles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {profile.styles.map((style: string) => (
                        <StyleBadge key={style} style={style} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Events with Roles - Tabs */}
          {sortedRoles.length > 0 && (
            <section className="w-full">
              <h2 className="text-2xl font-bold mb-4">Events with Roles</h2>
              <Tabs defaultValue={sortedRoles[0]} className="w-full">
                <TabsList>
                  {sortedRoles.map((role) => (
                    <TabsTrigger key={role} value={role}>
                      {role} ({eventsByRole.get(role)?.length || 0})
                    </TabsTrigger>
                  ))}
                </TabsList>
                {sortedRoles.map((role) => (
                  <TabsContent key={role} value={role}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-4">
                      {eventsByRole.get(role)?.map((event: Event) => {
                        const eventRoute = `/events/${event.id}`;

                        return (
                          <EventCard
                            key={event.id}
                            id={event.id}
                            title={event.eventDetails.title}
                            imageUrl={event.eventDetails.poster?.url}
                            date={
                              event.eventDetails.dates &&
                              event.eventDetails.dates.length > 0
                                ? event.eventDetails.dates[0].date
                                : ""
                            }
                            city={event.eventDetails.city.name || ""}
                            cityId={event.eventDetails.city.id}
                            styles={event.eventDetails.styles || []}
                            eventType={event.eventDetails.eventType}
                            href={eventRoute}
                            isSaved={savedEventIds.has(event.id)}
                          />
                        );
                      })}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </section>
          )}

          {/* Winning Videos */}
          {profile.winningVideos && profile.winningVideos.length > 0 && (
            <section className="w-full">
              <h2 className="text-2xl font-bold mb-4">
                Winning Videos ({profile.winningVideos.length})
              </h2>
              <TaggedVideosGrid
                videos={profile.winningVideos}
                isWinner={true}
              />
            </section>
          )}

          {/* Tagged Videos */}
          {profile.taggedVideos && profile.taggedVideos.length > 0 && (
            <section className="w-full">
              <h2 className="text-2xl font-bold mb-4">
                Tagged Videos ({profile.taggedVideos.length})
              </h2>
              <TaggedVideosGrid videos={profile.taggedVideos} />
            </section>
          )}

          {/* Sections Won */}
          {profile.winningSections && profile.winningSections.length > 0 && (
            <section className="w-full">
              <h2 className="text-2xl font-bold mb-4">
                Sections Won ({profile.winningSections.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {profile.winningSections.map(
                  (section: {
                    sectionId: string;
                    sectionTitle: string;
                    sectionType?: string;
                    eventId: string;
                    eventTitle: string;
                    imageUrl?: string;
                  }) => (
                    <SectionCard
                      key={section.sectionId}
                      section={{
                        id: section.sectionId,
                        title: section.sectionTitle,
                        sectionType: section.sectionType as
                          | Section["sectionType"]
                          | undefined,
                        poster: section.imageUrl
                          ? { url: section.imageUrl }
                          : null,
                        videos: [],
                        brackets: [],
                      }}
                      eventId={section.eventId}
                      eventTitle={section.eventTitle}
                    />
                  )
                )}
              </div>
            </section>
          )}

          {/* Empty State */}
          {(!profile.eventsCreated || profile.eventsCreated.length === 0) &&
            sortedRoles.length === 0 &&
            (!profile.taggedVideos || profile.taggedVideos.length === 0) &&
            (!profile.winningVideos || profile.winningVideos.length === 0) &&
            (!profile.winningSections ||
              profile.winningSections.length === 0) && (
              <section className="w-full py-12 text-center">
                <p className="text-muted-foreground">
                  No events or videos to display.
                </p>
              </section>
            )}
        </div>
      </div>
    </>
  );
}
