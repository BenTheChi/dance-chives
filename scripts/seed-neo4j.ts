import { signupUser } from "../src/db/queries/user";
import { insertEvent } from "../src/db/queries/event";
import { Event, EventDetails, Section, Video } from "../src/types/event";
import { generateSlugId } from "../src/lib/utils";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import driver from "../src/db/driver";
import { randomUUID } from "crypto";

// Create a Prisma client for scripts (without server-only import)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper function to sync event to PostgreSQL EventCard and Event
async function syncEventToPostgreSQL(
  eventId: string,
  eventDetails: EventDetails,
  sections: Section[]
): Promise<void> {
  // Aggregate styles from event and sections
  const eventStyles = eventDetails.styles || [];
  const sectionStyles = sections.flatMap((s) => s.styles || []);
  const videoStyles = sections.flatMap((s) => {
    const bracketVideos = s.brackets?.flatMap((b) => b.videos || []) || [];
    const directVideos = s.videos || [];
    return [...bracketVideos, ...directVideos].flatMap((v) => v.styles || []);
  });
  const allStyles = [
    ...new Set([...eventStyles, ...sectionStyles, ...videoStyles]),
  ];

  const eventTimezone = eventDetails.city.timezone || null;
  const displayDateLocal = eventDetails.dates?.[0]?.date || null;
  const additionalDatesCount = Math.max(
    0,
    (eventDetails.dates?.length || 0) - 1
  );

  // Create or update PostgreSQL Event record (links event to user)
  await prisma.event.upsert({
    where: { eventId },
    update: {
      userId: eventDetails.creatorId,
      creator: true,
    },
    create: {
      eventId,
      userId: eventDetails.creatorId,
      creator: true,
    },
  });

  // Create or update EventCard (read model for fast queries)
  await prisma.eventCard.upsert({
    where: { eventId },
    update: {
      title: eventDetails.title,
      eventType: eventDetails.eventType,
      cityId: eventDetails.city?.id ?? null,
      cityName: eventDetails.city?.name ?? null,
      region: eventDetails.city?.region ?? null,
      countryCode: eventDetails.city?.countryCode ?? null,
      eventTimezone,
      posterUrl: eventDetails.poster?.url ?? null,
      styles: allStyles,
      displayDateLocal,
      additionalDatesCount,
      status: eventDetails.status || "visible",
    } as any,
    create: {
      eventId,
      title: eventDetails.title,
      eventType: eventDetails.eventType,
      cityId: eventDetails.city?.id ?? null,
      cityName: eventDetails.city?.name ?? null,
      region: eventDetails.city?.region ?? null,
      countryCode: eventDetails.city?.countryCode ?? null,
      eventTimezone,
      posterUrl: eventDetails.poster?.url ?? null,
      styles: allStyles,
      displayDateLocal,
      additionalDatesCount,
      status: eventDetails.status || "visible",
    } as any,
  });
}

