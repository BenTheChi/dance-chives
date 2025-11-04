import { signupUser } from "../src/db/queries/user";
import { insertEvent } from "../src/db/queries/event";
import { Event } from "../src/types/event";
import { City } from "../src/types/city";
import { v4 as uuidv4 } from "uuid";
import driver from "../src/db/driver";

async function seedNeo4j() {
  console.log("🌱 Seeding Neo4j database using existing query functions...");

  // Clear existing data to prevent duplicates
  console.log("🧹 Clearing existing Neo4j data...");
  const clearSession = driver.session();
  try {
    await clearSession.run("MATCH (n) DETACH DELETE n");
    console.log("✅ Neo4j database cleared");
  } catch (error) {
    console.error("⚠️  Error clearing database:", error);
  } finally {
    await clearSession.close();
  }

  const posterImages = [
    "https://storage.googleapis.com/dance-chives-posters/85acb25a-b3ae-444a-9989-b5138bab5648-jensine_alien.jpg",
    "https://storage.googleapis.com/dance-chives-posters/82b8285d-2b11-4f8c-af3c-341ecd419c3a-this_is_fine.jpg",
    "https://storage.googleapis.com/dance-chives-posters/632f1ebc-6f3f-41d3-993c-83337636a1c9-battle_guests.jpg",
  ];

  try {
    // Create 5 users matching the Prisma seed structure
    const testUsers = [
      {
        id: "test-user-0",
        profile: {
          displayName: "Base User",
          username: "baseuser",
          city: "Seattle",
          date: "01/01/1990",
        },
      },
      {
        id: "test-user-1",
        profile: {
          displayName: "Creator",
          username: "creator",
          city: "New York",
          date: "01/01/1990",
        },
      },
      {
        id: "test-user-2",
        profile: {
          displayName: "Moderator",
          username: "moderator",
          city: "New York",
          date: "01/01/1990",
        },
      },
      {
        id: "test-user-3",
        profile: {
          displayName: "Admin",
          username: "admin",
          city: "Seattle",
          date: "01/01/1990",
        },
      },
      {
        id: "test-user-4",
        profile: {
          displayName: "Super Admin",
          username: "superadmin",
          city: "New York",
          date: "01/01/1990",
        },
      },
    ];

    // City definitions - only Seattle and New York
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

    // Create users using the signupUser function
    for (const user of testUsers) {
      try {
        await signupUser(user.id, user.profile);
        console.log(
          `✅ Created user: ${user.profile.displayName} (${user.profile.username})`
        );
      } catch (error) {
        console.log(
          `ℹ️  User ${user.profile.username} may already exist, skipping...`
        );
      }
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

    // Create 5 events matching the Prisma seed structure
    // Base user cannot create events, only be tagged in them
    const testEvents: Event[] = [
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
            url: posterImages[0],
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
            url: posterImages[1],
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
            url: posterImages[0],
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
            url: posterImages[1],
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
            url: posterImages[0],
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

    // Create events using the insertEvent function
    for (const event of testEvents) {
      try {
        await insertEvent(event);
        console.log(`✅ Created event: ${event.eventDetails.title}`);
      } catch (error) {
        console.log(
          `ℹ️  Event ${event.eventDetails.title} may already exist, skipping...`
        );
        console.log(`   Error: ${error}`);
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
    .then(() => {
      console.log("✅ Neo4j seeding script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Neo4j seeding script failed:", error);
      process.exit(1);
    });
}

export { seedNeo4j };
