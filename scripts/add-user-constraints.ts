/**
 * Script to add Neo4j constraints and indexes for User nodes
 * Run with: npx dotenv-cli -e .env.local -- tsx scripts/add-user-constraints.ts
 */

import driver from "../src/db/driver";

async function addUserConstraints() {
  const session = driver.session();

  try {
    console.log("Adding Neo4j constraints and indexes for User nodes...");

    // 1. Create unique constraint on User.instagram
    // This ensures no two users can have the same Instagram handle
    // Note: Multiple null values are allowed, but all non-null values must be unique
    try {
      await session.run(
        `CREATE CONSTRAINT user_instagram_unique IF NOT EXISTS
         FOR (u:User)
         REQUIRE u.instagram IS UNIQUE`
      );
      console.log("✅ Created unique constraint on User.instagram");
    } catch (error: any) {
      if (
        error.message?.includes("already exists") ||
        error.message?.includes("Equivalent constraint")
      ) {
        console.log("ℹ️  Unique constraint on User.instagram already exists");
      } else {
        throw error;
      }
    }

    // 2. Create index on User.instagram for fast lookups (even though unique constraint creates an index, explicit index helps with queries)
    try {
      await session.run(
        `CREATE INDEX user_instagram_index IF NOT EXISTS FOR (u:User) ON (u.instagram)`
      );
      console.log("✅ Created index on User.instagram");
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        console.log("ℹ️  Index on User.instagram already exists");
      } else {
        throw error;
      }
    }

    // 3. Create index on User.claimed for fast filtering
    try {
      await session.run(
        `CREATE INDEX user_claimed_index IF NOT EXISTS FOR (u:User) ON (u.claimed)`
      );
      console.log("✅ Created index on User.claimed");
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        console.log("ℹ️  Index on User.claimed already exists");
      } else {
        throw error;
      }
    }

    // 4. Set claimed = true for all existing users that don't have it set
    try {
      const result = await session.run(
        `MATCH (u:User)
         WHERE u.claimed IS NULL
         SET u.claimed = true
         RETURN count(u) as updated`
      );
      const updated = result.records[0]?.get("updated")?.toNumber() || 0;
      if (updated > 0) {
        console.log(`✅ Updated ${updated} existing users to claimed = true`);
      } else {
        console.log("ℹ️  All existing users already have claimed property set");
      }
    } catch (error: any) {
      console.warn(
        "⚠️  Warning: Could not update existing users:",
        error.message
      );
      // Don't fail the script if this fails - it's not critical
    }

    console.log("✅ All constraints and indexes created successfully");
  } catch (error) {
    console.error("❌ Error creating constraints/indexes:", error);
    throw error;
  } finally {
    await session.close();
  }
}

addUserConstraints()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
