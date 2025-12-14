/**
 * Script to clear all Neo4j data from the database
 * This ensures Neo4j is fully cleared even if Docker volumes persist
 */

import driver from "../src/db/driver";

async function clearNeo4j() {
  console.log("🧹 Clearing Neo4j database...");

  // Wait a bit for Neo4j to be ready if it just started
  console.log("⏳ Waiting for Neo4j to be ready...");
  let retries = 10;
  let connected = false;

  while (retries > 0 && !connected) {
    try {
      const testSession = driver.session();
      await testSession.run("RETURN 1");
      await testSession.close();
      connected = true;
      console.log("✅ Neo4j is ready");
    } catch (error) {
      retries--;
      if (retries > 0) {
        console.log(`   Waiting... (${retries} retries left)`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        console.error(
          "❌ Neo4j is not accessible. Make sure the container is running:"
        );
        console.error("   Run: npm run docker:up");
        throw new Error("Neo4j connection failed");
      }
    }
  }

  const session = driver.session();

  try {
    // First, check how many nodes exist
    const countResult = await session.run("MATCH (n) RETURN count(n) as count");
    const nodeCount = countResult.records[0]?.get("count") || 0;
    console.log(`📊 Found ${nodeCount} nodes in Neo4j`);

    if (nodeCount > 0) {
      // Clear all nodes and relationships
      const result = await session.run(
        "MATCH (n) DETACH DELETE n RETURN count(n) as deleted"
      );
      const deletedCount = result.records[0]?.get("deleted") || 0;
      console.log(`✅ Deleted ${deletedCount} nodes from Neo4j`);
    } else {
      console.log("✅ Neo4j is already empty");
    }

    // Verify it's empty
    const verifyResult = await session.run(
      "MATCH (n) RETURN count(n) as count"
    );
    const remainingCount = verifyResult.records[0]?.get("count") || 0;
    if (remainingCount > 0) {
      console.warn(
        `⚠️  Warning: ${remainingCount} nodes still remain after deletion`
      );
    } else {
      console.log("✅ Verified: Neo4j is now empty");
    }

    // Also clear any constraints/indexes metadata (optional, but ensures clean state)
    try {
      await session.run("CALL db.clearQueryCaches()");
      console.log("✅ Cleared Neo4j query caches");
    } catch (error) {
      // This might fail if not supported, that's okay
      console.log("ℹ️  Query cache clear not available (this is fine)");
    }
  } catch (error) {
    console.error("❌ Error clearing Neo4j database:", error);
    throw error;
  } finally {
    await session.close();
    await driver.close();
  }
}

// Run the clear
clearNeo4j()
  .then(() => {
    console.log("\n✨ Neo4j database cleared successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Failed to clear Neo4j database:", error);
    process.exit(1);
  });
