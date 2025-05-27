export interface CitySearchItem {
  id: number;
  name: string;
  countryCode: string;
  region: string;
  population: number;
}

export interface City {
  id: number;
  name: string;
  countryCode: string;
  country: string;
  region: string;
  regionCode: string;
  latitude: number;
  longitude: number;
  population: number;
  timezone: string;
  wikiDataId?: string;
  type?: string;
  elevationMeters?: number;
  deleted?: boolean;
}
