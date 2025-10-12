import { signupUser } from "../src/db/queries/user";
import { insertEvent } from "../src/db/queries/event";
import { Event } from "../src/types/event";
import { City } from "../src/types/city";
import { v4 as uuidv4 } from "uuid";

async function seedNeo4j() {
  console.log("🌱 Seeding Neo4j database using existing query functions...");

  try {
    // Create test users using the signupUser function
    const testUsers = [
      {
        id: "test-user-1",
        profile: {
          displayName: "Alice J",
          username: "alicej",
          city: "New York",
          date: "05/15/1992",
        },
      },
      {
        id: "test-user-2",
        profile: {
          displayName: "B-Boy Bob",
          username: "bboyb",
          city: "Los Angeles",
          date: "08/22/1988",
        },
      },
      {
        id: "test-user-3",
        profile: {
          displayName: "Carol D",
          username: "carold",
          city: "Chicago",
          date: "12/03/1995",
        },
      },
      {
        id: "test-user-4",
        profile: {
          displayName: "DJ Dave",
          username: "djdave",
          city: "Miami",
          date: "01/10/1990",
        },
      },
      {
        id: "test-user-5",
        profile: {
          displayName: "Eva M",
          username: "evam",
          city: "Seattle",
          date: "09/18/1993",
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
      } catch (error) {
        console.log(
          `ℹ️  User ${user.profile.username} may already exist, skipping...`
        );
      }
    }

    // Create test events using the insertEvent function
    const testEvents: Event[] = [
      {
        id: "summer-battle-2024",
        createdAt: new Date(),
        updatedAt: new Date(),
        eventDetails: {
          title: "Summer Battle Championship 2024",
          description:
            "The biggest breaking competition of the summer featuring top dancers from around the world.",
          address: "123 Dance Street, New York, NY 10001",
          prize: "$5000 Cash Prize + Trophy",
          entryCost: "$50",
          startDate: "07/15/2024",
          startTime: "18:00",
          endTime: "23:00",
          schedule: "Registration: 6PM, Battles: 7PM, Finals: 10PM",
          creatorId: "test-user-1",
          poster: {
            id: uuidv4(),
            title: "Summer Battle 2024 Poster",
            url: "https://example.com/summer-battle-poster.jpg",
            type: "poster",
            file: null,
          },
          city: {
            id: 1,
            name: "New York",
            countryCode: "US",
            region: "New York",
            population: 8336817,
            timezone: "America/New_York",
          },
        },
        roles: [
          {
            id: "ORGANIZER",
            title: "ORGANIZER",
            user: {
              id: "test-user-1",
              displayName: "Alice J",
              username: "alicej",
            },
          },
          {
            id: "HEAD_JUDGE",
            title: "HEAD_JUDGE",
            user: {
              id: "test-user-2",
              displayName: "B-Boy Bob",
              username: "bboyb",
            },
          },
        ],
        sections: [
          {
            id: "breaking-battles",
            title: "Breaking Battles",
            description: "Main breaking competition with elimination rounds",
            hasBrackets: true,
            videos: [],
            brackets: [
              {
                id: "round-1",
                title: "Round 1 - Preliminaries",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Battle 1: Alice vs Bob",
                    src: "https://example.com/battle1.mp4",
                    taggedUsers: [
                      {
                        id: "test-user-1",
                        displayName: "Alice J",
                        username: "alicej",
                      },
                      {
                        id: "test-user-2",
                        displayName: "B-Boy Bob",
                        username: "bboyb",
                      },
                    ],
                  },
                ],
              },
              {
                id: "finals",
                title: "Finals",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Final Battle: Carol vs Dave",
                    src: "https://example.com/final-battle.mp4",
                    taggedUsers: [
                      {
                        id: "test-user-3",
                        displayName: "Carol D",
                        username: "carold",
                      },
                      {
                        id: "test-user-4",
                        displayName: "DJ Dave",
                        username: "djdave",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: "freestyle-showcase",
            title: "Freestyle Showcase",
            description: "Open freestyle session for all participants",
            hasBrackets: false,
            videos: [
              {
                id: uuidv4(),
                title: "Eva Freestyle Session",
                src: "https://example.com/eva-freestyle.mp4",
                taggedUsers: [
                  {
                    id: "test-user-5",
                    displayName: "Eva M",
                    username: "evam",
                  },
                ],
              },
            ],
            brackets: [],
          },
        ],
        subEvents: [
          {
            id: "workshop-session",
            title: "Breaking Workshop",
            description: "Learn from the pros in this intensive workshop",
            schedule: "Morning session before main event",
            startDate: "07/15/2024",
            address: "123 Dance Street, Studio B",
            startTime: "14:00",
            endTime: "16:00",
            poster: {
              id: uuidv4(),
              title: "Workshop Poster",
              url: "https://example.com/workshop-poster.jpg",
              type: "poster",
              file: null,
            },
          },
        ],
        gallery: [
          {
            id: uuidv4(),
            title: "Event Photo 1",
            url: "https://example.com/event-photo-1.jpg",
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Event Photo 2",
            url: "https://example.com/event-photo-2.jpg",
            type: "photo",
            file: null,
          },
        ],
      },
      {
        id: "west-coast-cypher",
        createdAt: new Date(),
        updatedAt: new Date(),
        eventDetails: {
          title: "West Coast Cypher Sessions",
          description:
            "Weekly cypher sessions bringing together the LA breaking community.",
          address: "456 Hip Hop Ave, Los Angeles, CA 90028",
          prize: "Community Recognition",
          entryCost: "Free",
          startDate: "08/01/2024",
          startTime: "19:00",
          endTime: "22:00",
          schedule: "Open cypher format, all styles welcome",
          creatorId: "test-user-2",
          poster: {
            id: uuidv4(),
            title: "West Coast Cypher Poster",
            url: "https://example.com/west-coast-poster.jpg",
            type: "poster",
            file: null,
          },
          city: {
            id: 2,
            name: "Los Angeles",
            countryCode: "US",
            region: "California",
            population: 3898747,
            timezone: "America/Los_Angeles",
          },
        },
        roles: [
          {
            id: "ORGANIZER",
            title: "ORGANIZER",
            user: {
              id: "test-user-2",
              displayName: "B-Boy Bob",
              username: "bboyb",
            },
          },
        ],
        sections: [
          {
            id: "open-cypher",
            title: "Open Cypher",
            description: "Free-form cypher session",
            hasBrackets: false,
            videos: [
              {
                id: uuidv4(),
                title: "Cypher Highlights",
                src: "https://example.com/cypher-highlights.mp4",
                taggedUsers: [
                  {
                    id: "test-user-2",
                    displayName: "B-Boy Bob",
                    username: "bboyb",
                  },
                  {
                    id: "test-user-4",
                    displayName: "DJ Dave",
                    username: "djdave",
                  },
                ],
              },
            ],
            brackets: [],
          },
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
