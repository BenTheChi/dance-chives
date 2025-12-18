import { AppNavbar } from "@/components/AppNavbar";
import { getCityData } from "@/db/queries/event";
import { notFound } from "next/navigation";
import { EventCard } from "@/components/EventCard";
import { UserCard } from "@/components/UserCard";
import { GoogleMapEmbed } from "@/components/GoogleMapEmbed";
import { CityCalendarSection } from "@/components/CityCalendarSection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/auth";
import { getSavedEventIds } from "@/lib/server_actions/event_actions";

type PageProps = {
  params: Promise<{ cityId: string }>;
};

export default async function CityPage({ params }: PageProps) {
  const paramResult = await params;
  const cityId = paramResult.cityId;

  // Validate place_id format (basic check - place_ids are typically long alphanumeric strings)
  if (!cityId || cityId.trim().length === 0) {
    notFound();
  }

  const cityData = await getCityData(cityId);

  if (!cityData) {
    notFound();
  }

  const session = await auth();
  const savedResult = session?.user?.id
    ? await getSavedEventIds()
    : { status: 200, eventIds: [] };
  const savedEventIds = new Set(
    savedResult.status === 200 && "eventIds" in savedResult
      ? savedResult.eventIds
      : []
  );

  const cityDisplay =
    cityData.city.region && cityData.city.countryCode
      ? `${cityData.city.name}, ${cityData.city.region}, ${cityData.city.countryCode}`
      : cityData.city.region
      ? `${cityData.city.name}, ${cityData.city.region}`
      : cityData.city.name;

  return (
    <>
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">{cityDisplay}</h1>
        <p className="text-muted-foreground mb-8">
          Explore events and users from this city
        </p>

        {/* Map Section */}
        {cityData.city.latitude && cityData.city.longitude && (
          <section className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
                <CardDescription>
                  Map showing the location of {cityData.city.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-sm overflow-hidden">
                  <GoogleMapEmbed
                    latitude={cityData.city.latitude}
                    longitude={cityData.city.longitude}
                    zoom={12}
                    height="450px"
                  />
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Calendar Section */}
        <section className="mb-12">
          <CityCalendarSection cityId={cityData.city.id} />
        </section>

        {/* Events Section */}
        {cityData.events.length > 0 && (
          <section className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Events</CardTitle>
                <CardDescription>
                  Events in this city ({cityData.events.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
              </CardContent>
            </Card>
          </section>
        )}

        {/* Users Section */}
        {cityData.users.length > 0 && (
          <section className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  Users from this city ({cityData.users.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
              </CardContent>
            </Card>
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
    </>
  );
}
