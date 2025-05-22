"use client";

import { DebouncedSearchSelect } from "@/components/DebouncedSearchSelect";
import { useState } from "react";

type SearchItem = {
  value: string;
  label: string;
  sublabel?: string;
  abbr?: string;
  timezone?: string;
};

//Check for logged in user here.  If they're not logged in redirect them to the login page.
export default function TestPage() {
  const [search, setSearch] = useState("");

  function getCities(keyword: string): Promise<SearchItem[]> {
    //Do a mock fetch of cities from here

    const cities = [
      {
        name: "New York",
        label: "New York",
        value: "NY",
        sublabel: "USA",
        abbr: "NY",
        timezone: "America/New_York",
      },
      {
        name: "Los Angeles",
        label: "Los Angeles",
        value: "LA",
        sublabel: "USA",
        abbr: "LA",
        timezone: "America/Los_Angeles",
      },
      {
        name: "Chicago",
        label: "Chicago",
        value: "CHI",
        sublabel: "USA",
        abbr: "CHI",
        timezone: "America/Chicago",
      },
      {
        name: "London",
        label: "London",
        value: "LON",
        sublabel: "UK",
        abbr: "LON",
        timezone: "Europe/London",
      },
      {
        name: "Paris",
        label: "Paris",
        value: "PAR",
        sublabel: "France",
        abbr: "PAR",
        timezone: "Europe/Paris",
      },
    ];

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          cities.filter((city) =>
            city.label.toLowerCase().includes(keyword.toLowerCase())
          )
        );
      }, 3000);
    });
  }

  return (
    <>
      <header>Test Page</header>
      <main>
        <form>
          <DebouncedSearchSelect
            onSearch={getCities}
            placeholder="Search..."
            onChange={(value) => setSearch(value)}
            value={search}
            name="Cities"
          />
        </form>
      </main>
    </>
  );
}
