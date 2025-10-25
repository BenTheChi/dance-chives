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

    // Define comprehensive cities data
    const cities: City[] = [
      {
        id: 1,
        name: "New York",
        countryCode: "US",
        region: "New York",
        population: 8336817,
        timezone: "America/New_York",
      },
      {
        id: 2,
        name: "Los Angeles",
        countryCode: "US",
        region: "California",
        population: 3898747,
        timezone: "America/Los_Angeles",
      },
      {
        id: 3,
        name: "Chicago",
        countryCode: "US",
        region: "Illinois",
        population: 2746388,
        timezone: "America/Chicago",
      },
      {
        id: 4,
        name: "Miami",
        countryCode: "US",
        region: "Florida",
        population: 467963,
        timezone: "America/New_York",
      },
      {
        id: 5,
        name: "Seattle",
        countryCode: "US",
        region: "Washington",
        population: 753675,
        timezone: "America/Los_Angeles",
      },
      {
        id: 6,
        name: "London",
        countryCode: "GB",
        region: "England",
        population: 8982000,
        timezone: "Europe/London",
      },
      {
        id: 7,
        name: "Paris",
        countryCode: "FR",
        region: "Île-de-France",
        population: 2165423,
        timezone: "Europe/Paris",
      },
      {
        id: 8,
        name: "Tokyo",
        countryCode: "JP",
        region: "Kantō",
        population: 13960000,
        timezone: "Asia/Tokyo",
      },
      {
        id: 9,
        name: "Seoul",
        countryCode: "KR",
        region: "Seoul",
        population: 9776000,
        timezone: "Asia/Seoul",
      },
      {
        id: 10,
        name: "Toronto",
        countryCode: "CA",
        region: "Ontario",
        population: 2731571,
        timezone: "America/Toronto",
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

    // Create test events using the insertEvent function with comprehensive data
    const testEvents: Event[] = [
      {
        id: "summer-battle-2024",
        createdAt: new Date(),
        updatedAt: new Date(),
        eventDetails: {
          title: "Summer Battle Championship 2024",
          description:
            "The biggest breaking competition of the summer featuring top dancers from around the world. Join us for an unforgettable celebration of hip-hop culture, featuring world-class breakers, live DJs, and an electric atmosphere. This is the premier event of the season!",
          address:
            "123 Dance Street, Brooklyn Performance Center, New York, NY 10001",
          prize: "$5000 Cash Prize + Trophy + Sponsorship Deal",
          entryCost: "$50 pre-registration, $75 at door",
          startDate: "07/15/2024",
          startTime: "18:00",
          endTime: "23:00",
          schedule:
            "Registration: 6PM, Opening Ceremony: 6:30PM, Preliminary Battles: 7PM, Semifinals: 9PM, Finals: 10PM, Awards: 11PM",
          creatorId: "test-user-1",
          poster: {
            id: uuidv4(),
            title: "Summer Battle 2024 Official Poster",
            url: posterImages[2],
            type: "poster",
            file: null,
          },
          city: cities[0],
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
          {
            id: "JUDGE_1",
            title: "JUDGE",
            user: {
              id: "test-user-3",
              displayName: "Carol D",
              username: "carold",
            },
          },
          {
            id: "DJ",
            title: "DJ",
            user: {
              id: "test-user-4",
              displayName: "DJ Dave",
              username: "djdave",
            },
          },
          {
            id: "MC",
            title: "MC",
            user: {
              id: "test-user-5",
              displayName: "Eva M",
              username: "evam",
            },
          },
        ],
        sections: [
          {
            id: "breaking-battles-main",
            title: "Main Breaking Battles",
            description:
              "Championship breaking competition with elimination rounds - 1v1 format",
            hasBrackets: true,
            videos: [],
            brackets: [
              {
                id: "round-1-prelims",
                title: "Round 1 - Preliminaries",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Battle 1: Alice J vs B-Boy Bob",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
                  {
                    id: uuidv4(),
                    title: "Battle 2: Carol D vs Eva M",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    taggedUsers: [
                      {
                        id: "test-user-3",
                        displayName: "Carol D",
                        username: "carold",
                      },
                      {
                        id: "test-user-5",
                        displayName: "Eva M",
                        username: "evam",
                      },
                    ],
                  },
                ],
              },
              {
                id: "semifinals",
                title: "Semifinals",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Semifinal 1: Alice J vs Carol D",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    taggedUsers: [
                      {
                        id: "test-user-1",
                        displayName: "Alice J",
                        username: "alicej",
                      },
                      {
                        id: "test-user-3",
                        displayName: "Carol D",
                        username: "carold",
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
                    title: "Final Battle: Alice J vs Carol D - Best of 3",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    taggedUsers: [
                      {
                        id: "test-user-1",
                        displayName: "Alice J",
                        username: "alicej",
                      },
                      {
                        id: "test-user-3",
                        displayName: "Carol D",
                        username: "carold",
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
            description:
              "Open freestyle session for all participants and attendees",
            hasBrackets: false,
            videos: [
              {
                id: uuidv4(),
                title: "Eva M Freestyle Session",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                taggedUsers: [
                  {
                    id: "test-user-5",
                    displayName: "Eva M",
                    username: "evam",
                  },
                ],
              },
              {
                id: uuidv4(),
                title: "B-Boy Bob Power Moves Showcase",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                taggedUsers: [
                  {
                    id: "test-user-2",
                    displayName: "B-Boy Bob",
                    username: "bboyb",
                  },
                ],
              },
              {
                id: uuidv4(),
                title: "Group Cypher - All Participants",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
                  {
                    id: "test-user-3",
                    displayName: "Carol D",
                    username: "carold",
                  },
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
          {
            id: "crew-battles",
            title: "3v3 Crew Battles",
            description: "Team battles featuring the best crews in the region",
            hasBrackets: true,
            videos: [],
            brackets: [
              {
                id: "crew-round-1",
                title: "Crew Round 1",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Crew Battle: NYC All-Stars vs LA Breakers",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
                      {
                        id: "test-user-3",
                        displayName: "Carol D",
                        username: "carold",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        subEvents: [
          {
            id: "workshop-session-1",
            title: "Breaking Fundamentals Workshop",
            description:
              "Learn the fundamentals of breaking from world-renowned instructors. Perfect for beginners and intermediate dancers looking to refine their technique.",
            schedule: "Afternoon session before main event",
            startDate: "07/15/2024",
            address: "123 Dance Street, Studio B, Brooklyn Performance Center",
            startTime: "14:00",
            endTime: "16:00",
            poster: {
              id: uuidv4(),
              title: "Breaking Workshop Poster",
              url: posterImages[0],
              type: "poster",
              file: null,
            },
          },
          {
            id: "kids-battle",
            title: "Kids Breaking Showcase",
            description:
              "Special showcase for young breakers under 16 years old",
            schedule: "Early evening slot",
            startDate: "07/15/2024",
            address: "123 Dance Street, Main Stage",
            startTime: "17:00",
            endTime: "17:45",
            poster: {
              id: uuidv4(),
              title: "Kids Battle Poster",
              url: posterImages[2],
              type: "poster",
              file: null,
            },
          },
        ],
        gallery: [
          {
            id: uuidv4(),
            title: "Opening Ceremony Photo",
            url: posterImages[0],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Crowd Energy Shot",
            url: posterImages[1],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Winners Podium",
            url: posterImages[2],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "DJ Performance",
            url: posterImages[0],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Backstage Moments",
            url: posterImages[1],
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
            "Weekly cypher sessions bringing together the LA breaking community. An open and welcoming space for dancers of all levels to share moves, build community, and celebrate hip-hop culture.",
          address: "456 Hip Hop Ave, Venice Beach, Los Angeles, CA 90028",
          prize: "Community Recognition & Featured on Social Media",
          entryCost: "Free",
          startDate: "08/01/2024",
          startTime: "19:00",
          endTime: "22:00",
          schedule:
            "7PM Warm-up, 7:30PM Open Cypher, 9PM Featured Performances, 10PM Free Session",
          creatorId: "test-user-2",
          poster: {
            id: uuidv4(),
            title: "West Coast Cypher Poster",
            url: posterImages[0],
            type: "poster",
            file: null,
          },
          city: cities[1],
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
          {
            id: "DJ",
            title: "DJ",
            user: {
              id: "test-user-4",
              displayName: "DJ Dave",
              username: "djdave",
            },
          },
        ],
        sections: [
          {
            id: "open-cypher",
            title: "Open Cypher",
            description: "Free-form cypher session - all styles welcome",
            hasBrackets: false,
            videos: [
              {
                id: uuidv4(),
                title: "Cypher Highlights Reel",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
              {
                id: uuidv4(),
                title: "Eva M Smooth Footwork Session",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
        subEvents: [],
        gallery: [
          {
            id: uuidv4(),
            title: "Cypher Circle Overhead Shot",
            url: posterImages[0],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Sunset Cypher Session",
            url: posterImages[2],
            type: "photo",
            file: null,
          },
        ],
      },
      {
        id: "chicago-all-styles-jam",
        createdAt: new Date(),
        updatedAt: new Date(),
        eventDetails: {
          title: "Chicago All Styles Jam 2024",
          description:
            "The Midwest's premier all-styles dance event featuring breaking, popping, locking, house, and more. Three days of battles, workshops, and community building.",
          address: "789 Urban Dance Center, Chicago, IL 60601",
          prize: "$3000 total prize pool across all categories",
          entryCost: "$40 per category",
          startDate: "09/20/2024",
          startTime: "10:00",
          endTime: "20:00",
          schedule: "10AM-2PM Workshops, 2PM-8PM Battles across all categories",
          creatorId: "test-user-3",
          poster: {
            id: uuidv4(),
            title: "Chicago All Styles Jam Poster",
            url: posterImages[1],
            type: "poster",
            file: null,
          },
          city: cities[2],
        },
        roles: [
          {
            id: "ORGANIZER",
            title: "ORGANIZER",
            user: {
              id: "test-user-3",
              displayName: "Carol D",
              username: "carold",
            },
          },
          {
            id: "HEAD_JUDGE",
            title: "HEAD_JUDGE",
            user: {
              id: "test-user-1",
              displayName: "Alice J",
              username: "alicej",
            },
          },
          {
            id: "JUDGE_2",
            title: "JUDGE",
            user: {
              id: "test-user-2",
              displayName: "B-Boy Bob",
              username: "bboyb",
            },
          },
          {
            id: "HOST",
            title: "HOST",
            user: {
              id: "test-user-5",
              displayName: "Eva M",
              username: "evam",
            },
          },
        ],
        sections: [
          {
            id: "breaking-section",
            title: "Breaking Battles",
            description: "1v1 Breaking competition",
            hasBrackets: true,
            videos: [],
            brackets: [
              {
                id: "breaking-prelims",
                title: "Breaking Preliminaries",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Breaking Battle 1",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
                id: "breaking-finals",
                title: "Breaking Finals",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Breaking Championship Final",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    taggedUsers: [
                      {
                        id: "test-user-2",
                        displayName: "B-Boy Bob",
                        username: "bboyb",
                      },
                      {
                        id: "test-user-3",
                        displayName: "Carol D",
                        username: "carold",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: "popping-section",
            title: "Popping Battles",
            description: "1v1 Popping competition",
            hasBrackets: true,
            videos: [],
            brackets: [
              {
                id: "popping-finals",
                title: "Popping Finals",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Popping Championship Final",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    taggedUsers: [
                      {
                        id: "test-user-4",
                        displayName: "DJ Dave",
                        username: "djdave",
                      },
                      {
                        id: "test-user-5",
                        displayName: "Eva M",
                        username: "evam",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: "showcase-performances",
            title: "Special Guest Performances",
            description: "Featured performances by special guest dancers",
            hasBrackets: false,
            videos: [
              {
                id: uuidv4(),
                title: "Carol D Solo Performance",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                taggedUsers: [
                  {
                    id: "test-user-3",
                    displayName: "Carol D",
                    username: "carold",
                  },
                ],
              },
            ],
            brackets: [],
          },
        ],
        subEvents: [
          {
            id: "popping-workshop",
            title: "Popping Fundamentals Workshop",
            description:
              "Master the basics of popping with legendary instructors",
            schedule: "Morning Workshop Day 1",
            startDate: "09/20/2024",
            address: "789 Urban Dance Center, Studio A",
            startTime: "10:00",
            endTime: "12:00",
          },
          {
            id: "breaking-workshop",
            title: "Advanced Breaking Techniques",
            description: "Take your breaking to the next level",
            schedule: "Morning Workshop Day 1",
            startDate: "09/20/2024",
            address: "789 Urban Dance Center, Studio B",
            startTime: "10:00",
            endTime: "12:00",
          },
        ],
        gallery: [
          {
            id: uuidv4(),
            title: "All Styles Battle Action",
            url: posterImages[0],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Workshop Session",
            url: posterImages[1],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Community Photo",
            url: posterImages[2],
            type: "photo",
            file: null,
          },
        ],
      },
      {
        id: "miami-heat-battle",
        createdAt: new Date(),
        updatedAt: new Date(),
        eventDetails: {
          title: "Miami Heat Breaking Championship",
          description:
            "Bringing the heat to South Beach with the most intense breaking competition of the year. International competitors welcome!",
          address: "321 Ocean Drive, South Beach, Miami, FL 33139",
          prize: "$10,000 Grand Prize + International Competition Invites",
          entryCost: "$100 registration fee",
          startDate: "10/25/2024",
          startTime: "16:00",
          endTime: "01:00",
          schedule:
            "4PM Registration & Check-in, 5PM Opening Show, 6PM Battles Begin, 11PM Finals, 12AM After Party",
          creatorId: "test-user-4",
          poster: {
            id: uuidv4(),
            title: "Miami Heat Battle Official Poster",
            url: posterImages[0],
            type: "poster",
            file: null,
          },
          city: cities[3],
        },
        roles: [
          {
            id: "ORGANIZER",
            title: "ORGANIZER",
            user: {
              id: "test-user-4",
              displayName: "DJ Dave",
              username: "djdave",
            },
          },
          {
            id: "HEAD_JUDGE",
            title: "HEAD_JUDGE",
            user: {
              id: "test-user-1",
              displayName: "Alice J",
              username: "alicej",
            },
          },
          {
            id: "JUDGE_1",
            title: "JUDGE",
            user: {
              id: "test-user-2",
              displayName: "B-Boy Bob",
              username: "bboyb",
            },
          },
          {
            id: "JUDGE_2",
            title: "JUDGE",
            user: {
              id: "test-user-3",
              displayName: "Carol D",
              username: "carold",
            },
          },
          {
            id: "MC",
            title: "MC",
            user: {
              id: "test-user-5",
              displayName: "Eva M",
              username: "evam",
            },
          },
          {
            id: "DJ",
            title: "DJ",
            user: {
              id: "test-user-4",
              displayName: "DJ Dave",
              username: "djdave",
            },
          },
        ],
        sections: [
          {
            id: "miami-main-battle",
            title: "Main Championship Battle",
            description:
              "The ultimate showdown - best of the best compete for glory",
            hasBrackets: true,
            videos: [],
            brackets: [
              {
                id: "top-32",
                title: "Top 32",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Top 32 Battle Montage",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
                      {
                        id: "test-user-3",
                        displayName: "Carol D",
                        username: "carold",
                      },
                    ],
                  },
                ],
              },
              {
                id: "top-16",
                title: "Top 16",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Top 16 Highlights",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    taggedUsers: [
                      {
                        id: "test-user-2",
                        displayName: "B-Boy Bob",
                        username: "bboyb",
                      },
                      {
                        id: "test-user-5",
                        displayName: "Eva M",
                        username: "evam",
                      },
                    ],
                  },
                ],
              },
              {
                id: "quarterfinals",
                title: "Quarterfinals",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Quarterfinal Battle 1",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    taggedUsers: [
                      {
                        id: "test-user-1",
                        displayName: "Alice J",
                        username: "alicej",
                      },
                      {
                        id: "test-user-3",
                        displayName: "Carol D",
                        username: "carold",
                      },
                    ],
                  },
                  {
                    id: uuidv4(),
                    title: "Quarterfinal Battle 2",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    taggedUsers: [
                      {
                        id: "test-user-2",
                        displayName: "B-Boy Bob",
                        username: "bboyb",
                      },
                      {
                        id: "test-user-5",
                        displayName: "Eva M",
                        username: "evam",
                      },
                    ],
                  },
                ],
              },
              {
                id: "semifinals-miami",
                title: "Semifinals",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Semifinal Epic Battle",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
                id: "finals-miami",
                title: "Championship Finals",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Championship Final - Best of 5 Rounds",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
            ],
          },
          {
            id: "exhibition-battles",
            title: "Exhibition Battles",
            description:
              "Special showcase battles featuring international legends",
            hasBrackets: false,
            videos: [
              {
                id: uuidv4(),
                title: "Legends Exhibition Match",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
            brackets: [],
          },
        ],
        subEvents: [
          {
            id: "kids-under-18",
            title: "Under 18 Championship",
            description:
              "Youth championship for the next generation of breakers",
            schedule: "Early evening before main event",
            startDate: "10/25/2024",
            address: "321 Ocean Drive, Secondary Stage",
            startTime: "16:00",
            endTime: "18:00",
            poster: {
              id: uuidv4(),
              title: "Youth Championship Poster",
              url: posterImages[0],
              type: "poster",
              file: null,
            },
          },
          {
            id: "after-party",
            title: "Official After Party",
            description:
              "Celebrate with the dancers at the exclusive after party",
            schedule: "Late night celebration",
            startDate: "10/25/2024",
            address: "Ocean Beach Club, Miami Beach",
            startTime: "00:00",
            endTime: "04:00",
          },
        ],
        gallery: [
          {
            id: uuidv4(),
            title: "Beach Stage Setup",
            url: posterImages[2],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Finals Epic Freeze",
            url: posterImages[1],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Crowd Celebration",
            url: posterImages[0],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Trophy Presentation",
            url: posterImages[0],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Judges Panel",
            url: posterImages[1],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "After Party Vibes",
            url: posterImages[2],
            type: "photo",
            file: null,
          },
        ],
      },
      {
        id: "seattle-underground-jam",
        createdAt: new Date(),
        updatedAt: new Date(),
        eventDetails: {
          title: "Seattle Underground Hip-Hop Jam",
          description:
            "Raw, authentic hip-hop culture in the heart of Seattle. No frills, just pure skill and community vibes. This is where the real dancers come to showcase their art.",
          address: "555 Capitol Hill Arts Center, Seattle, WA 98102",
          prize: "Respect + $500 Winner Takes All",
          entryCost: "$20 at the door",
          startDate: "11/10/2024",
          startTime: "20:00",
          endTime: "02:00",
          schedule:
            "8PM Doors Open, 9PM Open Cypher, 10PM Battles Start, 1AM Open Session",
          creatorId: "test-user-5",
          poster: {
            id: uuidv4(),
            title: "Seattle Underground Poster",
            url: posterImages[0],
            type: "poster",
            file: null,
          },
          city: cities[4],
        },
        roles: [
          {
            id: "ORGANIZER",
            title: "ORGANIZER",
            user: {
              id: "test-user-5",
              displayName: "Eva M",
              username: "evam",
            },
          },
          {
            id: "DJ",
            title: "DJ",
            user: {
              id: "test-user-4",
              displayName: "DJ Dave",
              username: "djdave",
            },
          },
          {
            id: "JUDGE",
            title: "JUDGE",
            user: {
              id: "test-user-2",
              displayName: "B-Boy Bob",
              username: "bboyb",
            },
          },
        ],
        sections: [
          {
            id: "open-floor-battle",
            title: "Open Floor Battle",
            description:
              "No brackets, no structure - just call-outs and raw competition",
            hasBrackets: false,
            videos: [
              {
                id: uuidv4(),
                title: "Eva M vs B-Boy Bob - Spontaneous Battle",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                taggedUsers: [
                  {
                    id: "test-user-5",
                    displayName: "Eva M",
                    username: "evam",
                  },
                  {
                    id: "test-user-2",
                    displayName: "B-Boy Bob",
                    username: "bboyb",
                  },
                ],
              },
              {
                id: uuidv4(),
                title: "Alice J Footwork Showcase",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                taggedUsers: [
                  {
                    id: "test-user-1",
                    displayName: "Alice J",
                    username: "alicej",
                  },
                ],
              },
              {
                id: uuidv4(),
                title: "Carol D Power Set",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                taggedUsers: [
                  {
                    id: "test-user-3",
                    displayName: "Carol D",
                    username: "carold",
                  },
                ],
              },
              {
                id: uuidv4(),
                title: "Late Night Cypher Madness",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
                  {
                    id: "test-user-3",
                    displayName: "Carol D",
                    username: "carold",
                  },
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
        subEvents: [],
        gallery: [
          {
            id: uuidv4(),
            title: "Underground Venue Atmosphere",
            url: posterImages[1],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "DJ Setup",
            url: posterImages[2],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Battle Circle Energy",
            url: posterImages[0],
            type: "photo",
            file: null,
          },
        ],
      },
      {
        id: "uk-showdown-london",
        createdAt: new Date(),
        updatedAt: new Date(),
        eventDetails: {
          title: "UK Breaking Showdown 2024",
          description:
            "The United Kingdom's most prestigious breaking event returns to London. Featuring the best breakers from across Europe and representing the highest level of technical skill and artistic expression.",
          address: "100 Shoreditch Dance Hall, London, E1 6JE, United Kingdom",
          prize: "£8,000 Prize Pool + Red Bull BC One Qualifier Spot",
          entryCost: "£45 entry fee",
          startDate: "12/01/2024",
          startTime: "15:00",
          endTime: "23:00",
          schedule:
            "3PM Doors, 4PM Prelims, 7PM Top 16, 9PM Finals, 10:30PM Awards",
          creatorId: "test-user-1",
          poster: {
            id: uuidv4(),
            title: "UK Showdown 2024 Official Poster",
            url: posterImages[1],
            type: "poster",
            file: null,
          },
          city: cities[5],
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
              id: "test-user-3",
              displayName: "Carol D",
              username: "carold",
            },
          },
          {
            id: "JUDGE",
            title: "JUDGE",
            user: {
              id: "test-user-2",
              displayName: "B-Boy Bob",
              username: "bboyb",
            },
          },
          {
            id: "MC_HOST",
            title: "MC",
            user: {
              id: "test-user-5",
              displayName: "Eva M",
              username: "evam",
            },
          },
          {
            id: "DJ_MASTER",
            title: "DJ",
            user: {
              id: "test-user-4",
              displayName: "DJ Dave",
              username: "djdave",
            },
          },
        ],
        sections: [
          {
            id: "uk-main-comp",
            title: "Main Competition",
            description:
              "Championship tournament with international competitors",
            hasBrackets: true,
            videos: [],
            brackets: [
              {
                id: "uk-prelims",
                title: "Preliminary Rounds",
                videos: [
                  {
                    id: uuidv4(),
                    title: "UK Prelims Battle Compilation",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    taggedUsers: [
                      {
                        id: "test-user-1",
                        displayName: "Alice J",
                        username: "alicej",
                      },
                      {
                        id: "test-user-3",
                        displayName: "Carol D",
                        username: "carold",
                      },
                    ],
                  },
                ],
              },
              {
                id: "uk-top16",
                title: "Top 16",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Top 16 Battle 1",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    taggedUsers: [
                      {
                        id: "test-user-2",
                        displayName: "B-Boy Bob",
                        username: "bboyb",
                      },
                      {
                        id: "test-user-5",
                        displayName: "Eva M",
                        username: "evam",
                      },
                    ],
                  },
                ],
              },
              {
                id: "uk-finals",
                title: "Grand Finals",
                videos: [
                  {
                    id: uuidv4(),
                    title: "UK Showdown Grand Final",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    taggedUsers: [
                      {
                        id: "test-user-2",
                        displayName: "B-Boy Bob",
                        username: "bboyb",
                      },
                      {
                        id: "test-user-3",
                        displayName: "Carol D",
                        username: "carold",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: "uk-seven-to-smoke",
            title: "7 to Smoke",
            description:
              "Special format - defeat 7 consecutive opponents to win",
            hasBrackets: false,
            videos: [
              {
                id: uuidv4(),
                title: "7 to Smoke Challenge - Alice J",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                taggedUsers: [
                  {
                    id: "test-user-1",
                    displayName: "Alice J",
                    username: "alicej",
                  },
                ],
              },
            ],
            brackets: [],
          },
        ],
        subEvents: [
          {
            id: "uk-workshop-foundations",
            title: "Breaking Foundations Masterclass",
            description: "Learn from European champions",
            schedule: "Morning before main event",
            startDate: "12/01/2024",
            address: "100 Shoreditch Dance Hall, Studio Space",
            startTime: "11:00",
            endTime: "13:00",
            poster: {
              id: uuidv4(),
              title: "UK Workshop Poster",
              url: posterImages[2],
              type: "poster",
              file: null,
            },
          },
        ],
        gallery: [
          {
            id: uuidv4(),
            title: "London Venue Exterior",
            url: posterImages[2],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Finals Battle Action",
            url: posterImages[0],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Champion Trophy Lift",
            url: posterImages[0],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Judges Deliberation",
            url: posterImages[1],
            type: "photo",
            file: null,
          },
        ],
      },
      {
        id: "battle-of-the-year-paris",
        createdAt: new Date(),
        updatedAt: new Date(),
        eventDetails: {
          title: "Parisian Breaking Festival 2024",
          description:
            "Celebrating hip-hop culture in the City of Light. A three-day festival featuring battles, art exhibitions, live music, and the spirit of breaking. Join us for an unforgettable cultural experience.",
          address: "75 Rue de la Culture, Paris, 75001, France",
          prize: "€6,000 total prizes across multiple categories",
          entryCost: "€40 per category, €100 festival pass",
          startDate: "01/15/2025",
          startTime: "12:00",
          endTime: "23:59",
          schedule:
            "Full day festival: 12PM Opening, 2PM Workshops, 5PM Battles, 10PM Showcase, 11PM Jam Session",
          creatorId: "test-user-2",
          poster: {
            id: uuidv4(),
            title: "Parisian Breaking Festival Poster",
            url: posterImages[2],
            type: "poster",
            file: null,
          },
          city: cities[6],
        },
        roles: [
          {
            id: "FESTIVAL_DIRECTOR",
            title: "FESTIVAL DIRECTOR",
            user: {
              id: "test-user-2",
              displayName: "B-Boy Bob",
              username: "bboyb",
            },
          },
          {
            id: "ARTISTIC_DIRECTOR",
            title: "ARTISTIC DIRECTOR",
            user: {
              id: "test-user-3",
              displayName: "Carol D",
              username: "carold",
            },
          },
          {
            id: "HEAD_JUDGE_PARIS",
            title: "HEAD_JUDGE",
            user: {
              id: "test-user-1",
              displayName: "Alice J",
              username: "alicej",
            },
          },
          {
            id: "MUSIC_DIRECTOR",
            title: "MUSIC DIRECTOR",
            user: {
              id: "test-user-4",
              displayName: "DJ Dave",
              username: "djdave",
            },
          },
        ],
        sections: [
          {
            id: "solo-battle-paris",
            title: "Solo Battle Championship",
            description:
              "Individual breaking competition - European and International competitors",
            hasBrackets: true,
            videos: [],
            brackets: [
              {
                id: "paris-round-32",
                title: "Round of 32",
                videos: [
                  {
                    id: uuidv4(),
                    title: "R32 Highlights",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    taggedUsers: [
                      {
                        id: "test-user-1",
                        displayName: "Alice J",
                        username: "alicej",
                      },
                      {
                        id: "test-user-5",
                        displayName: "Eva M",
                        username: "evam",
                      },
                    ],
                  },
                ],
              },
              {
                id: "paris-finals",
                title: "Championship Final",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Paris Festival Grand Final",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    taggedUsers: [
                      {
                        id: "test-user-1",
                        displayName: "Alice J",
                        username: "alicej",
                      },
                      {
                        id: "test-user-3",
                        displayName: "Carol D",
                        username: "carold",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: "crew-showcase-paris",
            title: "Crew Showcase",
            description: "Choreographed crew performances",
            hasBrackets: false,
            videos: [
              {
                id: uuidv4(),
                title: "Paris All-Stars Crew Performance",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                taggedUsers: [
                  {
                    id: "test-user-2",
                    displayName: "B-Boy Bob",
                    username: "bboyb",
                  },
                  {
                    id: "test-user-3",
                    displayName: "Carol D",
                    username: "carold",
                  },
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
            id: "paris-hip-hop-history",
            title: "Hip-Hop History Panel Discussion",
            description:
              "Discussing the evolution and future of breaking culture",
            schedule: "Afternoon cultural program",
            startDate: "01/15/2025",
            address: "75 Rue de la Culture, Conference Room",
            startTime: "14:00",
            endTime: "15:30",
          },
          {
            id: "paris-art-exhibition",
            title: "Breaking Culture Art Exhibition",
            description: "Visual art inspired by breaking and hip-hop",
            schedule: "All day exhibition",
            startDate: "01/15/2025",
            address: "75 Rue de la Culture, Gallery Space",
            startTime: "12:00",
            endTime: "22:00",
          },
        ],
        gallery: [
          {
            id: uuidv4(),
            title: "Eiffel Tower View from Venue",
            url: posterImages[1],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Festival Main Stage",
            url: posterImages[2],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Art Exhibition Display",
            url: posterImages[0],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Crew Performance",
            url: posterImages[0],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Festival Atmosphere Night",
            url: posterImages[1],
            type: "photo",
            file: null,
          },
        ],
      },
      {
        id: "tokyo-cypher-olympics",
        createdAt: new Date(),
        updatedAt: new Date(),
        eventDetails: {
          title: "Tokyo Breaking Olympics Prep Jam",
          description:
            "Historic breaking jam in Tokyo preparing for the Olympic debut of breaking. Witness the convergence of tradition and innovation as Japan's finest breakers compete alongside international stars.",
          address: "456 Shibuya Breaking Dojo, Tokyo, 150-0042, Japan",
          prize: "¥500,000 + Olympic Circuit Recognition",
          entryCost: "¥5,000",
          startDate: "02/20/2025",
          startTime: "14:00",
          endTime: "22:00",
          schedule:
            "2PM Opening Ceremony, 3PM Exhibition Matches, 5PM Main Competition, 8PM Finals, 9PM Celebration",
          creatorId: "test-user-3",
          poster: {
            id: uuidv4(),
            title: "Tokyo Olympics Prep Poster",
            url: posterImages[2],
            type: "poster",
            file: null,
          },
          city: cities[7],
        },
        roles: [
          {
            id: "EVENT_COORDINATOR",
            title: "EVENT COORDINATOR",
            user: {
              id: "test-user-3",
              displayName: "Carol D",
              username: "carold",
            },
          },
          {
            id: "OLYMPIC_ADVISOR",
            title: "OLYMPIC ADVISOR",
            user: {
              id: "test-user-1",
              displayName: "Alice J",
              username: "alicej",
            },
          },
          {
            id: "HEAD_JUDGE_TOKYO",
            title: "HEAD_JUDGE",
            user: {
              id: "test-user-2",
              displayName: "B-Boy Bob",
              username: "bboyb",
            },
          },
          {
            id: "DJ_TOKYO",
            title: "DJ",
            user: {
              id: "test-user-4",
              displayName: "DJ Dave",
              username: "djdave",
            },
          },
          {
            id: "TRANSLATOR",
            title: "TRANSLATOR/MC",
            user: {
              id: "test-user-5",
              displayName: "Eva M",
              username: "evam",
            },
          },
        ],
        sections: [
          {
            id: "olympic-format-battle",
            title: "Olympic Format Competition",
            description:
              "Competition using official Olympic breaking format and judging criteria",
            hasBrackets: true,
            videos: [],
            brackets: [
              {
                id: "tokyo-qualifiers",
                title: "Qualification Round",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Tokyo Qualifier Highlights",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
                      {
                        id: "test-user-3",
                        displayName: "Carol D",
                        username: "carold",
                      },
                    ],
                  },
                ],
              },
              {
                id: "tokyo-medal-round",
                title: "Medal Round",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Tokyo Gold Medal Battle",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    taggedUsers: [
                      {
                        id: "test-user-2",
                        displayName: "B-Boy Bob",
                        username: "bboyb",
                      },
                      {
                        id: "test-user-3",
                        displayName: "Carol D",
                        username: "carold",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: "japanese-style-showcase",
            title: "Japanese Breaking Style Showcase",
            description:
              "Celebrating unique Japanese contributions to breaking culture",
            hasBrackets: false,
            videos: [
              {
                id: uuidv4(),
                title: "Traditional Meets Modern Performance",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                taggedUsers: [
                  {
                    id: "test-user-3",
                    displayName: "Carol D",
                    username: "carold",
                  },
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
            id: "olympic-rules-seminar",
            title: "Olympic Breaking Rules Seminar",
            description:
              "Understanding the official Olympic format and judging system",
            schedule: "Educational session before competition",
            startDate: "02/20/2025",
            address: "456 Shibuya Breaking Dojo, Conference Room",
            startTime: "12:00",
            endTime: "13:30",
          },
        ],
        gallery: [
          {
            id: uuidv4(),
            title: "Tokyo Dojo Interior",
            url: posterImages[0],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Opening Ceremony Performance",
            url: posterImages[2],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Medal Ceremony",
            url: posterImages[0],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "International Competitors Group Photo",
            url: posterImages[1],
            type: "photo",
            file: null,
          },
        ],
      },
      {
        id: "seoul-street-battle",
        createdAt: new Date(),
        updatedAt: new Date(),
        eventDetails: {
          title: "Seoul Street Battle Series 2025",
          description:
            "Raw street-style breaking in the heart of Seoul. This is where Korea's legendary breaking scene showcases its power. Underground vibes, world-class talent, and the energy that made Korean breaking famous worldwide.",
          address:
            "88 Hongdae Street Performance Area, Seoul, 04050, South Korea",
          prize: "₩5,000,000 + International Event Invitations",
          entryCost: "₩30,000",
          startDate: "03/10/2025",
          startTime: "18:00",
          endTime: "01:00",
          schedule:
            "6PM Street Cypher, 7PM Battle Preliminaries, 9PM Top 8, 11PM Finals, 12AM Street Party",
          creatorId: "test-user-5",
          poster: {
            id: uuidv4(),
            title: "Seoul Street Battle Poster",
            url: posterImages[2],
            type: "poster",
            file: null,
          },
          city: cities[8],
        },
        roles: [
          {
            id: "ORGANIZER_SEOUL",
            title: "ORGANIZER",
            user: {
              id: "test-user-5",
              displayName: "Eva M",
              username: "evam",
            },
          },
          {
            id: "CO_ORGANIZER",
            title: "CO-ORGANIZER",
            user: {
              id: "test-user-1",
              displayName: "Alice J",
              username: "alicej",
            },
          },
          {
            id: "HEAD_JUDGE_SEOUL",
            title: "HEAD_JUDGE",
            user: {
              id: "test-user-2",
              displayName: "B-Boy Bob",
              username: "bboyb",
            },
          },
          {
            id: "JUDGE_SEOUL",
            title: "JUDGE",
            user: {
              id: "test-user-3",
              displayName: "Carol D",
              username: "carold",
            },
          },
          {
            id: "DJ_SEOUL",
            title: "DJ",
            user: {
              id: "test-user-4",
              displayName: "DJ Dave",
              username: "djdave",
            },
          },
        ],
        sections: [
          {
            id: "seoul-main-battle",
            title: "Main Street Battle",
            description:
              "High-energy 1v1 battles in the legendary Hongdae style",
            hasBrackets: true,
            videos: [],
            brackets: [
              {
                id: "seoul-prelims",
                title: "Preliminary Battles",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Seoul Prelims - Best Moments",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    taggedUsers: [
                      {
                        id: "test-user-1",
                        displayName: "Alice J",
                        username: "alicej",
                      },
                      {
                        id: "test-user-5",
                        displayName: "Eva M",
                        username: "evam",
                      },
                    ],
                  },
                  {
                    id: uuidv4(),
                    title: "Intense Prelim Battle",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    taggedUsers: [
                      {
                        id: "test-user-2",
                        displayName: "B-Boy Bob",
                        username: "bboyb",
                      },
                      {
                        id: "test-user-3",
                        displayName: "Carol D",
                        username: "carold",
                      },
                    ],
                  },
                ],
              },
              {
                id: "seoul-top8",
                title: "Top 8",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Top 8 Battle Compilation",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
                      {
                        id: "test-user-3",
                        displayName: "Carol D",
                        username: "carold",
                      },
                      {
                        id: "test-user-5",
                        displayName: "Eva M",
                        username: "evam",
                      },
                    ],
                  },
                ],
              },
              {
                id: "seoul-finals",
                title: "Championship Finals",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Seoul Street Battle Grand Final",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
            ],
          },
          {
            id: "seoul-power-move-challenge",
            title: "Power Move Challenge",
            description:
              "Special competition focusing on power moves and acrobatics",
            hasBrackets: false,
            videos: [
              {
                id: uuidv4(),
                title: "Power Move Showcase - B-Boy Bob",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                taggedUsers: [
                  {
                    id: "test-user-2",
                    displayName: "B-Boy Bob",
                    username: "bboyb",
                  },
                ],
              },
              {
                id: uuidv4(),
                title: "Carol D Power Set",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                taggedUsers: [
                  {
                    id: "test-user-3",
                    displayName: "Carol D",
                    username: "carold",
                  },
                ],
              },
            ],
            brackets: [],
          },
          {
            id: "seoul-freestyle-jam",
            title: "Late Night Freestyle Jam",
            description: "Open session for all participants after main event",
            hasBrackets: false,
            videos: [
              {
                id: uuidv4(),
                title: "Hongdae Street Party Vibes",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
            id: "korean-breaking-history",
            title: "Korean Breaking Culture Documentary Screening",
            description:
              "Special screening celebrating Korean breaking heritage",
            schedule: "Pre-event cultural program",
            startDate: "03/10/2025",
            address: "Hongdae Cultural Center",
            startTime: "16:00",
            endTime: "17:30",
          },
        ],
        gallery: [
          {
            id: uuidv4(),
            title: "Hongdae Street Performance Area",
            url: posterImages[1],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Night Battle Atmosphere",
            url: posterImages[2],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Power Move Freeze",
            url: posterImages[0],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Crowd Circle Energy",
            url: posterImages[0],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Winner Celebration",
            url: posterImages[1],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Late Night Street Party",
            url: posterImages[2],
            type: "photo",
            file: null,
          },
        ],
      },
      {
        id: "toronto-unity-jam",
        createdAt: new Date(),
        updatedAt: new Date(),
        eventDetails: {
          title: "Toronto Unity Breaking Jam 2025",
          description:
            "Canada's most inclusive breaking event celebrating diversity and unity through hip-hop culture. All styles, all ages, all backgrounds welcome. This is about community, growth, and the love of the dance.",
          address:
            "200 Queen Street Community Center, Toronto, ON M5A 1S1, Canada",
          prize: "$2,500 CAD + Community Recognition + Media Features",
          entryCost: "$35 CAD (sliding scale available)",
          startDate: "04/05/2025",
          startTime: "13:00",
          endTime: "22:00",
          schedule:
            "1PM Community Gathering, 2PM Workshops, 4PM Open Cypher, 6PM Battles, 9PM Showcase, 10PM Community Jam",
          creatorId: "test-user-1",
          poster: {
            id: uuidv4(),
            title: "Toronto Unity Jam Poster",
            url: posterImages[0],
            type: "poster",
            file: null,
          },
          city: cities[9],
        },
        roles: [
          {
            id: "COMMUNITY_ORGANIZER",
            title: "COMMUNITY ORGANIZER",
            user: {
              id: "test-user-1",
              displayName: "Alice J",
              username: "alicej",
            },
          },
          {
            id: "WORKSHOP_COORDINATOR",
            title: "WORKSHOP COORDINATOR",
            user: {
              id: "test-user-3",
              displayName: "Carol D",
              username: "carold",
            },
          },
          {
            id: "BATTLE_JUDGE",
            title: "JUDGE",
            user: {
              id: "test-user-2",
              displayName: "B-Boy Bob",
              username: "bboyb",
            },
          },
          {
            id: "BATTLE_JUDGE_2",
            title: "JUDGE",
            user: {
              id: "test-user-5",
              displayName: "Eva M",
              username: "evam",
            },
          },
          {
            id: "MUSIC_CURATOR",
            title: "MUSIC CURATOR/DJ",
            user: {
              id: "test-user-4",
              displayName: "DJ Dave",
              username: "djdave",
            },
          },
        ],
        sections: [
          {
            id: "toronto-main-battle",
            title: "Main Breaking Battle",
            description: "Open-level 1v1 breaking competition",
            hasBrackets: true,
            videos: [],
            brackets: [
              {
                id: "toronto-round1",
                title: "Round 1",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Toronto Round 1 Highlights",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
                id: "toronto-semifinals",
                title: "Semifinals",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Semifinal Battle 1",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    taggedUsers: [
                      {
                        id: "test-user-3",
                        displayName: "Carol D",
                        username: "carold",
                      },
                      {
                        id: "test-user-5",
                        displayName: "Eva M",
                        username: "evam",
                      },
                    ],
                  },
                ],
              },
              {
                id: "toronto-final",
                title: "Final Battle",
                videos: [
                  {
                    id: uuidv4(),
                    title: "Toronto Unity Jam Championship Final",
                    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    taggedUsers: [
                      {
                        id: "test-user-1",
                        displayName: "Alice J",
                        username: "alicej",
                      },
                      {
                        id: "test-user-3",
                        displayName: "Carol D",
                        username: "carold",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: "toronto-community-showcase",
            title: "Community Showcase",
            description: "Open stage for community members to share their art",
            hasBrackets: false,
            videos: [
              {
                id: uuidv4(),
                title: "Community Members Group Performance",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                taggedUsers: [
                  {
                    id: "test-user-1",
                    displayName: "Alice J",
                    username: "alicej",
                  },
                  {
                    id: "test-user-3",
                    displayName: "Carol D",
                    username: "carold",
                  },
                  {
                    id: "test-user-5",
                    displayName: "Eva M",
                    username: "evam",
                  },
                ],
              },
              {
                id: uuidv4(),
                title: "Eva M Inspirational Solo",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
          {
            id: "toronto-all-ages-jam",
            title: "All Ages Open Jam",
            description:
              "Everyone welcome - from kids to elders, beginners to pros",
            hasBrackets: false,
            videos: [
              {
                id: uuidv4(),
                title: "Toronto Community Jam Session",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
            id: "toronto-beginner-workshop",
            title: "Beginner Friendly Breaking Workshop",
            description:
              "Perfect for newcomers to breaking - learn the basics in a supportive environment",
            schedule: "Afternoon workshop session",
            startDate: "04/05/2025",
            address: "200 Queen Street Community Center, Main Studio",
            startTime: "14:00",
            endTime: "15:30",
            poster: {
              id: uuidv4(),
              title: "Beginner Workshop Poster",
              url: posterImages[1],
              type: "poster",
              file: null,
            },
          },
          {
            id: "toronto-advanced-workshop",
            title: "Advanced Techniques Workshop",
            description: "Advanced workshop for experienced dancers",
            schedule: "Afternoon workshop session",
            startDate: "04/05/2025",
            address: "200 Queen Street Community Center, Studio B",
            startTime: "14:00",
            endTime: "15:30",
            poster: {
              id: uuidv4(),
              title: "Advanced Workshop Poster",
              url: posterImages[2],
              type: "poster",
              file: null,
            },
          },
          {
            id: "toronto-kids-session",
            title: "Kids Breaking Session",
            description: "Special session for young breakers under 12",
            schedule: "Early afternoon slot",
            startDate: "04/05/2025",
            address: "200 Queen Street Community Center, Kids Area",
            startTime: "13:30",
            endTime: "14:30",
          },
        ],
        gallery: [
          {
            id: uuidv4(),
            title: "Toronto Community Gathering",
            url: posterImages[2],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Workshop in Action",
            url: posterImages[0],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Battle Circle Overhead",
            url: posterImages[1],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Kids Session Fun",
            url: posterImages[0],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "All Ages Unity Photo",
            url: posterImages[1],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Final Battle Energy",
            url: posterImages[2],
            type: "photo",
            file: null,
          },
          {
            id: uuidv4(),
            title: "Community Showcase Performance",
            url: posterImages[0],
            type: "photo",
            file: null,
          },
        ],
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
