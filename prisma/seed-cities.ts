import { City } from "../src/types/city";

// Phase4 canonical seed cities.
// These are legitimate Google Places city place_ids and are intended to be
// replaced by production top-referenced cities via phase4 refresh tooling.
export const SEED_CITIES: City[] = [
  {
    id: "ChIJOwg_06VPwokRYv534QaPC8g",
    name: "New York",
    countryCode: "US",
    region: "NY",
    timezone: "America/New_York",
    latitude: 40.7127753,
    longitude: -74.0059728,
  },
  {
    id: "ChIJVTPpYqBvqkARlBKGEkAs8BY",
    name: "Seattle",
    countryCode: "US",
    region: "WA",
    timezone: "America/Los_Angeles",
    latitude: 47.6061389,
    longitude: -122.3328481,
  },
  {
    id: "ChIJE9on3F3HwoAR9AhGJW_fL-I",
    name: "Los Angeles",
    countryCode: "US",
    region: "CA",
    timezone: "America/Los_Angeles",
    latitude: 34.0549076,
    longitude: -118.242643,
  },
];

export const SEED_CITY_BY_NAME = {
  newYork: SEED_CITIES[0],
  seattle: SEED_CITIES[1],
  losAngeles: SEED_CITIES[2],
} as const;
