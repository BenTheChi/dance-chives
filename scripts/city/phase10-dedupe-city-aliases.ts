#!/usr/bin/env tsx

import { Prisma } from "@prisma/client";
import driver from "../../src/db/driver";
import { prisma } from "../../src/lib/primsa";
import { SEED_CITIES } from "../../prisma/seed-cities";

type CountValue = string | number | bigint;

type PostgresCityRow = {
  id: string;
  slug: string;
  name: string;
  region: string | null;
  countryCode: string;
  timezone: string;
  latitude: number;
  longitude: number;
  createdAt: Date | string;
};

type CountRow = {
  cityId: string;
  count: CountValue;
};

type CityUsage = {
  eventCardRefs: number;
  userCardRefs: number;
  totalRefs: number;
};

type DuplicateCluster = {
  key: string;
  normalizedName: string;
  normalizedRegion: string;
  normalizedCountryCode: string;
  cities: PostgresCityRow[];
};

type AliasPlan = {
  cluster: DuplicateCluster;
  canonical: PostgresCityRow;
  aliases: PostgresCityRow[];
};

type Neo4jPairPreStats = {
  canonicalExists: boolean;
  aliasExists: boolean;
  canonicalEventsBefore: number;
  canonicalUsersBefore: number;
  aliasEventsBefore: number;
  aliasUsersBefore: number;
  eventUniqueBefore: number;
  userUniqueBefore: number;
};

type Neo4jPairPostStats = {
  canonicalExists: boolean;
  aliasExists: boolean;
  canonicalEventsAfter: number;
  canonicalUsersAfter: number;
};

type PostgresAliasApplyResult = {
  eventCardRows: number;
  userCardRows: number;
  cityRowsDeleted: number;
};

const APPLY = process.argv.includes("--apply");
const PREVIEW_LIMIT = 25;

const DUPLICATE_VALIDATION_SQL = `
SELECT COUNT(*) AS "clusterCount"
FROM (
  SELECT
    LOWER(TRIM("name")) AS name_key,
    UPPER(TRIM(COALESCE("region", ''))) AS region_key,
    UPPER(TRIM("countryCode")) AS country_key
  FROM "cities"
  GROUP BY 1, 2, 3
  HAVING COUNT(*) > 1
) duplicate_clusters
`.trim();

const ALIAS_EVENT_CARD_VALIDATION_SQL = `
SELECT COUNT(*) AS "count"
FROM "event_cards"
WHERE "cityId" IN ($ALIAS_IDS)
`.trim();

const ALIAS_USER_CARD_VALIDATION_SQL = `
SELECT COUNT(*) AS "count"
FROM "user_cards"
WHERE "cityId" IN ($ALIAS_IDS)
`.trim();

const ALIAS_NEO4J_NODE_VALIDATION_CYPHER = `
MATCH (c:City)
WHERE c.id IN $aliasIds
RETURN count(c) AS aliasNodeCount
`.trim();

const normalizeName = (value: string | null | undefined): string =>
  (value || "").trim().toLowerCase();

const normalizeRegion = (value: string | null | undefined): string =>
  (value || "").trim().toUpperCase();

const normalizeCountryCode = (value: string | null | undefined): string =>
  (value || "").trim().toUpperCase();

const toCount = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  ) {
    const parsed = (value as { toNumber: () => number }).toNumber();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const toDateMs = (value: Date | string): number => {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
};

async function loadCitiesFromPostgres(): Promise<PostgresCityRow[]> {
  return prisma.$queryRaw<PostgresCityRow[]>`
    SELECT
      "id",
      "slug",
      "name",
      "region",
      "countryCode",
      "timezone",
      "latitude",
      "longitude",
      "createdAt"
    FROM "cities"
    ORDER BY "createdAt" ASC, "id" ASC
  `;
}

async function loadEventCardCounts(): Promise<Map<string, number>> {
  const rows = await prisma.$queryRaw<CountRow[]>`
    SELECT
      "cityId" AS "cityId",
      COUNT(*) AS "count"
    FROM "event_cards"
    WHERE "cityId" IS NOT NULL
    GROUP BY "cityId"
  `;

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.cityId, toCount(row.count));
  }
  return map;
}

