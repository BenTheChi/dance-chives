#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import driver from "../../src/db/driver";
import { prisma } from "../../src/lib/primsa";
import { isLikelyGooglePlaceId } from "../../src/db/queries/city";

interface AuditReport {
  environment: string;
  createdAt: string;
  neo4jCityCount: number;
  postgresCityCount: number;
  missingInPostgres: string[];
  unresolvedInPostgres: string[];
  referencedButMissing: Array<{
    cityId: string;
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

const reportOutputPath = async (environment: string): Promise<string> => {
  const dir = path.join(process.cwd(), "scripts", "city", "reports");
  await fs.mkdir(dir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(dir, `phase2-audit-${environment}-${timestamp}.json`);
};

async function main() {
  const environment = getEnvironment();
  const report: AuditReport = {
    environment,
    createdAt: new Date().toISOString(),
    neo4jCityCount: 0,
    postgresCityCount: 0,
    missingInPostgres: [],
    unresolvedInPostgres: [],
    referencedButMissing: [],
  };

  try {
    const neo4jSession = driver.session();
    const neo4jCitiesResult = await neo4jSession.run(
      `MATCH (c:City) RETURN DISTINCT c.id as id`
    );
    const neo4jIds = neo4jCitiesResult.records
      .map((record) => String(record.get("id") || ""))
      .filter(Boolean);
    report.neo4jCityCount = neo4jIds.length;

    const pgRows = await prisma.$queryRaw<
      Array<{
        id: string;
        timezone: string | null;
        latitude: number | null;
        longitude: number | null;
      }>
    >`
      SELECT "id", "timezone", "latitude", "longitude"
      FROM "cities"
    `;
    report.postgresCityCount = pgRows.length;

    const pgIds = new Set(pgRows.map((row) => row.id));
    report.missingInPostgres = neo4jIds.filter((id) => !pgIds.has(id));

    report.unresolvedInPostgres = pgRows
      .filter(
        (row) =>
          !isLikelyGooglePlaceId(row.id) ||
          !row.timezone ||
          row.latitude === null ||
          row.longitude === null
      )
      .map((row) => row.id);

    const referencedResult = await neo4jSession.run(
      `
      MATCH (c:City)
      OPTIONAL MATCH (e:Event)-[:IN]->(c)
      WITH c, count(DISTINCT e) as eventRefs
      OPTIONAL MATCH (u:User)-[:LOCATED_IN]->(c)
      RETURN c.id as id, eventRefs as eventRefs, count(DISTINCT u) as userRefs
      `
    );

    report.referencedButMissing = referencedResult.records
      .map((record) => ({
        cityId: String(record.get("id") || ""),
        eventRefs: Number(record.get("eventRefs") || 0),
        userRefs: Number(record.get("userRefs") || 0),
      }))
      .filter((item) => item.cityId && !pgIds.has(item.cityId))
      .sort((a, b) => b.eventRefs + b.userRefs - (a.eventRefs + a.userRefs));

    await neo4jSession.close();

    const outputFile = await reportOutputPath(environment);
    await fs.writeFile(outputFile, JSON.stringify(report, null, 2), "utf8");

    console.log("\n[phase2-audit] Snapshot complete");
    console.log(`- neo4j city count: ${report.neo4jCityCount}`);
    console.log(`- postgres city count: ${report.postgresCityCount}`);
    console.log(`- missing in postgres: ${report.missingInPostgres.length}`);
    console.log(`- unresolved in postgres: ${report.unresolvedInPostgres.length}`);
    console.log(
      `- referenced missing in postgres: ${report.referencedButMissing.length}`
    );
    console.log(`- report: ${outputFile}\n`);
  } catch (error) {
    console.error("[phase2-audit] Failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await driver.close();
  }
}

void main();
