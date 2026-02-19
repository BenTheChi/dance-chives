import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/primsa";
import { City } from "@/types/city";
import { generateCitySlug } from "@/lib/utils/city-slug";
import { getPlaceDetails, getTimezone } from "@/lib/google-places";
import { cityAutofixLowRisk } from "@/lib/config";

type QueryExecutor = Pick<PrismaClient, "$queryRaw"> | Prisma.TransactionClient;

interface CityRow {
  id: string;
  slug: string;
  name: string;
  countryCode: string;
  region: string | null;
  timezone: string;
  latitude: number;
  longitude: number;
}

const PLACE_ID_REGEX = /^[A-Za-z0-9_-]{10,}$/;

const normalizeCity = (row: CityRow): City => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  countryCode: row.countryCode,
  region: row.region || "",
  timezone: row.timezone,
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
});

const toCanonicalCityInput = (city: City): City => ({
  id: city.id.trim(),
  name: city.name.trim(),
  countryCode: city.countryCode.trim().toUpperCase(),
  region: city.region?.trim() || "",
  timezone: city.timezone?.trim(),
  latitude: city.latitude,
  longitude: city.longitude,
  slug: city.slug?.trim(),
});

export const isLikelyGooglePlaceId = (placeId?: string | null): boolean => {
  if (!placeId) {
    return false;
  }

  return PLACE_ID_REGEX.test(placeId.trim());
};

export const isResolvedCity = (city?: City | null): city is City => {
  if (!city) {
    return false;
  }

  return Boolean(
    city.id &&
      isLikelyGooglePlaceId(city.id) &&
      city.name &&
      city.countryCode &&
      city.timezone &&
      typeof city.latitude === "number" &&
      Number.isFinite(city.latitude) &&
      typeof city.longitude === "number" &&
      Number.isFinite(city.longitude)
  );
};

export async function getCityFromPostgres(placeId: string): Promise<City | null> {
  const rows = await prisma.$queryRaw<CityRow[]>`
    SELECT
      "id",
      "slug",
      "name",
      "countryCode",
      "region",
      "timezone",
      "latitude",
      "longitude"
    FROM "cities"
    WHERE "id" = ${placeId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return null;
  }

  return normalizeCity(rows[0]);
}

export async function upsertCityInPostgres(
  city: City,
  executor: QueryExecutor = prisma
): Promise<City> {
  if (!isResolvedCity(city)) {
    throw new Error("City must be a resolved Google Place before upsert");
  }

  const canonical = toCanonicalCityInput(city);
  const existingById = await executor.$queryRaw<Array<{ slug: string }>>`
    SELECT "slug"
    FROM "cities"
    WHERE "id" = ${canonical.id}
    LIMIT 1
  `;

  let rowSlug =
    existingById[0]?.slug || canonical.slug || generateCitySlug(canonical);

  if (!existingById[0]?.slug) {
    const slugConflict = await executor.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "cities"
      WHERE "slug" = ${rowSlug}
      LIMIT 1
    `;

    if (slugConflict.length > 0 && slugConflict[0].id !== canonical.id) {
      rowSlug = `${rowSlug}-${canonical.id.slice(-6).toLowerCase()}`;
    }
  }

  const rows = await executor.$queryRaw<CityRow[]>`
    INSERT INTO "cities" (
      "id",
      "slug",
      "name",
      "countryCode",
      "region",
      "timezone",
      "latitude",
      "longitude",
      "location",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${canonical.id},
      ${rowSlug},
      ${canonical.name},
      ${canonical.countryCode},
      ${canonical.region || null},
      ${canonical.timezone},
      ${canonical.latitude},
      ${canonical.longitude},
      ST_SetSRID(ST_MakePoint(${canonical.longitude}, ${canonical.latitude}), 4326)::geography,
      NOW(),
      NOW()
    )
    ON CONFLICT ("id")
    DO UPDATE SET
      "name" = EXCLUDED."name",
      "region" = EXCLUDED."region",
      "countryCode" = EXCLUDED."countryCode",
      "timezone" = EXCLUDED."timezone",
      "latitude" = EXCLUDED."latitude",
      "longitude" = EXCLUDED."longitude",
      "location" = EXCLUDED."location",
      "updatedAt" = NOW(),
      "slug" = "cities"."slug"
    RETURNING
      "id",
      "slug",
      "name",
      "countryCode",
      "region",
      "timezone",
      "latitude",
      "longitude"
  `;

  if (rows.length === 0) {
    throw new Error(`Failed to upsert city: ${canonical.id}`);
  }

  return normalizeCity(rows[0]);
}

