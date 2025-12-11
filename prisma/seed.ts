import { PrismaClient } from "@prisma/client";
import driver from "../src/db/driver";
import { seedNeo4j } from "../scripts/seed-neo4j";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PostgreSQL database...");

  // Clear Neo4j data FIRST before creating anything
  console.log("🧹 Clearing existing Neo4j data...");
  const clearSession = driver.session();
  try {
    await clearSession.run("MATCH (n) DETACH DELETE n");
    console.log("✅ Neo4j database cleared");
  } catch (error) {
    console.error("⚠️  Error clearing Neo4j database:", error);
  } finally {
    await clearSession.close();
  }

  // Clear all existing data
  console.log("🗑️  Clearing existing PostgreSQL data...");
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Cleared all existing data");

  // Create Users (matching Neo4j seed data)
  console.log(`🌱 Creating test users...`);
  const users = [
    {
      id: "test-user-0",
      name: "Base User",
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
      email: "superadmin@example.com",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "",
      auth: 3, // ADMIN (Super Admin uses same level)
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
    await driver.close();
    console.log("✅ Database connections closed");
  });
