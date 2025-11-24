import { AppNavbar } from "@/components/AppNavbar";
import { getStyleData } from "@/db/queries/event";
import { notFound } from "next/navigation";
import Eventcard from "@/components/cards";
import { StyleVideoGallery } from "@/components/ui/style-video-gallery";
import { formatStyleNameForDisplay } from "@/lib/utils/style-utils";
import { UserCard } from "@/components/user-card";
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
          Explore events, videos, users, workshops, and sessions tagged with
          this dance style
        </p>

        {/* Events in Your City Section */}
        {styleData.cityFilteredEvents &&
          styleData.cityFilteredEvents.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">
                Events in Your City
              </h2>
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
        {styleData.cityFilteredUsers &&
          styleData.cityFilteredUsers.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">
                Users in Your City
              </h2>
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
      </div>
    </>
  );
}
