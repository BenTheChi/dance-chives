#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import driver from "../../src/db/driver";
import { prisma } from "../../src/lib/primsa";
import {
  isLikelyGooglePlaceId,
  resolveGooglePlaceCity,
  upsertCityInPostgres,
} from "../../src/db/queries/city";
import { SEED_CITIES } from "../../prisma/seed-cities";
import { City } from "../../src/types/city";

interface Neo4jCityRow {
  id: string;
  name: string;
  countryCode: string;
  region: string;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface NormalizeReport {
  environment: string;
  startedAt: string;
  finishedAt?: string;
  deletedInvalidCities: number;
  syncedFromNeo4j: number;
  seededCanonicalCities: number;
  nullifiedEventCardCityRefs: number;
  nullifiedUserCardCityRefs: number;
}

const getEnvironment = (): "development" | "staging" | "production" => {
  const appEnv = process.env.APP_ENV;
  const nodeEnv = process.env.NODE_ENV;
  if (appEnv === "staging" || nodeEnv === "staging") {
    return "staging";
  }
  if (appEnv === "production" || nodeEnv === "production") {
    return "production";
  }
  return "development";
};

const reportOutputPath = async (environment: string): Promise<string> => {
  const dir = path.join(process.cwd(), "scripts", "city", "reports");
  await fs.mkdir(dir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(dir, `phase5-normalize-${environment}-${timestamp}.json`);
};

const loadNeo4jCities = async (): Promise<Neo4jCityRow[]> => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (c:City)
      RETURN
        c.id as id,
        c.name as name,
        c.countryCode as countryCode,
        c.region as region,
        c.timezone as timezone,
        c.latitude as latitude,
        c.longitude as longitude
      `
    );

    return result.records.map((record) => ({
      id: String(record.get("id") || ""),
      name: String(record.get("name") || ""),
      countryCode: String(record.get("countryCode") || ""),
      region: String(record.get("region") || ""),
      timezone: record.get("timezone") || null,
      latitude:
        record.get("latitude") === null ? null : Number(record.get("latitude")),
      longitude:
        record.get("longitude") === null
          ? null
          : Number(record.get("longitude")),
    }));
  } finally {
    await session.close();
  }
};

const resolveRowToCity = async (row: Neo4jCityRow): Promise<City | null> => {
  if (!row.id || !isLikelyGooglePlaceId(row.id)) {
    return null;
  }

  const hasCoreMetadata =
    !!row.name &&
    !!row.countryCode &&
    !!row.timezone &&
    row.latitude !== null &&
    row.longitude !== null;

  if (hasCoreMetadata) {
    return {
      id: row.id,
      name: row.name,
      countryCode: row.countryCode,
      region: row.region || "",
      timezone: row.timezone || "UTC",
      latitude: row.latitude as number,
      longitude: row.longitude as number,
    };
  }

  return resolveGooglePlaceCity(row.id);
};

async function main() {
  const environment = getEnvironment();
  if (environment === "production") {
    throw new Error(
      "phase5-normalize-dev must not run against production environment"
    );
  }

  const report: NormalizeReport = {
    environment,
    startedAt: new Date().toISOString(),
    deletedInvalidCities: 0,
    syncedFromNeo4j: 0,
    seededCanonicalCities: 0,
    nullifiedEventCardCityRefs: 0,
    nullifiedUserCardCityRefs: 0,
  };

  try {
    console.log(`\n[phase5-normalize] Starting (${environment})...`);

    const deleted = await prisma.$executeRaw`
      DELETE FROM "cities"
      WHERE "id" !~ '^[A-Za-z0-9_-]{10,}$'
    `;
    report.deletedInvalidCities = Number(deleted || 0);

    const neo4jCities = await loadNeo4jCities();
    for (const row of neo4jCities) {
      const city = await resolveRowToCity(row);
      if (!city) {
        continue;
      }
      await upsertCityInPostgres(city);
      report.syncedFromNeo4j += 1;
    }

    for (const city of SEED_CITIES) {
      await upsertCityInPostgres(city);
      report.seededCanonicalCities += 1;
    }

    const nullifiedEventRows = await prisma.$executeRaw`
      UPDATE "event_cards"
      SET
        "cityId" = NULL,
        "cityName" = NULL
      WHERE "cityId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "cities" c WHERE c."id" = "event_cards"."cityId"
        )
    `;
    report.nullifiedEventCardCityRefs = Number(nullifiedEventRows || 0);

    const nullifiedUserRows = await prisma.$executeRaw`
      UPDATE "user_cards"
      SET
        "cityId" = NULL,
        "cityName" = NULL
      WHERE "cityId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "cities" c WHERE c."id" = "user_cards"."cityId"
        )
    `;
    report.nullifiedUserCardCityRefs = Number(nullifiedUserRows || 0);

    report.finishedAt = new Date().toISOString();
    const outputFile = await reportOutputPath(environment);
    await fs.writeFile(outputFile, JSON.stringify(report, null, 2), "utf8");

    console.log("[phase5-normalize] Done");
    console.log(`- deleted invalid city ids: ${report.deletedInvalidCities}`);
    console.log(`- synced from neo4j: ${report.syncedFromNeo4j}`);
    console.log(`- canonical seed cities upserted: ${report.seededCanonicalCities}`);
    console.log(
      `- nullified event_card city refs: ${report.nullifiedEventCardCityRefs}`
    );
    console.log(
      `- nullified user_card city refs: ${report.nullifiedUserCardCityRefs}`
    );
    console.log(`- report: ${outputFile}\n`);
  } catch (error) {
    console.error("[phase5-normalize] Failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await driver.close();
  }
}

void main();
