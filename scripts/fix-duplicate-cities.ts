/**
 * Deduplicate :City nodes sharing an id, then constrain City.id to be unique.
 *
 * ## Why this exists
 *
 * :City was the ONLY content label in the graph without a uniqueness
 * constraint — Country, Event, Image, IngestRun, Section, Style and Video all
 * have one. Without it, repeated MERGEs that ran before the id was settled
 * could create siblings. Taipei ended up as 3 nodes sharing one id, splitting
 * its events across them: 26 distinct events holding 70 (:Event)-[:IN]->(:City)
 * edges.
 *
 * Nothing user-facing was visibly broken, which is why it went unnoticed for
 * months. The damage is to counting: any `count(e)` over an Event->City path
 * double-counts. It inflated a country-migration invariant from 343 to 387.
 *
 * ## Order matters
 *
 * The constraint CANNOT be created while duplicates exist — Neo4j rejects it.
 * So: merge first, verify, then constrain. The constraint is the part that
 * makes this unrepeatable.
 *
 * ## Why not apoc.refactor.mergeNodes
 *
 * It is not guaranteed available on Aura, and the merge here is simple enough
 * to do explicitly: the duplicates are property-identical, so there is no
 * property-conflict policy to choose. Relationships are re-pointed with MERGE
 * (not CREATE) so an event already linked to the survivor does not gain a
 * second edge — 22 of the 26 Taipei events are in exactly that position.
 *
 * Run:
 *   npx dotenv-cli -e .env.staging -- tsx scripts/fix-duplicate-cities.ts --check
 *   npx dotenv-cli -e .env.staging -- tsx scripts/fix-duplicate-cities.ts
 */

import driver from "../src/db/driver";

const CHECK = process.argv.includes("--check");
const CONSTRAINT = "city_id_unique";

async function main() {
  const session = driver.session();

  try {
    if (CHECK) console.log("— CHECK MODE, nothing will be written —\n");

    // 1. Report the duplicate groups.
    const dupes = await session.run(
      `MATCH (c:City)
       WITH c.id AS id, count(*) AS copies
       WHERE copies > 1
       RETURN id, copies ORDER BY copies DESC`
    );

    if (dupes.records.length === 0) {
      console.log("No duplicate City ids.");
    }

    for (const r of dupes.records) {
      const id = String(r.get("id"));
      const copies = r.get("copies");

      const detail = await session.run(
        `MATCH (e:Event)-[:IN]->(c:City {id: $id})
         RETURN count(DISTINCT e) AS events, count(*) AS edges`,
        { id }
      );
      const events = detail.records[0]?.get("events") ?? 0;
      const edges = detail.records[0]?.get("edges") ?? 0;
      console.log(
        `  ${id}: ${copies} nodes, ${events} distinct events across ${edges} edges`
      );

      if (CHECK) continue;

      // 2. Merge. Keep the first node; re-point every relationship of the
      //    others onto it with MERGE so no duplicate edges appear, then delete
      //    the emptied duplicates.
      //
      //    Both directions are handled explicitly rather than with an
      //    undirected pattern, because direction is meaningful here:
      //    (:Event)-[:IN]->(:City)-[:IN]->(:Country).
      await session.run(
        `MATCH (c:City {id: $id})
         WITH c ORDER BY elementId(c)
         WITH collect(c) AS nodes
         WITH head(nodes) AS keep, tail(nodes) AS drop
         UNWIND drop AS d
         OPTIONAL MATCH (x)-[r:IN]->(d)
         FOREACH (_ IN CASE WHEN x IS NULL THEN [] ELSE [1] END |
           MERGE (x)-[:IN]->(keep)
         )
         WITH keep, d
         OPTIONAL MATCH (d)-[r2:IN]->(y)
         FOREACH (_ IN CASE WHEN y IS NULL THEN [] ELSE [1] END |
           MERGE (keep)-[:IN]->(y)
         )
         WITH DISTINCT d
         DETACH DELETE d`,
        { id }
      );

      const after = await session.run(
        `MATCH (e:Event)-[:IN]->(c:City {id: $id})
         RETURN count(DISTINCT c) AS nodes, count(DISTINCT e) AS events, count(*) AS edges`,
        { id }
      );
      const a = after.records[0];
      console.log(
        `    -> merged: ${a.get("nodes")} node, ${a.get("events")} events, ${a.get("edges")} edges`
      );
    }

    // 3. The constraint. This is what stops it recurring.
    const existing = await session.run(
      `SHOW CONSTRAINTS YIELD name WHERE name = $name RETURN name`,
      { name: CONSTRAINT }
    );

    if (existing.records.length > 0) {
      console.log(`\nConstraint ${CONSTRAINT} already exists.`);
    } else if (CHECK) {
      console.log(`\nwould create constraint ${CONSTRAINT} on City.id`);
    } else {
      await session.run(
        `CREATE CONSTRAINT ${CONSTRAINT} IF NOT EXISTS
         FOR (c:City) REQUIRE c.id IS UNIQUE`
      );
      console.log(`\n✅ Constraint ${CONSTRAINT} on City.id`);
    }

    // 4. Verify.
    const verify = await session.run(
      `CALL () { MATCH (c:City) RETURN count(c) AS nodes }
       CALL () { MATCH (c:City) RETURN count(DISTINCT c.id) AS ids }
       CALL () { MATCH (e:Event)-[:IN]->(:City) RETURN count(*) AS edges }
       CALL () { MATCH (e:Event)-[r:IN]->(c:City) WITH e, c, count(r) AS k WHERE k > 1 RETURN count(*) AS dupEdges }
       RETURN nodes, ids, edges, dupEdges`
    );
    const v = verify.records[0];
    console.log(
      `\nCity nodes: ${v.get("nodes")}, distinct ids: ${v.get("ids")}, ` +
        `Event->City edges: ${v.get("edges")}, duplicate edges: ${v.get("dupEdges")}`
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
