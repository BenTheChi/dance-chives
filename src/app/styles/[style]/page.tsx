import { AppNavbar } from "@/components/AppNavbar";
import { getStyleData } from "@/db/queries/competition";
import { notFound } from "next/navigation";
import Eventcard from "@/components/cards";
import { StyleVideoGallery } from "@/components/ui/style-video-gallery";
import { formatStyleNameForDisplay } from "@/lib/utils/style-utils";
import { UserCard } from "@/components/user-card";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { normalizeYouTubeThumbnailUrl } from "@/lib/utils";
import { StyleBadge } from "@/components/ui/style-badge";
import { auth } from "@/auth";
import { getUser } from "@/db/queries/user";

type PageProps = {
  params: Promise<{ style: string }>;
};

export default async function StylePage({ params }: PageProps) {
  const paramResult = await params;
  const styleName = decodeURIComponent(paramResult.style);

  // Get current user and their city
  const session = await auth();
  let cityId: number | undefined = undefined;
  if (session?.user?.id) {
    const user = await getUser(session.user.id);
    if (user?.city) {
      cityId = user.city.id;
    }
  }

  const styleData = await getStyleData(styleName, cityId);

  if (!styleData) {
    notFound();
  }

  // Format style name for display (first letter uppercase)
  const displayStyleName = formatStyleNameForDisplay(styleData.styleName);

  return (
    <>
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">{displayStyleName}</h1>
        <p className="text-muted-foreground mb-8">
          Explore events, videos, users, workshops, and sessions tagged with this dance style
        </p>

        {/* Events in Your City Section */}
        {styleData.cityFilteredEvents && styleData.cityFilteredEvents.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Events in Your City</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {styleData.cityFilteredEvents.map((event) => (
                <Eventcard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  series={event.series}
                  imageUrl={event.imageUrl}
                  date={event.date}
                  city={event.city}
                  cityId={event.cityId}
                  styles={event.styles}
                />
              ))}
            </div>
          </section>
        )}

        {/* Videos Section */}
        {styleData.videos.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Videos</h2>
            <StyleVideoGallery videos={styleData.videos} />
          </section>
        )}

        {/* Users in Your City Section */}
        {styleData.cityFilteredUsers && styleData.cityFilteredUsers.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Users in Your City</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {styleData.cityFilteredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  id={user.id}
                  displayName={user.displayName}
                  username={user.username}
                  image={user.image}
                  styles={user.styles}
                />
              ))}
            </div>
          </section>
        )}

        {/* Workshops Section */}
        {styleData.workshops.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Workshops</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {styleData.workshops.map((workshop) => (
                <Card
                  key={workshop.id}
                  className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-video overflow-hidden rounded-t-lg">
                      <Link href={`/workshops/${workshop.id}`}>
                        <Image
                          src={normalizeYouTubeThumbnailUrl(workshop.imageUrl)}
                          alt={workshop.title}
                          fill
                          className="object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      </Link>
                    </div>

                    <div className="sm:p-4 space-y-2 sm:space-y-3">
                      <Link href={`/workshops/${workshop.id}`}>
                        <h3 className="font-semibold text-base sm:text-lg line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors">
                          {workshop.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {workshop.date}
                      </p>
                      {workshop.cityId ? (
                        <Link
                          href={`/cities/${workshop.cityId}`}
                          className="text-sm text-muted-foreground hover:text-blue-600 hover:underline transition-colors"
                        >
                          {workshop.city}
                        </Link>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {workshop.city}
                        </p>
                      )}
                      {workshop.cost && (
                        <p className="text-sm font-medium">{workshop.cost}</p>
                      )}
                      {workshop.styles && workshop.styles.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {workshop.styles.slice(0, 3).map((style) => (
                            <StyleBadge key={style} style={style} />
                          ))}
                          {workshop.styles.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{workshop.styles.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Sessions Section */}
        {styleData.sessions.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Sessions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {styleData.sessions.map((session) => (
                <Card
                  key={session.id}
                  className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-video overflow-hidden rounded-t-lg">
                      <Link href={`/sessions/${session.id}`}>
                        <Image
                          src={normalizeYouTubeThumbnailUrl(session.imageUrl)}
                          alt={session.title}
                          fill
                          className="object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      </Link>
                    </div>

                    <div className="sm:p-4 space-y-2 sm:space-y-3">
                      <Link href={`/sessions/${session.id}`}>
                        <h3 className="font-semibold text-base sm:text-lg line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors">
                          {session.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {session.date}
                      </p>
                      {session.cityId ? (
                        <Link
                          href={`/cities/${session.cityId}`}
                          className="text-sm text-muted-foreground hover:text-blue-600 hover:underline transition-colors"
                        >
                          {session.city}
                        </Link>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {session.city}
                        </p>
                      )}
                      {session.cost && (
                        <p className="text-sm font-medium">{session.cost}</p>
                      )}
                      {session.styles && session.styles.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {session.styles.slice(0, 3).map((style) => (
                            <StyleBadge key={style} style={style} />
                          ))}
                          {session.styles.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{session.styles.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {(!styleData.cityFilteredEvents || styleData.cityFilteredEvents.length === 0) &&
          (!styleData.cityFilteredUsers || styleData.cityFilteredUsers.length === 0) &&
          styleData.videos.length === 0 &&
          styleData.workshops.length === 0 &&
          styleData.sessions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No events, videos, users, workshops, or sessions found for this style.
              </p>
            </div>
          )}
      </div>
    </>
  );
}
