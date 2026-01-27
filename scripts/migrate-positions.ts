import driver from "../src/db/driver";
import "./load-env"; // Load environment variables
import { int } from "neo4j-driver";

/**
 * Migration script to backfill position values for all sections, brackets, and videos
 * Uses current query order (or createdAt) as baseline and assigns 0-based positions
 * This script is idempotent - safe to run multiple times
 */
async function migratePositions() {
  const session = driver.session();

  try {
    console.log("🚀 Starting position migration...");

    // Get all events
    const eventsResult = await session.run(
      `MATCH (e:Event)
       RETURN e.id as eventId
       ORDER BY e.createdAt ASC`
    );

    const events = eventsResult.records.map((r) => r.get("eventId"));
    console.log(`📋 Found ${events.length} events to process`);

    let totalSections = 0;
    let totalBrackets = 0;
    let totalVideos = 0;

    for (const eventId of events) {
      // Get sections for this event (ordered by createdAt as fallback)
      const sectionsResult = await session.run(
        `MATCH (e:Event {id: $eventId})<-[:IN]-(s:Section)
         RETURN s.id as sectionId
         ORDER BY COALESCE(s.position, 999999) ASC, s.createdAt ASC`,
        { eventId }
      );

      const sections = sectionsResult.records.map((r) => r.get("sectionId"));
      
      if (sections.length === 0) continue;

      // Update section positions
      const sectionUpdates = sections.map((sectionId, index) => ({
        id: sectionId,
        position: int(index),
      }));

      await session.run(
        `UNWIND $updates AS update
         MATCH (s:Section {id: update.id})
         SET s.position = update.position`,
        { updates: sectionUpdates }
      );

      totalSections += sections.length;

      // Process each section
      for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
        const sectionId = sections[sectionIndex];

        // Get brackets for this section
        const bracketsResult = await session.run(
          `MATCH (s:Section {id: $sectionId})<-[:IN]-(b:Bracket)
           RETURN b.id as bracketId
           ORDER BY COALESCE(b.position, 999999) ASC, b.createdAt ASC`,
          { sectionId }
        );

        const brackets = bracketsResult.records.map((r) => r.get("bracketId"));

        if (brackets.length > 0) {
          // Update bracket positions
          const bracketUpdates = brackets.map((bracketId, index) => ({
            id: bracketId,
            position: int(index),
          }));

          await session.run(
            `UNWIND $updates AS update
             MATCH (b:Bracket {id: update.id})
             SET b.position = update.position`,
            { updates: bracketUpdates }
          );

          totalBrackets += brackets.length;

          // Process videos in each bracket
          for (let bracketIndex = 0; bracketIndex < brackets.length; bracketIndex++) {
            const bracketId = brackets[bracketIndex];

            const bracketVideosResult = await session.run(
              `MATCH (b:Bracket {id: $bracketId})<-[:IN]-(v:Video)
               RETURN v.id as videoId
               ORDER BY COALESCE(v.position, 999999) ASC, v.createdAt ASC`,
              { bracketId }
            );

            const bracketVideos = bracketVideosResult.records.map((r) =>
              r.get("videoId")
            );

            if (bracketVideos.length > 0) {
              const videoUpdates = bracketVideos.map((videoId, index) => ({
                id: videoId,
                position: int(index),
              }));

              await session.run(
                `UNWIND $updates AS update
                 MATCH (v:Video {id: update.id})
                 SET v.position = update.position`,
                { updates: videoUpdates }
              );

              totalVideos += bracketVideos.length;
            }
          }
        }

        // Get direct videos in section (not in brackets)
        const sectionVideosResult = await session.run(
          `MATCH (s:Section {id: $sectionId})<-[:IN]-(v:Video)
           WHERE NOT EXISTS {
             MATCH (v)-[:IN]->(:Bracket)
           }
           RETURN v.id as videoId
           ORDER BY COALESCE(v.position, 999999) ASC, v.createdAt ASC`,
          { sectionId }
        );

        const sectionVideos = sectionVideosResult.records.map((r) =>
          r.get("videoId")
        );

        if (sectionVideos.length > 0) {
          const videoUpdates = sectionVideos.map((videoId, index) => ({
            id: videoId,
            position: int(index),
          }));

          await session.run(
            `UNWIND $updates AS update
             MATCH (v:Video {id: update.id})
             SET v.position = update.position`,
            { updates: videoUpdates }
          );

          totalVideos += sectionVideos.length;
        }
      }

      if (events.indexOf(eventId) % 10 === 0) {
        console.log(
          `  Processed ${events.indexOf(eventId) + 1}/${events.length} events...`
        );
      }
    }

    console.log("✅ Migration completed!");
    console.log(`   - Sections: ${totalSections}`);
    console.log(`   - Brackets: ${totalBrackets}`);
    console.log(`   - Videos: ${totalVideos}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await session.close();
    await driver.close();
  }
}

// Run migration
migratePositions()
  .then(() => {
    console.log("🎉 Migration script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration script failed:", error);
    process.exit(1);
  });
