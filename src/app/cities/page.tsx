import { AppNavbar } from "@/components/AppNavbar";
import { getAllCities } from "@/db/queries/event";
import { CityCard } from "@/components/CityCard";

export default async function CitiesPage() {
  const cities = await getAllCities();

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col items-center justify-center">
        <h1 className="!text-[60px] mt-5 mb-12">Cities</h1>

        {cities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-10">
            {cities.map((city) => (
              <CityCard
                key={city.id}
                city={city}
                href={city.slug ? `/cities/${city.slug}` : `/cities/${city.id}`}
              />
            ))}
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
