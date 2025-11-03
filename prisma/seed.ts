import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PostgreSQL database...");

  // Create test users with different auth levels and verification statuses
  const users = [
    {
      id: "test-user-0",
      name: "Base User",
      email: "base@test.local",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "https://example.com/base.jpg",
      auth: 0, // BASE_USER
      allCityAccess: false,
    },
    {
      id: "test-user-1",
      name: "Creator",
      email: "creator@test.local",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "https://example.com/creator.jpg",
      auth: 1, // CREATOR
      allCityAccess: false,
    },
    {
      id: "test-user-2",
      name: "Moderator",
      email: "moderator@test.local",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "https://example.com/moderator.jpg",
      auth: 2, // MODERATOR
      allCityAccess: false,
    },
    {
      id: "test-user-3",
      name: "Admin",
      email: "admin@test.local",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "https://example.com/admin.jpg",
      auth: 3, // ADMIN
      allCityAccess: false,
    },
    {
      id: "test-user-4",
      name: "Super Admin",
      email: "super-admin@test.local",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "https://example.com/super-admin.jpg",
      auth: 4, // SUPER_ADMIN
      allCityAccess: false,
    },
    // Keep original test users for backward compatibility
    {
      id: "test-user-alice",
      name: "Alice Johnson",
      email: "alice@example.com",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "https://example.com/alice.jpg",
      auth: 2, // MODERATOR
      allCityAccess: false,
    },
    {
      id: "test-user-bob",
      name: "Bob Smith",
      email: "bob@example.com",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "https://example.com/bob.jpg",
      auth: 1, // CREATOR
      allCityAccess: false,
    },
    {
      id: "test-user-carol",
      name: "Carol Davis",
      email: "carol@example.com",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "https://example.com/carol.jpg",
      auth: 1, // CREATOR
      allCityAccess: false,
    },
    {
      id: "test-user-david",
      name: "David Wilson",
      email: "david@example.com",
      emailVerified: new Date(),
      accountVerified: null,
      image: "https://example.com/david.jpg",
      auth: 1, // CREATOR
      allCityAccess: false,
    },
    {
      id: "test-user-eva",
      name: "Eva Martinez",
      email: "eva@example.com",
      emailVerified: new Date(),
      accountVerified: null,
      image: "https://example.com/eva.jpg",
      auth: 0, // BASE_USER
      allCityAccess: false,
    },
  ];

  // Create users
  for (const userData of users) {
    const { id, ...dataWithoutId } = userData;
    await prisma.user.upsert({
      where: { email: userData.email },
      update: dataWithoutId,
      create: userData,
    });
    console.log(`✅ Created/updated user: ${userData.email}`);
  }

  // Create OAuth accounts for test users (required for NextAuth)
  const accounts = [
    {
      userId: "test-user-0",
      type: "oauth",
      provider: "google",
      providerAccountId: "google-base-000",
      access_token: "mock-access-token-base",
      refresh_token: "mock-refresh-token-base",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: "Bearer",
      scope: "openid email profile",
      id_token: "mock-id-token-base",
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
    },
    {
      userId: "test-user-4",
      type: "oauth",
      provider: "google",
      providerAccountId: "google-super-admin-444",
      access_token: "mock-access-token-super",
      refresh_token: "mock-refresh-token-super",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: "Bearer",
      scope: "openid email profile",
      id_token: "mock-id-token-super",
    },
    // Backward compatibility accounts
    {
      userId: "test-user-alice",
      type: "oauth",
      provider: "google",
      providerAccountId: "google-alice-123",
      access_token: "mock-access-token-alice",
      refresh_token: "mock-refresh-token-alice",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: "Bearer",
      scope: "openid email profile",
      id_token: "mock-id-token-alice",
    },
    {
      userId: "test-user-bob",
      type: "oauth",
      provider: "google",
      providerAccountId: "google-bob-456",
      access_token: "mock-access-token-bob",
      refresh_token: "mock-refresh-token-bob",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: "Bearer",
      scope: "openid email profile",
      id_token: "mock-id-token-bob",
    },
    {
      userId: "test-user-carol",
      type: "oauth",
      provider: "google",
      providerAccountId: "google-carol-789",
      access_token: "mock-access-token-carol",
      refresh_token: "mock-refresh-token-carol",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: "Bearer",
      scope: "openid email profile",
      id_token: "mock-id-token-carol",
    },
    {
      userId: "test-user-david",
      type: "oauth",
      provider: "google",
      providerAccountId: "google-david-101",
      access_token: "mock-access-token-david",
      refresh_token: "mock-refresh-token-david",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: "Bearer",
      scope: "openid email profile",
      id_token: "mock-id-token-david",
    },
    {
      userId: "test-user-eva",
      type: "oauth",
      provider: "google",
      providerAccountId: "google-eva-202",
      access_token: "mock-access-token-eva",
      refresh_token: "mock-refresh-token-eva",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: "Bearer",
      scope: "openid email profile",
      id_token: "mock-id-token-eva",
    },
  ];

  // Create OAuth accounts
  for (const accountData of accounts) {
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: accountData.provider,
          providerAccountId: accountData.providerAccountId,
        },
      },
      update: accountData,
      create: accountData,
    });
    console.log(
      `✅ Created/updated OAuth account for user: ${accountData.userId}`
    );
  }

  // Create sample invitations
  const invitations = [
    {
      email: "newuser1@example.com",
      authLevel: 1, // CREATOR
      invitedBy: "test-user-1",
      token: "sample-token-1",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      used: false,
    },
    {
      email: "newuser2@example.com",
      authLevel: 1, // CREATOR
      invitedBy: "test-user-2",
      token: "sample-token-2",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      used: false,
    },
    {
      email: "used-invitation@example.com",
      authLevel: 2, // MODERATOR
      invitedBy: "test-user-1",
      token: "used-token-1",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      used: true,
    },
  ];

  // Create invitations
  for (const invitationData of invitations) {
    await prisma.invitation.upsert({
      where: { token: invitationData.token },
      update: invitationData,
      create: invitationData,
    });
    console.log(`✅ Created/updated invitation for: ${invitationData.email}`);
  }

  console.log("🎉 PostgreSQL seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ PostgreSQL seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