async function seedNeo4j() {
  console.log("🌱 Seeding Neo4j database using existing query functions...");
  console.log("ℹ️  Note: Neo4j data is cleared by prisma/seed.ts");
  console.log(
    "ℹ️  This script only creates users if they don't exist (using MERGE)"
  );

  try {
    // Create users matching the Prisma seed structure
    const testUsers = [
      {
        id: "test-user-0",
        profile: {
          displayName: "Base User",
          username: "baseuser",
          city: {
            id: "ChIJVTPpYqBvqkARlBKGEkAs8BY", // Seattle place_id
            name: "Seattle",
            countryCode: "US",
            region: "Washington",
            timezone: "America/Los_Angeles",
            latitude: 47.6062,
            longitude: -122.3321,
          },
          date: "01/01/1990",
          bio: "Dance enthusiast from Seattle",
          instagram: "@baseuser",
          website: "",
          image: "",
          styles: [],
        },
      },
      {
        id: "test-user-1",
        profile: {
          displayName: "Creator",
          username: "creator",
          city: {
            id: "ChIJOwg_06VPwokRYv534QaPC8g", // New York City place_id
            name: "New York City",
            countryCode: "US",
            region: "New York",
            timezone: "America/New_York",
            latitude: 40.7128,
            longitude: -74.006,
          },
          date: "01/01/1990",
          bio: "Event creator and organizer",
          instagram: "@creator",
          website: "https://creator.example.com",
          image: "",
          styles: [],
        },
      },
      {
        id: "test-user-2",
        profile: {
          displayName: "Moderator",
          username: "moderator",
          city: {
            id: "ChIJOwg_06VPwokRYv534QaPC8g", // New York City place_id
            name: "New York City",
            countryCode: "US",
            region: "New York",
            timezone: "America/New_York",
            latitude: 40.7128,
            longitude: -74.006,
          },
          date: "01/01/1990",
          bio: "Community moderator",
          instagram: "",
          website: "",
          image: "",
          styles: [],
        },
      },
      {
        id: "test-user-3",
        profile: {
          displayName: "Admin",
          username: "admin",
          city: {
            id: "ChIJVTPpYqBvqkARlBKGEkAs8BY", // Seattle place_id
            name: "Seattle",
            countryCode: "US",
            region: "Washington",
            timezone: "America/Los_Angeles",
            latitude: 47.6062,
            longitude: -122.3321,
          },
          date: "01/01/1990",
          bio: "Platform administrator",
          instagram: "@admin",
          website: "",
          image: "",
          styles: [],
        },
      },
      {
        id: "test-user-4",
        profile: {
          displayName: "Super Admin",
          username: "superadmin",
          city: {
            id: "ChIJOwg_06VPwokRYv534QaPC8g", // New York City place_id
            name: "New York City",
            countryCode: "US",
            region: "New York",
            timezone: "America/New_York",
            latitude: 40.7128,
            longitude: -74.006,
          },
          date: "01/01/1990",
          bio: "Super administrator with full access",
          instagram: "@superadmin",
          website: "https://superadmin.example.com",
          image: "",
          styles: [],
        },
      },
    ];

    // Create users using the signupUser function
    for (const user of testUsers) {
      try {
        await signupUser(user.id, user.profile);
        console.log(
          `✅ Created user: ${user.profile.displayName} (${user.profile.username})`
        );

        // Create UserCard entry in PostgreSQL for profiles page
        const cityObj =
          typeof user.profile.city === "object" ? user.profile.city : null;
        await prisma.userCard.upsert({
          where: { userId: user.id },
          update: {
            username: user.profile.username,
            displayName: user.profile.displayName,
            imageUrl: user.profile.image ?? null,
            cityId: cityObj?.id ?? null,
            cityName: cityObj?.name ?? null,
            styles: ((user.profile.styles || []) as string[]).map((s) =>
              s.toUpperCase().trim()
            ),
          },
          create: {
            userId: user.id,
            username: user.profile.username,
            displayName: user.profile.displayName,
            imageUrl: user.profile.image ?? null,
            cityId: cityObj?.id ?? null,
            cityName: cityObj?.name ?? null,
            styles: ((user.profile.styles || []) as string[]).map((s) =>
              s.toUpperCase().trim()
            ),
          },
        });
        console.log(
          `✅ Created UserCard for: ${user.profile.displayName} (${user.profile.username})`
        );
      } catch (error) {
        console.log(
          `ℹ️  User ${user.profile.username} may already exist, skipping...`
        );
      }
    }

    // Create events with sections and videos
    console.log("🌱 Creating test events...");

    const youtubeVideos = [
      "https://www.youtube.com/watch?v=TgF9Q5gWsVI&pp=2AYB",
      "https://www.youtube.com/watch?v=qqqnnvl8wfI",
      "https://www.youtube.com/watch?v=v-OjQzivU3g",
      "https://www.youtube.com/watch?v=MovXOlmvuxI",
    ];

    // Event 1: Breaking Battle Championship
    const event1Id = generateSlugId("Breaking Battle Championship 2025");
    const event1: Event = {
      id: event1Id,
      createdAt: new Date(),
      updatedAt: new Date(),
      eventDetails: {
        title: "Breaking Battle Championship 2025",
        description:
          "Join us for an epic breaking battle championship featuring top dancers from around the world. Multiple rounds, intense battles, and incredible performances await!",
        location: "123 Dance Street, New York, NY 10001",
        cost: "$25",
        prize: "$5,000",
        creatorId: "test-user-1",
        dates: [
          {
            date: "06/15/2025",
            startTime: "18:00",
            endTime: "23:00",
          },
        ],
        schedule:
          "6:00 PM - Doors Open\n7:00 PM - Preliminaries\n8:00 PM - Semi-Finals\n9:00 PM - Finals\n10:00 PM - Awards",
        city: {
          id: "ChIJOwg_06VPwokRYv534QaPC8g", // New York City place_id
          name: "New York City",
          countryCode: "US",
          region: "New York",
          timezone: "America/New_York",
          latitude: 40.7128,
          longitude: -74.006,
        },
        styles: ["Breaking", "Hip-Hop"],
        eventType: "Battle",
        status: "visible",
        poster: null,
        originalPoster: null,
      },
      roles: [],
      gallery: [],
      sections: [
        {
          id: randomUUID(),
          title: "1v1 Battle",
          description: "Intense one-on-one breaking battles",
          sectionType: "Battle",
          hasBrackets: true,
          videos: [],
          brackets: [
            {
              id: randomUUID(),
              title: "Round 1",
              videos: [
                {
                  id: randomUUID(),
                  title: "Battle Round 1 - Match 1",
                  src: youtubeVideos[0],
                  type: "battle",
                  styles: ["Breaking"],
                  taggedDancers: [
                    {
                      id: "test-user-0",
                      displayName: "Base User",
                      username: "baseuser",
                    },
                    {
                      id: "test-user-1",
                      displayName: "Creator",
                      username: "creator",
                    },
                  ],
                },
                {
                  id: randomUUID(),
                  title: "Battle Round 1 - Match 2",
                  src: youtubeVideos[1],
                  type: "battle",
                  styles: ["Breaking"],
                  taggedDancers: [
                    {
                      id: "test-user-2",
                      displayName: "Moderator",
                      username: "moderator",
                    },
                    {
                      id: "test-user-3",
                      displayName: "Admin",
                      username: "admin",
                    },
                  ],
                },
              ],
            },
            {
              id: randomUUID(),
              title: "Finals",
              videos: [
                {
                  id: randomUUID(),
                  title: "Finals Battle",
                  src: youtubeVideos[2],
                  type: "battle",
                  styles: ["Breaking"],
                  taggedDancers: [
                    {
                      id: "test-user-1",
                      displayName: "Creator",
                      username: "creator",
                    },
                    {
                      id: "test-user-3",
                      displayName: "Admin",
                      username: "admin",
                    },
                  ],
                  taggedWinners: [
                    {
                      id: "test-user-1",
                      displayName: "Creator",
                      username: "creator",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    // Event 2: Hip-Hop Freestyle Session
    const event2Id = generateSlugId("Hip-Hop Freestyle Session Seattle");
    const event2: Event = {
      id: event2Id,
      createdAt: new Date(),
      updatedAt: new Date(),
      eventDetails: {
        title: "Hip-Hop Freestyle Session Seattle",
        description:
          "A laid-back freestyle session for hip-hop dancers to express themselves and connect with the community. All levels welcome!",
        location: "456 Music Avenue, Seattle, WA 98101",
        cost: "Free",
        creatorId: "test-user-0",
        dates: [
          {
            date: "07/20/2025",
            startTime: "19:00",
            endTime: "22:00",
          },
        ],
        schedule:
          "7:00 PM - Open Cypher\n8:00 PM - Featured Performances\n9:00 PM - Open Freestyle",
        city: {
          id: "ChIJVTPpYqBvqkARlBKGEkAs8BY", // Seattle place_id
          name: "Seattle",
          countryCode: "US",
          region: "Washington",
          timezone: "America/Los_Angeles",
          latitude: 47.6062,
          longitude: -122.3321,
        },
        styles: ["Hip-Hop"],
        eventType: "Session",
        status: "visible",
        poster: null,
        originalPoster: null,
      },
      roles: [],
      gallery: [],
      sections: [
        {
          id: randomUUID(),
          title: "Freestyle Performances",
          description: "Recorded freestyle sessions from the event",
          sectionType: "Session",
          hasBrackets: false,
          brackets: [],
          videos: [
            {
              id: randomUUID(),
              title: "Freestyle Session Highlights",
              src: youtubeVideos[3],
              type: "freestyle",
              styles: ["Hip-Hop"],
              taggedDancers: [
                {
                  id: "test-user-0",
                  displayName: "Base User",
                  username: "baseuser",
                },
                {
                  id: "test-user-4",
                  displayName: "Super Admin",
                  username: "superadmin",
                },
              ],
            },
          ],
        },
      ],
    };

    // Event 3: Choreography Showcase
    const event3Id = generateSlugId("Choreography Showcase 2025");
    const event3: Event = {
      id: event3Id,
      createdAt: new Date(),
      updatedAt: new Date(),
      eventDetails: {
        title: "Choreography Showcase 2025",
        description:
          "A showcase of original choreography pieces from talented choreographers. Watch incredible routines and support the dance community!",
        location: "789 Arts Center, New York, NY 10002",
        cost: "$15",
        creatorId: "test-user-2",
        dates: [
          {
            date: "08/10/2025",
            startTime: "19:30",
            endTime: "21:30",
          },
        ],
        schedule:
          "7:30 PM - Doors Open\n8:00 PM - Showcase Begins\n9:30 PM - Meet & Greet",
        city: {
          id: "ChIJOwg_06VPwokRYv534QaPC8g", // New York City place_id
          name: "New York City",
          countryCode: "US",
          region: "New York",
          timezone: "America/New_York",
          latitude: 40.7128,
          longitude: -74.006,
        },
        styles: ["Hip-Hop"],
        eventType: "Performance",
        status: "visible",
        poster: null,
        originalPoster: null,
      },
      roles: [],
      gallery: [],
      sections: [
        {
          id: randomUUID(),
          title: "Choreography Pieces",
          description: "Recorded performances from the showcase",
          sectionType: "Showcase",
          hasBrackets: false,
          brackets: [],
          videos: [
            {
              id: randomUUID(),
              title: "Opening Piece",
              src: youtubeVideos[0],
              type: "choreography",
              styles: ["Hip-Hop"],
              taggedChoreographers: [
                {
                  id: "test-user-1",
                  displayName: "Creator",
                  username: "creator",
                },
              ],
              taggedDancers: [
                {
                  id: "test-user-0",
                  displayName: "Base User",
                  username: "baseuser",
                },
                {
                  id: "test-user-2",
                  displayName: "Moderator",
                  username: "moderator",
                },
              ],
            },
            {
              id: randomUUID(),
              title: "Featured Choreography",
              src: youtubeVideos[1],
              type: "choreography",
              styles: ["Hip-Hop"],
              taggedChoreographers: [
                {
                  id: "test-user-3",
                  displayName: "Admin",
                  username: "admin",
                },
              ],
              taggedDancers: [
                {
                  id: "test-user-4",
                  displayName: "Super Admin",
                  username: "superadmin",
                },
              ],
            },
          ],
        },
      ],
    };

    // Create all events (check if they already exist first)
    const events = [event1, event2, event3];
    for (const event of events) {
      try {
        // Check if event already exists in Neo4j
        const session = driver.session();
        let eventExists = false;
        try {
          const result = await session.run(
            "MATCH (e:Event {id: $eventId}) RETURN e LIMIT 1",
            { eventId: event.id }
          );
          eventExists = result.records.length > 0;
        } finally {
          await session.close();
        }

        if (eventExists) {
          console.log(
            `ℹ️  Event ${event.eventDetails.title} already exists, skipping creation`
          );
          // Still sync to PostgreSQL in case it's missing there
          await syncEventToPostgreSQL(
            event.id,
            event.eventDetails,
            event.sections
          );
        } else {
          await insertEvent(event);
          await syncEventToPostgreSQL(
            event.id,
            event.eventDetails,
            event.sections
          );
          console.log(`✅ Created event: ${event.eventDetails.title}`);
        }
      } catch (error) {
        console.error(
          `❌ Failed to create event ${event.eventDetails.title}:`,
          error
        );
      }
    }

    console.log("🎉 Neo4j seeding completed using existing query functions!");
  } catch (error) {
    console.error("❌ Neo4j seeding failed:", error);
    throw error;
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedNeo4j()
    .then(async () => {
      console.log("✅ Neo4j seeding script completed successfully");
      await prisma.$disconnect();
      await pool.end();
      await driver.close();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error("❌ Neo4j seeding script failed:", error);
      await prisma.$disconnect().catch(() => {});
      await pool.end().catch(() => {});
      await driver.close().catch(() => {});
      process.exit(1);
    });
}

export { seedNeo4j };
