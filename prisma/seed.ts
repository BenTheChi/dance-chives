import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import driver from "../src/db/driver";
import { seedNeo4j } from "../scripts/seed-neo4j";
import { SEED_CITIES } from "./seed-cities";

// Create a Prisma client for scripts (with adapter for connection pooling)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding PostgreSQL database...");

  // Clear Neo4j data FIRST before creating anything
  console.log("🧹 Clearing existing Neo4j data...");
  const clearSession = driver.session();
  try {
    // Wait a bit for Neo4j to be ready if it just started
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = await clearSession.run(
      "MATCH (n) DETACH DELETE n RETURN count(n) as deleted"
    );
    const deletedCount = result.records[0]?.get("deleted") || 0;
    console.log(`✅ Neo4j database cleared (deleted ${deletedCount} nodes)`);
  } catch (error) {
    console.error("⚠️  Error clearing Neo4j database:", error);
    console.error(
      "   This might happen if Neo4j is not running or not accessible."
    );
    console.error("   Try running: npm run neo4j:clear");
    // Don't throw - allow seed to continue even if Neo4j clear fails
  } finally {
    await clearSession.close();
  }

  // Clear all existing data
  console.log("🗑️  Clearing existing PostgreSQL data...");

  // Helper function to safely delete from tables that might not exist
  const safeDelete = async (model: any, tableName: string) => {
    try {
      if (!model || typeof model.deleteMany !== "function") {
        console.log(`⚠️  Model ${tableName} is not available, skipping...`);
        return;
      }
      await model.deleteMany();
    } catch (error: any) {
      if (error.code === "P2021" || error.message?.includes("does not exist")) {
        console.log(`⚠️  Table ${tableName} does not exist, skipping...`);
      } else {
        throw error;
      }
    }
  };

  // Delete in order to respect foreign key constraints
  // EventCard has CASCADE deletes for EventDate and SectionCard, so delete those first
  await safeDelete(prisma.eventDate, "EventDate");
  await safeDelete(prisma.sectionCard, "SectionCard");
  await safeDelete(prisma.eventCard, "EventCard");
  await safeDelete(prisma.event, "Event");
  await safeDelete(prisma.userCard, "UserCard");
  await safeDelete((prisma as any).city, "City");

  // Delete request-related tables
  await safeDelete(prisma.requestApproval, "RequestApproval");
  await safeDelete(prisma.notification, "Notification");
  await safeDelete(prisma.authLevelChangeRequest, "AuthLevelChangeRequest");
  await safeDelete(prisma.ownershipRequest, "OwnershipRequest");
  await safeDelete(prisma.teamMemberRequest, "TeamMemberRequest");
  await safeDelete(prisma.taggingRequest, "TaggingRequest");

  // Delete accounts and users (must be deleted after foreign key references)
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleared all existing data");

  console.log("🌆 Seeding canonical Postgres cities...");
  for (const city of SEED_CITIES) {
    await prisma.$executeRaw`
      INSERT INTO "cities" (
        "id",
        "slug",
        "name",
        "countryCode",
        "region",
        "timezone",
        "latitude",
        "longitude",
        "location",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${city.id},
        ${city.slug || `${city.name.toLowerCase().replace(/\s+/g, "-")}-${city.region?.toLowerCase() || ""}-${city.countryCode.toLowerCase()}`},
        ${city.name},
        ${city.countryCode},
        ${city.region || null},
        ${city.timezone || "UTC"},
        ${city.latitude || 0},
        ${city.longitude || 0},
        ST_SetSRID(ST_MakePoint(${city.longitude || 0}, ${city.latitude || 0}), 4326)::geography,
        NOW(),
        NOW()
      )
      ON CONFLICT ("id")
      DO UPDATE SET
        "name" = EXCLUDED."name",
        "countryCode" = EXCLUDED."countryCode",
        "region" = EXCLUDED."region",
        "timezone" = EXCLUDED."timezone",
        "latitude" = EXCLUDED."latitude",
        "longitude" = EXCLUDED."longitude",
        "location" = EXCLUDED."location",
        "updatedAt" = NOW(),
        "slug" = "cities"."slug"
    `;
  }
  console.log(`✅ Seeded ${SEED_CITIES.length} canonical cities`);

  // Create Users (matching Neo4j seed data)
  console.log(`🌱 Creating test users...`);
  const users = [
    {
      id: "test-user-0",
      name: "Base User",
      username: "baseuser",
      email: "baseuser@example.com",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "",
      auth: 0, // BASE_USER
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "test-user-1",
      name: "Creator",
      username: "creator",
      email: "creator@example.com",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "",
      auth: 1, // CREATOR
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "test-user-2",
      name: "Moderator",
      username: "moderator",
      email: "moderator@example.com",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "",
      auth: 2, // MODERATOR
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "test-user-3",
      name: "Admin",
      username: "admin",
      email: "admin@example.com",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "",
      auth: 3, // ADMIN
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "test-user-4",
      name: "Super Admin",
      username: "superadmin",
      email: "superadmin@example.com",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "",
      auth: 4, // ADMIN (Super Admin uses same level)
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const userData of users) {
    await prisma.user.create({
      data: userData,
    });
    console.log(`✅ Created user: ${userData.email} (auth: ${userData.auth})`);
  }

  // Create anon user for anonymous video reactions (FK for React model)
  await prisma.user.upsert({
    where: { id: "anon" },
    create: {
      id: "anon",
      name: "Anonymous",
      email: "anon@dancechives.local",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    update: {},
  });
  console.log(`✅ Ensured anon user exists`);

  // Create Accounts (OAuth Google accounts for login)
  console.log(`🌱 Creating OAuth accounts...`);
  const accounts = [
    {
      userId: "test-user-0",
      type: "oauth",
      provider: "google",
      providerAccountId: "google-baseuser-000",
      access_token: "mock-access-token-baseuser",
      refresh_token: "mock-refresh-token-baseuser",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: "Bearer",
      scope: "openid email profile",
      id_token: "mock-id-token-baseuser",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      userId: "test-user-1",
      type: "oauth",
      provider: "google",
      providerAccountId: "google-creator-111",
      access_token: "mock-access-token-creator",
      refresh_token: "mock-refresh-token-creator",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: "Bearer",
      scope: "openid email profile",
      id_token: "mock-id-token-creator",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      userId: "test-user-2",
      type: "oauth",
      provider: "google",
      providerAccountId: "google-moderator-222",
      access_token: "mock-access-token-moderator",
      refresh_token: "mock-refresh-token-moderator",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: "Bearer",
      scope: "openid email profile",
      id_token: "mock-id-token-moderator",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      userId: "test-user-3",
      type: "oauth",
      provider: "google",
      providerAccountId: "google-admin-333",
      access_token: "mock-access-token-admin",
      refresh_token: "mock-refresh-token-admin",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: "Bearer",
      scope: "openid email profile",
      id_token: "mock-id-token-admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      userId: "test-user-4",
      type: "oauth",
      provider: "google",
      providerAccountId: "google-superadmin-444",
      access_token: "mock-access-token-superadmin",
      refresh_token: "mock-refresh-token-superadmin",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: "Bearer",
      scope: "openid email profile",
      id_token: "mock-id-token-superadmin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const accountData of accounts) {
    await prisma.account.create({
      data: accountData,
    });
    console.log(`✅ Created OAuth account for user: ${accountData.userId}`);
  }

  // Create Neo4j user profiles
  console.log("🌱 Creating Neo4j user profiles...");
  await seedNeo4j();

  console.log("🎉 PostgreSQL seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ PostgreSQL seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
    await driver.close();
    console.log("✅ Database connections closed");
  });
