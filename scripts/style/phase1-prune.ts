#!/usr/bin/env tsx

import { createHash } from "crypto";
import driver from "../../src/db/driver";
import { DANCE_STYLES } from "../../src/lib/utils/dance-styles";

const APPLY = process.argv.includes("--apply");
const confirmIndex = process.argv.findIndex((arg) => arg === "--confirm");
const confirmToken =
  confirmIndex >= 0 && process.argv[confirmIndex + 1]
    ? process.argv[confirmIndex + 1]
    : null;

function styleKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function buildConfirmationToken(names: string[]): string {
  const seed = names.join("\n");
  return createHash("sha256").update(seed).digest("hex").slice(0, 12);
}

async function main() {
  const canonical = new Set<string>(DANCE_STYLES);
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (s:Style)
      WHERE NOT EXISTS { ()-[:STYLE]->(s) }
      RETURN s.name AS name
      ORDER BY toLower(trim(s.name)), s.name
      `
    );

    const candidates = result.records
      .map((record) => String(record.get("name")))
      .filter((name) => {
        const canonicalName = DANCE_STYLES.find(
          (style) => styleKey(style) === styleKey(name)
        );
        if (!canonicalName) return true;
        return !canonical.has(name);
      });

    const token = buildConfirmationToken(candidates);

    console.log(
      `[style:phase1:prune] mode=${APPLY ? "apply" : "dry-run"} prunable_nodes=${candidates.length}`
    );
    for (const name of candidates) {
      console.log(`- ${name}`);
    }
    console.log(`\n[style:phase1:prune] confirmation_token=${token}`);

    if (!APPLY) {
      return;
    }

    if (!confirmToken || confirmToken !== token) {
      throw new Error(
        "Confirmation token mismatch. Re-run with --confirm <confirmation_token>."
      );
    }

    if (candidates.length > 0) {
      await session.run(
        `
        UNWIND $names AS name
        MATCH (s:Style {name: name})
        WHERE NOT EXISTS { ()-[:STYLE]->(s) }
        DELETE s
        `,
        { names: candidates }
      );
    }

    await session.run(
      `
      CREATE CONSTRAINT style_name_unique IF NOT EXISTS
      FOR (s:Style)
      REQUIRE s.name IS UNIQUE
      `
    );

    const duplicateResult = await session.run(
      `
      MATCH (s:Style)
      WITH toLower(trim(s.name)) AS key, collect(s.name) AS names, count(*) AS c
      WHERE c > 1
      RETURN key, names, c
      ORDER BY key
      `
    );

    if (duplicateResult.records.length > 0) {
      throw new Error(
        "Case-insensitive duplicate style names remain after prune."
      );
    }

    console.log("[style:phase1:prune] success");
  } finally {
    await session.close();
  }
}

main()
  .catch((error) => {
    console.error("[style:phase1:prune] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await driver.close();
  });