async function loadUserCardCounts(): Promise<Map<string, number>> {
  const rows = await prisma.$queryRaw<CountRow[]>`
    SELECT
      "cityId" AS "cityId",
      COUNT(*) AS "count"
    FROM "user_cards"
    WHERE "cityId" IS NOT NULL
    GROUP BY "cityId"
  `;

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.cityId, toCount(row.count));
  }
  return map;
}

function buildUsageByCityId(
  eventCardCounts: Map<string, number>,
  userCardCounts: Map<string, number>,
  cities: PostgresCityRow[]
): Map<string, CityUsage> {
  const usageByCityId = new Map<string, CityUsage>();

  for (const city of cities) {
    const eventCardRefs = eventCardCounts.get(city.id) || 0;
    const userCardRefs = userCardCounts.get(city.id) || 0;
    usageByCityId.set(city.id, {
      eventCardRefs,
      userCardRefs,
      totalRefs: eventCardRefs + userCardRefs,
    });
  }

  return usageByCityId;
}

function buildDuplicateClusters(cities: PostgresCityRow[]): DuplicateCluster[] {
  const grouped = new Map<string, PostgresCityRow[]>();

  for (const city of cities) {
    const normalizedName = normalizeName(city.name);
    const normalizedRegion = normalizeRegion(city.region);
    const normalizedCountryCode = normalizeCountryCode(city.countryCode);
    const key = `${normalizedName}|${normalizedRegion}|${normalizedCountryCode}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.push(city);
    } else {
      grouped.set(key, [city]);
    }
  }

  const clusters: DuplicateCluster[] = [];
  for (const [key, members] of grouped.entries()) {
    if (members.length <= 1) {
      continue;
    }

    const [normalizedName, normalizedRegion, normalizedCountryCode] = key.split("|");
    clusters.push({
      key,
      normalizedName,
      normalizedRegion,
      normalizedCountryCode,
      cities: members,
    });
  }

  return clusters.sort((a, b) => a.key.localeCompare(b.key));
}

function chooseCanonicalForCluster(
  cluster: DuplicateCluster,
  usageByCityId: Map<string, CityUsage>,
  seededCityIds: Set<string>
): PostgresCityRow {
  const seededCandidates = cluster.cities.filter((city) =>
    seededCityIds.has(city.id)
  );
  const candidates =
    seededCandidates.length > 0 ? seededCandidates : cluster.cities;

  const sorted = [...candidates].sort((a, b) => {
    const aUsage = usageByCityId.get(a.id)?.totalRefs || 0;
    const bUsage = usageByCityId.get(b.id)?.totalRefs || 0;
    if (aUsage !== bUsage) {
      return bUsage - aUsage;
    }

    const createdAtDiff = toDateMs(a.createdAt) - toDateMs(b.createdAt);
    if (createdAtDiff !== 0) {
      return createdAtDiff;
    }

    return a.id.localeCompare(b.id);
  });

  return sorted[0];
}

function buildAliasPlans(
  clusters: DuplicateCluster[],
  usageByCityId: Map<string, CityUsage>,
  seededCityIds: Set<string>
): AliasPlan[] {
  const plans: AliasPlan[] = [];

  for (const cluster of clusters) {
    const canonical = chooseCanonicalForCluster(
      cluster,
      usageByCityId,
      seededCityIds
    );
    const aliases = cluster.cities
      .filter((city) => city.id !== canonical.id)
      .sort((a, b) => a.id.localeCompare(b.id));

    if (aliases.length === 0) {
      continue;
    }

    plans.push({
      cluster,
      canonical,
      aliases,
    });
  }

  return plans;
}

async function fetchNeo4jPairPreStats(
  canonicalId: string,
  aliasId: string
): Promise<Neo4jPairPreStats> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      CALL {
        WITH $canonicalId AS canonicalId, $aliasId AS aliasId
        OPTIONAL MATCH (c:City)
        WHERE c.id IN [canonicalId, aliasId]
        OPTIONAL MATCH (e:Event)-[:IN]->(c)
        RETURN count(DISTINCT e) AS eventUniqueBefore
      }
      CALL {
        WITH $canonicalId AS canonicalId, $aliasId AS aliasId
        OPTIONAL MATCH (c:City)
        WHERE c.id IN [canonicalId, aliasId]
        OPTIONAL MATCH (u:User)-[:LOCATED_IN]->(c)
        RETURN count(DISTINCT u) AS userUniqueBefore
      }
      OPTIONAL MATCH (canonical:City {id: $canonicalId})
      WITH eventUniqueBefore, userUniqueBefore, canonical
      OPTIONAL MATCH (eCanon:Event)-[:IN]->(canonical)
      WITH eventUniqueBefore, userUniqueBefore, canonical, count(DISTINCT eCanon) AS canonicalEventsBefore
      OPTIONAL MATCH (uCanon:User)-[:LOCATED_IN]->(canonical)
      WITH eventUniqueBefore, userUniqueBefore, canonical, canonicalEventsBefore, count(DISTINCT uCanon) AS canonicalUsersBefore
      OPTIONAL MATCH (alias:City {id: $aliasId})
      WITH eventUniqueBefore, userUniqueBefore, canonical, canonicalEventsBefore, canonicalUsersBefore, alias
      OPTIONAL MATCH (eAlias:Event)-[:IN]->(alias)
      WITH eventUniqueBefore, userUniqueBefore, canonical, canonicalEventsBefore, canonicalUsersBefore, alias, count(DISTINCT eAlias) AS aliasEventsBefore
      OPTIONAL MATCH (uAlias:User)-[:LOCATED_IN]->(alias)
      RETURN
        eventUniqueBefore,
        userUniqueBefore,
        canonicalEventsBefore,
        canonicalUsersBefore,
        aliasEventsBefore,
        count(DISTINCT uAlias) AS aliasUsersBefore,
        canonical IS NOT NULL AS canonicalExists,
        alias IS NOT NULL AS aliasExists
      `,
      { canonicalId, aliasId }
    );

    const record = result.records[0];
    return {
      canonicalExists: Boolean(record?.get("canonicalExists")),
      aliasExists: Boolean(record?.get("aliasExists")),
      canonicalEventsBefore: toCount(record?.get("canonicalEventsBefore")),
      canonicalUsersBefore: toCount(record?.get("canonicalUsersBefore")),
      aliasEventsBefore: toCount(record?.get("aliasEventsBefore")),
      aliasUsersBefore: toCount(record?.get("aliasUsersBefore")),
      eventUniqueBefore: toCount(record?.get("eventUniqueBefore")),
      userUniqueBefore: toCount(record?.get("userUniqueBefore")),
    };
  } finally {
    await session.close();
  }
}

