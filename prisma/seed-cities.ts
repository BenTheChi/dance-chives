import { City } from "../src/types/city";

// Phase4 canonical seed cities.
// These are legitimate Google Places city place_ids and are intended to be
// replaced by production top-referenced cities via phase4 refresh tooling.
export const SEED_CITIES: City[] = [
  {
    id: "ChIJVTPokywQkFQRmtVEaUZlJRA",
    name: "Seattle",
    countryCode: "US",
    region: "WA",
    timezone: "America/Los_Angeles",
    latitude: 47.6061389,
    longitude: -122.3328481,
  },
  {
    id: "ChIJs0-pQ_FzhlQRi_OBm-qWkbs",
    name: "Vancouver",
    countryCode: "CA",
    region: "BC",
    timezone: "America/Vancouver",
    latitude: 49.2827291,
    longitude: -123.1207375,
  },
  {
    id: "ChIJpTvG15DL1IkRd8S0KlBVNTI",
    name: "Toronto",
    countryCode: "CA",
    region: "ON",
    timezone: "America/Toronto",
    latitude: 43.6548253,
    longitude: -79.388447,
  },
];

export const SEED_CITY_BY_NAME = {
  seattle: SEED_CITIES[0],
  vancouver: SEED_CITIES[1],
  toronto: SEED_CITIES[2],
} as const;
