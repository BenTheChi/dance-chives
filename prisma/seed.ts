import { PrismaClient } from "@prisma/client";
import { insertEvent } from "../src/db/queries/event";
import { signupUser } from "../src/db/queries/user";
import { Event } from "../src/types/event";
import { City } from "../src/types/city";
import { v4 as uuidv4 } from "uuid";
import driver from "../src/db/driver";
import { AVAILABLE_ROLES } from "../src/lib/utils/roles";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PostgreSQL database...");

  // Clear Neo4j data FIRST before creating anything
  // This prevents duplicates when seed scripts run multiple times
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

  // Helper function to safely delete from tables that might not exist
  const safeDelete = async (
    operation: () => Promise<any>,
    tableName: string
  ) => {
    try {
      await operation();
    } catch (error: any) {
      if (error.code === "P2021" || error.message?.includes("does not exist")) {
        console.log(`⚠️  Table ${tableName} does not exist, skipping...`);
      } else {
        throw error;
      }
    }
  };

  await safeDelete(
    () => prisma.requestApproval.deleteMany(),
    "RequestApproval"
  );
  await safeDelete(() => prisma.notification.deleteMany(), "Notification");
  await safeDelete(
    () => prisma.authLevelChangeRequest.deleteMany(),
    "AuthLevelChangeRequest"
  );
  await safeDelete(
    () => prisma.globalAccessRequest.deleteMany(),
    "GlobalAccessRequest"
  );
  await safeDelete(
    () => prisma.teamMemberRequest.deleteMany(),
    "TeamMemberRequest"
  );
  await safeDelete(() => prisma.taggingRequest.deleteMany(), "TaggingRequest");
  await prisma.event.deleteMany();
  await prisma.city.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Cleared all existing data");

  // Create 5 users accessible through Test Login functionality
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
      allCityAccess: true, // Admins always have allCityAccess
    },
    {
      id: "test-user-4",
      name: "Super Admin",
      email: "super-admin@test.local",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "https://example.com/super-admin.jpg",
      auth: 4, // SUPER_ADMIN
      allCityAccess: true, // SuperAdmins always have allCityAccess
    },
  ];

  // Create users
  for (const userData of users) {
    const { id, ...dataWithoutId } = userData;
    await prisma.user.create({
      data: userData,
    });
    console.log(`✅ Created user: ${userData.email}`);
  }

  // Create OAuth accounts for test users (required for NextAuth Test Login)
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
  ];

  // Create OAuth accounts
  for (const accountData of accounts) {
    await prisma.account.create({
      data: accountData,
    });
    console.log(`✅ Created OAuth account for user: ${accountData.userId}`);
  }

  // Create Neo4j user profiles for all users (needed for events and requests)
  console.log("🌱 Creating Neo4j user profiles...");
  const neo4jUserProfiles = [
    {
      userId: "test-user-0",
      displayName: "Base User",
      username: "baseuser",
      city: "Seattle",
      date: "01/01/1990",
      bio: "Dance enthusiast from Seattle",
      instagram: "@baseuser",
      website: "",
      image: "",
    },
    {
      userId: "test-user-1",
      displayName: "Creator",
      username: "creator",
      city: "New York",
      date: "01/01/1990",
      bio: "Event creator and organizer",
      instagram: "@creator",
      website: "https://creator.example.com",
      image: "",
    },
    {
      userId: "test-user-2",
      displayName: "Moderator",
      username: "moderator",
      city: "New York",
      date: "01/01/1990",
      bio: "Community moderator",
      instagram: "",
      website: "",
      image: "",
    },
    {
      userId: "test-user-3",
      displayName: "Admin",
      username: "admin",
      city: "Seattle",
      date: "01/01/1990",
      bio: "Platform administrator",
      instagram: "@admin",
      website: "",
      image: "",
    },
    {
      userId: "test-user-4",
      displayName: "Super Admin",
      username: "superadmin",
      city: "New York",
      date: "01/01/1990",
      bio: "Super administrator with full access",
      instagram: "@superadmin",
      website: "https://superadmin.example.com",
      image: "",
    },
  ];

  for (const profile of neo4jUserProfiles) {
    try {
      await signupUser(profile.userId, {
        displayName: profile.displayName,
        username: profile.username,
        city: profile.city,
        date: profile.date,
        bio: profile.bio,
        instagram: profile.instagram,
        website: profile.website,
        image: profile.image,
      });
      console.log(`✅ Created Neo4j profile for ${profile.userId}`);
    } catch (error) {
      console.log(`ℹ️  Neo4j profile for ${profile.userId} may already exist`);
    }
  }

  // City definitions
  const newYorkCity: City = {
    id: 1,
    name: "New York",
    countryCode: "US",
    region: "New York",
    population: 8336817,
    timezone: "America/New_York",
  };

  const seattleCity: City = {
    id: 5,
    name: "Seattle",
    countryCode: "US",
    region: "Washington",
    population: 753675,
    timezone: "America/Los_Angeles",
  };

  // Assign cities to all users (mandatory)
  console.log("🌱 Assigning cities to users...");
  const userCityAssignments = [
    { userId: "test-user-0", cityId: "5" }, // Base User -> Seattle
    { userId: "test-user-1", cityId: "1" }, // Creator -> New York
    { userId: "test-user-2", cityId: "1" }, // Moderator -> New York
    { userId: "test-user-3", cityId: "5" }, // Admin -> Seattle
    { userId: "test-user-4", cityId: "1" }, // Super Admin -> New York
  ];

  for (const assignment of userCityAssignments) {
    await prisma.city.create({
      data: {
        userId: assignment.userId,
        cityId: assignment.cityId,
      },
    });
    console.log(
      `✅ Assigned city ${assignment.cityId} to user ${assignment.userId}`
    );
  }

  // Helper function to create sections with brackets and videos
  const createSectionWithVideos = (
    sectionId: string,
    sectionTitle: string,
    bracketId: string,
    bracketTitle: string,
    videos: Array<{ id: string; title: string; src: string }>
  ) => ({
    id: sectionId,
    title: sectionTitle,
    description: "",
    hasBrackets: true,
    videos: [],
    brackets: [
      {
        id: bracketId,
        title: bracketTitle,
        videos: videos,
      },
    ],
  });

  // Create 5 events using only the 5 users
  // Base user cannot create events, only be tagged in them
  console.log("🌱 Creating 5 events...");
  const events: Event[] = [
    {
      id: "event-1-new-york-creator",
      createdAt: new Date(),
      updatedAt: new Date(),
      eventDetails: {
        title: "New York Dance Event by Creator",
        description: "A dance event in New York created by Creator",
        address: "123 Broadway, New York, NY 10001",
        prize: "$1000",
        entryCost: "$25",
        startDate: "12/15/2024",
        startTime: "18:00",
        endTime: "22:00",
        schedule: "Doors open at 6PM, Event starts at 7PM",
        creatorId: "test-user-1", // Creator
        poster: {
          id: uuidv4(),
          title: "Event Poster",
          url: "https://storage.googleapis.com/dance-chives-posters/85acb25a-b3ae-444a-9989-b5138bab5648-jensine_alien.jpg",
          type: "poster",
          file: null,
        },
        city: newYorkCity,
      },
      roles: [],
      sections: [
        createSectionWithVideos(
          "section-1-breaking-1v1",
          "Breaking 1v1",
          "bracket-1-breaking-1v1",
          "Round 1",
          [
            {
              id: "video-1-breaking-1v1-r1",
              title: "Breaking 1v1 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            },
            {
              id: "video-2-breaking-1v1-r1",
              title: "Breaking 1v1 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
            },
          ]
        ),
        createSectionWithVideos(
          "section-2-popping-2v2",
          "Popping 2v2",
          "bracket-1-popping-2v2",
          "Round 1",
          [
            {
              id: "video-1-popping-2v2-r1",
              title: "Popping 2v2 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
            },
            {
              id: "video-2-popping-2v2-r1",
              title: "Popping 2v2 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=9bZkp7q19f0",
            },
          ]
        ),
      ],
      subEvents: [],
      gallery: [],
    },
    {
      id: "event-2-seattle-creator",
      createdAt: new Date(),
      updatedAt: new Date(),
      eventDetails: {
        title: "Seattle Dance Event by Creator",
        description: "A dance event in Seattle created by Creator",
        address: "456 Pike Street, Seattle, WA 98101",
        prize: "$1500",
        entryCost: "$30",
        startDate: "12/20/2024",
        startTime: "19:00",
        endTime: "23:00",
        schedule: "Doors open at 7PM, Event starts at 8PM",
        creatorId: "test-user-1", // Creator
        poster: {
          id: uuidv4(),
          title: "Event Poster",
          url: "https://storage.googleapis.com/dance-chives-posters/82b8285d-2b11-4f8c-af3c-341ecd419c3a-this_is_fine.jpg",
          type: "poster",
          file: null,
        },
        city: seattleCity,
      },
      roles: [],
      sections: [
        createSectionWithVideos(
          "section-1-breaking-1v1-seattle",
          "Breaking 1v1",
          "bracket-1-breaking-1v1-seattle",
          "Round 1",
          [
            {
              id: "video-1-breaking-1v1-seattle-r1",
              title: "Breaking 1v1 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            },
            {
              id: "video-2-breaking-1v1-seattle-r1",
              title: "Breaking 1v1 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
            },
          ]
        ),
        createSectionWithVideos(
          "section-2-popping-2v2-seattle",
          "Popping 2v2",
          "bracket-1-popping-2v2-seattle",
          "Round 1",
          [
            {
              id: "video-1-popping-2v2-seattle-r1",
              title: "Popping 2v2 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
            },
            {
              id: "video-2-popping-2v2-seattle-r1",
              title: "Popping 2v2 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=9bZkp7q19f0",
            },
          ]
        ),
      ],
      subEvents: [],
      gallery: [],
    },
    {
      id: "event-3-new-york-moderator",
      createdAt: new Date(),
      updatedAt: new Date(),
      eventDetails: {
        title: "New York Dance Event by Moderator",
        description: "A dance event in New York created by Moderator",
        address: "789 5th Avenue, New York, NY 10002",
        prize: "$2000",
        entryCost: "$35",
        startDate: "12/25/2024",
        startTime: "20:00",
        endTime: "24:00",
        schedule: "Doors open at 8PM, Event starts at 9PM",
        creatorId: "test-user-2", // Moderator
        poster: {
          id: uuidv4(),
          title: "Event Poster",
          url: "https://storage.googleapis.com/dance-chives-posters/85acb25a-b3ae-444a-9989-b5138bab5648-jensine_alien.jpg",
          type: "poster",
          file: null,
        },
        city: newYorkCity,
      },
      roles: [],
      sections: [
        createSectionWithVideos(
          "section-1-breaking-1v1-moderator",
          "Breaking 1v1",
          "bracket-1-breaking-1v1-moderator",
          "Round 1",
          [
            {
              id: "video-1-breaking-1v1-moderator-r1",
              title: "Breaking 1v1 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            },
            {
              id: "video-2-breaking-1v1-moderator-r1",
              title: "Breaking 1v1 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
            },
          ]
        ),
        createSectionWithVideos(
          "section-2-popping-2v2-moderator",
          "Popping 2v2",
          "bracket-1-popping-2v2-moderator",
          "Round 1",
          [
            {
              id: "video-1-popping-2v2-moderator-r1",
              title: "Popping 2v2 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
            },
            {
              id: "video-2-popping-2v2-moderator-r1",
              title: "Popping 2v2 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=9bZkp7q19f0",
            },
          ]
        ),
      ],
      subEvents: [],
      gallery: [],
    },
    {
      id: "event-4-seattle-admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      eventDetails: {
        title: "Seattle Dance Event by Admin",
        description: "A dance event in Seattle created by Admin",
        address: "321 University Street, Seattle, WA 98102",
        prize: "$2500",
        entryCost: "$40",
        startDate: "12/30/2024",
        startTime: "18:00",
        endTime: "22:00",
        schedule: "Doors open at 6PM, Event starts at 7PM",
        creatorId: "test-user-3", // Admin
        poster: {
          id: uuidv4(),
          title: "Event Poster",
          url: "https://storage.googleapis.com/dance-chives-posters/82b8285d-2b11-4f8c-af3c-341ecd419c3a-this_is_fine.jpg",
          type: "poster",
          file: null,
        },
        city: seattleCity,
      },
      roles: [],
      sections: [
        createSectionWithVideos(
          "section-1-breaking-1v1-admin",
          "Breaking 1v1",
          "bracket-1-breaking-1v1-admin",
          "Round 1",
          [
            {
              id: "video-1-breaking-1v1-admin-r1",
              title: "Breaking 1v1 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            },
            {
              id: "video-2-breaking-1v1-admin-r1",
              title: "Breaking 1v1 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
            },
          ]
        ),
        createSectionWithVideos(
          "section-2-popping-2v2-admin",
          "Popping 2v2",
          "bracket-1-popping-2v2-admin",
          "Round 1",
          [
            {
              id: "video-1-popping-2v2-admin-r1",
              title: "Popping 2v2 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
            },
            {
              id: "video-2-popping-2v2-admin-r1",
              title: "Popping 2v2 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=9bZkp7q19f0",
            },
          ]
        ),
      ],
      subEvents: [],
      gallery: [],
    },
    {
      id: "event-5-new-york-super-admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      eventDetails: {
        title: "New York Dance Event by Super Admin",
        description: "A dance event in New York created by Super Admin",
        address: "999 Madison Avenue, New York, NY 10003",
        prize: "$3000",
        entryCost: "$50",
        startDate: "01/05/2025",
        startTime: "19:00",
        endTime: "23:00",
        schedule: "Doors open at 7PM, Event starts at 8PM",
        creatorId: "test-user-4", // Super Admin
        poster: {
          id: uuidv4(),
          title: "Event Poster",
          url: "https://storage.googleapis.com/dance-chives-posters/85acb25a-b3ae-444a-9989-b5138bab5648-jensine_alien.jpg",
          type: "poster",
          file: null,
        },
        city: newYorkCity,
      },
      roles: [],
      sections: [
        createSectionWithVideos(
          "section-1-breaking-1v1-super-admin",
          "Breaking 1v1",
          "bracket-1-breaking-1v1-super-admin",
          "Round 1",
          [
            {
              id: "video-1-breaking-1v1-super-admin-r1",
              title: "Breaking 1v1 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            },
            {
              id: "video-2-breaking-1v1-super-admin-r1",
              title: "Breaking 1v1 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
            },
          ]
        ),
        createSectionWithVideos(
          "section-2-popping-2v2-super-admin",
          "Popping 2v2",
          "bracket-1-popping-2v2-super-admin",
          "Round 1",
          [
            {
              id: "video-1-popping-2v2-super-admin-r1",
              title: "Popping 2v2 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
            },
            {
              id: "video-2-popping-2v2-super-admin-r1",
              title: "Popping 2v2 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=9bZkp7q19f0",
            },
          ]
        ),
      ],
      subEvents: [],
      gallery: [],
    },
  ];

  // Create events in Neo4j and PostgreSQL
  for (const event of events) {
    try {
      await insertEvent(event);
      console.log(`✅ Created Neo4j event: ${event.id}`);

      // Create PostgreSQL Event record so it shows up in the dashboard
      // Use findFirst + create/update instead of upsert since unique constraint might not exist in migrations
      const existingEvent = await prisma.event.findFirst({
        where: { eventId: event.id },
      });

      if (existingEvent) {
        await prisma.event.update({
          where: { id: existingEvent.id },
          data: {
            userId: event.eventDetails.creatorId,
            creator: true,
          },
        });
        console.log(`✅ Updated PostgreSQL Event record: ${event.id}`);
      } else {
        await prisma.event.create({
          data: {
            eventId: event.id,
            userId: event.eventDetails.creatorId,
            creator: true,
          },
        });
        console.log(`✅ Created PostgreSQL Event record: ${event.id}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create event ${event.id}:`, error);
      // Don't silently continue - log the actual error
      throw error;
    }
  }

  // Add tagging requests from base user (test-user-0) for one event in each city
  // Event 1 is in New York, Event 2 is in Seattle
  // Note: General tagging requests (without videoId or role) are no longer supported
  // Only video tag requests and role tag requests are allowed

  // Add video tag requests from base user (test-user-0) in one event in each city
  // Video tag requests reference videos from the event sections
  console.log("🌱 Creating video tag requests from base user...");
  const videoTagRequests = [
    {
      eventId: "event-1-new-york-creator",
      senderId: "test-user-0",
      targetUserId: "test-user-0", // Self-tagging
      videoId: "video-1-breaking-1v1-r1", // Video from Breaking 1v1 section
      role: null,
      status: "PENDING" as const,
    },
    {
      eventId: "event-2-seattle-creator",
      senderId: "test-user-0",
      targetUserId: "test-user-0", // Self-tagging
      videoId: "video-1-popping-2v2-seattle-r1", // Video from Popping 2v2 section
      role: null,
      status: "PENDING" as const,
    },
  ];

  for (const requestData of videoTagRequests) {
    try {
      await prisma.taggingRequest.create({
        data: requestData,
      });
      console.log(
        `✅ Created video tag request: ${requestData.eventId} -> video ${requestData.videoId}`
      );
    } catch (error) {
      console.log(
        `ℹ️  Video tag request may already exist or event not found, skipping...`
      );
    }
  }

  // Add role requests from base user (test-user-0) in one event in each city
  // Role requests are tagging requests with a role specified
  // Using valid roles from AVAILABLE_ROLES
  console.log("🌱 Creating role requests from base user...");
  const roleRequests = [
    {
      eventId: "event-1-new-york-creator",
      senderId: "test-user-0",
      targetUserId: "test-user-0", // Self-tagging with role
      videoId: null,
      role: "Organizer", // Valid role from AVAILABLE_ROLES
      status: "PENDING" as const,
    },
    {
      eventId: "event-2-seattle-creator",
      senderId: "test-user-0",
      targetUserId: "test-user-0", // Self-tagging with role
      videoId: null,
      role: "DJ", // Valid role from AVAILABLE_ROLES
      status: "PENDING" as const,
    },
  ];

  for (const requestData of roleRequests) {
    try {
      await prisma.taggingRequest.create({
        data: requestData,
      });
      console.log(
        `✅ Created role request: ${requestData.eventId} -> ${requestData.targetUserId} (${requestData.role})`
      );
    } catch (error) {
      console.log(
        `ℹ️  Role request may already exist or event not found, skipping...`
      );
    }
  }

  // Add team member request from base user (test-user-0) for event created by Creator
  // Event 1 is created by Creator (test-user-1)
  console.log("🌱 Creating team member request from base user...");
  try {
    await prisma.teamMemberRequest.create({
      data: {
        eventId: "event-1-new-york-creator",
        senderId: "test-user-0",
        status: "PENDING" as const,
      },
    });
    console.log(
      `✅ Created team member request: test-user-0 requests to join event-1-new-york-creator`
    );
  } catch (error) {
    console.log(
      `ℹ️  Team member request may already exist or event not found, skipping...`
    );
  }

  // Add auth level change request from moderator (test-user-2) to be admin level (level 3)
  console.log("🌱 Creating auth level change request from moderator...");
  try {
    await prisma.authLevelChangeRequest.create({
      data: {
        senderId: "test-user-2",
        targetUserId: "test-user-2", // Requesting for themselves
        requestedLevel: 3, // ADMIN
        currentLevel: 2, // MODERATOR
        message:
          "I would like to be upgraded to Admin level to better manage events and users across the platform.",
        status: "PENDING" as const,
      },
    });
    console.log(
      `✅ Created auth level change request: test-user-2 requesting to become Admin (level 3)`
    );
  } catch (error) {
    console.log(`ℹ️  Auth level change request may already exist, skipping...`);
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
    await driver.close();
    console.log("✅ Database connections closed");
  });
