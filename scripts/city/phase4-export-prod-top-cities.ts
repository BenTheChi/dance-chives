#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../../src/lib/primsa";

type TopCityRow = {
  id: string;
  slug: string;
  name: string;
  countryCode: string;
  region: string | null;
  timezone: string;
  latitude: number;
  longitude: number;
  refs: number;
};

async function main() {
  try {
    const rows = await prisma.$queryRaw<TopCityRow[]>`
      SELECT
        c."id",
        c."slug",
        c."name",
        c."countryCode",
        c."region",
        c."timezone",
        c."latitude",
        c."longitude",
        (COALESCE(ec.refs, 0) + COALESCE(uc.refs, 0))::integer AS refs
      FROM "cities" c
      LEFT JOIN (
        SELECT "cityId", count(*)::integer AS refs
        FROM "event_cards"
        WHERE "cityId" IS NOT NULL
        GROUP BY "cityId"
      ) ec ON ec."cityId" = c."id"
      LEFT JOIN (
        SELECT "cityId", count(*)::integer AS refs
        FROM "user_cards"
        WHERE "cityId" IS NOT NULL
        GROUP BY "cityId"
      ) uc ON uc."cityId" = c."id"
      ORDER BY refs DESC, c."name" ASC
      LIMIT 3
    `;

    const output = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      countryCode: row.countryCode,
      region: row.region || "",
      timezone: row.timezone,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      refs: Number(row.refs || 0),
    }));

    const dir = path.join(process.cwd(), "scripts", "city", "reports");
    await fs.mkdir(dir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const reportPath = path.join(
      dir,
      `phase4-top-prod-cities-${timestamp}.json`
    );
    await fs.writeFile(reportPath, JSON.stringify(output, null, 2), "utf8");

    console.log("\n[phase4-export] Top production seed candidates:");
    console.log(JSON.stringify(output, null, 2));
    console.log(`\n[phase4-export] Report written: ${reportPath}\n`);
  } catch (error) {
    console.error("[phase4-export] Failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
