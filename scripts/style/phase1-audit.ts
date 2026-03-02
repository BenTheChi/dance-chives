#!/usr/bin/env tsx

import driver from "../../src/db/driver";
import { DANCE_STYLES } from "../../src/lib/utils/dance-styles";

type StyleRow = {
  name: string;
  relCount: number;
};

function styleKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

async function main() {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (s:Style)
      OPTIONAL MATCH (s)<-[r:STYLE]-()
      RETURN s.name AS name, count(r) AS relCount
      ORDER BY toLower(trim(s.name)), s.name
      `
    );

    const rows: StyleRow[] = result.records.map((record) => ({
      name: String(record.get("name")),
      relCount: Number(record.get("relCount")),
    }));

    const canonicalByKey = new Map<string, string>(
      DANCE_STYLES.map((style) => [styleKey(style), style])
    );

    const canonicalExact: StyleRow[] = [];
    const caseVariants: Array<StyleRow & { target: string }> = [];
    const unknown: StyleRow[] = [];

    for (const row of rows) {
      const key = styleKey(row.name);
      const target = canonicalByKey.get(key);
      if (!target) {
        unknown.push(row);
        continue;
      }
      if (row.name === target) {
        canonicalExact.push(row);
      } else {
        caseVariants.push({ ...row, target });
      }
    }

    const totals = {
      styleNodes: rows.length,
      canonicalExactNodes: canonicalExact.length,
      caseVariantNodes: caseVariants.length,
      unknownNodes: unknown.length,
      totalStyleRelationships: rows.reduce((sum, row) => sum + row.relCount, 0),
      relsOnCanonicalExact: canonicalExact.reduce(
        (sum, row) => sum + row.relCount,
        0
      ),
      relsOnCaseVariants: caseVariants.reduce((sum, row) => sum + row.relCount, 0),
      relsOnUnknown: unknown.reduce((sum, row) => sum + row.relCount, 0),
    };

    const unknownWithRelationships = unknown.filter((row) => row.relCount > 0);

    console.log("[style:phase1:audit] Summary");
    console.log(JSON.stringify(totals, null, 2));

    console.log("\n[style:phase1:audit] Variant nodes -> canonical target");
    for (const row of caseVariants) {
      console.log(
        `- ${row.name} -> ${row.target} (relationships=${row.relCount})`
      );
    }

    console.log("\n[style:phase1:audit] Unknown nodes");
    if (unknown.length === 0) {
      console.log("- none");
    } else {
      for (const row of unknown) {
        console.log(`- ${row.name} (relationships=${row.relCount})`);
      }
    }

    if (unknownWithRelationships.length > 0) {
      console.error(
        "\n[style:phase1:audit] ERROR: Unknown styles have relationships and must be resolved before migration."
      );
      process.exitCode = 1;
      return;
    }
  } finally {
    await session.close();
  }
}

main()
  .catch((error) => {
    console.error("[style:phase1:audit] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await driver.close();
  });
