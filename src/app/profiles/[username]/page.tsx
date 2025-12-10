import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/server_actions/auth_actions";
import { getSavedEventIds } from "@/lib/server_actions/event_actions";
import { AppNavbar } from "@/components/AppNavbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { TaggedVideosGrid } from "@/components/profile/TaggedVideosGrid";
import {
  WinningSectionCard,
  type WinningSection,
} from "@/components/profile/WinningSectionCard";
import { Event, Role } from "@/types/event";

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

  return (
    <>
      <AppNavbar />
      <main className="container mx-auto p-6 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {profile.image ? (
                  <div className="relative w-[250px] h-[350px] overflow-hidden rounded-[5px] border-2 border-black">
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
                  <div className="w-[250px] h-[350px] rounded-[5px] border-2 border-black bg-gray-200 flex items-center justify-center text-4xl">
                    {profile.displayName || profile.username || "U"}
                  </div>
                )}
                <div>
                  <CardTitle className="text-3xl">
                    {profile.displayName || profile.username}
                  </CardTitle>
                  <CardDescription className="text-lg mt-1">
                    @{profile.username}
                  </CardDescription>
                  {profile.bio && (
                    <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
                      {profile.bio}
                    </p>
                  )}
                  <div className="flex gap-4 mt-4">
                    {profile.city && (
                      <div className="text-sm text-muted-foreground">
                        {typeof profile.city === "object" && profile.city.id ? (
                          <Link
                            href={`/cities/${profile.city.id}`}
                            className="hover:text-blue-600 hover:underline transition-colors"
                          >
                            📍{" "}
                            {`${profile.city.name}${
                              profile.city.region
                                ? `, ${profile.city.region}`
                                : ""
                            }`}
                          </Link>
                        ) : (
                          <span>
                            📍{" "}
                            {typeof profile.city === "object"
                              ? `${profile.city.name}${
                                  profile.city.region
                                    ? `, ${profile.city.region}`
                                    : ""
                                }`
                              : profile.city}
                          </span>
                        )}
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
                  <div className="flex flex-wrap gap-2">
                    <span>Dance Styles: </span>
                    {profile.styles.map((style: string) => (
                      <Badge key={style} variant="secondary">
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              {isOwnProfile && (
                <Button asChild>
                  <Link href={`/profiles/${username}/edit`}>Edit Profile</Link>
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Events Created */}
        {profile.eventsCreated && profile.eventsCreated.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Events Created</CardTitle>
              <CardDescription>
                Events you have created ({profile.eventsCreated.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {profile.eventsCreated.map((event: Event) => {
                  // All events use the unified /events/ route
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
                          : event.eventDetails.dates[0].date || ""
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
            </CardContent>
          </Card>
        )}

        {/* Events with Roles */}
        {profile.eventsWithRoles && profile.eventsWithRoles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Events with Roles</CardTitle>
              <CardDescription>
                Events where you have a role ({profile.eventsWithRoles.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {profile.eventsWithRoles.map((event: Event) => {
                  // All events use the unified /events/ route
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
                          : event.eventDetails.dates[0].date || ""
                      }
                      city={event.eventDetails.city.name || ""}
                      cityId={event.eventDetails.city.id}
                      styles={event.eventDetails.styles || []}
                      eventType={event.eventDetails.eventType}
                      roles={event.roles.map((role: Role) => role.title)}
                      href={eventRoute}
                      isSaved={savedEventIds.has(event.id)}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Winning Videos */}
        {profile.winningVideos && profile.winningVideos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Winning Videos</CardTitle>
              <CardDescription>
                Videos you won ({profile.winningVideos.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaggedVideosGrid
                videos={profile.winningVideos}
                isWinner={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Tagged Videos */}
        {profile.taggedVideos && profile.taggedVideos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tagged Videos</CardTitle>
              <CardDescription>
                Videos you are tagged in ({profile.taggedVideos.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaggedVideosGrid videos={profile.taggedVideos} />
            </CardContent>
          </Card>
        )}

        {/* Sections Won */}
        {profile.winningSections && profile.winningSections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sections Won</CardTitle>
              <CardDescription>
                Sections you won ({profile.winningSections.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {profile.winningSections.map((section: WinningSection) => (
                  <WinningSectionCard
                    key={section.sectionId}
                    section={section}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {(!profile.eventsCreated || profile.eventsCreated.length === 0) &&
          (!profile.eventsWithRoles || profile.eventsWithRoles.length === 0) &&
          (!profile.taggedVideos || profile.taggedVideos.length === 0) &&
          (!profile.winningVideos || profile.winningVideos.length === 0) &&
          (!profile.winningSections ||
            profile.winningSections.length === 0) && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No events or videos to display.
                </p>
              </CardContent>
            </Card>
          )}
      </main>
    </>
  );
}
