/**
 * Script to add Neo4j indexes for City nodes
 * Run with: npx dotenv-cli -e .env.development -- tsx scripts/add-city-indexes.ts
 */

import driver from "../src/db/driver";

async function addCityIndexes() {
  const session = driver.session();

  try {
    console.log("Adding Neo4j indexes for City nodes...");

    // Add index on City.name for fast text search
    try {
      await session.run(
        `CREATE INDEX city_name_index IF NOT EXISTS FOR (c:City) ON (c.name)`
      );
      console.log("✅ Created index on City.name");
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        console.log("ℹ️  Index on City.name already exists");
      } else {
        throw error;
      }
    }

    // Add index on City.region for fast text search
    try {
      await session.run(
        `CREATE INDEX city_region_index IF NOT EXISTS FOR (c:City) ON (c.region)`
      );
      console.log("✅ Created index on City.region");
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        console.log("ℹ️  Index on City.region already exists");
      } else {
        throw error;
      }
    }

    console.log("✅ All indexes created successfully");
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
    throw error;
  } finally {
    await session.close();
  }
}

addCityIndexes()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });

