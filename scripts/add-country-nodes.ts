/**
 * Phase 1 of the country-nodes migration (~/.claude/plans/country-nodes.md).
 *
 * Creates one :Country node per ISO code the corpus references and links every
 * :City to its country: (:City)-[:IN]->(:Country).
 *
 * ADDITIVE AND IDEMPOTENT. Nothing reads these yet, so this changes no
 * behaviour. Phase 2 makes the publish path write the edges; Phase 3 backfills
 * the direct (:Event)-[:IN]->(:Country) edges.
 *
 * Run:
 *   npx dotenv-cli -e .env.staging -- tsx scripts/add-country-nodes.ts --check
 *   npx dotenv-cli -e .env.staging -- tsx scripts/add-country-nodes.ts
 *
 * --check reports what would change and writes nothing.
 */

import driver from "../src/db/driver";
import { COUNTRIES, getCountry } from "../src/lib/utils/countries";

const CHECK = process.argv.includes("--check");

async function main() {
  const session = driver.session();

  try {
    console.log(CHECK ? "— CHECK MODE, nothing will be written —\n" : "");

    // 1. Constraint first: makes the MERGEs below safe under any concurrency
    //    and is what guarantees `code` is the node's identity.
    if (!CHECK) {
      await session.run(
        `CREATE CONSTRAINT country_code_unique IF NOT EXISTS
         FOR (k:Country) REQUIRE k.code IS UNIQUE`
      );
      console.log("✅ Constraint on Country.code");
    } else {
      console.log("would create constraint country_code_unique");
    }

    // 2. Which codes do the City nodes actually use? Create nodes for every
    //    known country regardless (the list is small and a country with no
    //    cities yet is not a problem), but report the overlap so a code that
    //    exists in data but not in the static list is loud rather than silent.
    const used = await session.run(
      `MATCH (c:City)
       WHERE c.countryCode IS NOT NULL AND trim(c.countryCode) <> ''
       RETURN DISTINCT toUpper(trim(c.countryCode)) AS code ORDER BY code`
    );
    const usedCodes = used.records.map((r) => String(r.get("code")));
    const unknown = usedCodes.filter((c) => !getCountry(c));

    console.log(`City nodes reference ${usedCodes.length} distinct country codes.`);
    if (unknown.length) {
      // Not fatal: those cities simply get no country edge until the code is
      // added to countries.ts. Better to report than to invent a name.
      console.warn(`⚠️  ${unknown.length} code(s) not in countries.ts, will be SKIPPED: ${unknown.join(", ")}`);
    }

    // 3. Create the country nodes.
    if (!CHECK) {
      await session.run(
        `UNWIND $rows AS row
         MERGE (k:Country {code: row.code})
         SET k.name = row.name, k.slug = row.slug`,
        { rows: COUNTRIES.map((c) => ({ ...c })) }
      );
      console.log(`✅ MERGEd ${COUNTRIES.length} Country nodes`);
    } else {
      const existing = await session.run(`MATCH (k:Country) RETURN count(k) AS n`);
      console.log(`would MERGE ${COUNTRIES.length} Country nodes (currently ${existing.records[0].get("n")})`);
    }

    // 4. Link cities to countries. Matching on the normalized code keeps
    //    lowercase/padded values in the data from silently missing.
    if (!CHECK) {
      const linked = await session.run(
        `MATCH (c:City)
         WHERE c.countryCode IS NOT NULL AND trim(c.countryCode) <> ''
         MATCH (k:Country {code: toUpper(trim(c.countryCode))})
         MERGE (c)-[:IN]->(k)
         RETURN count(*) AS n`
      );
      console.log(`✅ Linked ${linked.records[0].get("n")} City→Country edges`);
    } else {
      const would = await session.run(
        `MATCH (c:City)
         WHERE c.countryCode IS NOT NULL AND trim(c.countryCode) <> ''
           AND toUpper(trim(c.countryCode)) IN $codes
         RETURN count(c) AS n`,
        { codes: COUNTRIES.map((c) => c.code) }
      );
      console.log(`would link ${would.records[0].get("n")} City→Country edges`);
    }

    // 5. Report what is deliberately left alone: sentinel cities have no real
    //    country, and the bare `unknown` node must never gain an edge.
    const sentinels = await session.run(
      `MATCH (c:City)
       WHERE c.countryCode IS NULL OR trim(c.countryCode) = ''
       RETURN c.id AS id, c.name AS name ORDER BY c.id`
    );
    console.log(`\nCities with no country code (left unlinked, expected: sentinels):`);
    for (const r of sentinels.records) {
      console.log(`  ${r.get("id")}  ${r.get("name")}`);
    }

    // 6. Verification, always runs.
    // Each count is its own subquery: chaining MATCHes drops the whole row
    // when any one of them has zero matches (which is exactly the state on a
    // first --check run).
    const verify = await session.run(
      `CALL () { MATCH (k:Country) RETURN count(k) AS countries }
       CALL () { MATCH (:City)-[:IN]->(:Country) RETURN count(*) AS edges }
       CALL () { MATCH (c:City) WHERE NOT (c)-[:IN]->(:Country) RETURN count(c) AS unlinkedCities }
       RETURN countries, edges, unlinkedCities`
    );
    const v = verify.records[0];
    console.log(
      `\nGraph now: ${v.get("countries")} Country nodes, ` +
        `${v.get("edges")} City→Country edges, ` +
        `${v.get("unlinkedCities")} unlinked cities.`
    );
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});
