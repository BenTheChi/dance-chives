import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PostgreSQL database...");

  // Create test users with different auth levels and verification statuses
  const users = [
    {
      id: "test-user-1",
      name: "Alice Johnson",
      email: "alice@example.com",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "https://example.com/alice.jpg",
      auth: 3, // REGIONAL_MODERATOR
    },
    {
      id: "test-user-2",
      name: "Bob Smith",
      email: "bob@example.com",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "https://example.com/bob.jpg",
      auth: 2, // GLOBAL_CREATOR
    },
    {
      id: "test-user-3",
      name: "Carol Davis",
      email: "carol@example.com",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "https://example.com/carol.jpg",
      auth: 1, // REGIONAL_CREATOR
    },
    {
      id: "test-user-4",
      name: "David Wilson",
      email: "david@example.com",
      emailVerified: new Date(),
      accountVerified: null, // Unverified account
      image: "https://example.com/david.jpg",
      auth: 1, // REGIONAL_CREATOR
    },
    {
      id: "test-user-5",
      name: "Eva Martinez",
      email: "eva@example.com",
      emailVerified: new Date(),
      accountVerified: null, // Unverified account
      image: "https://example.com/eva.jpg",
      auth: 0, // BASE_USER
    },
  ];

  // Create users
  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: userData,
      create: userData,
    });
    console.log(`✅ Created/updated user: ${userData.email}`);
  }

  // Create OAuth accounts for test users (required for NextAuth)
  const accounts = [
    {
      userId: "test-user-1",
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
      userId: "test-user-2",
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
      userId: "test-user-3",
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
      userId: "test-user-4",
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
      userId: "test-user-5",
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
      authLevel: 2,
      invitedBy: "test-user-1",
      token: "sample-token-1",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      used: false,
    },
    {
      email: "newuser2@example.com",
      authLevel: 1,
      invitedBy: "test-user-2",
      token: "sample-token-2",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      used: false,
    },
    {
      email: "used-invitation@example.com",
      authLevel: 3,
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