export async function searchCitiesInPostgres(
  keyword: string,
  limit = 5
): Promise<City[]> {
  if (!keyword.trim()) {
    return [];
  }

  const safeLimit = Math.max(1, Math.min(limit, 25));

  const rows = await prisma.$queryRaw<CityRow[]>`
    SELECT
      "id",
      "slug",
      "name",
      "countryCode",
      "region",
      "timezone",
      "latitude",
      "longitude"
    FROM "cities"
    WHERE
      LOWER("name") LIKE CONCAT('%', LOWER(${keyword}), '%')
      OR LOWER(COALESCE("region", '')) LIKE CONCAT('%', LOWER(${keyword}), '%')
    ORDER BY
      GREATEST(
        similarity(LOWER("name"), LOWER(${keyword})),
        similarity(LOWER(COALESCE("region", '')), LOWER(${keyword}))
      ) DESC,
      "name" ASC
    LIMIT ${safeLimit}
  `;

  return rows.map(normalizeCity);
}

export async function nearestCitiesFromPostgres(
  latitude: number,
  longitude: number,
  limit = 10
): Promise<Array<City & { distanceMeters: number }>> {
  const safeLimit = Math.max(1, Math.min(limit, 25));

  const rows = await prisma.$queryRaw<Array<CityRow & { distanceMeters: number }>>`
    SELECT
      "id",
      "slug",
      "name",
      "countryCode",
      "region",
      "timezone",
      "latitude",
      "longitude",
      ST_Distance(
        "location",
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
      ) AS "distanceMeters"
    FROM "cities"
    WHERE "location" IS NOT NULL
    ORDER BY "distanceMeters" ASC
    LIMIT ${safeLimit}
  `;

  return rows.map((row) => ({
    ...normalizeCity(row),
    distanceMeters: Number(row.distanceMeters),
  }));
}

export async function resolveGooglePlaceCity(placeId: string): Promise<City> {
  if (!isLikelyGooglePlaceId(placeId)) {
    throw new Error(`City id is not a valid Google place_id: ${placeId}`);
  }

  const placeDetails = await getPlaceDetails(placeId);
  const timezoneResult = await getTimezone(
    placeDetails.geometry.location.lat,
    placeDetails.geometry.location.lng
  );

  const region =
    placeDetails.address_components.find((ac) =>
      ac.types.includes("administrative_area_level_1")
    )?.short_name || "";
  const countryCode =
    placeDetails.address_components.find((ac) => ac.types.includes("country"))
      ?.short_name || "";

  const city: City = {
    id: placeDetails.place_id,
    name: placeDetails.name || placeDetails.formatted_address,
    region,
    countryCode,
    timezone: timezoneResult.timeZoneId,
    latitude: placeDetails.geometry.location.lat,
    longitude: placeDetails.geometry.location.lng,
  };

  if (!isResolvedCity(city)) {
    throw new Error(`Google place does not resolve to a full city: ${placeId}`);
  }

  return city;
}

export async function resolveAndUpsertCityForWrite(city: City): Promise<City> {
  if (!isLikelyGooglePlaceId(city.id)) {
    throw new Error("City must use a Google place_id");
  }

  const existing = await getCityFromPostgres(city.id);
  if (existing && isResolvedCity(existing)) {
    if (
      cityAutofixLowRisk &&
      (existing.countryCode !== city.countryCode ||
        existing.region !== city.region ||
        existing.timezone !== city.timezone)
    ) {
      const autofixed = await upsertCityInPostgres({
        ...existing,
        countryCode: city.countryCode || existing.countryCode,
        region: city.region || existing.region,
        timezone: city.timezone || existing.timezone,
      });
      return autofixed;
    }
    return existing;
  }

  const googleResolved = await resolveGooglePlaceCity(city.id);
  return upsertCityInPostgres(googleResolved);
}

export async function requireCityFromPostgres(placeId: string): Promise<City> {
  const city = await getCityFromPostgres(placeId);
  if (!city || !isResolvedCity(city)) {
    throw new Error(
      `City ${placeId} is unresolved. Resolve and upsert in Postgres before write.`
    );
  }

  return city;
}
