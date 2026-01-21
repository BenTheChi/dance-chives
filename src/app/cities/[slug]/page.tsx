import { getCityData } from "@/db/queries/event";
import { notFound } from "next/navigation";
import { EventCard } from "@/components/EventCard";
import { UserCard } from "@/components/UserCard";
import { GoogleMapEmbed } from "@/components/GoogleMapEmbed";
import { CityCalendarSection } from "@/components/CityCalendarSection";
import { auth } from "@/auth";
import { getSavedEventIds } from "@/lib/server_actions/event_actions";
import { cn } from "@/lib/utils";
import { UnderConstruction } from "@/components/UnderConstruction";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CityPage({ params }: PageProps) {
  // Keep existing code for future use
  // const paramResult = await params;
  // const slug = paramResult.slug;

  // // Validate slug format
  // if (!slug || slug.trim().length === 0) {
  //   notFound();
  // }

  // const cityData = await getCityData(slug);

  // if (!cityData) {
  //   notFound();
  // }

  // const session = await auth();
  // const savedResult = session?.user?.id
  //   ? await getSavedEventIds()
  //   : { status: 200, eventIds: [] };
  // const savedEventIds = new Set(
  //   savedResult.status === 200 && "eventIds" in savedResult
  //     ? savedResult.eventIds
  //     : []
  // );

  // const cityDisplay = cityData.city.region
  //   ? `${cityData.city.name}, ${cityData.city.region}`
  //   : cityData.city.name;

  return (
    <>
      <UnderConstruction />
      {/* 
      Original code preserved for future use:
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">{cityDisplay}</h1>
        <p className="text-muted-foreground mb-8">
          Explore events and users from this city
        </p>

        Map Section
        {cityData.city.latitude && cityData.city.longitude && (
          <section className="mb-12">
            <article
              className={cn(
                "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm py-6"
              )}
            >
              <header
                className={cn(
                  "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6"
                )}
              >
                <h2 className={cn("leading-none font-semibold font-display")}>
                  Location
                </h2>
                <p className={cn("text-muted-foreground text-sm")}>
                  Map showing the location of {cityData.city.name}
                </p>
              </header>
              <div className={cn("px-5")}>
                <div className="rounded-sm overflow-hidden">
                  <GoogleMapEmbed
                    latitude={cityData.city.latitude}
                    longitude={cityData.city.longitude}
                    zoom={12}
                    height="450px"
                  />
                </div>
              </div>
            </article>
          </section>
        )}

        Calendar Section
        <section className="mb-12">
          <CityCalendarSection citySlug={cityData.city.slug || slug} />
        </section>

        Events Section
        {cityData.events.length > 0 && (
          <section className="bg-charcoal/40 rounded-sm p-4 border-2 border-black container mx-auto">
            <h2 className="mb-6 !font-rubik-mono-one text-center">Events</h2>
            <div className={cn("px-5")}>
              <div className="flex flex-wrap gap-6">
                {cityData.events.map((event) => (
                  <EventCard
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    series={event.series}
                    imageUrl={event.imageUrl}
                    date={event.date}
                    city={event.city}
                    cityId={cityData.city.id}
                    styles={event.styles}
                    eventType={event.eventType}
                    isSaved={savedEventIds.has(event.id)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        Users Section
        {cityData.users.length > 0 && (
          <section className="bg-charcoal/40 rounded-sm p-4 border-2 border-black container mx-auto">
            <h2 className="mb-6 !font-rubik-mono-one text-center">Users</h2>
            <div className={cn("px-5")}>
              <div className="flex flex-wrap gap-6">
                {cityData.users.map((user) => (
                  <UserCard
                    key={user.id}
                    displayName={user.displayName}
                    username={user.username}
                    image={user.image}
                    styles={user.styles}
                    city={cityData.city.name}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {cityData.events.length === 0 && cityData.users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No events or users found for this city.
            </p>
          </div>
        )}
      </div>
      */}
    </>
  );
}
