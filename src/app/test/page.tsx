"use client";

import { DebouncedSearchSelect } from "@/components/DebouncedSearchSelect";
import { CitySearchItem } from "@/types/city";
import { useState } from "react";

//Check for logged in user here.  If they're not logged in redirect them to the login page.
export default function TestPage() {
  const [search, setSearch] = useState<CitySearchItem | null>(null);

  async function getCitySearchItems(
    keyword: string
  ): Promise<CitySearchItem[]> {
    return fetch(
      `http://geodb-free-service.wirefreethought.com/v1/geo/places?limit=10&sort=population&types=CITY&namePrefix=${keyword}`
    )
      .then((response) => {
        if (!response.ok) {
          console.error("Failed to fetch cities", response.statusText);
          return [];
        }
        return response.json();
      })
      .then((data) =>
        data.data
          .map((city: any) => ({
            id: city.id,
            name: city.name,
            region: city.region,
            countryCode: city.countryCode,
            population: city.population,
          }))
          .reverse()
      )
      .catch((error) => {
        console.error(error);
        return [];
      });
  }

  return (
    <>
      <header>Test Page</header>
      <main>
        <form>
          <DebouncedSearchSelect<CitySearchItem>
            onSearch={getCitySearchItems}
            placeholder="Search..."
            getDisplayValue={(item: CitySearchItem) => {
              return item.name + ", " + item.region;
            }}
            getItemId={(item) => item.id}
            onChange={(value) => setSearch(value)}
            value={search}
            name="Cities"
          />
        </form>
      </main>
    </>
  );
}
