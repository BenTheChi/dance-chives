export interface CitySearchItem {
  id: string;
  name: string;
  countryCode: string;
  region: string;
}

export interface City {
  id: string;
  name: string;
  countryCode: string;
  region: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  slug?: string;
}