async function fetchNeo4jPairPostStats(
  canonicalId: string,
  aliasId: string
): Promise<Neo4jPairPostStats> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      OPTIONAL MATCH (canonical:City {id: $canonicalId})
      WITH canonical
      OPTIONAL MATCH (e:Event)-[:IN]->(canonical)
      WITH canonical, count(DISTINCT e) AS canonicalEventsAfter
      OPTIONAL MATCH (u:User)-[:LOCATED_IN]->(canonical)
      WITH canonical, canonicalEventsAfter, count(DISTINCT u) AS canonicalUsersAfter
      OPTIONAL MATCH (alias:City {id: $aliasId})
      RETURN
        canonical IS NOT NULL AS canonicalExists,
        alias IS NOT NULL AS aliasExists,
        canonicalEventsAfter,
        canonicalUsersAfter
      `,
      { canonicalId, aliasId }
    );

    const record = result.records[0];
    return {
      canonicalExists: Boolean(record?.get("canonicalExists")),
      aliasExists: Boolean(record?.get("aliasExists")),
      canonicalEventsAfter: toCount(record?.get("canonicalEventsAfter")),
      canonicalUsersAfter: toCount(record?.get("canonicalUsersAfter")),
    };
  } finally {
    await session.close();
  }
}

async function applyPostgresAliasRemap(
  aliasId: string,
  canonicalId: string
): Promise<PostgresAliasApplyResult> {
  return prisma.$transaction(async (tx) => {
    const eventCardRows = await tx.$executeRaw`
      UPDATE "event_cards"
      SET "cityId" = ${canonicalId}
      WHERE "cityId" = ${aliasId}
    `;

    const userCardRows = await tx.$executeRaw`
      UPDATE "user_cards"
      SET "cityId" = ${canonicalId}
      WHERE "cityId" = ${aliasId}
    `;

    const cityRowsDeleted = await tx.$executeRaw`
      DELETE FROM "cities"
      WHERE "id" = ${aliasId}
    `;

    return {
      eventCardRows: Number(eventCardRows),
      userCardRows: Number(userCardRows),
      cityRowsDeleted: Number(cityRowsDeleted),
    };
  });
}

async function applyNeo4jAliasRemap(
  aliasId: string,
  canonical: PostgresCityRow
): Promise<void> {
  const session = driver.session();
  try {
    await session.run(
      `
      MERGE (canonical:City {id: $canonicalId})
      ON CREATE SET
        canonical.name = $canonicalName,
        canonical.region = $canonicalRegion,
        canonical.countryCode = $canonicalCountryCode,
        canonical.timezone = $canonicalTimezone,
        canonical.latitude = $canonicalLatitude,
        canonical.longitude = $canonicalLongitude,
        canonical.slug = $canonicalSlug
      WITH canonical
      OPTIONAL MATCH (alias:City {id: $aliasId})
      WITH canonical, alias
      OPTIONAL MATCH (event:Event)-[:IN]->(alias)
      FOREACH (_ IN CASE WHEN alias IS NULL OR event IS NULL THEN [] ELSE [1] END |
        MERGE (event)-[:IN]->(canonical)
      )
      WITH canonical, alias
      OPTIONAL MATCH (user:User)-[:LOCATED_IN]->(alias)
      FOREACH (_ IN CASE WHEN alias IS NULL OR user IS NULL THEN [] ELSE [1] END |
        MERGE (user)-[:LOCATED_IN]->(canonical)
      )
      WITH alias
      FOREACH (_ IN CASE WHEN alias IS NULL THEN [] ELSE [1] END |
        DETACH DELETE alias
      )
      `,
      {
        aliasId,
        canonicalId: canonical.id,
        canonicalName: canonical.name,
        canonicalRegion: canonical.region || "",
        canonicalCountryCode: canonical.countryCode,
        canonicalTimezone: canonical.timezone,
        canonicalLatitude: Number(canonical.latitude),
        canonicalLongitude: Number(canonical.longitude),
        canonicalSlug: canonical.slug,
      }
    );
  } finally {
    await session.close();
  }
}

async function countRemainingDuplicateClusters(): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ clusterCount: CountValue }>>`
    SELECT COUNT(*) AS "clusterCount"
    FROM (
      SELECT
        LOWER(TRIM("name")) AS name_key,
        UPPER(TRIM(COALESCE("region", ''))) AS region_key,
        UPPER(TRIM("countryCode")) AS country_key
      FROM "cities"
      GROUP BY 1, 2, 3
      HAVING COUNT(*) > 1
    ) duplicate_clusters
  `;
  return toCount(rows[0]?.clusterCount);
}

async function countAliasEventCardRefs(aliasIds: string[]): Promise<number> {
  if (aliasIds.length === 0) {
    return 0;
  }

  const rows = await prisma.$queryRaw<Array<{ count: CountValue }>>`
    SELECT COUNT(*) AS "count"
    FROM "event_cards"
    WHERE "cityId" IN (${Prisma.join(aliasIds)})
  `;
  return toCount(rows[0]?.count);
}

async function countAliasUserCardRefs(aliasIds: string[]): Promise<number> {
  if (aliasIds.length === 0) {
    return 0;
  }

  const rows = await prisma.$queryRaw<Array<{ count: CountValue }>>`
    SELECT COUNT(*) AS "count"
    FROM "user_cards"
    WHERE "cityId" IN (${Prisma.join(aliasIds)})
  `;
  return toCount(rows[0]?.count);
}

async function countAliasNeo4jNodes(aliasIds: string[]): Promise<number> {
  if (aliasIds.length === 0) {
    return 0;
  }

  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (c:City)
      WHERE c.id IN $aliasIds
      RETURN count(c) AS aliasNodeCount
      `,
      { aliasIds }
    );
    return toCount(result.records[0]?.get("aliasNodeCount"));
  } finally {
    await session.close();
  }
}

