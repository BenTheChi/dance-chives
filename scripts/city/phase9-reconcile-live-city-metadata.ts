#!/usr/bin/env tsx

import driver from "../../src/db/driver";
import { prisma } from "../../src/lib/primsa";

type CanonicalCity = {
  id: string;
  name: string;
  region: string;
  countryCode: string;
  timezone: string;
  latitude: number;
  longitude: number;
  slug: string;
};

type Neo4jCity = {
  id: string;
  name: string;
  region: string;
  countryCode: string;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  slug: string;
};

const APPLY = process.argv.includes("--apply");
const COORD_EPSILON = 0.000001;
const PREVIEW_LIMIT = 25;

function normalizeText(value: string | null | undefined): string {
  return (value || "").trim();
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function sameNumber(a: number | null, b: number | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return Math.abs(a - b) <= COORD_EPSILON;
}

function buildCanonicalCityMap(rows: CanonicalCity[]): Map<string, CanonicalCity> {
  return new Map(rows.map((city) => [city.id, city]));
}

async function loadCanonicalCitiesFromPostgres(): Promise<CanonicalCity[]> {
  const rows = await prisma.city.findMany({
    select: {
      id: true,
      name: true,
      region: true,
      countryCode: true,
      timezone: true,
      latitude: true,
      longitude: true,
      slug: true,
    },
    orderBy: { name: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    name: normalizeText(row.name),
    region: normalizeText(row.region),
    countryCode: normalizeText(row.countryCode).toUpperCase(),
    timezone: normalizeText(row.timezone),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    slug: normalizeText(row.slug),
  }));
}

async function loadCitiesFromNeo4j(): Promise<Map<string, Neo4jCity>> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (c:City)
      RETURN
        c.id AS id,
        c.name AS name,
        c.region AS region,
        c.countryCode AS countryCode,
        c.timezone AS timezone,
        c.latitude AS latitude,
        c.longitude AS longitude,
        c.slug AS slug
      `
    );

    const rows = result.records.map((record) => {
      const id = normalizeText(record.get("id"));
      return [
        id,
        {
          id,
          name: normalizeText(record.get("name")),
          region: normalizeText(record.get("region")),
          countryCode: normalizeText(record.get("countryCode")).toUpperCase(),
          timezone: normalizeText(record.get("timezone")),
          latitude: toNumberOrNull(record.get("latitude")),
          longitude: toNumberOrNull(record.get("longitude")),
          slug: normalizeText(record.get("slug")),
        } as Neo4jCity,
      ] as const;
    });

    return new Map(rows);
  } finally {
    await session.close();
  }
}

async function reconcileNeo4jCities(
  canonicalCities: CanonicalCity[],
  neo4jCitiesById: Map<string, Neo4jCity>
) {
  const missingInNeo4j: CanonicalCity[] = [];
  const mismatched: Array<{
    id: string;
    fields: string[];
    canonical: CanonicalCity;
    current: Neo4jCity;
  }> = [];

  for (const canonical of canonicalCities) {
    const current = neo4jCitiesById.get(canonical.id);
    if (!current) {
      missingInNeo4j.push(canonical);
      continue;
    }

    const fields: string[] = [];
    if (current.name !== canonical.name) fields.push("name");
    if (current.region !== canonical.region) fields.push("region");
    if (current.countryCode !== canonical.countryCode) fields.push("countryCode");
    if (current.timezone !== canonical.timezone) fields.push("timezone");
    if (current.slug !== canonical.slug) fields.push("slug");
    if (!sameNumber(current.latitude, canonical.latitude)) fields.push("latitude");
    if (!sameNumber(current.longitude, canonical.longitude)) fields.push("longitude");

    if (fields.length > 0) {
      mismatched.push({
        id: canonical.id,
        fields,
        canonical,
        current,
      });
    }
  }

  if (!APPLY) {
    return { missingInNeo4j, mismatched, applied: 0 };
  }

  const session = driver.session();
  let applied = 0;
  try {
    for (const canonical of missingInNeo4j) {
      await session.run(
        `
        MERGE (c:City {id: $id})
        SET c.name = $name,
            c.region = $region,
            c.countryCode = $countryCode,
            c.timezone = $timezone,
            c.latitude = $latitude,
            c.longitude = $longitude,
            c.slug = $slug
        `,
        canonical
      );
      applied += 1;
    }

    for (const diff of mismatched) {
      await session.run(
        `
        MERGE (c:City {id: $id})
        SET c.name = $name,
            c.region = $region,
            c.countryCode = $countryCode,
            c.timezone = $timezone,
            c.latitude = $latitude,
            c.longitude = $longitude,
            c.slug = $slug
        `,
        diff.canonical
      );
      applied += 1;
    }

    return { missingInNeo4j, mismatched, applied };
  } finally {
    await session.close();
  }
}

async function reconcileEventCards(canonicalCityById: Map<string, CanonicalCity>) {
  const cards = await prisma.eventCard.findMany({
    where: { cityId: { not: null } },
    select: {
      eventId: true,
      title: true,
      cityId: true,
      cityName: true,
      region: true,
      countryCode: true,
    },
  });

  const missingCanonicalCity: string[] = [];
  const mismatched: Array<{
    eventId: string;
    cityId: string;
    title: string;
    fields: string[];
    current: {
      cityName: string;
      region: string;
      countryCode: string;
    };
    canonical: CanonicalCity;
  }> = [];

  for (const card of cards) {
    const cityId = normalizeText(card.cityId);
    if (!cityId) continue;

    const canonical = canonicalCityById.get(cityId);
    if (!canonical) {
      missingCanonicalCity.push(cityId);
      continue;
    }

    const currentCityName = normalizeText(card.cityName);
    const currentRegion = normalizeText(card.region);
    const currentCountryCode = normalizeText(card.countryCode).toUpperCase();

    const fields: string[] = [];
    if (currentCityName !== canonical.name) fields.push("cityName");
    if (currentRegion !== canonical.region) fields.push("region");
    if (currentCountryCode !== canonical.countryCode) fields.push("countryCode");

    if (fields.length > 0) {
      mismatched.push({
        eventId: card.eventId,
        cityId,
        title: card.title,
        fields,
        current: {
          cityName: currentCityName,
          region: currentRegion,
          countryCode: currentCountryCode,
        },
        canonical,
      });
    }
  }

  if (!APPLY) {
    return {
      scanned: cards.length,
      missingCanonicalCityIds: Array.from(new Set(missingCanonicalCity)).sort(),
      mismatched,
      applied: 0,
    };
  }

  let applied = 0;
  for (const diff of mismatched) {
    await prisma.eventCard.update({
      where: { eventId: diff.eventId },
      data: {
        cityName: diff.canonical.name,
        region: diff.canonical.region,
        countryCode: diff.canonical.countryCode,
      },
    });
    applied += 1;
  }

  return {
    scanned: cards.length,
    missingCanonicalCityIds: Array.from(new Set(missingCanonicalCity)).sort(),
    mismatched,
    applied,
  };
}

async function run() {
  console.log(
    `[phase9-reconcile-live-city-metadata] mode=${APPLY ? "apply" : "dry-run"}`
  );

  const canonicalCities = await loadCanonicalCitiesFromPostgres();
  const canonicalCityById = buildCanonicalCityMap(canonicalCities);
  const neo4jCitiesById = await loadCitiesFromNeo4j();

  const neo4jResult = await reconcileNeo4jCities(canonicalCities, neo4jCitiesById);
  const eventCardResult = await reconcileEventCards(canonicalCityById);

  console.log("\nNeo4j reconciliation summary:");
  console.log(`- canonical cities (Postgres): ${canonicalCities.length}`);
  console.log(`- existing Neo4j cities: ${neo4jCitiesById.size}`);
  console.log(`- missing in Neo4j: ${neo4jResult.missingInNeo4j.length}`);
  console.log(`- mismatched in Neo4j: ${neo4jResult.mismatched.length}`);
  console.log(`- Neo4j rows ${APPLY ? "updated/created" : "to update/create"}: ${neo4jResult.missingInNeo4j.length + neo4jResult.mismatched.length}`);

  if (neo4jResult.mismatched.length > 0) {
    console.log("\nNeo4j mismatch preview:");
    neo4jResult.mismatched.slice(0, PREVIEW_LIMIT).forEach((item) => {
      console.log(`- ${item.id}: ${item.fields.join(", ")}`);
    });
  }

  console.log("\nEventCard reconciliation summary:");
  console.log(`- scanned event_cards: ${eventCardResult.scanned}`);
  console.log(`- mismatched event_cards: ${eventCardResult.mismatched.length}`);
  console.log(
    `- event_cards missing canonical city: ${eventCardResult.missingCanonicalCityIds.length}`
  );
  console.log(
    `- EventCard rows ${APPLY ? "updated" : "to update"}: ${eventCardResult.mismatched.length}`
  );

  if (eventCardResult.mismatched.length > 0) {
    console.log("\nEventCard mismatch preview:");
    eventCardResult.mismatched.slice(0, PREVIEW_LIMIT).forEach((item) => {
      console.log(
        `- ${item.eventId} (${item.cityId}): ${item.fields.join(", ")}`
      );
    });
  }

  if (eventCardResult.missingCanonicalCityIds.length > 0) {
    console.log("\nEventCard cityIds missing canonical city (preview):");
    eventCardResult.missingCanonicalCityIds
      .slice(0, PREVIEW_LIMIT)
      .forEach((cityId) => console.log(`- ${cityId}`));
  }

  if (APPLY) {
    console.log("\nApply mode complete.");
    console.log(`- Neo4j rows updated/created: ${neo4jResult.applied}`);
    console.log(`- EventCard rows updated: ${eventCardResult.applied}`);
  } else {
    console.log("\nDry-run complete. Re-run with --apply to persist changes.");
  }
}

run()
  .catch((error) => {
    console.error("[phase9-reconcile-live-city-metadata] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await driver.close();
    await prisma.$disconnect();
  });
