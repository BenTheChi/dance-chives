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
import { City } from "../../src/types/city";

interface Neo4jCityRow {
  id: string;
  name: string;
  countryCode: string;
  region: string;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
  eventRefs: number;
  userRefs: number;
}

interface BackfillReport {
  environment: string;
  startedAt: string;
  finishedAt?: string;
  totalNeo4jCities: number;
  attemptedPlaceIds: number;
  resolvedCities: number;
  unresolvedCities: Array<{
    id: string;
    name: string;
    reason: string;
    eventRefs: number;
    userRefs: number;
  }>;
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

const loadNeo4jCities = async (): Promise<Neo4jCityRow[]> => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (c:City)
      OPTIONAL MATCH (e:Event)-[:IN]->(c)
      WITH c, count(DISTINCT e) as eventRefs
      OPTIONAL MATCH (u:User)-[:LOCATED_IN]->(c)
      RETURN
        c.id as id,
        c.name as name,
        c.countryCode as countryCode,
        c.region as region,
        c.timezone as timezone,
        c.latitude as latitude,
        c.longitude as longitude,
        eventRefs as eventRefs,
        count(DISTINCT u) as userRefs
      ORDER BY eventRefs DESC, userRefs DESC, c.name ASC
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
      eventRefs: Number(record.get("eventRefs") || 0),
      userRefs: Number(record.get("userRefs") || 0),
    }));
  } finally {
    await session.close();
  }
};

const resolveRowToCity = async (row: Neo4jCityRow): Promise<City> => {
  if (!isLikelyGooglePlaceId(row.id)) {
    throw new Error("invalid_place_id_format");
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

const reportOutputPath = async (
  environment: string,
  name: string
): Promise<string> => {
  const dir = path.join(process.cwd(), "scripts", "city", "reports");
  await fs.mkdir(dir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(dir, `${name}-${environment}-${timestamp}.json`);
};

async function main() {
  const environment = getEnvironment();
  const report: BackfillReport = {
    environment,
    startedAt: new Date().toISOString(),
    totalNeo4jCities: 0,
    attemptedPlaceIds: 0,
    resolvedCities: 0,
    unresolvedCities: [],
  };

  try {
    console.log(
      `\n[phase2-backfill] Starting city backfill (${environment})...\n`
    );
    const neo4jCities = await loadNeo4jCities();
    report.totalNeo4jCities = neo4jCities.length;

    const resolved: City[] = [];
    for (const row of neo4jCities) {
      if (!row.id) {
        report.unresolvedCities.push({
          id: "",
          name: row.name,
          reason: "missing_city_id",
          eventRefs: row.eventRefs,
          userRefs: row.userRefs,
        });
        continue;
      }

      if (!isLikelyGooglePlaceId(row.id)) {
        report.unresolvedCities.push({
          id: row.id,
          name: row.name,
          reason: "invalid_place_id_format",
          eventRefs: row.eventRefs,
          userRefs: row.userRefs,
        });
        continue;
      }

      report.attemptedPlaceIds += 1;
      try {
        resolved.push(await resolveRowToCity(row));
      } catch (error) {
        report.unresolvedCities.push({
          id: row.id,
          name: row.name,
          reason: error instanceof Error ? error.message : "resolve_failed",
          eventRefs: row.eventRefs,
          userRefs: row.userRefs,
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const city of resolved) {
        await upsertCityInPostgres(city, tx);
      }
    });

    report.resolvedCities = resolved.length;
    report.finishedAt = new Date().toISOString();

    const outputFile = await reportOutputPath(environment, "phase2-backfill");
    await fs.writeFile(outputFile, JSON.stringify(report, null, 2), "utf8");

    console.log("[phase2-backfill] Done");
    console.log(`- total Neo4j cities: ${report.totalNeo4jCities}`);
    console.log(`- attempted place_ids: ${report.attemptedPlaceIds}`);
    console.log(`- resolved/upserted: ${report.resolvedCities}`);
    console.log(`- unresolved: ${report.unresolvedCities.length}`);
    console.log(`- report: ${outputFile}\n`);
  } catch (error) {
    console.error("[phase2-backfill] Failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await driver.close();
  }
}

void main();
