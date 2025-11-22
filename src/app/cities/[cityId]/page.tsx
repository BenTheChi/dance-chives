import { AppNavbar } from "@/components/AppNavbar";
import { getCityData } from "@/db/queries/competition";
import { notFound } from "next/navigation";
import Eventcard from "@/components/cards";
import { UserCard } from "@/components/user-card";
import { GoogleMapEmbed } from "@/components/GoogleMapEmbed";
import { CityCalendarSection } from "@/components/CityCalendarSection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PageProps = {
  params: Promise<{ cityId: string }>;
};

export default async function CityPage({ params }: PageProps) {
  const paramResult = await params;
  const cityId = parseInt(paramResult.cityId, 10);

  if (isNaN(cityId)) {
    notFound();
  }

  const cityData = await getCityData(cityId);

  if (!cityData) {
    notFound();
  }

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
                <div className="rounded-lg overflow-hidden">
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
                    <Eventcard
                      key={event.id}
                      id={event.id}
                      title={event.title}
                      series={event.series}
                      imageUrl={event.imageUrl}
                      date={event.date}
                      city={event.city}
                      cityId={cityData.city.id}
                      styles={event.styles}
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
                      id={user.id}
                      displayName={user.displayName}
                      username={user.username}
                      image={user.image}
                      styles={user.styles}
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
