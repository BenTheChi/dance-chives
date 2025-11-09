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
  region: string;
  population: number;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}
