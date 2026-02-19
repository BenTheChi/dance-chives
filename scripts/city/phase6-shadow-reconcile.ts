#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import driver from "../../src/db/driver";
import { prisma } from "../../src/lib/primsa";
import { cityAutofixLowRisk } from "../../src/lib/config";

interface Neo4jCityRow {
  id: string;
  countryCode: string;
  region: string;
  timezone: string;
}

interface PostgresCityRow {
  id: string;
  countryCode: string;
  region: string | null;
  timezone: string;
}

interface ReconcileReport {
  environment: string;
  createdAt: string;
  applyFixes: boolean;
  comparedCities: number;
  lowRiskMismatches: Array<{
    cityId: string;
    neo4j: { countryCode: string; region: string; timezone: string };
    postgres: { countryCode: string; region: string; timezone: string };
  }>;
  fixedCount: number;
  missingInPostgres: string[];
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
  return path.join(dir, `phase6-shadow-reconcile-${environment}-${timestamp}.json`);
};

async function main() {
  const environment = getEnvironment();
  const applyFixes = process.argv.includes("--apply") || cityAutofixLowRisk;
  const report: ReconcileReport = {
    environment,
    createdAt: new Date().toISOString(),
    applyFixes,
    comparedCities: 0,
    lowRiskMismatches: [],
    fixedCount: 0,
    missingInPostgres: [],
  };

  try {
    const neo4jSession = driver.session();
    const neo4jResult = await neo4jSession.run(
      `
      MATCH (c:City)
      RETURN
        c.id as id,
        c.countryCode as countryCode,
        c.region as region,
        c.timezone as timezone
      `
    );
    await neo4jSession.close();

    const neo4jCities = neo4jResult.records
      .map((record) => ({
        id: String(record.get("id") || ""),
        countryCode: String(record.get("countryCode") || ""),
        region: String(record.get("region") || ""),
        timezone: String(record.get("timezone") || ""),
      }))
      .filter((row) => row.id) as Neo4jCityRow[];

    const postgresRows = await prisma.$queryRaw<PostgresCityRow[]>`
      SELECT "id", "countryCode", "region", "timezone"
      FROM "cities"
    `;
    const postgresById = new Map(postgresRows.map((row) => [row.id, row]));

    for (const neo4jCity of neo4jCities) {
      const postgresCity = postgresById.get(neo4jCity.id);
      if (!postgresCity) {
        report.missingInPostgres.push(neo4jCity.id);
        continue;
      }

      report.comparedCities += 1;
      const region = postgresCity.region || "";
      const hasMismatch =
        neo4jCity.countryCode !== postgresCity.countryCode ||
        neo4jCity.region !== region ||
        neo4jCity.timezone !== postgresCity.timezone;

      if (!hasMismatch) {
        continue;
      }

      report.lowRiskMismatches.push({
        cityId: neo4jCity.id,
        neo4j: {
          countryCode: neo4jCity.countryCode,
          region: neo4jCity.region,
          timezone: neo4jCity.timezone,
        },
        postgres: {
          countryCode: postgresCity.countryCode,
          region,
          timezone: postgresCity.timezone,
        },
      });

      if (applyFixes) {
        const patchedCountryCode =
          neo4jCity.countryCode || postgresCity.countryCode;
        const patchedRegion = neo4jCity.region || region;
        const patchedTimezone = neo4jCity.timezone || postgresCity.timezone;

        await prisma.$executeRaw`
          UPDATE "cities"
          SET
            "countryCode" = ${patchedCountryCode},
            "region" = ${patchedRegion || null},
            "timezone" = ${patchedTimezone},
            "updatedAt" = NOW()
          WHERE "id" = ${neo4jCity.id}
        `;
        report.fixedCount += 1;
      }
    }

    const outputFile = await reportOutputPath(environment);
    await fs.writeFile(outputFile, JSON.stringify(report, null, 2), "utf8");

    console.log("\n[phase6-shadow-reconcile] Done");
    console.log(`- environment: ${environment}`);
    console.log(`- compared cities: ${report.comparedCities}`);
    console.log(`- low-risk mismatches: ${report.lowRiskMismatches.length}`);
    console.log(`- fixes applied: ${report.fixedCount}`);
    console.log(`- missing in postgres: ${report.missingInPostgres.length}`);
    console.log(`- report: ${outputFile}\n`);
  } catch (error) {
    console.error("[phase6-shadow-reconcile] Failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await driver.close();
  }
}

void main();