function printValidationQueryAnchors(): void {
  console.log("\nValidation query anchors:");
  console.log(`- duplicate cluster validation (Postgres):\n${DUPLICATE_VALIDATION_SQL}`);
  console.log(
    `- alias refs validation (Postgres event_cards):\n${ALIAS_EVENT_CARD_VALIDATION_SQL}`
  );
  console.log(
    `- alias refs validation (Postgres user_cards):\n${ALIAS_USER_CARD_VALIDATION_SQL}`
  );
  console.log(
    `- alias node validation (Neo4j):\n${ALIAS_NEO4J_NODE_VALIDATION_CYPHER}`
  );
}

async function run() {
  const seededCityIds = new Set(SEED_CITIES.map((city) => city.id));
  const preStatsByAliasId = new Map<string, Neo4jPairPreStats>();

  try {
    console.log(
      `[phase10-dedupe-city-aliases] mode=${APPLY ? "apply" : "dry-run"}`
    );

    const cities = await loadCitiesFromPostgres();
    const eventCardCounts = await loadEventCardCounts();
    const userCardCounts = await loadUserCardCounts();
    const usageByCityId = buildUsageByCityId(eventCardCounts, userCardCounts, cities);
    const duplicateClusters = buildDuplicateClusters(cities);
    const plans = buildAliasPlans(duplicateClusters, usageByCityId, seededCityIds);

    if (plans.length === 0) {
      console.log("- no duplicate city clusters found");
      printValidationQueryAnchors();
      console.log(`- duplicate clusters remaining: ${await countRemainingDuplicateClusters()}`);
      return;
    }

    const aliasIds: string[] = [];
    let expectedEventCardUpdates = 0;
    let expectedUserCardUpdates = 0;
    let expectedNeo4jEventRewires = 0;
    let expectedNeo4jUserRewires = 0;

    console.log(`- duplicate clusters detected: ${plans.length}`);

    for (const plan of plans) {
      const canonicalUsage = usageByCityId.get(plan.canonical.id) || {
        eventCardRefs: 0,
        userCardRefs: 0,
        totalRefs: 0,
      };
      const canonicalSeeded = seededCityIds.has(plan.canonical.id);

      console.log(
        `\ncluster=${plan.cluster.key} canonical=${plan.canonical.id} seeded=${canonicalSeeded} usage=${canonicalUsage.totalRefs}`
      );

      const previewAliases = plan.aliases.slice(0, PREVIEW_LIMIT);
      for (const alias of previewAliases) {
        aliasIds.push(alias.id);
        const aliasUsage = usageByCityId.get(alias.id) || {
          eventCardRefs: 0,
          userCardRefs: 0,
          totalRefs: 0,
        };
        expectedEventCardUpdates += aliasUsage.eventCardRefs;
        expectedUserCardUpdates += aliasUsage.userCardRefs;

        const preStats = await fetchNeo4jPairPreStats(plan.canonical.id, alias.id);
        preStatsByAliasId.set(alias.id, preStats);
        expectedNeo4jEventRewires += preStats.aliasEventsBefore;
        expectedNeo4jUserRewires += preStats.aliasUsersBefore;

        console.log(
          `- alias=${alias.id} -> canonical=${plan.canonical.id} | pg(event_cards=${aliasUsage.eventCardRefs}, user_cards=${aliasUsage.userCardRefs}) | neo4j(aliasEvents=${preStats.aliasEventsBefore}, aliasUsers=${preStats.aliasUsersBefore}, pairUniqueEvents=${preStats.eventUniqueBefore}, pairUniqueUsers=${preStats.userUniqueBefore})`
        );
      }

      const remainingAliasCount = plan.aliases.length - previewAliases.length;
      if (remainingAliasCount > 0) {
        console.log(`- ... ${remainingAliasCount} additional aliases omitted from preview`);
      }

      for (const alias of plan.aliases.slice(previewAliases.length)) {
        aliasIds.push(alias.id);
        const aliasUsage = usageByCityId.get(alias.id) || {
          eventCardRefs: 0,
          userCardRefs: 0,
          totalRefs: 0,
        };
        expectedEventCardUpdates += aliasUsage.eventCardRefs;
        expectedUserCardUpdates += aliasUsage.userCardRefs;

        const preStats = await fetchNeo4jPairPreStats(plan.canonical.id, alias.id);
        preStatsByAliasId.set(alias.id, preStats);
        expectedNeo4jEventRewires += preStats.aliasEventsBefore;
        expectedNeo4jUserRewires += preStats.aliasUsersBefore;
      }
    }

    console.log("\nExpected affected rows/relationships:");
    console.log(`- Postgres event_cards rows to update: ${expectedEventCardUpdates}`);
    console.log(`- Postgres user_cards rows to update: ${expectedUserCardUpdates}`);
    console.log(`- Postgres city rows to delete: ${aliasIds.length}`);
    console.log(`- Neo4j event IN relationships to rewire: ${expectedNeo4jEventRewires}`);
    console.log(
      `- Neo4j user LOCATED_IN relationships to rewire: ${expectedNeo4jUserRewires}`
    );

    printValidationQueryAnchors();

    if (!APPLY) {
      console.log(
        "\nDry-run complete. Re-run `npm run city:dedupe:prod -- --apply` to persist changes."
      );
      return;
    }

    let appliedEventCardRows = 0;
    let appliedUserCardRows = 0;
    let appliedCityDeletes = 0;

    for (const plan of plans) {
      for (const alias of plan.aliases) {
        const postgresResult = await applyPostgresAliasRemap(alias.id, plan.canonical.id);
        appliedEventCardRows += postgresResult.eventCardRows;
        appliedUserCardRows += postgresResult.userCardRows;
        appliedCityDeletes += postgresResult.cityRowsDeleted;

        await applyNeo4jAliasRemap(alias.id, plan.canonical);
        const preStats = preStatsByAliasId.get(alias.id);
        const postStats = await fetchNeo4jPairPostStats(plan.canonical.id, alias.id);

        if (!postStats.canonicalExists) {
          throw new Error(
            `Canonical city missing in Neo4j after remap: ${plan.canonical.id}`
          );
        }

        if (postStats.aliasExists) {
          throw new Error(`Alias city still exists in Neo4j after remap: ${alias.id}`);
        }

        if (preStats) {
          if (postStats.canonicalEventsAfter < preStats.eventUniqueBefore) {
            throw new Error(
              `Neo4j event relationship regression for canonical ${plan.canonical.id}: after=${postStats.canonicalEventsAfter}, expected>=${preStats.eventUniqueBefore}`
            );
          }

          if (postStats.canonicalUsersAfter < preStats.userUniqueBefore) {
            throw new Error(
              `Neo4j user relationship regression for canonical ${plan.canonical.id}: after=${postStats.canonicalUsersAfter}, expected>=${preStats.userUniqueBefore}`
            );
          }
        }
      }
    }

    const remainingDuplicateClusters = await countRemainingDuplicateClusters();
    const remainingEventCardAliasRefs = await countAliasEventCardRefs(aliasIds);
    const remainingUserCardAliasRefs = await countAliasUserCardRefs(aliasIds);
    const remainingAliasNeo4jNodes = await countAliasNeo4jNodes(aliasIds);

    console.log("\nApply summary:");
    console.log(`- Postgres event_cards rows updated: ${appliedEventCardRows}`);
    console.log(`- Postgres user_cards rows updated: ${appliedUserCardRows}`);
    console.log(`- Postgres city rows deleted: ${appliedCityDeletes}`);
    console.log(`- duplicate clusters remaining: ${remainingDuplicateClusters}`);
    console.log(`- remaining alias refs in event_cards: ${remainingEventCardAliasRefs}`);
    console.log(`- remaining alias refs in user_cards: ${remainingUserCardAliasRefs}`);
    console.log(`- remaining alias nodes in Neo4j: ${remainingAliasNeo4jNodes}`);

    if (
      remainingDuplicateClusters > 0 ||
      remainingEventCardAliasRefs > 0 ||
      remainingUserCardAliasRefs > 0 ||
      remainingAliasNeo4jNodes > 0
    ) {
      throw new Error(
        "Post-apply validation failed: duplicate clusters or alias references still present."
      );
    }

    console.log("\nApply mode complete.");
  } finally {
    await prisma.$disconnect();
    await driver.close();
  }
}

run().catch((error) => {
  console.error("[phase10-dedupe-city-aliases] failed", error);
  process.exitCode = 1;
});
