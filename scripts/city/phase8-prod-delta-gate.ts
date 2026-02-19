#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import driver from "../../src/db/driver";
import { prisma } from "../../src/lib/primsa";
import { isLikelyGooglePlaceId } from "../../src/db/queries/city";

interface Neo4jCityRow {
  id: string;
  name: string;
  countryCode: string;
  region: string;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
}

interface PostgresCityRow {
  id: string;
  name: string;
  countryCode: string;
  region: string | null;
  timezone: string;
  latitude: number;
  longitude: number;
}

interface DeltaGateReport {
  environment: string;
  createdAt: string;
  pass: boolean;
  parity: {
    missingInPostgres: string[];
    missingInNeo4j: string[];
  };
  unresolvedPostgresCityIds: string[];
  highRiskMismatches: Array<{
    cityId: string;
    reasons: string[];
  }>;
  lowRiskMismatches: Array<{
    cityId: string;
    reasons: string[];
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

const reportOutputPath = async (): Promise<string> => {
  const dir = path.join(process.cwd(), "scripts", "city", "reports");
  await fs.mkdir(dir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(dir, `phase8-delta-gate-prod-${timestamp}.json`);
};

const nearlyEqual = (a?: number | null, b?: number | null): boolean => {
  if (a === null || a === undefined || b === null || b === undefined) {
    return false;
  }
  return Math.abs(Number(a) - Number(b)) <= 0.0001;
};

async function main() {
  const environment = getEnvironment();
  if (environment !== "production") {
    throw new Error(
      `phase8-prod-delta-gate must run in production context, received: ${environment}`
    );
  }

  const report: DeltaGateReport = {
    environment,
    createdAt: new Date().toISOString(),
    pass: false,
    parity: {
      missingInPostgres: [],
      missingInNeo4j: [],
    },
    unresolvedPostgresCityIds: [],
    highRiskMismatches: [],
    lowRiskMismatches: [],
  };

  try {
    const neo4jSession = driver.session();
    const neo4jResult = await neo4jSession.run(
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
    await neo4jSession.close();

    const neo4jCities = neo4jResult.records
      .map((record) => ({
        id: String(record.get("id") || ""),
        name: String(record.get("name") || ""),
        countryCode: String(record.get("countryCode") || ""),
        region: String(record.get("region") || ""),
        timezone: String(record.get("timezone") || ""),
        latitude:
          record.get("latitude") === null ? null : Number(record.get("latitude")),
        longitude:
          record.get("longitude") === null
            ? null
            : Number(record.get("longitude")),
      }))
      .filter((row) => row.id) as Neo4jCityRow[];

    const postgresCities = await prisma.$queryRaw<PostgresCityRow[]>`
      SELECT
        "id",
        "name",
        "countryCode",
        "region",
        "timezone",
        "latitude",
        "longitude"
      FROM "cities"
    `;

    const neo4jIds = new Set(neo4jCities.map((city) => city.id));
    const postgresIds = new Set(postgresCities.map((city) => city.id));

    report.parity.missingInPostgres = [...neo4jIds].filter(
      (id) => !postgresIds.has(id)
    );
    report.parity.missingInNeo4j = [...postgresIds].filter(
      (id) => !neo4jIds.has(id)
    );

    report.unresolvedPostgresCityIds = postgresCities
      .filter(
        (city) =>
          !isLikelyGooglePlaceId(city.id) ||
          !city.timezone ||
          city.latitude === null ||
          city.longitude === null
      )
      .map((city) => city.id);

    const postgresById = new Map(postgresCities.map((city) => [city.id, city]));

    for (const neo4jCity of neo4jCities) {
      const postgresCity = postgresById.get(neo4jCity.id);
      if (!postgresCity) {
        continue;
      }

      const highRiskReasons: string[] = [];
      if (
        neo4jCity.name &&
        postgresCity.name &&
        neo4jCity.name.trim().toLowerCase() !==
          postgresCity.name.trim().toLowerCase()
      ) {
        highRiskReasons.push("name");
      }

      if (highRiskReasons.length > 0) {
        report.highRiskMismatches.push({
          cityId: neo4jCity.id,
          reasons: highRiskReasons,
        });
      }

      const lowRiskReasons: string[] = [];
      if (!nearlyEqual(neo4jCity.latitude, postgresCity.latitude)) {
        lowRiskReasons.push("latitude");
      }
      if (!nearlyEqual(neo4jCity.longitude, postgresCity.longitude)) {
        lowRiskReasons.push("longitude");
      }
      if ((neo4jCity.countryCode || "") !== (postgresCity.countryCode || "")) {
        lowRiskReasons.push("countryCode");
      }
      if ((neo4jCity.region || "") !== (postgresCity.region || "")) {
        lowRiskReasons.push("region");
      }
      if ((neo4jCity.timezone || "") !== (postgresCity.timezone || "")) {
        lowRiskReasons.push("timezone");
      }
      if (lowRiskReasons.length > 0) {
        report.lowRiskMismatches.push({
          cityId: neo4jCity.id,
          reasons: lowRiskReasons,
        });
      }
    }

    report.pass =
      report.parity.missingInPostgres.length === 0 &&
      report.unresolvedPostgresCityIds.length === 0 &&
      report.highRiskMismatches.length === 0;

    const reportPath = await reportOutputPath();
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");

    console.log("\n[phase8-delta-gate] Production delta gate result");
    console.log(`- pass: ${report.pass}`);
    console.log(
      `- missing in postgres: ${report.parity.missingInPostgres.length}`
    );
    console.log(`- unresolved postgres: ${report.unresolvedPostgresCityIds.length}`);
    console.log(`- high-risk mismatches: ${report.highRiskMismatches.length}`);
    console.log(`- low-risk mismatches: ${report.lowRiskMismatches.length}`);
    console.log(`- report: ${reportPath}\n`);

    if (!report.pass) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("[phase8-delta-gate] Failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await driver.close();
  }
}

void main();
