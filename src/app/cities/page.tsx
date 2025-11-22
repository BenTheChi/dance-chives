import { AppNavbar } from "@/components/AppNavbar";
import { getAllCities } from "@/db/queries/competition";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default async function CitiesPage() {
  const cities = await getAllCities();

  return (
    <>
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Cities</h1>
        <p className="text-muted-foreground mb-8">
          Browse all cities and explore related events and users
        </p>

        {cities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {cities.map((city) => {
              const cityDisplay = city.region
                ? `${city.name}, ${city.region}`
                : city.name;
              return (
                <Card
                  key={city.id}
                  className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                >
                  <CardContent className="p-4 sm:p-6">
                    <Link href={`/cities/${city.id}`}>
                      <h3 className="font-semibold text-base sm:text-lg line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors">
                        {cityDisplay}
                      </h3>
                      {city.countryCode && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {city.countryCode}
                        </p>
                      )}
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No cities found in the database.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
