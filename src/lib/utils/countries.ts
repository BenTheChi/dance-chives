/**
 * ISO 3166-1 alpha-2 country reference data.
 *
 * Deliberately a static in-repo table rather than a lookup through Google.
 * Country names came only from the Geocoding API before this, which meant a
 * disabled API silently degraded published events -- the fault that stranded
 * 163 events on the bare `unknown` city. Country names do not change often
 * enough to justify a paid network dependency on the publish path.
 *
 * Client-safe: no Prisma, no driver imports, so both server queries and React
 * components share one definition.
 *
 * Slugs are stable identifiers for a future `/country/{slug}` route and are
 * mirrored onto the (:Country) nodes, so treat a slug edit as a migration.
 * No lookup-by-slug helper exists yet — add one with the route that needs it
 * rather than carrying an unused export.
 */

export interface Country {
  /** ISO 3166-1 alpha-2, uppercase. The node key. */
  code: string;
  name: string;
  slug: string;
}

/**
 * Every country the corpus references today plus the common dance-scene
 * countries, so onboarding a new channel rarely needs a code change. Adding a
 * row here is safe and additive; the migration script MERGEs by code.
 */
export const COUNTRIES: readonly Country[] = [
  { code: "AR", name: "Argentina", slug: "argentina" },
  { code: "AT", name: "Austria", slug: "austria" },
  { code: "AU", name: "Australia", slug: "australia" },
  { code: "BD", name: "Bangladesh", slug: "bangladesh" },
  { code: "BE", name: "Belgium", slug: "belgium" },
  { code: "BG", name: "Bulgaria", slug: "bulgaria" },
  { code: "BR", name: "Brazil", slug: "brazil" },
  { code: "CA", name: "Canada", slug: "canada" },
  { code: "CH", name: "Switzerland", slug: "switzerland" },
  { code: "CL", name: "Chile", slug: "chile" },
  { code: "CN", name: "China", slug: "china" },
  { code: "CO", name: "Colombia", slug: "colombia" },
  { code: "CZ", name: "Czechia", slug: "czechia" },
  { code: "DE", name: "Germany", slug: "germany" },
  { code: "DK", name: "Denmark", slug: "denmark" },
  { code: "DO", name: "Dominican Republic", slug: "dominican-republic" },
  { code: "EE", name: "Estonia", slug: "estonia" },
  { code: "EG", name: "Egypt", slug: "egypt" },
  { code: "ES", name: "Spain", slug: "spain" },
  { code: "FI", name: "Finland", slug: "finland" },
  { code: "FR", name: "France", slug: "france" },
  { code: "GB", name: "United Kingdom", slug: "united-kingdom" },
  { code: "GR", name: "Greece", slug: "greece" },
  { code: "HK", name: "Hong Kong", slug: "hong-kong" },
  { code: "HR", name: "Croatia", slug: "croatia" },
  { code: "HU", name: "Hungary", slug: "hungary" },
  { code: "ID", name: "Indonesia", slug: "indonesia" },
  { code: "IE", name: "Ireland", slug: "ireland" },
  { code: "IL", name: "Israel", slug: "israel" },
  { code: "IN", name: "India", slug: "india" },
  { code: "IT", name: "Italy", slug: "italy" },
  { code: "JP", name: "Japan", slug: "japan" },
  { code: "KG", name: "Kyrgyzstan", slug: "kyrgyzstan" },
  { code: "KR", name: "South Korea", slug: "south-korea" },
  { code: "KZ", name: "Kazakhstan", slug: "kazakhstan" },
  { code: "LT", name: "Lithuania", slug: "lithuania" },
  { code: "LV", name: "Latvia", slug: "latvia" },
  { code: "MA", name: "Morocco", slug: "morocco" },
  { code: "MX", name: "Mexico", slug: "mexico" },
  { code: "MY", name: "Malaysia", slug: "malaysia" },
  { code: "NG", name: "Nigeria", slug: "nigeria" },
  { code: "NL", name: "Netherlands", slug: "netherlands" },
  { code: "NO", name: "Norway", slug: "norway" },
  { code: "NZ", name: "New Zealand", slug: "new-zealand" },
  { code: "PE", name: "Peru", slug: "peru" },
  { code: "PH", name: "Philippines", slug: "philippines" },
  { code: "PL", name: "Poland", slug: "poland" },
  { code: "PT", name: "Portugal", slug: "portugal" },
  { code: "RO", name: "Romania", slug: "romania" },
  { code: "RS", name: "Serbia", slug: "serbia" },
  { code: "RU", name: "Russia", slug: "russia" },
  { code: "SE", name: "Sweden", slug: "sweden" },
  { code: "SG", name: "Singapore", slug: "singapore" },
  { code: "SI", name: "Slovenia", slug: "slovenia" },
  { code: "SK", name: "Slovakia", slug: "slovakia" },
  { code: "SN", name: "Senegal", slug: "senegal" },
  { code: "TH", name: "Thailand", slug: "thailand" },
  { code: "TR", name: "Türkiye", slug: "turkiye" },
  { code: "TW", name: "Taiwan", slug: "taiwan" },
  { code: "TZ", name: "Tanzania", slug: "tanzania" },
  { code: "UA", name: "Ukraine", slug: "ukraine" },
  { code: "US", name: "United States", slug: "united-states" },
  { code: "UY", name: "Uruguay", slug: "uruguay" },
  { code: "VN", name: "Vietnam", slug: "vietnam" },
  { code: "ZA", name: "South Africa", slug: "south-africa" },
] as const;

const BY_CODE: ReadonlyMap<string, Country> = new Map(
  COUNTRIES.map((c) => [c.code, c])
);

/** Normalize any casing/whitespace to the canonical uppercase alpha-2 form. */
export const normalizeCountryCode = (code?: string | null): string =>
  (code || "").trim().toUpperCase();

export const isValidCountryCode = (code?: string | null): boolean =>
  BY_CODE.has(normalizeCountryCode(code));

export const getCountry = (code?: string | null): Country | null =>
  BY_CODE.get(normalizeCountryCode(code)) ?? null;

/**
 * Display name for a country code, falling back to the code itself so an
 * unknown code renders as "XX" rather than blank or "undefined".
 */
export const getCountryName = (code?: string | null): string =>
  getCountry(code)?.name ?? normalizeCountryCode(code);
