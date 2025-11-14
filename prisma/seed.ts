import { PrismaClient } from "@prisma/client";
import { insertEvent } from "../src/db/queries/event";
import { insertWorkshop } from "../src/db/queries/workshop";
import { signupUser } from "../src/db/queries/user";
import { Event } from "../src/types/event";
import { Workshop } from "../src/types/workshop";
import { City } from "../src/types/city";
import { v4 as uuidv4 } from "uuid";
import driver from "../src/db/driver";
import { VIDEO_ROLE_DANCER, VIDEO_ROLE_WINNER } from "../src/lib/utils/roles";
import {
  setVideoRoles,
  setSectionWinner,
  setEventRoles,
} from "../src/db/queries/team-member";

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
    () => prisma.teamMemberRequest.deleteMany(),
    "TeamMemberRequest"
  );
  await safeDelete(() => prisma.taggingRequest.deleteMany(), "TaggingRequest");
  await prisma.event.deleteMany();
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
    },
    {
      id: "test-user-1",
      name: "Creator",
      email: "creator@test.local",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "https://example.com/creator.jpg",
      auth: 1, // CREATOR
    },
    {
      id: "test-user-2",
      name: "Moderator",
      email: "moderator@test.local",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "https://example.com/moderator.jpg",
      auth: 2, // MODERATOR
    },
    {
      id: "test-user-3",
      name: "Admin",
      email: "admin@test.local",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "https://example.com/admin.jpg",
      auth: 3, // ADMIN
    },
    {
      id: "test-user-4",
      name: "Super Admin",
      email: "super-admin@test.local",
      emailVerified: new Date(),
      accountVerified: new Date(),
      image: "https://example.com/super-admin.jpg",
      auth: 4, // SUPER_ADMIN
    },
  ];

  // Create users
  for (const userData of users) {
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

  // City definitions (for events in Neo4j, not user authorization)
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

  // Generate UUIDs for all section IDs
  const sectionIds = {
    "section-1-breaking-1v1": uuidv4(),
    "section-2-popping-2v2": uuidv4(),
    "section-1-breaking-1v1-seattle": uuidv4(),
    "section-2-waacking-2v2-seattle": uuidv4(),
    "section-1-breaking-1v1-moderator": uuidv4(),
    "section-2-locking-2v2-moderator": uuidv4(),
    "section-1-breaking-1v1-admin": uuidv4(),
    "section-2-hip-hop-2v2-admin": uuidv4(),
    "section-1-breaking-1v1-super-admin": uuidv4(),
    "section-2-popping-2v2-super-admin": uuidv4(),
  };

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
          sectionIds["section-1-breaking-1v1"],
          "Breaking 1v1",
          "bracket-1-breaking-1v1",
          "Round 1",
          [
            {
              id: "video-1-breaking-1v1-r1",
              title: "Breaking 1v1 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=-kT0HJhm5ck",
            },
            {
              id: "video-2-breaking-1v1-r1",
              title: "Breaking 1v1 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=-kT0HJhm5ck",
            },
          ]
        ),
        createSectionWithVideos(
          sectionIds["section-2-popping-2v2"],
          "Popping 2v2",
          "bracket-1-popping-2v2",
          "Round 1",
          [
            {
              id: "video-1-popping-2v2-r1",
              title: "Popping 2v2 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=4ESPNEKl4yM",
            },
            {
              id: "video-2-popping-2v2-r1",
              title: "Popping 2v2 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=4ESPNEKl4yM",
            },
          ]
        ),
      ],
      subEvents: [],
      workshops: [],
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
          sectionIds["section-1-breaking-1v1-seattle"],
          "Breaking 1v1",
          "bracket-1-breaking-1v1-seattle",
          "Round 1",
          [
            {
              id: "video-1-breaking-1v1-seattle-r1",
              title: "Breaking 1v1 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=-kT0HJhm5ck",
            },
            {
              id: "video-2-breaking-1v1-seattle-r1",
              title: "Breaking 1v1 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=-kT0HJhm5ck",
            },
          ]
        ),
        createSectionWithVideos(
          sectionIds["section-2-waacking-2v2-seattle"],
          "Waacking 2v2",
          "bracket-1-waacking-2v2-seattle",
          "Round 1",
          [
            {
              id: "video-1-waacking-2v2-seattle-r1",
              title: "Waacking 2v2 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=_E7SMkgHcsM",
            },
            {
              id: "video-2-waacking-2v2-seattle-r1",
              title: "Waacking 2v2 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=_E7SMkgHcsM",
            },
          ]
        ),
      ],
      subEvents: [],
      workshops: [],
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
          sectionIds["section-1-breaking-1v1-moderator"],
          "Breaking 1v1",
          "bracket-1-breaking-1v1-moderator",
          "Round 1",
          [
            {
              id: "video-1-breaking-1v1-moderator-r1",
              title: "Breaking 1v1 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=-kT0HJhm5ck",
            },
            {
              id: "video-2-breaking-1v1-moderator-r1",
              title: "Breaking 1v1 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=-kT0HJhm5ck",
            },
          ]
        ),
        createSectionWithVideos(
          sectionIds["section-2-locking-2v2-moderator"],
          "Locking 2v2",
          "bracket-1-locking-2v2-moderator",
          "Round 1",
          [
            {
              id: "video-1-locking-2v2-moderator-r1",
              title: "Locking 2v2 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=z-plXrkvhTg",
            },
            {
              id: "video-2-locking-2v2-moderator-r1",
              title: "Locking 2v2 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=z-plXrkvhTg",
            },
          ]
        ),
      ],
      subEvents: [],
      workshops: [],
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
          sectionIds["section-1-breaking-1v1-admin"],
          "Breaking 1v1",
          "bracket-1-breaking-1v1-admin",
          "Round 1",
          [
            {
              id: "video-1-breaking-1v1-admin-r1",
              title: "Breaking 1v1 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=-kT0HJhm5ck",
            },
            {
              id: "video-2-breaking-1v1-admin-r1",
              title: "Breaking 1v1 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=-kT0HJhm5ck",
            },
          ]
        ),
        createSectionWithVideos(
          sectionIds["section-2-hip-hop-2v2-admin"],
          "Hip Hop 2v2",
          "bracket-1-hip-hop-2v2-admin",
          "Round 1",
          [
            {
              id: "video-1-hip-hop-2v2-admin-r1",
              title: "Hip Hop 2v2 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=YzHOD9t1fKM",
            },
            {
              id: "video-2-hip-hop-2v2-admin-r1",
              title: "Hip Hop 2v2 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=YzHOD9t1fKM",
            },
          ]
        ),
      ],
      subEvents: [],
      workshops: [],
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
          sectionIds["section-1-breaking-1v1-super-admin"],
          "Breaking 1v1",
          "bracket-1-breaking-1v1-super-admin",
          "Round 1",
          [
            {
              id: "video-1-breaking-1v1-super-admin-r1",
              title: "Breaking 1v1 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=-kT0HJhm5ck",
            },
            {
              id: "video-2-breaking-1v1-super-admin-r1",
              title: "Breaking 1v1 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=-kT0HJhm5ck",
            },
          ]
        ),
        createSectionWithVideos(
          sectionIds["section-2-popping-2v2-super-admin"],
          "Popping 2v2",
          "bracket-1-popping-2v2-super-admin",
          "Round 1",
          [
            {
              id: "video-1-popping-2v2-super-admin-r1",
              title: "Popping 2v2 - Round 1 Battle",
              src: "https://www.youtube.com/watch?v=4ESPNEKl4yM",
            },
            {
              id: "video-2-popping-2v2-super-admin-r1",
              title: "Popping 2v2 - Round 1 Battle 2",
              src: "https://www.youtube.com/watch?v=4ESPNEKl4yM",
            },
          ]
        ),
      ],
      subEvents: [],
      workshops: [],
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

  // Create 2 workshops with most fields filled out
  console.log("🌱 Creating 2 workshops...");
  const workshops: Workshop[] = [
    {
      id: "workshop-1-new-york-with-event",
      createdAt: new Date(),
      updatedAt: new Date(),
      workshopDetails: {
        title: "Advanced Breaking Workshop - New York",
        description:
          "An intensive breaking workshop covering advanced footwork, power moves, and freestyle techniques. Perfect for dancers looking to take their skills to the next level. We'll cover everything from foundational concepts to competition-level moves.",
        schedule:
          "10:00 AM - Registration and warm-up\n10:30 AM - Footwork fundamentals\n12:00 PM - Power moves session\n1:30 PM - Lunch break\n2:30 PM - Freestyle and battle techniques\n4:00 PM - Q&A and individual feedback\n5:00 PM - Workshop concludes",
        address: "789 Dance Studio, 5th Avenue, New York, NY 10002",
        startDate: "01/10/2025",
        startTime: "10:00",
        endTime: "17:00",
        cost: "$75",
        creatorId: "test-user-1", // Creator
        poster: {
          id: uuidv4(),
          title: "Workshop Poster",
          url: "https://storage.googleapis.com/dance-chives-posters/85acb25a-b3ae-444a-9989-b5138bab5648-jensine_alien.jpg",
          type: "poster",
          file: null,
        },
        city: newYorkCity,
      },
      roles: [
        {
          id: "role-organizer-1",
          title: "ORGANIZER",
          user: {
            id: "test-user-1",
            displayName: "Creator",
            username: "creator",
          },
        },
        {
          id: "role-teacher-1",
          title: "TEACHER",
          user: {
            id: "test-user-2",
            displayName: "Moderator",
            username: "moderator",
          },
        },
      ],
      videos: [
        {
          id: "workshop-video-1",
          title: "Breaking Workshop Highlights",
          src: "https://www.youtube.com/watch?v=-kT0HJhm5ck",
          styles: ["Breaking", "Hip Hop"],
        },
        {
          id: "workshop-video-2",
          title: "Advanced Footwork Techniques",
          src: "https://www.youtube.com/watch?v=4ESPNEKl4yM",
          styles: ["Breaking"],
        },
      ],
      gallery: [
        {
          id: uuidv4(),
          title: "Workshop Photo 1",
          url: "https://storage.googleapis.com/dance-chives-posters/82b8285d-2b11-4f8c-af3c-341ecd419c3a-this_is_fine.jpg",
          type: "photo",
          file: null,
        },
        {
          id: uuidv4(),
          title: "Workshop Photo 2",
          url: "https://storage.googleapis.com/dance-chives-posters/85acb25a-b3ae-444a-9989-b5138bab5648-jensine_alien.jpg",
          type: "photo",
          file: null,
        },
      ],
      associatedEventId: "event-1-new-york-creator", // Connected to event
    },
    {
      id: "workshop-2-seattle-standalone",
      createdAt: new Date(),
      updatedAt: new Date(),
      workshopDetails: {
        title: "Popping & Animation Workshop - Seattle",
        description:
          "Master the art of popping and animation in this comprehensive workshop. Learn techniques from basic hits and waves to advanced animation concepts. This workshop is designed for all skill levels, with personalized instruction to help you develop your unique style. We'll explore musicality, isolations, and how to create smooth transitions between moves.",
        schedule:
          "9:00 AM - Check-in and introductions\n9:30 AM - Warm-up and stretching\n10:00 AM - Basic popping techniques\n11:30 AM - Animation fundamentals\n1:00 PM - Lunch break\n2:00 PM - Advanced concepts and combinations\n3:30 PM - Freestyle session\n4:30 PM - Performance tips and stage presence\n5:30 PM - Final showcase and feedback",
        address: "456 Dance Academy, Pike Street, Seattle, WA 98101",
        startDate: "01/15/2025",
        startTime: "09:00",
        endTime: "17:30",
        cost: "$85",
        creatorId: "test-user-3", // Admin
        poster: {
          id: uuidv4(),
          title: "Workshop Poster",
          url: "https://storage.googleapis.com/dance-chives-posters/82b8285d-2b11-4f8c-af3c-341ecd419c3a-this_is_fine.jpg",
          type: "poster",
          file: null,
        },
        city: seattleCity,
      },
      roles: [
        {
          id: "role-organizer-2",
          title: "ORGANIZER",
          user: {
            id: "test-user-3",
            displayName: "Admin",
            username: "admin",
          },
        },
        {
          id: "role-teacher-2",
          title: "TEACHER",
          user: {
            id: "test-user-4",
            displayName: "Super Admin",
            username: "superadmin",
          },
        },
        {
          id: "role-teacher-3",
          title: "TEACHER",
          user: {
            id: "test-user-2",
            displayName: "Moderator",
            username: "moderator",
          },
        },
      ],
      videos: [
        {
          id: "workshop-video-3",
          title: "Popping Workshop Introduction",
          src: "https://www.youtube.com/watch?v=4ESPNEKl4yM",
          styles: ["Popping", "Animation"],
        },
        {
          id: "workshop-video-4",
          title: "Animation Techniques Explained",
          src: "https://www.youtube.com/watch?v=_E7SMkgHcsM",
          styles: ["Animation", "Popping"],
        },
        {
          id: "workshop-video-5",
          title: "Musicality in Popping",
          src: "https://www.youtube.com/watch?v=z-plXrkvhTg",
          styles: ["Popping"],
        },
      ],
      gallery: [
        {
          id: uuidv4(),
          title: "Workshop Gallery Photo 1",
          url: "https://storage.googleapis.com/dance-chives-posters/85acb25a-b3ae-444a-9989-b5138bab5648-jensine_alien.jpg",
          type: "photo",
          file: null,
        },
        {
          id: uuidv4(),
          title: "Workshop Gallery Photo 2",
          url: "https://storage.googleapis.com/dance-chives-posters/82b8285d-2b11-4f8c-af3c-341ecd419c3a-this_is_fine.jpg",
          type: "photo",
          file: null,
        },
        {
          id: uuidv4(),
          title: "Workshop Gallery Photo 3",
          url: "https://storage.googleapis.com/dance-chives-posters/85acb25a-b3ae-444a-9989-b5138bab5648-jensine_alien.jpg",
          type: "photo",
          file: null,
        },
      ],
      // No associatedEventId - standalone workshop
    },
  ];

  // Create workshops in Neo4j
  for (const workshop of workshops) {
    try {
      await insertWorkshop(workshop);
      console.log(`✅ Created Neo4j workshop: ${workshop.id}`);
    } catch (error) {
      console.error(`❌ Failed to create workshop ${workshop.id}:`, error);
      // Don't silently continue - log the actual error
      throw error;
    }
  }

  // Add tagging requests from base user (test-user-0) for one event in each city
  // Event 1 is in New York, Event 2 is in Seattle
  // Note: Video and section tag requests require a role
  // Event role requests require a role but no videoId or sectionId

  // Add video tag requests from base user (test-user-0) in one event in each city
  // Video tag requests require a role (e.g., "Dancer" or "Winner")
  // Videos can be tagged with: "Dancer", "Winner", or event roles like "Organizer", "DJ", etc.
  console.log("🌱 Creating video tag requests from base user...");
  const videoTagRequests = [
    {
      eventId: "event-1-new-york-creator",
      senderId: "test-user-0",
      targetUserId: "test-user-0", // Self-tagging
      videoId: "video-1-breaking-1v1-r1", // Video from Breaking 1v1 section
      sectionId: null,
      role: "Dancer", // Required role for video tags
      status: "PENDING" as const,
    },
    {
      eventId: "event-2-seattle-creator",
      senderId: "test-user-0",
      targetUserId: "test-user-0", // Self-tagging
      videoId: "video-1-waacking-2v2-seattle-r1", // Video from Waacking 2v2 section
      sectionId: null,
      role: "Winner", // Winner role for video tags
      status: "PENDING" as const,
    },
  ];

  for (const requestData of videoTagRequests) {
    try {
      await prisma.taggingRequest.create({
        data: requestData,
      });
      console.log(
        `✅ Created video tag request: ${requestData.eventId} -> video ${requestData.videoId} as ${requestData.role}`
      );
    } catch (error) {
      console.log(
        `ℹ️  Video tag request may already exist or event not found, skipping...`
      );
    }
  }

  // Add section tag requests from base user (test-user-0)
  // Section tag requests require a role (currently only "Winner" is supported)
  console.log("🌱 Creating section tag requests from base user...");
  const sectionTagRequests = [
    {
      eventId: "event-1-new-york-creator",
      senderId: "test-user-0",
      targetUserId: "test-user-0", // Self-tagging
      videoId: null,
      sectionId: sectionIds["section-1-breaking-1v1"], // Section from event 1
      role: "Winner", // Required role for section tags (currently only "Winner" is supported)
      status: "PENDING" as const,
    },
  ];

  for (const requestData of sectionTagRequests) {
    try {
      await prisma.taggingRequest.create({
        data: requestData,
      });
      console.log(
        `✅ Created section tag request: ${requestData.eventId} -> section ${requestData.sectionId} as ${requestData.role}`
      );
    } catch (error) {
      console.log(
        `ℹ️  Section tag request may already exist or event not found, skipping...`
      );
    }
  }

  // Add event role requests from base user (test-user-0) in one event in each city
  // Event role requests are tagging requests with a role specified but no videoId or sectionId
  // Using valid roles from AVAILABLE_ROLES
  console.log("🌱 Creating event role requests from base user...");
  const roleRequests = [
    {
      eventId: "event-1-new-york-creator",
      senderId: "test-user-0",
      targetUserId: "test-user-0", // Self-tagging with role
      videoId: null,
      sectionId: null,
      role: "Organizer", // Valid role from AVAILABLE_ROLES
      status: "PENDING" as const,
    },
    {
      eventId: "event-2-seattle-creator",
      senderId: "test-user-0",
      targetUserId: "test-user-0", // Self-tagging with role
      videoId: null,
      sectionId: null,
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
        `✅ Created event role request: ${requestData.eventId} -> ${requestData.targetUserId} (${requestData.role})`
      );
    } catch (error) {
      console.log(
        `ℹ️  Event role request may already exist or event not found, skipping...`
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

  // Add direct tags in Neo4j for privileged users (moderators, admins, super admins)
  // These users can tag directly without creating requests
  console.log("🌱 Creating direct tags in Neo4j for privileged users...");

  // Moderator (test-user-2) tags themselves as Dancer in a video
  try {
    await setVideoRoles(
      "event-3-new-york-moderator",
      "video-1-breaking-1v1-moderator-r1",
      "test-user-2",
      [VIDEO_ROLE_DANCER]
    );
    console.log(
      `✅ Tagged moderator as Dancer in video: event-3-new-york-moderator -> video-1-breaking-1v1-moderator-r1`
    );
  } catch (error) {
    console.log(
      `ℹ️  Failed to tag moderator in video, skipping... (${
        error instanceof Error ? error.message : "unknown error"
      })`
    );
  }

  // Admin (test-user-3) tags themselves as Winner in a video (setVideoRoles automatically ensures Dancer is present)
  try {
    await setVideoRoles(
      "event-4-seattle-admin",
      "video-1-breaking-1v1-admin-r1",
      "test-user-3",
      [VIDEO_ROLE_DANCER, VIDEO_ROLE_WINNER]
    );
    console.log(
      `✅ Tagged admin as Winner and Dancer in video: event-4-seattle-admin -> video-1-breaking-1v1-admin-r1`
    );
  } catch (error) {
    console.log(
      `ℹ️  Failed to tag admin in video, skipping... (${
        error instanceof Error ? error.message : "unknown error"
      })`
    );
  }

  // Super Admin (test-user-4) tags themselves as Winner in a section
  try {
    await setSectionWinner(
      "event-5-new-york-super-admin",
      sectionIds["section-1-breaking-1v1-super-admin"],
      "test-user-4"
    );
    console.log(
      `✅ Tagged super admin as Winner in section: event-5-new-york-super-admin -> ${sectionIds["section-1-breaking-1v1-super-admin"]}`
    );
  } catch (error) {
    console.log(
      `ℹ️  Failed to tag super admin in section, skipping... (${
        error instanceof Error ? error.message : "unknown error"
      })`
    );
  }

  // Admin (test-user-3) tags themselves with an event role
  try {
    await setEventRoles("event-4-seattle-admin", "test-user-3", "Photographer");
    console.log(
      `✅ Tagged admin with event role: event-4-seattle-admin -> test-user-3 (Photographer)`
    );
  } catch (error) {
    console.log(
      `ℹ️  Failed to tag admin with event role, skipping... (${
        error instanceof Error ? error.message : "unknown error"
      })`
    );
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
