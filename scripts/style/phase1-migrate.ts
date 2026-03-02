#!/usr/bin/env tsx

import driver from "../../src/db/driver";
import { DANCE_STYLES } from "../../src/lib/utils/dance-styles";

type StyleRow = {
  name: string;
  relCount: number;
};

type MovePlan = {
  oldName: string;
  targetName: string;
  relCount: number;
};

const APPLY = process.argv.includes("--apply");

function styleKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

async function getStyleRows(): Promise<StyleRow[]> {
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
    return result.records.map((record) => ({
      name: String(record.get("name")),
      relCount: Number(record.get("relCount")),
    }));
  } finally {
    await session.close();
  }
}

async function getTotalRelationshipCount(): Promise<number> {
  const session = driver.session();
  try {
    const result = await session.run(
      "MATCH ()-[r:STYLE]->(:Style) RETURN count(r) AS total"
    );
    return Number(result.records[0]?.get("total") ?? 0);
  } finally {
    await session.close();
  }
}

async function getCountsByCaseInsensitiveKey(): Promise<Map<string, number>> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH ()-[r:STYLE]->(s:Style)
      RETURN toLower(trim(s.name)) AS k, count(r) AS c
      ORDER BY k
      `
    );
    return new Map(
      result.records.map((record) => [
        String(record.get("k")),
        Number(record.get("c")),
      ])
    );
  } finally {
    await session.close();
  }
}

function mapsEqual(a: Map<string, number>, b: Map<string, number>): boolean {
  if (a.size !== b.size) return false;
  for (const [key, value] of a) {
    if (b.get(key) !== value) {
      return false;
    }
  }
  return true;
}

async function main() {
  const rows = await getStyleRows();
  const canonicalByKey = new Map<string, string>(
    DANCE_STYLES.map((style) => [styleKey(style), style])
  );

  const unknownWithRelationships = rows.filter((row) => {
    const target = canonicalByKey.get(styleKey(row.name));
    return !target && row.relCount > 0;
  });

  if (unknownWithRelationships.length > 0) {
    console.error(
      "[style:phase1:migrate] Unknown styles have relationships. Resolve these before migration:"
    );
    for (const row of unknownWithRelationships) {
      console.error(`- ${row.name} (relationships=${row.relCount})`);
    }
    process.exitCode = 1;
    return;
  }

  const plan: MovePlan[] = [];
  for (const row of rows) {
    const target = canonicalByKey.get(styleKey(row.name));
    if (!target) continue;
    if (row.name === target) continue;
    plan.push({ oldName: row.name, targetName: target, relCount: row.relCount });
  }

  const totalToMove = plan.reduce((sum, row) => sum + row.relCount, 0);
  console.log(
    `[style:phase1:migrate] mode=${APPLY ? "apply" : "dry-run"} planned_nodes=${plan.length} planned_relationship_moves=${totalToMove}`
  );
  for (const row of plan) {
    console.log(
      `- ${row.oldName} -> ${row.targetName} (relationships=${row.relCount})`
    );
  }

  if (!APPLY) {
    return;
  }

  const beforeTotal = await getTotalRelationshipCount();
  const beforeByKey = await getCountsByCaseInsensitiveKey();

  const session = driver.session();
  try {
    for (const row of plan) {
      await session.run(
        `
        MERGE (:Style {name: $targetName})
        `,
        { targetName: row.targetName }
      );

      await session.run(
        `
        MATCH (target:Style {name: $targetName})
        OPTIONAL MATCH (old:Style {name: $oldName})<-[r:STYLE]-(source)
        FOREACH (_ IN CASE WHEN r IS NULL THEN [] ELSE [1] END |
          CREATE (source)-[:STYLE]->(target)
          DELETE r
        )
        RETURN count(r) AS moved
        `,
        { oldName: row.oldName, targetName: row.targetName }
      );
    }
  } finally {
    await session.close();
  }

  const afterTotal = await getTotalRelationshipCount();
  const afterByKey = await getCountsByCaseInsensitiveKey();

  if (afterTotal !== beforeTotal) {
    throw new Error(
      `STYLE relationship count changed: before=${beforeTotal} after=${afterTotal}`
    );
  }

  if (!mapsEqual(beforeByKey, afterByKey)) {
    throw new Error(
      "Case-insensitive STYLE relationship distribution changed after migration"
    );
  }

  console.log(
    `[style:phase1:migrate] success relationships_preserved=${afterTotal}`
  );
}

main()
  .catch((error) => {
    console.error("[style:phase1:migrate] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await driver.close();
  });
