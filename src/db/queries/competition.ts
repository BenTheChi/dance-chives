import driver from "../driver";
import { Competition, Section, Bracket, EventCard } from "../../types/event";
import { Video } from "../../types/video";
import { Image } from "../../types/image";
import { Workshop, WorkshopCard } from "../../types/workshop";
import { UserSearchItem } from "../../types/user";
import { SessionCard } from "../../types/session";
import { City } from "../../types/city";
import {
  getNeo4jRoleFormats,
  toNeo4jRoleFormat,
  isValidRole,
  AVAILABLE_ROLES,
  WORKSHOP_ROLES,
} from "@/lib/utils/roles";
import {
  normalizeStyleNames,
  normalizeStyleName,
} from "@/lib/utils/style-utils";
import { getUserByUsername } from "./user";
import { AUTH_LEVELS } from "@/lib/utils/auth-utils";

/**
 * Helper function to get userId from UserSearchItem.
 * If id is present, returns it. Otherwise, looks up user by username.
 * Throws error if user not found.
 */
async function getUserIdFromUserSearchItem(
  user: UserSearchItem
): Promise<string> {
  if (user.id) {
    return user.id;
  }

  if (!user.username) {
    throw new Error(
      `User must have either id or username. Got: ${JSON.stringify(user)}`
    );
  }

  const userRecord = await getUserByUsername(user.username);
  if (!userRecord || !userRecord.id) {
    throw new Error(`User not found with username: ${user.username}`);
  }

  return userRecord.id;
}

/**
 * Helper function to create user relationships for a video based on video type
 */
async function createVideoUserRelationships(
  video: Video,
  videoId: string
): Promise<void> {
  const session = driver.session();
  try {
    if (video.type === "battle") {
      const battleVideo = video as any;
      // Create DANCER relationships
      if (battleVideo.taggedDancers && battleVideo.taggedDancers.length > 0) {
        for (const dancer of battleVideo.taggedDancers) {
          const userId = await getUserIdFromUserSearchItem(dancer);
          await session.run(
            `MATCH (v:Video {id: $videoId})
             MERGE (u:User {id: $userId})
             MERGE (u)-[:DANCER]->(v)`,
            { videoId, userId }
          );
        }
      }
      // Create WINNER relationships
      if (battleVideo.taggedWinners && battleVideo.taggedWinners.length > 0) {
        for (const winner of battleVideo.taggedWinners) {
          const userId = await getUserIdFromUserSearchItem(winner);
          await session.run(
            `MATCH (v:Video {id: $videoId})
             MERGE (u:User {id: $userId})
             MERGE (u)-[:WINNER]->(v)`,
            { videoId, userId }
          );
        }
      }
    } else if (video.type === "freestyle") {
      const freestyleVideo = video as any;
      // Create DANCER relationships
      if (
        freestyleVideo.taggedDancers &&
        freestyleVideo.taggedDancers.length > 0
      ) {
        for (const dancer of freestyleVideo.taggedDancers) {
          const userId = await getUserIdFromUserSearchItem(dancer);
          await session.run(
            `MATCH (v:Video {id: $videoId})
             MERGE (u:User {id: $userId})
             MERGE (u)-[:DANCER]->(v)`,
            { videoId, userId }
          );
        }
      }
    } else if (video.type === "choreography") {
      const choreographyVideo = video as any;
      // Create CHOREOGRAPHER relationships
      if (
        choreographyVideo.taggedChoreographers &&
        choreographyVideo.taggedChoreographers.length > 0
      ) {
        for (const choreographer of choreographyVideo.taggedChoreographers) {
          const userId = await getUserIdFromUserSearchItem(choreographer);
          await session.run(
            `MATCH (v:Video {id: $videoId})
             MERGE (u:User {id: $userId})
             MERGE (u)-[:CHOREOGRAPHER]->(v)`,
            { videoId, userId }
          );
        }
      }
      // Create DANCER relationships
      if (
        choreographyVideo.taggedDancers &&
        choreographyVideo.taggedDancers.length > 0
      ) {
        for (const dancer of choreographyVideo.taggedDancers) {
          const userId = await getUserIdFromUserSearchItem(dancer);
          await session.run(
            `MATCH (v:Video {id: $videoId})
             MERGE (u:User {id: $userId})
             MERGE (u)-[:DANCER]->(v)`,
            { videoId, userId }
          );
        }
      }
    } else if (video.type === "class") {
      const classVideo = video as any;
      // Create TEACHER relationships
      if (classVideo.taggedTeachers && classVideo.taggedTeachers.length > 0) {
        for (const teacher of classVideo.taggedTeachers) {
          const userId = await getUserIdFromUserSearchItem(teacher);
          await session.run(
            `MATCH (v:Video {id: $videoId})
             MERGE (u:User {id: $userId})
             MERGE (u)-[:TEACHER]->(v)`,
            { videoId, userId }
          );
        }
      }
      // Create DANCER relationships
      if (classVideo.taggedDancers && classVideo.taggedDancers.length > 0) {
        for (const dancer of classVideo.taggedDancers) {
          const userId = await getUserIdFromUserSearchItem(dancer);
          await session.run(
            `MATCH (v:Video {id: $videoId})
             MERGE (u:User {id: $userId})
             MERGE (u)-[:DANCER]->(v)`,
            { videoId, userId }
          );
        }
      }
    }
  } finally {
    await session.close();
  }
}

// Function to fetch city coordinates from GeoDB API
async function fetchCityCoordinates(
  cityId: number
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const response = await fetch(
      `http://geodb-free-service.wirefreethought.com/v1/geo/places/${cityId}`
    );

    if (!response.ok) {
      console.warn(`Failed to fetch coordinates for city ${cityId}`);
      return null;
    }

    const data = await response.json();
    const place = data.data;

    if (
      place &&
      place.latitude !== undefined &&
      place.longitude !== undefined
    ) {
      return {
        latitude: place.latitude,
        longitude: place.longitude,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching coordinates for city ${cityId}:`, error);
    return null;
  }
}

// Neo4j record interfaces
interface BracketVideoRecord {
  sectionId: string;
  bracketId: string;
  videos: Video[];
}

interface BracketVideoUserRecord {
  sectionId: string;
  bracketId: string;
  videoId: string;
  videoType: string;
  taggedWinners?: UserSearchItem[];
  taggedDancers?: UserSearchItem[];
  taggedChoreographers?: UserSearchItem[];
  taggedTeachers?: UserSearchItem[];
}

interface SectionVideoUserRecord {
  sectionId: string;
  videoId: string;
  videoType: string;
  taggedWinners?: UserSearchItem[];
  taggedDancers?: UserSearchItem[];
  taggedChoreographers?: UserSearchItem[];
  taggedTeachers?: UserSearchItem[];
}

export const getCompetition = async (id: string): Promise<Competition> => {
  const session = driver.session();

  // Get main event data - now using Event:Competition labels
  const eventResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})
    OPTIONAL MATCH (e)-[:IN]->(c:City)
    OPTIONAL MATCH (poster:Image)-[:POSTER_OF]->(e)
    OPTIONAL MATCH (creator:User)-[:CREATED]->(e)
    
    RETURN e {
      id: e.id,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      title: e.title,
      description: e.description,
      address: e.address,
      prize: e.prize,
      entryCost: e.entryCost,
      startDate: e.startDate,
      startTime: e.startTime,
      endTime: e.endTime,
      schedule: e.schedule,
      creatorId: creator.id,
      poster: poster {
        id: poster.id,
        title: poster.title,
        url: poster.url
      },
      city: c {
        id: c.id,
        name: c.name,
        countryCode: c.countryCode,
        region: c.region,
        population: c.population,
        timezone: c.timezone
      }
    } as event
  `,
    { id }
  );

  // Get parent event if this event is a subevent
  const parentEventResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})-[:SUBEVENT_OF]->(parent:Event)
    RETURN parent {
      id: parent.id,
      title: parent.title,
      type: CASE
        WHEN 'Competition' IN labels(parent) THEN 'competition'
        WHEN 'Workshop' IN labels(parent) THEN 'workshop'
        WHEN 'Session' IN labels(parent) THEN 'session'
        ELSE 'competition'
      END
    } as parentEvent
    `,
    { id }
  );

  // Get roles (exclude TEAM_MEMBER - team members are shown separately)
  const validRoleFormats = getNeo4jRoleFormats().filter(
    (role) => role !== "TEAM_MEMBER"
  );
  const rolesResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[roleRel]-(user:User)
    WHERE type(roleRel) IN $validRoles
    RETURN collect({
      id: type(roleRel),
      title: type(roleRel),
      user: user {
        id: user.id,
        displayName: user.displayName,
        username: user.username
      }
    }) as roles
  `,
    { id, validRoles: validRoleFormats }
  );

  // Get sections with video and bracket counts
  const sectionsResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[:IN]-(s:Section)
    OPTIONAL MATCH (s)<-[:IN]-(v:Video)
    OPTIONAL MATCH (s)<-[:IN]-(b:Bracket)
    
    WITH s, collect(DISTINCT v) as videos, collect(DISTINCT b) as brackets
    
    RETURN collect({
      id: s.id,
      title: s.title,
      description: s.description,
      hasBrackets: size(brackets) > 0,
      videos: [v in videos | {
        id: v.id,
        title: v.title,
        src: v.src,
        taggedUsers: []
      }],
      brackets: [b in brackets | {
        id: b.id,
        title: b.title,
        videos: []
      }]
    }) as sections
  `,
    { id }
  );

  // Get bracket videos separately
  const bracketVideosResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)
    RETURN s.id as sectionId, b.id as bracketId, collect({
      id: v.id,
      title: v.title,
      src: v.src
    }) as videos
  `,
    { id }
  );

  // Get tagged users for bracket videos using relationship types - separate winners, dancers, choreographers, teachers
  const bracketVideoUsersResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)
    OPTIONAL MATCH (v)<-[:WINNER]-(winner:User)
    OPTIONAL MATCH (v)<-[:DANCER]-(dancer:User)
    OPTIONAL MATCH (v)<-[:CHOREOGRAPHER]-(choreographer:User)
    OPTIONAL MATCH (v)<-[:TEACHER]-(teacher:User)
    WITH s, b, v, 
         collect(DISTINCT {
           id: winner.id,
           displayName: winner.displayName,
           username: winner.username
         }) as allWinners,
         collect(DISTINCT {
           id: dancer.id,
           displayName: dancer.displayName,
           username: dancer.username
         }) as allDancers,
         collect(DISTINCT {
           id: choreographer.id,
           displayName: choreographer.displayName,
           username: choreographer.username
         }) as allChoreographers,
         collect(DISTINCT {
           id: teacher.id,
           displayName: teacher.displayName,
           username: teacher.username
         }) as allTeachers
    WITH s, b, v,
         [w in allWinners WHERE w.id IS NOT NULL] as winners,
         [d in allDancers WHERE d.id IS NOT NULL] as dancers,
         [c in allChoreographers WHERE c.id IS NOT NULL] as choreographers,
         [t in allTeachers WHERE t.id IS NOT NULL] as teachers,
         CASE 
           WHEN 'Battle' IN labels(v) THEN 'battle'
           WHEN 'Freestyle' IN labels(v) THEN 'freestyle'
           WHEN 'Choreography' IN labels(v) THEN 'choreography'
           WHEN 'Class' IN labels(v) THEN 'class'
           ELSE 'battle'
         END as videoType
    WHERE size(winners) > 0 OR size(dancers) > 0 OR size(choreographers) > 0 OR size(teachers) > 0
    RETURN s.id as sectionId, b.id as bracketId, v.id as videoId, 
           winners as taggedWinners,
           dancers as taggedDancers,
           choreographers as taggedChoreographers,
           teachers as taggedTeachers,
           videoType
  `,
    { id }
  );

  // Get tagged users for direct section videos using relationship types - separate winners, dancers, choreographers, teachers
  const sectionVideoUsersResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[:IN]-(s:Section)<-[:IN]-(v:Video)
    OPTIONAL MATCH (v)<-[:WINNER]-(winner:User)
    OPTIONAL MATCH (v)<-[:DANCER]-(dancer:User)
    OPTIONAL MATCH (v)<-[:CHOREOGRAPHER]-(choreographer:User)
    OPTIONAL MATCH (v)<-[:TEACHER]-(teacher:User)
    WITH s, v, 
         collect(DISTINCT {
           id: winner.id,
           displayName: winner.displayName,
           username: winner.username
         }) as allWinners,
         collect(DISTINCT {
           id: dancer.id,
           displayName: dancer.displayName,
           username: dancer.username
         }) as allDancers,
         collect(DISTINCT {
           id: choreographer.id,
           displayName: choreographer.displayName,
           username: choreographer.username
         }) as allChoreographers,
         collect(DISTINCT {
           id: teacher.id,
           displayName: teacher.displayName,
           username: teacher.username
         }) as allTeachers
    WITH s, v,
         [w in allWinners WHERE w.id IS NOT NULL] as winners,
         [d in allDancers WHERE d.id IS NOT NULL] as dancers,
         [c in allChoreographers WHERE c.id IS NOT NULL] as choreographers,
         [t in allTeachers WHERE t.id IS NOT NULL] as teachers,
         CASE 
           WHEN 'Battle' IN labels(v) THEN 'battle'
           WHEN 'Freestyle' IN labels(v) THEN 'freestyle'
           WHEN 'Choreography' IN labels(v) THEN 'choreography'
           WHEN 'Class' IN labels(v) THEN 'class'
           ELSE 'battle'
         END as videoType
    WHERE size(winners) > 0 OR size(dancers) > 0 OR size(choreographers) > 0 OR size(teachers) > 0
    RETURN s.id as sectionId, v.id as videoId, 
           winners as taggedWinners,
           dancers as taggedDancers,
           choreographers as taggedChoreographers,
           teachers as taggedTeachers,
           videoType
  `,
    { id }
  );

  // Get section winners using :WINNER relationship type
  const sectionWinnersResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[:IN]-(s:Section)<-[r:WINNER]-(u:User)
    RETURN s.id as sectionId, collect({
      id: u.id,
      displayName: u.displayName,
      username: u.username
    }) as winners
  `,
    { id }
  );

  // Get section styles
  const sectionStylesResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[:IN]-(s:Section)-[:STYLE]->(style:Style)
    RETURN s.id as sectionId, collect(style.name) as styles
  `,
    { id }
  );

  // Get video styles (direct section videos)
  const sectionVideoStylesResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[:IN]-(s:Section)<-[:IN]-(v:Video)-[:STYLE]->(style:Style)
    RETURN s.id as sectionId, v.id as videoId, collect(style.name) as styles
  `,
    { id }
  );

  // Get video styles (bracket videos)
  const bracketVideoStylesResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)-[:STYLE]->(style:Style)
    RETURN s.id as sectionId, b.id as bracketId, v.id as videoId, collect(style.name) as styles
  `,
    { id }
  );

  // Get section applyStylesToVideos property
  const sectionApplyStylesResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[:IN]-(s:Section)
    RETURN s.id as sectionId, s.applyStylesToVideos as applyStylesToVideos
  `,
    { id }
  );

  // Merge bracket videos into sections
  const sections = sectionsResult.records[0]?.get("sections") || [];
  const bracketVideos = bracketVideosResult.records.map(
    (record): BracketVideoRecord => ({
      sectionId: record.get("sectionId"),
      bracketId: record.get("bracketId"),
      videos: record.get("videos"),
    })
  );

  const bracketVideoUsers = bracketVideoUsersResult.records.map(
    (record): BracketVideoUserRecord => ({
      sectionId: record.get("sectionId"),
      bracketId: record.get("bracketId"),
      videoId: record.get("videoId"),
      videoType: record.get("videoType") || "battle",
      taggedWinners: record.get("taggedWinners") || [],
      taggedDancers: record.get("taggedDancers") || [],
      taggedChoreographers: record.get("taggedChoreographers") || [],
      taggedTeachers: record.get("taggedTeachers") || [],
    })
  );

  // Create maps for styles
  const sectionStylesMap = new Map<string, string[]>();
  sectionStylesResult.records.forEach((record) => {
    sectionStylesMap.set(record.get("sectionId"), record.get("styles") || []);
  });

  const sectionVideoStylesMap = new Map<string, string[]>();
  sectionVideoStylesResult.records.forEach((record) => {
    const key = `${record.get("sectionId")}:${record.get("videoId")}`;
    sectionVideoStylesMap.set(key, record.get("styles") || []);
  });

  const bracketVideoStylesMap = new Map<string, string[]>();
  bracketVideoStylesResult.records.forEach((record) => {
    const key = `${record.get("sectionId")}:${record.get(
      "bracketId"
    )}:${record.get("videoId")}`;
    bracketVideoStylesMap.set(key, record.get("styles") || []);
  });

  const sectionApplyStylesMap = new Map<string, boolean>();
  sectionApplyStylesResult.records.forEach((record) => {
    sectionApplyStylesMap.set(
      record.get("sectionId"),
      record.get("applyStylesToVideos") || false
    );
  });

  // Create map of section winners
  const sectionWinnersMap = new Map<string, any[]>();
  sectionWinnersResult.records.forEach((record) => {
    const sectionId = record.get("sectionId");
    const winners = (record.get("winners") || []).filter(
      (w: any) => w.id !== null && w.id !== undefined
    );
    sectionWinnersMap.set(sectionId, winners);
  });

  // Update sections with bracket videos and tagged users
  sections.forEach((section: Section) => {
    // Add section styles and applyStylesToVideos
    section.styles = sectionStylesMap.get(section.id) || [];
    section.applyStylesToVideos =
      sectionApplyStylesMap.get(section.id) || false;
    // Add section winners
    section.winners = sectionWinnersMap.get(section.id) || [];

    // Add tagged users and styles to direct section videos
    section.videos.forEach((video: Video) => {
      const userData = sectionVideoUsersResult.records.find(
        (record) =>
          record.get("sectionId") === section.id &&
          record.get("videoId") === video.id
      );
      const videoType = video.type || "battle";

      if (userData) {
        (video as any).taggedWinners = userData.get("taggedWinners") || [];
        (video as any).taggedDancers = userData.get("taggedDancers") || [];
        // Only include taggedChoreographers for choreography videos
        if (videoType === "choreography") {
          (video as any).taggedChoreographers =
            userData.get("taggedChoreographers") || [];
        }
        // Only include taggedTeachers for class videos
        if (videoType === "class") {
          (video as any).taggedTeachers = userData.get("taggedTeachers") || [];
        }
      } else {
        (video as any).taggedWinners = [];
        (video as any).taggedDancers = [];
        // Only include taggedChoreographers for choreography videos
        if (videoType === "choreography") {
          (video as any).taggedChoreographers = [];
        }
        // Only include taggedTeachers for class videos
        if (videoType === "class") {
          (video as any).taggedTeachers = [];
        }
      }

      // Add video styles
      const styleKey = `${section.id}:${video.id}`;
      video.styles = sectionVideoStylesMap.get(styleKey) || [];
    });

    // Add videos and tagged users to brackets
    section.brackets.forEach((bracket: Bracket) => {
      const bracketVideoData = bracketVideos.find(
        (bv) => bv.sectionId === section.id && bv.bracketId === bracket.id
      );
      if (bracketVideoData) {
        bracket.videos = bracketVideoData.videos;

        // Add tagged users and styles to bracket videos
        bracket.videos.forEach((video: Video) => {
          const userData = bracketVideoUsers.find(
            (bvu: BracketVideoUserRecord) =>
              bvu.sectionId === section.id &&
              bvu.bracketId === bracket.id &&
              bvu.videoId === video.id
          );
          const videoType = video.type || "battle";

          if (userData) {
            (video as any).taggedWinners = userData.taggedWinners || [];
            (video as any).taggedDancers = userData.taggedDancers || [];
            // Only include taggedChoreographers for choreography videos
            if (videoType === "choreography") {
              (video as any).taggedChoreographers =
                userData.taggedChoreographers || [];
            }
            // Only include taggedTeachers for class videos
            if (videoType === "class") {
              (video as any).taggedTeachers = userData.taggedTeachers || [];
            }
          } else {
            (video as any).taggedWinners = [];
            (video as any).taggedDancers = [];
            // Only include taggedChoreographers for choreography videos
            if (videoType === "choreography") {
              (video as any).taggedChoreographers = [];
            }
            // Only include taggedTeachers for class videos
            if (videoType === "class") {
              (video as any).taggedTeachers = [];
            }
          }

          // Add video styles
          const styleKey = `${section.id}:${bracket.id}:${video.id}`;
          video.styles = bracketVideoStylesMap.get(styleKey) || [];
        });
      } else {
        bracket.videos = [];
      }
    });
  });

  // Get sub events - now using :SUBEVENT_OF relationship between Event nodes
  // Subevents can be any event type (Competition, Workshop, Session)
  const subEventsResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})
    OPTIONAL MATCH (subEvent:Event)-[:SUBEVENT_OF]->(e)
    OPTIONAL MATCH (subEvent)-[:IN]->(subCity:City)
    OPTIONAL MATCH (sePoster:Image)-[:POSTER_OF]->(subEvent)
    OPTIONAL MATCH (subCreator:User)-[:CREATED]->(subEvent)
    OPTIONAL MATCH (subEvent)-[:STYLE]->(subStyle:Style)
    
    WITH subEvent, subCity, sePoster, subCreator, collect(DISTINCT subStyle.name) as styles
    WHERE subEvent IS NOT NULL
    RETURN collect({
      id: subEvent.id,
      title: subEvent.title,
      description: subEvent.description,
      schedule: subEvent.schedule,
      startDate: subEvent.startDate,
      address: subEvent.address,
      startTime: subEvent.startTime,
      endTime: subEvent.endTime,
      creatorId: subCreator.id,
      type: CASE
        WHEN 'Competition' IN labels(subEvent) THEN 'competition'
        WHEN 'Workshop' IN labels(subEvent) THEN 'workshop'
        WHEN 'Session' IN labels(subEvent) THEN 'session'
        ELSE 'competition'
      END,
      poster: sePoster {
        id: sePoster.id,
        title: sePoster.title,
        url: sePoster.url
      },
      city: subCity {
        id: subCity.id,
        name: subCity.name,
        countryCode: subCity.countryCode,
        region: subCity.region,
        population: subCity.population,
        timezone: subCity.timezone
      },
      styles: styles
    }) as subEvents
  `,
    { id }
  );

  // Get gallery - now using Image:Gallery
  const galleryResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[:PHOTO]-(galleryPic:Image:Gallery)
    RETURN collect({
      id: galleryPic.id,
      title: galleryPic.title,
      url: galleryPic.url
    }) as gallery
  `,
    { id }
  );

  session.close();

  const competitionData = eventResult.records[0]?.get("event");
  const roles = rolesResult.records[0]?.get("roles") || [];
  const subEvents = subEventsResult.records[0]?.get("subEvents") || [];
  const gallery = galleryResult.records[0]?.get("gallery") || [];
  const parentEvent = parentEventResult.records[0]?.get("parentEvent") || null;

  // Check if competition exists
  if (!competitionData) {
    throw new Error(`Competition with id ${id} not found`);
  }

  return {
    ...competitionData,
    eventDetails: {
      title: competitionData.title,
      description: competitionData.description,
      address: competitionData.address,
      prize: competitionData.prize,
      entryCost: competitionData.entryCost,
      startDate: competitionData.startDate,
      startTime: competitionData.startTime,
      endTime: competitionData.endTime,
      schedule: competitionData.schedule,
      creatorId: competitionData.creatorId,
      poster: competitionData.poster,
      city: competitionData.city,
      parentEvent: parentEvent,
    },
    roles,
    sections,
    subEvents: subEvents,
    gallery,
  };
};

// Helper function to create subevent relationships
// Subevents are now Event nodes with :SUBEVENT_OF relationship
// Works with Competition, Workshop, and Session event types
export const createSubEvents = async (eventId: string, subEvents: any[]) => {
  if (subEvents.length === 0) return;
  const session = driver.session();
  try {
    for (const subEvent of subEvents) {
      // Validate that subevent doesn't already have a parent (prevent nested subevents)
      const existingParentCheck = await session.run(
        `MATCH (se:Event {id: $subEventId})-[r:SUBEVENT_OF]->(parent:Event)
         RETURN count(r) as parentCount`,
        { subEventId: subEvent.id }
      );

      const parentCount =
        existingParentCheck.records[0]?.get("parentCount")?.toNumber() || 0;
      if (parentCount > 0) {
        throw new Error(
          `Event ${subEvent.id} already has a parent event. Nested subevents are not allowed.`
        );
      }

      // Create :SUBEVENT_OF relationship from subevent to main event
      // Works with any Event type (Competition, Workshop, Session)
      await session.run(
        `MATCH (mainEvent:Event {id: $eventId})
         MATCH (subEvent:Event {id: $subEventId})
         MERGE (subEvent)-[:SUBEVENT_OF]->(mainEvent)`,
        {
          eventId,
          subEventId: subEvent.id,
        }
      );
    }
  } finally {
    await session.close();
  }
};

// Subevent posters are now handled as part of the event itself
// This function is no longer needed - subevents are full events with their own posters
const createSubEventPosters = async (subEvents: any[]) => {
  // No-op: subevents are now full Event nodes, their posters are handled separately
  return;
};

// Helper function to create gallery photos - now using Image:Gallery
const createGalleryPhotos = async (eventId: string, gallery: any[]) => {
  if (gallery.length === 0) return;
  const session = driver.session();
  try {
    for (const pic of gallery) {
      await session.run(
        `MATCH (e:Event:Competition {id: $eventId})
         MERGE (p:Image:Gallery {id: $picId})
         ON CREATE SET
           p.title = $title,
           p.url = $url
         ON MATCH SET
           p.title = $title,
           p.url = $url
         MERGE (p)-[:PHOTO]->(e)`,
        {
          eventId,
          picId: pic.id,
          title: pic.title,
          url: pic.url,
        }
      );
    }
  } finally {
    await session.close();
  }
};

// Helper function to create sections
const createSections = async (eventId: string, sections: any[]) => {
  if (sections.length === 0) return;
  const session = driver.session();
  try {
    // Check for duplicate section titles within this event
    const existingSections = await session.run(
      `MATCH (e:Event {id: $eventId})<-[:IN]-(s:Section)
       RETURN s.title as title`,
      { eventId }
    );

    const existingTitles = new Set(
      existingSections.records.map((r) => r.get("title").toLowerCase().trim())
    );

    // Validate uniqueness before creating
    for (const sec of sections) {
      const normalizedTitle = sec.title.toLowerCase().trim();
      if (existingTitles.has(normalizedTitle)) {
        throw new Error(
          `Section title "${sec.title}" already exists in this event. Section titles must be unique within an event.`
        );
      }
      existingTitles.add(normalizedTitle);
    }

    for (const sec of sections) {
      // Create section
      await session.run(
        `MATCH (e:Event {id: $eventId})
         MERGE (s:Section {id: $sectionId})
         ON CREATE SET
           s.title = $title,
           s.description = $description,
           s.applyStylesToVideos = $applyStylesToVideos
         ON MATCH SET
           s.title = $title,
           s.description = $description,
           s.applyStylesToVideos = $applyStylesToVideos
         MERGE (s)-[:IN]->(e)`,
        {
          eventId,
          sectionId: sec.id,
          title: sec.title,
          description: sec.description || null,
          applyStylesToVideos: sec.applyStylesToVideos || false,
        }
      );

      // Create section style relationships if applyStylesToVideos is true
      if (sec.applyStylesToVideos && sec.styles && sec.styles.length > 0) {
        const normalizedStyles = normalizeStyleNames(sec.styles);
        await session.run(
          `
          MATCH (s:Section {id: $sectionId})
          WITH s, $styles AS styles
          UNWIND styles AS styleName
          MERGE (style:Style {name: styleName})
          MERGE (s)-[:STYLE]->(style)
          `,
          { sectionId: sec.id, styles: normalizedStyles }
        );
      }
    }
  } finally {
    await session.close();
  }
};

// Helper function to create brackets
const createBrackets = async (sections: any[]) => {
  const sectionsWithBrackets = sections.filter(
    (s) => s.hasBrackets && s.brackets?.length > 0
  );
  if (sectionsWithBrackets.length === 0) return;

  const session = driver.session();
  try {
    for (const sec of sectionsWithBrackets) {
      for (const br of sec.brackets) {
        await session.run(
          `MATCH (s:Section {id: $sectionId})
           MERGE (b:Bracket {id: $bracketId})
           ON CREATE SET
             b.title = $title
           ON MATCH SET
             b.title = $title
           MERGE (b)-[:IN]->(s)`,
          { sectionId: sec.id, bracketId: br.id, title: br.title }
        );
      }
    }
  } finally {
    await session.close();
  }
};

// Helper function to create videos in brackets
const createBracketVideos = async (sections: any[]) => {
  const sectionsWithBrackets = sections.filter(
    (s) => s.hasBrackets && s.brackets?.length > 0
  );
  if (sectionsWithBrackets.length === 0) return;

  const session = driver.session();
  try {
    for (const sec of sectionsWithBrackets) {
      for (const br of sec.brackets) {
        for (const vid of br.videos || []) {
          // Get video type label
          const videoType = vid.type || "battle"; // Default to battle
          const videoLabel =
            videoType.charAt(0).toUpperCase() + videoType.slice(1);

          await session.run(
            `MATCH (b:Bracket {id: $bracketId})
             MERGE (v:Video {id: $videoId})
             ON CREATE SET
               v.title = $title,
               v.src = $src
             ON MATCH SET
               v.title = $title,
               v.src = $src
             WITH v, b
             CALL apoc.create.addLabels(v, ['Video', '${videoLabel}']) YIELD node
             MERGE (v)-[:IN]->(b)`,
            {
              bracketId: br.id,
              videoId: vid.id,
              title: vid.title,
              src: vid.src,
            }
          );

          // Create user relationships based on video type
          await createVideoUserRelationships(vid, vid.id);

          // Create video style relationships
          const videoStyles = vid.styles || [];
          if (videoStyles.length > 0) {
            const normalizedStyles = normalizeStyleNames(videoStyles);
            await session.run(
              `
              MATCH (v:Video {id: $videoId})
              WITH v, $styles AS styles
              UNWIND styles AS styleName
              MERGE (style:Style {name: styleName})
              MERGE (v)-[:STYLE]->(style)
              `,
              { videoId: vid.id, styles: normalizedStyles }
            );
          }
        }
      }
    }
  } finally {
    await session.close();
  }
};

// Helper function to create videos directly in sections
const createSectionVideos = async (sections: any[]) => {
  const sectionsWithVideos = sections.filter(
    (s) => !s.hasBrackets && s.videos?.length > 0
  );
  if (sectionsWithVideos.length === 0) return;

  const session = driver.session();
  try {
    for (const sec of sectionsWithVideos) {
      for (const vid of sec.videos) {
        // Get video type label
        const videoType = vid.type || "battle"; // Default to battle
        const videoLabel =
          videoType.charAt(0).toUpperCase() + videoType.slice(1);

        await session.run(
          `MATCH (s:Section {id: $sectionId})
           MERGE (v:Video {id: $videoId})
           ON CREATE SET
             v.title = $title,
             v.src = $src
           ON MATCH SET
             v.title = $title,
             v.src = $src
           WITH v, s
           CALL apoc.create.addLabels(v, ['Video', '${videoLabel}']) YIELD node
           MERGE (v)-[:IN]->(s)`,
          { sectionId: sec.id, videoId: vid.id, title: vid.title, src: vid.src }
        );

        // Create user relationships based on video type
        await createVideoUserRelationships(vid, vid.id);

        // Create video style relationships
        const videoStyles = vid.styles || [];
        if (videoStyles.length > 0) {
          const normalizedStyles = normalizeStyleNames(videoStyles);
          await session.run(
            `
            MATCH (v:Video {id: $videoId})
            WITH v, $styles AS styles
            UNWIND styles AS styleName
            MERGE (style:Style {name: styleName})
            MERGE (v)-[:STYLE]->(style)
            `,
            { videoId: vid.id, styles: normalizedStyles }
          );
        }
      }
    }
  } finally {
    await session.close();
  }
};

export const insertCompetition = async (competition: Competition) => {
  // Validate all roles before inserting
  if (competition.roles && competition.roles.length > 0) {
    for (const role of competition.roles) {
      if (!isValidRole(role.title)) {
        throw new Error(
          `Invalid role: ${role.title}. Must be one of: ${AVAILABLE_ROLES.join(
            ", "
          )}`
        );
      }
    }

    // Preprocess roles to ensure all users have ids
    const processedRoles = await Promise.all(
      competition.roles.map(async (role) => {
        if (!role.user) {
          return role;
        }
        const userId = await getUserIdFromUserSearchItem(role.user);
        return {
          ...role,
          user: {
            ...role.user,
            id: userId,
          },
        };
      })
    );
    competition = {
      ...competition,
      roles: processedRoles,
    };
  }

  const session = driver.session();

  const result = await session.run(
    `
MERGE (e:Event:Competition {id: $eventId})
  ON CREATE SET 
    e.title = $title,
    e.description = $description,
    e.address = $address,
    e.prize = $prize,
    e.entryCost = $entryCost,
    e.startDate = $startDate,
    e.startTime = $startTime,
    e.endTime = $endTime,
    e.schedule = $schedule,
    e.createdAt = $createdAt,
    e.updatedAt = $updatedAt
  ON MATCH SET
    e.title = $title,
    e.description = $description,
    e.address = $address,
    e.prize = $prize,
    e.entryCost = $entryCost,
    e.startDate = $startDate,
    e.startTime = $startTime,
    e.endTime = $endTime,
    e.schedule = $schedule,
    e.updatedAt = $updatedAt

WITH e
MERGE (c:City {id: $city.id})
  ON CREATE SET 
    c.name = $city.name,
    c.countryCode = $city.countryCode,
    c.region = $city.region,
    c.population = $city.population,
    c.timezone = $city.timezone
  ON MATCH SET
    c.population = $city.population
MERGE (e)-[:IN]->(c)

WITH e
// Remove old poster relationship if it exists
OPTIONAL MATCH (oldPoster:Image)-[r:POSTER_OF]->(e)
DELETE r
WITH e
// Create or merge poster only if poster exists
FOREACH (poster IN CASE WHEN $poster IS NOT NULL AND $poster.id IS NOT NULL THEN [$poster] ELSE [] END |
      MERGE (newPoster:Image:Gallery {id: poster.id})
      ON CREATE SET
        newPoster.title = poster.title,
        newPoster.url = poster.url
      SET
        newPoster.title = poster.title,
        newPoster.url = poster.url
      MERGE (newPoster)-[:POSTER_OF]->(e)
)

WITH e
MATCH (creator:User {id: $creatorId})
MERGE (creator)-[:CREATED]->(e)

WITH e
CALL {
  WITH e
  WITH e, $roles AS roles
  UNWIND roles AS roleData
  MATCH (u:User { id: roleData.user.id })
  WITH u, e, roleData,
    CASE 
      WHEN roleData.title = 'Team Member' THEN 'TEAM_MEMBER'
      ELSE toUpper(roleData.title)
    END AS relationshipType
  CALL apoc.merge.relationship(u, relationshipType, {}, {}, e) YIELD rel
  RETURN count(rel) AS roleCount
}

WITH e
RETURN e as event
`,
    {
      eventId: competition.id,
      creatorId: competition.eventDetails.creatorId,
      title: competition.eventDetails.title,
      description: competition.eventDetails.description,
      address: competition.eventDetails.address,
      prize: competition.eventDetails.prize,
      entryCost: competition.eventDetails.entryCost,
      startDate: competition.eventDetails.startDate,
      startTime: competition.eventDetails.startTime,
      endTime: competition.eventDetails.endTime,
      schedule: competition.eventDetails.schedule || null,
      createdAt: competition.createdAt.toISOString(),
      updatedAt: competition.updatedAt.toISOString(),
      poster: competition.eventDetails.poster,
      city: competition.eventDetails.city,
      roles: competition.roles,
    }
  );

  // Check if query returned results
  if (!result.records || result.records.length === 0) {
    await session.close();
    throw new Error(
      `Failed to create competition ${competition.id}: No records returned from query`
    );
  }

  const eventNode = result.records[0].get("event");
  if (!eventNode) {
    await session.close();
    throw new Error(
      `Failed to create competition ${competition.id}: Competition node not found in result`
    );
  }

  await session.close();

  // Create subevents (as relationships), gallery, sections, brackets, and videos in separate queries
  await createSubEvents(competition.id, competition.subEvents || []);
  await createGalleryPhotos(competition.id, competition.gallery);
  await createSections(competition.id, competition.sections);
  await createBrackets(competition.sections);
  await createBracketVideos(competition.sections);
  await createSectionVideos(competition.sections);

  return eventNode.properties;
};

export const getCompetitionSections = async (id: string) => {
  const session = driver.session();

  // Get event title
  const eventResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})
    RETURN e.title as title
  `,
    { id }
  );

  // Get sections with full video and bracket data
  const sectionsResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[:IN]-(s:Section)
    OPTIONAL MATCH (s)<-[:IN]-(v:Video)
    OPTIONAL MATCH (s)<-[:IN]-(b:Bracket)
    OPTIONAL MATCH (b)<-[:IN]-(bv:Video)
    
    WITH s, collect(DISTINCT v) as videos, collect(DISTINCT b) as brackets
    
    RETURN collect({
      id: s.id,
      title: s.title,
      description: s.description,
      hasBrackets: size(brackets) > 0,
      videos: [v in videos | {
        id: v.id,
        title: v.title,
        src: v.src,
        type: CASE 
          WHEN 'Battle' IN labels(v) THEN 'battle'
          WHEN 'Freestyle' IN labels(v) THEN 'freestyle'
          WHEN 'Choreography' IN labels(v) THEN 'choreography'
          WHEN 'Class' IN labels(v) THEN 'class'
          ELSE 'battle'
        END
      }],
      brackets: [b in brackets | {
        id: b.id,
        title: b.title,
        videos: []
      }]
    }) as sections
  `,
    { id }
  );

  // Get bracket videos separately
  const bracketVideosResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)
    RETURN s.id as sectionId, b.id as bracketId, collect({
      id: v.id,
      title: v.title,
      src: v.src
    }) as videos
  `,
    { id }
  );

  // Get tagged users for all videos in sections using relationship types - separate winners, dancers, choreographers, teachers
  const sectionVideoUsersResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[:IN]-(s:Section)<-[:IN]-(v:Video)
    OPTIONAL MATCH (v)<-[:WINNER]-(winner:User)
    OPTIONAL MATCH (v)<-[:DANCER]-(dancer:User)
    OPTIONAL MATCH (v)<-[:CHOREOGRAPHER]-(choreographer:User)
    OPTIONAL MATCH (v)<-[:TEACHER]-(teacher:User)
    WITH s, v, 
         collect(DISTINCT {
           id: winner.id,
           displayName: winner.displayName,
           username: winner.username
         }) as allWinners,
         collect(DISTINCT {
           id: dancer.id,
           displayName: dancer.displayName,
           username: dancer.username
         }) as allDancers,
         collect(DISTINCT {
           id: choreographer.id,
           displayName: choreographer.displayName,
           username: choreographer.username
         }) as allChoreographers,
         collect(DISTINCT {
           id: teacher.id,
           displayName: teacher.displayName,
           username: teacher.username
         }) as allTeachers
    WITH s, v,
         [w in allWinners WHERE w.id IS NOT NULL] as winners,
         [d in allDancers WHERE d.id IS NOT NULL] as dancers,
         [c in allChoreographers WHERE c.id IS NOT NULL] as choreographers,
         [t in allTeachers WHERE t.id IS NOT NULL] as teachers
    WHERE size(winners) > 0 OR size(dancers) > 0 OR size(choreographers) > 0 OR size(teachers) > 0
    RETURN s.id as sectionId, v.id as videoId, v.type as videoType,
           winners as taggedWinners,
           dancers as taggedDancers,
           choreographers as taggedChoreographers,
           teachers as taggedTeachers
  `,
    { id }
  );

  // Get tagged users for bracket videos using relationship types - separate winners, dancers, choreographers, teachers
  const bracketVideoUsersResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)
    OPTIONAL MATCH (v)<-[:WINNER]-(winner:User)
    OPTIONAL MATCH (v)<-[:DANCER]-(dancer:User)
    OPTIONAL MATCH (v)<-[:CHOREOGRAPHER]-(choreographer:User)
    OPTIONAL MATCH (v)<-[:TEACHER]-(teacher:User)
    WITH s, b, v, 
         collect(DISTINCT {
           id: winner.id,
           displayName: winner.displayName,
           username: winner.username
         }) as allWinners,
         collect(DISTINCT {
           id: dancer.id,
           displayName: dancer.displayName,
           username: dancer.username
         }) as allDancers,
         collect(DISTINCT {
           id: choreographer.id,
           displayName: choreographer.displayName,
           username: choreographer.username
         }) as allChoreographers,
         collect(DISTINCT {
           id: teacher.id,
           displayName: teacher.displayName,
           username: teacher.username
         }) as allTeachers
    WITH s, b, v,
         [w in allWinners WHERE w.id IS NOT NULL] as winners,
         [d in allDancers WHERE d.id IS NOT NULL] as dancers,
         [c in allChoreographers WHERE c.id IS NOT NULL] as choreographers,
         [t in allTeachers WHERE t.id IS NOT NULL] as teachers,
         CASE 
           WHEN 'Battle' IN labels(v) THEN 'battle'
           WHEN 'Freestyle' IN labels(v) THEN 'freestyle'
           WHEN 'Choreography' IN labels(v) THEN 'choreography'
           WHEN 'Class' IN labels(v) THEN 'class'
           ELSE 'battle'
         END as videoType
    WHERE size(winners) > 0 OR size(dancers) > 0 OR size(choreographers) > 0 OR size(teachers) > 0
    RETURN s.id as sectionId, b.id as bracketId, v.id as videoId, 
           winners as taggedWinners,
           dancers as taggedDancers,
           choreographers as taggedChoreographers,
           teachers as taggedTeachers,
           videoType
  `,
    { id }
  );

  // Get section styles
  const sectionStylesResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[:IN]-(s:Section)-[:STYLE]->(style:Style)
    RETURN s.id as sectionId, collect(style.name) as styles
  `,
    { id }
  );

  // Get video styles (direct section videos)
  const sectionVideoStylesResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[:IN]-(s:Section)<-[:IN]-(v:Video)-[:STYLE]->(style:Style)
    RETURN s.id as sectionId, v.id as videoId, collect(style.name) as styles
  `,
    { id }
  );

  // Get video styles (bracket videos)
  const bracketVideoStylesResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)-[:STYLE]->(style:Style)
    RETURN s.id as sectionId, b.id as bracketId, v.id as videoId, collect(style.name) as styles
  `,
    { id }
  );

  // Get section applyStylesToVideos property
  const sectionApplyStylesResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[:IN]-(s:Section)
    RETURN s.id as sectionId, s.applyStylesToVideos as applyStylesToVideos
  `,
    { id }
  );

  // Get section winners using :WINNER relationship type
  const sectionWinnersResult = await session.run(
    `
    MATCH (e:Event:Competition {id: $id})<-[:IN]-(s:Section)<-[r:WINNER]-(u:User)
    RETURN s.id as sectionId, collect({
      id: u.id,
      displayName: u.displayName,
      username: u.username
    }) as winners
  `,
    { id }
  );

  session.close();

  const title = eventResult.records[0]?.get("title");
  const sections = sectionsResult.records[0]?.get("sections") || [];
  const bracketVideos = bracketVideosResult.records.map(
    (record): BracketVideoRecord => ({
      sectionId: record.get("sectionId"),
      bracketId: record.get("bracketId"),
      videos: record.get("videos"),
    })
  );

  // Get all bracket video IDs to filter them out from section videos
  const bracketVideoIdsSet = new Set(
    bracketVideosResult.records.flatMap((record) =>
      (record.get("videos") || []).map((v: any) => v.id)
    )
  );

  // Filter out bracket videos from section video users
  const sectionVideoUsers = sectionVideoUsersResult.records
    .filter((record) => {
      const videoId = record.get("videoId");
      return videoId && !bracketVideoIdsSet.has(videoId);
    })
    .map(
      (record): SectionVideoUserRecord => ({
        sectionId: record.get("sectionId"),
        videoId: record.get("videoId"),
        videoType: record.get("videoType") || "battle",
        taggedWinners: record.get("taggedWinners") || [],
        taggedDancers: record.get("taggedDancers") || [],
        taggedChoreographers: record.get("taggedChoreographers") || [],
        taggedTeachers: record.get("taggedTeachers") || [],
      })
    );

  const bracketVideoUsers = bracketVideoUsersResult.records.map(
    (record): BracketVideoUserRecord => ({
      sectionId: record.get("sectionId"),
      bracketId: record.get("bracketId"),
      videoId: record.get("videoId"),
      videoType: record.get("videoType") || "battle",
      taggedWinners: record.get("taggedWinners") || [],
      taggedDancers: record.get("taggedDancers") || [],
      taggedChoreographers: record.get("taggedChoreographers") || [],
      taggedTeachers: record.get("taggedTeachers") || [],
    })
  );

  // Create maps for styles
  const sectionStylesMap = new Map<string, string[]>();
  sectionStylesResult.records.forEach((record) => {
    sectionStylesMap.set(record.get("sectionId"), record.get("styles") || []);
  });

  const sectionVideoStylesMap = new Map<string, string[]>();
  sectionVideoStylesResult.records.forEach((record) => {
    const key = `${record.get("sectionId")}:${record.get("videoId")}`;
    sectionVideoStylesMap.set(key, record.get("styles") || []);
  });

  const bracketVideoStylesMap = new Map<string, string[]>();
  bracketVideoStylesResult.records.forEach((record) => {
    const key = `${record.get("sectionId")}:${record.get(
      "bracketId"
    )}:${record.get("videoId")}`;
    bracketVideoStylesMap.set(key, record.get("styles") || []);
  });

  const sectionApplyStylesMap = new Map<string, boolean>();
  sectionApplyStylesResult.records.forEach((record) => {
    sectionApplyStylesMap.set(
      record.get("sectionId"),
      record.get("applyStylesToVideos") || false
    );
  });

  // Create map of section winners
  const sectionWinnersMap = new Map<string, any[]>();
  sectionWinnersResult.records.forEach((record) => {
    const sectionId = record.get("sectionId");
    const winners = (record.get("winners") || []).filter(
      (w: any) => w.id !== null && w.id !== undefined
    );
    sectionWinnersMap.set(sectionId, winners);
  });

  // Check if event exists
  if (!title) {
    throw new Error(`Event with id ${id} not found`);
  }

  // Update sections with bracket videos
  sections.forEach((section: Section) => {
    // Add section styles and applyStylesToVideos
    section.styles = sectionStylesMap.get(section.id) || [];
    section.applyStylesToVideos =
      sectionApplyStylesMap.get(section.id) || false;
    // Add section winners
    section.winners = sectionWinnersMap.get(section.id) || [];

    // Add tagged users and styles to direct section videos - create new objects to avoid mutating Neo4j objects
    section.videos = section.videos.map((video: Video) => {
      const userData = sectionVideoUsers.find(
        (svu) => svu.sectionId === section.id && svu.videoId === video.id
      );
      const styleKey = `${section.id}:${video.id}`;
      const videoType = video.type || "battle";

      const result: any = {
        ...video,
        taggedWinners: userData?.taggedWinners || [],
        taggedDancers: userData?.taggedDancers || [],
        styles: sectionVideoStylesMap.get(styleKey) || [],
      };

      // Only include taggedChoreographers for choreography videos
      if (videoType === "choreography") {
        result.taggedChoreographers = userData?.taggedChoreographers || [];
      }

      // Only include taggedTeachers for class videos
      if (videoType === "class") {
        result.taggedTeachers = userData?.taggedTeachers || [];
      }

      return result;
    });

    // Add videos and tagged users to brackets
    section.brackets.forEach((bracket: Bracket) => {
      const bracketVideoData = bracketVideos.find(
        (bv) => bv.sectionId === section.id && bv.bracketId === bracket.id
      );
      if (bracketVideoData) {
        // Create new video objects with taggedWinners/taggedDancers/taggedChoreographers/taggedTeachers and styles to avoid mutating Neo4j objects
        bracket.videos = bracketVideoData.videos.map((video: Video) => {
          const userData = bracketVideoUsers.find(
            (bvu) =>
              bvu.sectionId === section.id &&
              bvu.bracketId === bracket.id &&
              bvu.videoId === video.id
          );
          const styleKey = `${section.id}:${bracket.id}:${video.id}`;
          const videoType = video.type || "battle";

          const result: any = {
            ...video,
            taggedWinners: userData?.taggedWinners || [],
            taggedDancers: userData?.taggedDancers || [],
            styles: bracketVideoStylesMap.get(styleKey) || [],
          };

          // Only include taggedChoreographers for choreography videos
          if (videoType === "choreography") {
            result.taggedChoreographers = userData?.taggedChoreographers || [];
          }

          // Only include taggedTeachers for class videos
          if (videoType === "class") {
            result.taggedTeachers = userData?.taggedTeachers || [];
          }

          return result;
        });
      } else {
        bracket.videos = [];
      }
    });
  });

  return { title, sections };
};

export const getSection = async (sectionId: string, eventId: string) => {
  const session = driver.session();

  try {
    // Get section by UUID directly, optionally verify it belongs to the event
    const sectionResult = await session.run(
      `
      MATCH (s:Section {id: $sectionId})-[:IN]->(e:Event:Competition {id: $eventId})
      OPTIONAL MATCH (s)<-[:IN]-(v:Video)
      OPTIONAL MATCH (s)<-[:IN]-(b:Bracket)
      
      WITH s, e, collect(DISTINCT v) as videos, collect(DISTINCT b) as brackets
      
      RETURN {
        id: s.id,
        title: s.title,
        description: s.description,
        hasBrackets: size(brackets) > 0,
        videos: [v in videos | {
        id: v.id,
        title: v.title,
        src: v.src,
        type: CASE 
          WHEN 'Battle' IN labels(v) THEN 'battle'
          WHEN 'Freestyle' IN labels(v) THEN 'freestyle'
          WHEN 'Choreography' IN labels(v) THEN 'choreography'
          WHEN 'Class' IN labels(v) THEN 'class'
          ELSE 'battle'
        END
      }],
        brackets: [b in brackets | {
        id: b.id,
        title: b.title,
        videos: []
      }]
      } as section,
      e.id as eventId,
      e.title as eventTitle
    `,
      { sectionId, eventId }
    );

    if (sectionResult.records.length === 0) {
      await session.close();
      return null;
    }

    const sectionData = sectionResult.records[0].get("section") as any;
    const resultEventId = sectionResult.records[0].get("eventId");
    const eventTitle = sectionResult.records[0].get("eventTitle");

    // Get bracket videos separately
    const bracketVideosResult = await session.run(
      `
      MATCH (s:Section {id: $sectionId})<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)
      RETURN s.id as sectionId, b.id as bracketId, collect({
        id: v.id,
        title: v.title,
        src: v.src
      }) as videos
    `,
      { sectionId }
    );

    // Get tagged users for direct section videos
    const sectionVideoUsersResult = await session.run(
      `
      MATCH (s:Section {id: $sectionId})<-[:IN]-(v:Video)
      OPTIONAL MATCH (v)<-[:WINNER]-(winner:User)
      OPTIONAL MATCH (v)<-[:DANCER]-(dancer:User)
      OPTIONAL MATCH (v)<-[:CHOREOGRAPHER]-(choreographer:User)
      OPTIONAL MATCH (v)<-[:TEACHER]-(teacher:User)
      WITH s, v, 
           collect(DISTINCT {
             id: winner.id,
             displayName: winner.displayName,
             username: winner.username
           }) as allWinners,
           collect(DISTINCT {
             id: dancer.id,
             displayName: dancer.displayName,
             username: dancer.username
           }) as allDancers,
           collect(DISTINCT {
             id: choreographer.id,
             displayName: choreographer.displayName,
             username: choreographer.username
           }) as allChoreographers,
           collect(DISTINCT {
             id: teacher.id,
             displayName: teacher.displayName,
             username: teacher.username
           }) as allTeachers
      WITH s, v,
           [w in allWinners WHERE w.id IS NOT NULL] as winners,
           [d in allDancers WHERE d.id IS NOT NULL] as dancers,
           [c in allChoreographers WHERE c.id IS NOT NULL] as choreographers,
           [t in allTeachers WHERE t.id IS NOT NULL] as teachers
      WHERE size(winners) > 0 OR size(dancers) > 0 OR size(choreographers) > 0 OR size(teachers) > 0
      RETURN s.id as sectionId, v.id as videoId, v.type as videoType,
             winners as taggedWinners,
             dancers as taggedDancers,
             choreographers as taggedChoreographers,
             teachers as taggedTeachers
    `,
      { sectionId }
    );

    // Get tagged users for bracket videos
    const bracketVideoUsersResult = await session.run(
      `
      MATCH (s:Section {id: $sectionId})<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)
      OPTIONAL MATCH (v)<-[:WINNER]-(winner:User)
      OPTIONAL MATCH (v)<-[:DANCER]-(dancer:User)
      OPTIONAL MATCH (v)<-[:CHOREOGRAPHER]-(choreographer:User)
      OPTIONAL MATCH (v)<-[:TEACHER]-(teacher:User)
      WITH s, b, v, 
           collect(DISTINCT {
             id: winner.id,
             displayName: winner.displayName,
             username: winner.username
           }) as allWinners,
           collect(DISTINCT {
             id: dancer.id,
             displayName: dancer.displayName,
             username: dancer.username
           }) as allDancers,
           collect(DISTINCT {
             id: choreographer.id,
             displayName: choreographer.displayName,
             username: choreographer.username
           }) as allChoreographers,
           collect(DISTINCT {
             id: teacher.id,
             displayName: teacher.displayName,
             username: teacher.username
           }) as allTeachers
      WITH s, b, v,
           [w in allWinners WHERE w.id IS NOT NULL] as winners,
           [d in allDancers WHERE d.id IS NOT NULL] as dancers,
           [c in allChoreographers WHERE c.id IS NOT NULL] as choreographers,
           [t in allTeachers WHERE t.id IS NOT NULL] as teachers
      WHERE size(winners) > 0 OR size(dancers) > 0 OR size(choreographers) > 0 OR size(teachers) > 0
      RETURN s.id as sectionId, b.id as bracketId, v.id as videoId, v.type as videoType,
             winners as taggedWinners,
             dancers as taggedDancers,
             choreographers as taggedChoreographers,
             teachers as taggedTeachers
    `,
      { sectionId }
    );

    // Get section styles
    const sectionStylesResult = await session.run(
      `
      MATCH (s:Section {id: $sectionId})-[:STYLE]->(style:Style)
      RETURN s.id as sectionId, collect(style.name) as styles
    `,
      { sectionId }
    );

    // Get video styles (direct section videos)
    const sectionVideoStylesResult = await session.run(
      `
      MATCH (s:Section {id: $sectionId})<-[:IN]-(v:Video)-[:STYLE]->(style:Style)
      RETURN s.id as sectionId, v.id as videoId, collect(style.name) as styles
    `,
      { sectionId }
    );

    // Get video styles (bracket videos)
    const bracketVideoStylesResult = await session.run(
      `
      MATCH (s:Section {id: $sectionId})<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)-[:STYLE]->(style:Style)
      RETURN s.id as sectionId, b.id as bracketId, v.id as videoId, collect(style.name) as styles
    `,
      { sectionId }
    );

    // Get section applyStylesToVideos property
    const sectionApplyStylesResult = await session.run(
      `
      MATCH (s:Section {id: $sectionId})
      RETURN s.id as sectionId, s.applyStylesToVideos as applyStylesToVideos
    `,
      { sectionId }
    );

    // Get section winners
    const sectionWinnersResult = await session.run(
      `
      MATCH (s:Section {id: $sectionId})<-[r:WINNER]-(u:User)
      RETURN s.id as sectionId, collect({
        id: u.id,
        displayName: u.displayName,
        username: u.username
      }) as winners
    `,
      { sectionId }
    );

    await session.close();

    const section: Section = sectionData;
    const bracketVideos = bracketVideosResult.records.map(
      (record): BracketVideoRecord => ({
        sectionId: record.get("sectionId"),
        bracketId: record.get("bracketId"),
        videos: record.get("videos"),
      })
    );

    // Get all bracket video IDs to filter them out from section videos
    const bracketVideoIdsSet = new Set(
      bracketVideosResult.records.flatMap((record) =>
        (record.get("videos") || []).map((v: any) => v.id)
      )
    );

    // Filter out bracket videos from section video users
    const sectionVideoUsers = sectionVideoUsersResult.records
      .filter((record) => {
        const videoId = record.get("videoId");
        return videoId && !bracketVideoIdsSet.has(videoId);
      })
      .map(
        (record): SectionVideoUserRecord => ({
          sectionId: record.get("sectionId"),
          videoId: record.get("videoId"),
          videoType: record.get("videoType") || "battle",
          taggedWinners: record.get("taggedWinners") || [],
          taggedDancers: record.get("taggedDancers") || [],
          taggedChoreographers: record.get("taggedChoreographers") || [],
          taggedTeachers: record.get("taggedTeachers") || [],
        })
      );

    const bracketVideoUsers = bracketVideoUsersResult.records.map(
      (record): BracketVideoUserRecord => ({
        sectionId: record.get("sectionId"),
        bracketId: record.get("bracketId"),
        videoId: record.get("videoId"),
        videoType: record.get("videoType") || "battle",
        taggedWinners: record.get("taggedWinners") || [],
        taggedDancers: record.get("taggedDancers") || [],
        taggedChoreographers: record.get("taggedChoreographers") || [],
        taggedTeachers: record.get("taggedTeachers") || [],
      })
    );

    // Create maps for styles
    const sectionStylesMap = new Map<string, string[]>();
    sectionStylesResult.records.forEach((record) => {
      sectionStylesMap.set(record.get("sectionId"), record.get("styles") || []);
    });

    const sectionVideoStylesMap = new Map<string, string[]>();
    sectionVideoStylesResult.records.forEach((record) => {
      const key = `${record.get("sectionId")}:${record.get("videoId")}`;
      sectionVideoStylesMap.set(key, record.get("styles") || []);
    });

    const bracketVideoStylesMap = new Map<string, string[]>();
    bracketVideoStylesResult.records.forEach((record) => {
      const key = `${record.get("sectionId")}:${record.get(
        "bracketId"
      )}:${record.get("videoId")}`;
      bracketVideoStylesMap.set(key, record.get("styles") || []);
    });

    const sectionApplyStylesMap = new Map<string, boolean>();
    sectionApplyStylesResult.records.forEach((record) => {
      sectionApplyStylesMap.set(
        record.get("sectionId"),
        record.get("applyStylesToVideos") || false
      );
    });

    // Create map of section winners
    const sectionWinnersMap = new Map<string, any[]>();
    sectionWinnersResult.records.forEach((record) => {
      const sectionId = record.get("sectionId");
      const winners = (record.get("winners") || []).filter(
        (w: any) => w.id !== null && w.id !== undefined
      );
      sectionWinnersMap.set(sectionId, winners);
    });

    // Update section with bracket videos, styles, and winners
    section.styles = sectionStylesMap.get(section.id) || [];
    section.applyStylesToVideos =
      sectionApplyStylesMap.get(section.id) || false;
    section.winners = sectionWinnersMap.get(section.id) || [];

    // Add tagged users and styles to direct section videos
    section.videos = section.videos.map((video: Video) => {
      const userData = sectionVideoUsers.find(
        (svu) => svu.sectionId === section.id && svu.videoId === video.id
      );
      const styleKey = `${section.id}:${video.id}`;
      return {
        ...video,
        taggedWinners: userData?.taggedWinners || [],
        taggedDancers: userData?.taggedDancers || [],
        taggedChoreographers: userData?.taggedChoreographers || [],
        taggedTeachers: userData?.taggedTeachers || [],
        styles: sectionVideoStylesMap.get(styleKey) || [],
      };
    });

    // Add videos and tagged users to brackets
    section.brackets.forEach((bracket: Bracket) => {
      const bracketVideoData = bracketVideos.find(
        (bv) => bv.sectionId === section.id && bv.bracketId === bracket.id
      );
      if (bracketVideoData) {
        bracket.videos = bracketVideoData.videos.map((video: Video) => {
          const userData = bracketVideoUsers.find(
            (bvu) =>
              bvu.sectionId === section.id &&
              bvu.bracketId === bracket.id &&
              bvu.videoId === video.id
          );
          const styleKey = `${section.id}:${bracket.id}:${video.id}`;
          return {
            ...video,
            taggedWinners: userData?.taggedWinners || [],
            taggedDancers: userData?.taggedDancers || [],
            taggedChoreographers: userData?.taggedChoreographers || [],
            taggedTeachers: userData?.taggedTeachers || [],
            styles: bracketVideoStylesMap.get(styleKey) || [],
          };
        });
      } else {
        bracket.videos = [];
      }
    });

    return {
      section,
      eventId: resultEventId,
      eventTitle,
    };
  } catch (error) {
    console.error("Error fetching section:", error);
    await session.close();
    throw error;
  }
};

export const getAllSections = async () => {
  const session = driver.session();

  try {
    // Get all sections with event information
    const sectionsResult = await session.run(
      `
      MATCH (s:Section)-[:IN]->(e:Event)
      OPTIONAL MATCH (s)<-[:IN]-(v:Video)
      OPTIONAL MATCH (s)<-[:IN]-(b:Bracket)
      
      WITH s, e, collect(DISTINCT v) as videos, collect(DISTINCT b) as brackets
      
      RETURN {
        id: s.id,
        title: s.title,
        description: s.description,
        hasBrackets: size(brackets) > 0,
        videoCount: size(videos),
        bracketCount: size(brackets)
      } as section,
      e.id as eventId,
      e.title as eventTitle
    `,
      {}
    );

    // Get section styles
    const sectionStylesResult = await session.run(
      `
      MATCH (s:Section)-[:STYLE]->(style:Style)
      RETURN s.id as sectionId, collect(style.name) as styles
    `,
      {}
    );

    // Get section winners
    const sectionWinnersResult = await session.run(
      `
      MATCH (s:Section)<-[r:WINNER]-(u:User)
      RETURN s.id as sectionId, collect({
        id: u.id,
        displayName: u.displayName,
        username: u.username
      }) as winners
    `,
      {}
    );

    // Get bracket video counts
    const bracketVideoCountsResult = await session.run(
      `
      MATCH (s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)
      RETURN s.id as sectionId, b.id as bracketId, count(v) as videoCount
    `,
      {}
    );

    await session.close();

    // Create maps for styles and winners
    const sectionStylesMap = new Map<string, string[]>();
    sectionStylesResult.records.forEach((record) => {
      sectionStylesMap.set(record.get("sectionId"), record.get("styles") || []);
    });

    const sectionWinnersMap = new Map<string, any[]>();
    sectionWinnersResult.records.forEach((record) => {
      const sectionId = record.get("sectionId");
      const winners = (record.get("winners") || []).filter(
        (w: any) => w.id !== null && w.id !== undefined
      );
      sectionWinnersMap.set(sectionId, winners);
    });

    // Calculate total video counts including bracket videos
    const bracketVideoCountsMap = new Map<string, number>();
    bracketVideoCountsResult.records.forEach((record) => {
      const sectionId = record.get("sectionId");
      const currentCount = bracketVideoCountsMap.get(sectionId) || 0;
      bracketVideoCountsMap.set(
        sectionId,
        currentCount + (record.get("videoCount") as number)
      );
    });

    // Build sections array with event context
    const sections = sectionsResult.records.map((record) => {
      const sectionData = record.get("section");
      const sectionId = sectionData.id;
      const directVideoCount = sectionData.videoCount || 0;
      const bracketVideoCount = bracketVideoCountsMap.get(sectionId) || 0;
      const totalVideoCount = directVideoCount + bracketVideoCount;

      return {
        id: sectionId,
        title: sectionData.title,
        description: sectionData.description,
        hasBrackets: sectionData.hasBrackets,
        videoCount: totalVideoCount,
        bracketCount: sectionData.bracketCount || 0,
        styles: sectionStylesMap.get(sectionId) || [],
        winners: sectionWinnersMap.get(sectionId) || [],
        eventId: record.get("eventId"),
        eventTitle: record.get("eventTitle"),
      };
    });

    return sections;
  } catch (error) {
    console.error("Error fetching all sections:", error);
    await session.close();
    return [];
  }
};

export const EditCompetition = async (competition: Competition) => {
  const { id, eventDetails } = competition;

  // Validate all roles before editing
  if (competition.roles && competition.roles.length > 0) {
    for (const role of competition.roles) {
      if (!isValidRole(role.title)) {
        throw new Error(
          `Invalid role: ${role.title}. Must be one of: ${AVAILABLE_ROLES.join(
            ", "
          )}`
        );
      }
    }

    // Preprocess roles to ensure all users have ids
    const processedRoles = await Promise.all(
      competition.roles.map(async (role) => {
        if (!role.user) {
          return role;
        }
        const userId = await getUserIdFromUserSearchItem(role.user);
        return {
          ...role,
          user: {
            ...role.user,
            id: userId,
          },
        };
      })
    );
    competition = {
      ...competition,
      roles: processedRoles,
    };
  }

  const session = driver.session();

  try {
    // Start transaction
    const tx = session.beginTransaction();

    // Update competition properties
    await tx.run(
      `MATCH (e:Event:Competition {id: $id})
       SET e.title = $title,
           e.description = $description,
           e.address = $address,
           e.prize = $prize,
           e.entryCost = $entryCost,
           e.startDate = $startDate,
           e.startTime = $startTime,
           e.endTime = $endTime,
           e.schedule = $schedule`,
      {
        id,
        title: eventDetails.title,
        description: eventDetails.description,
        address: eventDetails.address,
        prize: eventDetails.prize,
        entryCost: eventDetails.entryCost,
        startDate: eventDetails.startDate,
        startTime: eventDetails.startTime,
        endTime: eventDetails.endTime,
        schedule: eventDetails.schedule || null,
      }
    );

    // Update city relationship
    await tx.run(
      `MATCH (e:Event:Competition {id: $id})-[i:IN]->(c:City)
       DELETE i
       WITH e
       MERGE (c:City {id: $city.id})
       ON CREATE SET 
         c.name = $city.name,
         c.countryCode = $city.countryCode,
         c.region = $city.region,
         c.population = $city.population,
         c.timezone = $city.timezone
       ON MATCH SET
         c.population = $city.population
       MERGE (e)-[:IN]->(c)`,
      { id, city: eventDetails.city }
    );

    // Update poster
    await tx.run(
      `MATCH (e:Event:Competition {id: $id})
       OPTIONAL MATCH (oldPoster:Image)-[r:POSTER_OF]->(e)
       DELETE r
       WITH e
       FOREACH (poster IN CASE WHEN $poster IS NOT NULL AND $poster.id IS NOT NULL THEN [$poster] ELSE [] END |
         MERGE (newPoster:Image:Gallery { id: poster.id })
         ON CREATE SET
           newPoster.title = poster.title,
           newPoster.url = poster.url
         SET
           newPoster.title = poster.title,
           newPoster.url = poster.url
         MERGE (newPoster)-[:POSTER_OF]->(e)
       )`,
      { id, poster: eventDetails.poster }
    );

    // Update roles
    const validRoleFormats = getNeo4jRoleFormats();
    // Separate regular roles from Team Member roles
    const regularRoles =
      competition.roles?.filter((role) => role.title !== "Team Member") || [];
    const teamMemberRoles =
      competition.roles?.filter((role) => role.title === "Team Member") || [];

    // Handle regular roles
    if (regularRoles.length > 0) {
      await tx.run(
        `MATCH (e:Event {id: $id})
         UNWIND $roles AS roleData
         MERGE (u:User { id: roleData.user.id })
         WITH u, e, roleData
         CALL apoc.merge.relationship(u, toUpper(roleData.title), {}, {}, e)
         YIELD rel
         RETURN e, u
         `,
        { id, roles: regularRoles }
      );
    }

    // Handle Team Member roles (create TEAM_MEMBER relationships)
    if (teamMemberRoles.length > 0) {
      await tx.run(
        `MATCH (e:Event {id: $id})
         UNWIND $roles AS roleData
         MERGE (u:User { id: roleData.user.id })
         MERGE (u)-[:TEAM_MEMBER]->(e)
         RETURN e, u
         `,
        { id, roles: teamMemberRoles }
      );
    }

    // Delete roles not in the new list (but preserve CREATED and TEAM_MEMBER relationships)
    // First, delete regular role relationships (exclude TEAM_MEMBER from deletion)
    const regularRoleFormats = validRoleFormats.filter(
      (r) => r !== "TEAM_MEMBER"
    );
    if (regularRoles.length > 0) {
      await tx.run(
        `MATCH (e:Event {id: $id})
         MATCH (u:User)-[r]->(e)
         WHERE type(r) IN $validRoles AND NOT u.id IN [role IN $roles | role.user.id]
         DELETE r`,
        { id, roles: regularRoles, validRoles: regularRoleFormats }
      );
    } else {
      // If no regular roles, delete all role relationships except CREATED and TEAM_MEMBER
      await tx.run(
        `MATCH (e:Event {id: $id})
         MATCH (u:User)-[r]->(e)
         WHERE type(r) IN $validRoles
         DELETE r`,
        { id, validRoles: regularRoleFormats }
      );
    }

    // Delete Team Member relationships not in the new list
    if (teamMemberRoles.length > 0) {
      await tx.run(
        `MATCH (e:Event {id: $id})
         MATCH (u:User)-[r:TEAM_MEMBER]->(e)
         WHERE NOT u.id IN [role IN $roles | role.user.id]
         DELETE r`,
        { id, roles: teamMemberRoles }
      );
    } else {
      // If no team member roles, delete all TEAM_MEMBER relationships (but preserve CREATED)
      await tx.run(
        `MATCH (e:Event {id: $id})
         MATCH (u:User)-[r:TEAM_MEMBER]->(e)
         DELETE r`,
        { id }
      );
    }

    // Ensure creator relationship is preserved/recreated
    if (eventDetails.creatorId) {
      await tx.run(
        `MATCH (e:Event {id: $id})
         MATCH (creator:User {id: $creatorId})
         MERGE (creator)-[:CREATED]->(e)`,
        { id, creatorId: eventDetails.creatorId }
      );
    }

    // Update sub events - now using :SUBEVENT_OF relationships
    // Remove old subevent relationships
    await tx.run(
      `MATCH (e:Event:Competition {id: $id})
       OPTIONAL MATCH (subEvent:Event)-[r:SUBEVENT_OF]->(e)
       DELETE r`,
      { id }
    );

    // Create new subevent relationships
    if (competition.subEvents && competition.subEvents.length > 0) {
      for (const subEvent of competition.subEvents) {
        // Validate that subevent doesn't already have a parent
        const existingParentCheck = await tx.run(
          `MATCH (se:Event {id: $subEventId})-[r:SUBEVENT_OF]->(parent:Event)
           WHERE parent.id <> $eventId
           RETURN count(r) as parentCount`,
          { subEventId: subEvent.id, eventId: id }
        );

        const parentCount =
          existingParentCheck.records[0]?.get("parentCount")?.toNumber() || 0;
        if (parentCount > 0) {
          throw new Error(
            `Event ${subEvent.id} already has a parent event. Nested subevents are not allowed.`
          );
        }

        // Create relationship
        await tx.run(
          `MATCH (mainEvent:Event:Competition {id: $eventId})
           MATCH (subEvent:Event {id: $subEventId})
           MERGE (subEvent)-[:SUBEVENT_OF]->(mainEvent)`,
          { eventId: id, subEventId: subEvent.id }
        );
      }
    }

    // Delete all user-video relationships
    await tx.run(
      `MATCH (e:Event:Competition {id: $id})
       OPTIONAL MATCH (e)<-[:IN]-(s:Section)<-[:IN]-(v:Video)<-[r:DANCER|WINNER|CHOREOGRAPHER|TEACHER]-(u:User)
       DELETE r`,
      { id }
    );

    await tx.run(
      `MATCH (e:Event:Competition {id: $id})
       OPTIONAL MATCH (e)<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)<-[r:DANCER|WINNER|CHOREOGRAPHER|TEACHER]-(u:User)
       DELETE r`,
      { id }
    );

    // Delete all existing style relationships for sections and videos
    await tx.run(
      `MATCH (e:Event:Competition {id: $id})
       OPTIONAL MATCH (e)<-[:IN]-(s:Section)-[rs:STYLE]->(:Style)
       DELETE rs`,
      { id }
    );

    await tx.run(
      `MATCH (e:Event:Competition {id: $id})
       OPTIONAL MATCH (e)<-[:IN]-(s:Section)<-[:IN]-(v:Video)-[rv:STYLE]->(:Style)
       DELETE rv`,
      { id }
    );

    await tx.run(
      `MATCH (e:Event:Competition {id: $id})
       OPTIONAL MATCH (e)<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)-[rv:STYLE]->(:Style)
       DELETE rv`,
      { id }
    );

    // Update sections
    await tx.run(
      `MATCH (e:Event {id: $id})
       FOREACH (sec IN $sections |
         MERGE (s:Section { id: sec.id })
         ON CREATE SET
           s.applyStylesToVideos = COALESCE(sec.applyStylesToVideos, false)
         SET
           s.title = sec.title,
           s.description = sec.description,
           s.applyStylesToVideos = COALESCE(sec.applyStylesToVideos, false)
         MERGE (s)-[:IN]->(e)
       )`,
      { id, sections: competition.sections }
    );

    // Create section style relationships (only if applyStylesToVideos is true)
    for (const sec of competition.sections) {
      if (sec.applyStylesToVideos && sec.styles && sec.styles.length > 0) {
        const normalizedStyles = normalizeStyleNames(sec.styles);
        await tx.run(
          `
          MATCH (s:Section {id: $sectionId})
          WITH s, $styles AS styles
          UNWIND styles AS styleName
          MERGE (style:Style {name: styleName})
          MERGE (s)-[:STYLE]->(style)
          `,
          { sectionId: sec.id, styles: normalizedStyles }
        );
      }
    }

    // Cascade delete brackets if section hasBrackets is false
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (b:Bracket)-[:IN]->(s:Section)-[:IN]->(e)
       WHERE ANY(sec IN $sections WHERE sec.id = s.id AND sec.hasBrackets = false)
       DETACH DELETE b`,
      { id, sections: competition.sections }
    );

    // Cascade delete direct section videos if section hasBrackets is true
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (vid:Video)-[:IN]->(s:Section)-[:IN]->(e)
       WHERE ANY(sec IN $sections WHERE sec.id = s.id AND sec.hasBrackets = true)
       DETACH DELETE vid`,
      { id, sections: competition.sections }
    );

    // Handle sections with brackets (hasBrackets = true)
    // First create sections
    await tx.run(
      `MATCH (e:Event {id: $id})
       UNWIND [s IN $sections WHERE s.hasBrackets = true] AS sec
       MERGE (s:Section {id: sec.id})
       MERGE (s)-[:IN]->(e)`,
      { id, sections: competition.sections }
    );

    // Then create brackets
    for (const sec of competition.sections) {
      if (sec.hasBrackets && sec.brackets) {
        for (const br of sec.brackets) {
          await tx.run(
            `MATCH (e:Event {id: $id})<-[:IN]-(s:Section {id: $sectionId})
             MERGE (b:Bracket { id: $bracketId })
             ON CREATE SET
               b.title = $title
             ON MATCH SET
               b.title = $title
             MERGE (b)-[:IN]->(s)`,
            { id, sectionId: sec.id, bracketId: br.id, title: br.title }
          );
        }
      }
    }

    // Then create bracket videos
    for (const sec of competition.sections) {
      if (sec.hasBrackets && sec.brackets) {
        for (const br of sec.brackets) {
          if (br.videos) {
            for (const bvid of br.videos) {
              // Get video type label
              const videoType = bvid.type || "battle";
              const videoLabel =
                videoType.charAt(0).toUpperCase() + videoType.slice(1);

              // Remove old video type labels before adding new one (only if video exists)
              await tx.run(
                `OPTIONAL MATCH (v:Video { id: $videoId })
                 WITH v
                 WHERE v IS NOT NULL
                 CALL apoc.create.removeLabels(v, ['Battle', 'Freestyle', 'Choreography', 'Class']) YIELD node
                 RETURN node`,
                { videoId: bvid.id }
              );

              await tx.run(
                `MATCH (b:Bracket {id: $bracketId})
                 MERGE (bv:Video { id: $videoId })
                 ON CREATE SET
                   bv.title = $title,
                   bv.src = $src
                 ON MATCH SET
                   bv.title = $title,
                   bv.src = $src
                 WITH bv, b
                 CALL apoc.create.addLabels(bv, ['Video', '${videoLabel}']) YIELD node
                 MERGE (bv)-[:IN]->(b)`,
                {
                  bracketId: br.id,
                  videoId: bvid.id,
                  title: bvid.title,
                  src: bvid.src,
                }
              );
            }
          }
        }
      }
    }

    // Then create user-video relationships for bracket videos
    for (const sec of competition.sections) {
      if (sec.hasBrackets && sec.brackets) {
        for (const br of sec.brackets) {
          if (br.videos) {
            for (const bvid of br.videos) {
              const taggedUsers = [
                ...((bvid as any).taggedWinners || []),
                ...((bvid as any).taggedDancers || []),
              ];
              if (taggedUsers.length > 0) {
                for (const user of taggedUsers) {
                  const userId = await getUserIdFromUserSearchItem(user);
                  await tx.run(
                    `MATCH (bv:Video {id: $videoId})
                     MERGE (u:User { id: $userId })
                     MERGE (u)-[:IN]->(bv)`,
                    { videoId: bvid.id, userId }
                  );
                }
              }
            }
          }
        }
      }
    }

    // Create video style relationships for bracket videos
    for (const sec of competition.sections) {
      if (sec.hasBrackets && sec.brackets) {
        for (const br of sec.brackets) {
          if (br.videos) {
            for (const bvid of br.videos) {
              if (bvid.styles && bvid.styles.length > 0) {
                const normalizedStyles = normalizeStyleNames(bvid.styles);
                await tx.run(
                  `
                  MATCH (bv:Video {id: $videoId})
                  WITH bv, $styles AS styles
                  UNWIND styles AS styleName
                  MERGE (style:Style {name: styleName})
                  MERGE (bv)-[:STYLE]->(style)
                  `,
                  { videoId: bvid.id, styles: normalizedStyles }
                );
              }
            }
          }
        }
      }
    }

    // Handle sections without brackets (hasBrackets = false)
    // First create sections
    await tx.run(
      `MATCH (e:Event {id: $id})
       UNWIND [s IN $sections WHERE s.hasBrackets = false] AS sec
       MERGE (s:Section {id: sec.id})
       MERGE (s)-[:IN]->(e)`,
      { id, sections: competition.sections }
    );

    // Then create videos
    for (const sec of competition.sections) {
      if (!sec.hasBrackets && sec.videos) {
        for (const vid of sec.videos) {
          // Get video type label
          const videoType = vid.type || "battle";
          const videoLabel =
            videoType.charAt(0).toUpperCase() + videoType.slice(1);

          // Remove old video type labels before adding new one (only if video exists)
          await tx.run(
            `OPTIONAL MATCH (v:Video { id: $videoId })
             WITH v
             WHERE v IS NOT NULL
             CALL apoc.create.removeLabels(v, ['Battle', 'Freestyle', 'Choreography', 'Class']) YIELD node
             RETURN node`,
            { videoId: vid.id }
          );

          await tx.run(
            `MATCH (e:Event {id: $id})<-[:IN]-(s:Section {id: $sectionId})
             MERGE (v:Video { id: $videoId })
             ON CREATE SET
               v.title = $title,
               v.src = $src
             ON MATCH SET
               v.title = $title,
               v.src = $src
             WITH v, s
             CALL apoc.create.addLabels(v, ['Video', '${videoLabel}']) YIELD node
             MERGE (v)-[:IN]->(s)`,
            {
              id,
              sectionId: sec.id,
              videoId: vid.id,
              title: vid.title,
              src: vid.src,
            }
          );
        }
      }
    }

    // Then create user-video relationships for direct section videos
    for (const sec of competition.sections) {
      if (!sec.hasBrackets && sec.videos) {
        for (const vid of sec.videos) {
          const taggedUsers = [
            ...((vid as any).taggedWinners || []),
            ...((vid as any).taggedDancers || []),
          ];
          if (taggedUsers.length > 0) {
            for (const user of taggedUsers) {
              const userId = await getUserIdFromUserSearchItem(user);
              await tx.run(
                `MATCH (v:Video {id: $videoId})
                 MERGE (u:User { id: $userId })
                 MERGE (u)-[:IN]->(v)`,
                { videoId: vid.id, userId }
              );
            }
          }
        }
      }
    }

    // Create video style relationships for direct section videos
    for (const sec of competition.sections) {
      if (!sec.hasBrackets && sec.videos) {
        for (const vid of sec.videos) {
          if (vid.styles && vid.styles.length > 0) {
            const normalizedStyles = normalizeStyleNames(vid.styles);
            await tx.run(
              `
              MATCH (v:Video {id: $videoId})
              WITH v, $styles AS styles
              UNWIND styles AS styleName
              MERGE (style:Style {name: styleName})
              MERGE (v)-[:STYLE]->(style)
              `,
              { videoId: vid.id, styles: normalizedStyles }
            );
          }
        }
      }
    }

    // Delete sections not in the new list
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (s:Section)-[:IN]->(e)
       WHERE NOT ANY(sec IN $sections WHERE sec.id = s.id)
       DETACH DELETE s`,
      { id, sections: competition.sections }
    );

    // Delete brackets not in the new list
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (b:Bracket)-[:IN]->(s:Section)-[:IN]->(e)
       WHERE NOT ANY(sec IN $sections WHERE ANY(br IN sec.brackets WHERE br.id = b.id))
       DETACH DELETE b`,
      { id, sections: competition.sections }
    );

    // Delete videos not in the new list (but preserve user nodes)
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (v:Video)-[:IN]->(s:Section)-[:IN]->(e)
       WHERE NOT ANY(sec IN $sections WHERE ANY(vid IN sec.videos WHERE vid.id = v.id))
       DETACH DELETE v`,
      { id, sections: competition.sections }
    );

    // Delete videos in brackets not in the new list (but preserve user nodes)
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (v:Video)-[:IN]->(b:Bracket)-[:IN]->(s:Section)-[:IN]->(e)
       WHERE NOT ANY(sec IN $sections WHERE ANY(br IN sec.brackets WHERE ANY(vid IN br.videos WHERE vid.id = v.id)))
       DETACH DELETE v`,
      { id, sections: competition.sections }
    );

    // Workshops are now separate Event:Workshop nodes, not nested in events
    // This code is removed - workshops should be managed separately
    /*
    if (competition.workshops && competition.workshops.length > 0) {
      for (const workshop of competition.workshops) {
        // Get timezone for city if needed
        let timezone = workshop.workshopDetails.city.timezone;
        if (!timezone) {
          // Try to get it from an existing city node
          const cityResult = await tx.run(
            `MATCH (c:City {id: $cityId}) RETURN c.timezone as timezone`,
            { cityId: workshop.workshopDetails.city.id }
          );
          if (cityResult.records.length > 0) {
            timezone = cityResult.records[0].get("timezone");
          }
        }

        // Get or create dates
        const now = new Date();
        const createdAt = workshop.createdAt
          ? new Date(workshop.createdAt).toISOString()
          : now.toISOString();
        const updatedAt = now.toISOString();

        // Create or update workshop
        await tx.run(
          `MATCH (e:Event {id: $eventId})
           MERGE (w:Workshop {id: $workshopId})
           ON CREATE SET
             w.title = $title,
             w.description = $description,
             w.address = $address,
             w.cost = $cost,
             w.startDate = $startDate,
             w.startTime = $startTime,
             w.endTime = $endTime,
             w.schedule = $schedule,
             w.createdAt = $createdAt,
             w.updatedAt = $updatedAt
           ON MATCH SET
             w.title = $title,
             w.description = $description,
             w.address = $address,
             w.cost = $cost,
             w.startDate = $startDate,
             w.startTime = $startTime,
             w.endTime = $endTime,
             w.schedule = $schedule,
             w.updatedAt = $updatedAt
           MERGE (w)-[:IN]->(e)`,
          {
            eventId: id,
            workshopId: workshop.id,
            title: workshop.workshopDetails.title,
            description: workshop.workshopDetails.description || null,
            address: workshop.workshopDetails.address || null,
            cost: workshop.workshopDetails.cost || null,
            startDate: workshop.workshopDetails.startDate,
            startTime: workshop.workshopDetails.startTime || null,
            endTime: workshop.workshopDetails.endTime || null,
            schedule: workshop.workshopDetails.schedule || null,
            createdAt,
            updatedAt,
          }
        );

        // Ensure creator relationship exists (only on create, preserve on update)
        if (workshop.workshopDetails.creatorId) {
          await tx.run(
            `MATCH (w:Workshop {id: $workshopId})
             MATCH (creator:User {id: $creatorId})
             MERGE (creator)-[:CREATED]->(w)`,
            {
              workshopId: workshop.id,
              creatorId: workshop.workshopDetails.creatorId,
            }
          );
        }

        // Update city relationship
        await tx.run(
          `MATCH (w:Workshop {id: $workshopId})
           OPTIONAL MATCH (w)-[oldCityRel:IN]->(:City)
           DELETE oldCityRel
           WITH w
           MERGE (c:City {id: $city.id})
           ON CREATE SET 
             c.name = $city.name,
             c.countryCode = $city.countryCode,
             c.region = $city.region,
             c.population = $city.population,
             c.timezone = $city.timezone
           ON MATCH SET
             c.population = $city.population
           MERGE (w)-[:IN]->(c)`,
          {
            workshopId: workshop.id,
            city: {
              ...workshop.workshopDetails.city,
              timezone: timezone || workshop.workshopDetails.city.timezone,
            },
          }
        );

        // Update poster
        await tx.run(
          `MATCH (w:Workshop {id: $workshopId})
           OPTIONAL MATCH (oldPoster:Image)-[r:POSTER_OF]->(w)
           DELETE r
           WITH w
           FOREACH (poster IN CASE WHEN $poster IS NOT NULL AND $poster.id IS NOT NULL THEN [$poster] ELSE [] END |
             MERGE (newPoster:Image {id: poster.id})
             ON CREATE SET
               newPoster.title = poster.title,
               newPoster.url = poster.url
             SET
               newPoster.title = poster.title,
               newPoster.url = poster.url
             MERGE (newPoster)-[:POSTER_OF]->(w)
           )`,
          {
            workshopId: workshop.id,
            poster: workshop.workshopDetails.poster,
          }
        );

        // Update roles
        if (workshop.roles && workshop.roles.length > 0) {
          // Preprocess roles to ensure all users have ids
          const processedRoles = await Promise.all(
            workshop.roles.map(async (role) => {
              if (!role.user) {
                return null; // Filter out roles without users
              }
              try {
                const userId = await getUserIdFromUserSearchItem(role.user);
                if (!userId) {
                  return null; // Filter out roles where userId lookup failed
                }
                return {
                  ...role,
                  user: {
                    ...role.user,
                    id: userId,
                  },
                };
              } catch (error) {
                console.error(`Failed to get userId for role:`, error);
                return null; // Filter out roles where userId lookup failed
              }
            })
          );

          // Filter out null roles (roles without valid users)
          const validRoles = processedRoles.filter(
            (role) => role !== null && role.user && role.user.id
          );

          // Separate regular roles from TEAM_MEMBER roles
          const regularRoles = validRoles.filter(
            (role) => role && role.title && role.title !== "TEAM_MEMBER"
          );
          const teamMemberRoles = validRoles.filter(
            (role) => role && role.title === "TEAM_MEMBER"
          );

          // Handle regular roles
          if (regularRoles.length > 0) {
            await tx.run(
              `MATCH (w:Workshop {id: $workshopId})
               UNWIND $roles AS roleData
               WITH w, roleData
               WHERE roleData.user.id IS NOT NULL
               MERGE (u:User { id: roleData.user.id })
               WITH u, w, roleData
               CALL apoc.merge.relationship(u, toUpper(roleData.title), {}, {}, w)
               YIELD rel
               RETURN w, u`,
              { workshopId: workshop.id, roles: regularRoles }
            );
          }

          // Handle TEAM_MEMBER roles (create TEAM_MEMBER relationships)
          if (teamMemberRoles.length > 0) {
            await tx.run(
              `MATCH (w:Workshop {id: $workshopId})
               UNWIND $roles AS roleData
               MERGE (u:User { id: roleData.user.id })
               MERGE (u)-[:TEAM_MEMBER]->(w)
               RETURN w, u`,
              { workshopId: workshop.id, roles: teamMemberRoles }
            );
          }

          // Delete regular roles not in the new list
          if (regularRoles.length > 0) {
            await tx.run(
              `MATCH (w:Workshop {id: $workshopId})
               MATCH (u:User)-[r]->(w)
               WHERE type(r) IN ['ORGANIZER', 'TEACHER'] AND NOT u.id IN [role IN $roles WHERE role.user.id IS NOT NULL | role.user.id]
               DELETE r`,
              { workshopId: workshop.id, roles: regularRoles }
            );
          } else {
            // If no regular roles, remove all regular role relationships
            await tx.run(
              `MATCH (w:Workshop {id: $workshopId})
               MATCH (u:User)-[r]->(w)
               WHERE type(r) IN ['ORGANIZER', 'TEACHER']
               DELETE r`,
              { workshopId: workshop.id }
            );
          }

          // Delete TEAM_MEMBER relationships not in the new list
          if (teamMemberRoles.length > 0) {
            await tx.run(
              `MATCH (w:Workshop {id: $workshopId})
               MATCH (u:User)-[r:TEAM_MEMBER]->(w)
               WHERE NOT u.id IN [role IN $roles WHERE role.user.id IS NOT NULL | role.user.id]
               DELETE r`,
              { workshopId: workshop.id, roles: teamMemberRoles }
            );
          } else {
            // If no team member roles, remove all TEAM_MEMBER relationships
            await tx.run(
              `MATCH (w:Workshop {id: $workshopId})
               MATCH (u:User)-[r:TEAM_MEMBER]->(w)
               DELETE r`,
              { workshopId: workshop.id }
            );
          }
        } else {
          // Remove all roles if none provided
          await tx.run(
            `MATCH (w:Workshop {id: $workshopId})
             MATCH (u:User)-[r]->(w)
             WHERE type(r) IN ['ORGANIZER', 'TEACHER', 'TEAM_MEMBER']
             DELETE r`,
            { workshopId: workshop.id }
          );
        }

        // Delete videos not in the new list
        await tx.run(
          `MATCH (w:Workshop {id: $workshopId})
           MATCH (v:Video)-[:IN]->(w)
           WHERE NOT v.id IN [vid IN $videos | vid.id]
           DETACH DELETE v`,
          { workshopId: workshop.id, videos: workshop.videos }
        );

        // Update videos
        for (const vid of workshop.videos) {
          await tx.run(
            `MATCH (w:Workshop {id: $workshopId})
             MERGE (v:Video { id: $videoId })
             ON CREATE SET
               v.title = $title,
               v.src = $src
             ON MATCH SET
               v.title = $title,
               v.src = $src
             MERGE (v)-[:IN]->(w)`,
            {
              workshopId: workshop.id,
              videoId: vid.id,
              title: vid.title,
              src: vid.src,
            }
          );

          // Update video styles (workshops don't have dancer/winner tags)
          // Update video styles
          await tx.run(
            `MATCH (v:Video {id: $videoId})-[r:STYLE]->(:Style)
             DELETE r`,
            { videoId: vid.id }
          );

          if (vid.styles && vid.styles.length > 0) {
            const normalizedStyles = normalizeStyleNames(vid.styles);
            await tx.run(
              `
              MATCH (v:Video {id: $videoId})
              WITH v, $styles AS styles
              UNWIND styles AS styleName
              MERGE (style:Style {name: styleName})
              MERGE (v)-[:STYLE]->(style)
              `,
              { videoId: vid.id, styles: normalizedStyles }
            );
          }
        }

        // Update gallery
        await tx.run(
          `MATCH (w:Workshop {id: $workshopId})
           FOREACH (pic IN $gallery |
             MERGE (g:Image:Gallery { id: pic.id, title: pic.title, url: pic.url })
             MERGE (g)-[:PHOTO]->(w)
           )`,
          { workshopId: workshop.id, gallery: workshop.gallery }
        );

        // Delete gallery items not in the new list
        await tx.run(
          `MATCH (w:Workshop {id: $workshopId})
           MATCH (g:Image)-[:PHOTO]->(w)
           WHERE NOT g.id IN [pic IN $gallery | pic.id]
           DETACH DELETE g`,
          { workshopId: workshop.id, gallery: workshop.gallery }
        );

        // Update workshop styles
        await tx.run(
          `MATCH (w:Workshop {id: $workshopId})-[r:STYLE]->(:Style)
           DELETE r`,
          { workshopId: workshop.id }
        );

        if (
          workshop.workshopDetails.styles &&
          workshop.workshopDetails.styles.length > 0
        ) {
          const normalizedStyles = normalizeStyleNames(
            workshop.workshopDetails.styles
          );
          await tx.run(
            `
            MATCH (w:Workshop {id: $workshopId})
            WITH w, $styles AS styles
            UNWIND styles AS styleName
            MERGE (style:Style {name: styleName})
            MERGE (w)-[:STYLE]->(style)
            `,
            { workshopId: workshop.id, styles: normalizedStyles }
          );
        }
      }
    }

    // Workshops are now separate Event:Workshop nodes - removed workshop relationship handling
    */

    // Update gallery
    await tx.run(
      `MATCH (e:Event {id: $id})
       FOREACH (pic IN $gallery |
         MERGE (g:Image:Gallery { id: pic.id, title: pic.title, url: pic.url })
         MERGE (g)-[:PHOTO]->(e)
       )`,
      { id, gallery: competition.gallery }
    );

    // Delete gallery items not in the new list
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (g:Image)-[:PHOTO]->(e)
       WHERE NOT g.id IN [pic IN $gallery | pic.id]
       DETACH DELETE g`,
      { id, gallery: competition.gallery }
    );

    // Commit transaction
    await tx.commit();
    await session.close();

    return true;
  } catch (error) {
    // Rollback transaction on error
    if (session) {
      await session.close();
    }
    throw error;
  }
};

export const deleteCompetition = async (competitionId: string) => {
  const session = driver.session();
  try {
    await session.run(
      `MATCH (e:Event:Competition {id: $id})
    OPTIONAL MATCH (e)<-[:POSTER_OF|PHOTO]-(pic:Image)
    OPTIONAL MATCH (e)<-[:IN]-(s:Section)
    OPTIONAL MATCH (s)<-[:IN]-(b:Bracket)
    OPTIONAL MATCH (s)<-[:IN]-(v1:Video)
    OPTIONAL MATCH (b)<-[:IN]-(v2:Video)
    
    DETACH DELETE pic, s, b, v1, v2, e
    
    RETURN count(*) as deletedNodes`,
      {
        id: competitionId,
      }
    );
    await session.close();
    return true;
  } catch (error) {
    console.error("Error deleting competition:", error);
    return false;
  }
};

export const searchEvents = async (
  keyword?: string
): Promise<Array<{ id: string; title: string }>> => {
  const session = driver.session();

  try {
    let query = `MATCH (e:Event)`;
    const params: any = {};

    if (keyword && keyword.trim()) {
      query += ` WHERE toLower(e.title) CONTAINS toLower($keyword)`;
      params.keyword = keyword.trim();
    }

    query += ` RETURN e.id as id, e.title as title ORDER BY e.title LIMIT 20`;

    const result = await session.run(query, params);

    return result.records.map((record) => ({
      id: record.get("id"),
      title: record.get("title"),
    }));
  } finally {
    await session.close();
  }
};

/**
 * Search events that a user has access to (created, team member, moderator, admin, super_admin)
 */
export const searchAccessibleEvents = async (
  userId: string,
  authLevel: number,
  keyword?: string
): Promise<Array<{ id: string; title: string }>> => {
  const session = driver.session();

  try {
    let query = ``;
    const params: any = { userId };

    // If user is moderator, admin, or super_admin, they can see all events
    if (authLevel >= AUTH_LEVELS.MODERATOR) {
      query = `MATCH (e:Event)`;

      if (keyword && keyword.trim()) {
        query += ` WHERE toLower(e.title) CONTAINS toLower($keyword)`;
        params.keyword = keyword.trim();
      }
    } else {
      // Otherwise, only show events where user is creator or team member
      query = `
        MATCH (u:User {id: $userId})
        OPTIONAL MATCH (u)-[:CREATED]->(e1:Event)
        OPTIONAL MATCH (u)-[:TEAM_MEMBER]->(e2:Event)
        WITH collect(DISTINCT e1) + collect(DISTINCT e2) as events
        UNWIND events as e
        WHERE e IS NOT NULL
      `;

      if (keyword && keyword.trim()) {
        query += ` AND toLower(e.title) CONTAINS toLower($keyword)`;
        params.keyword = keyword.trim();
      }
    }

    query += ` RETURN DISTINCT e.id as id, e.title as title ORDER BY e.title LIMIT 20`;

    const result = await session.run(query, params);

    return result.records.map((record) => ({
      id: record.get("id"),
      title: record.get("title"),
    }));
  } finally {
    await session.close();
  }
};

/**
 * Search events for subevent selection
 * Returns events that:
 * - User has access to (created or team member, or moderator/admin/super_admin)
 * - Do not already have a parent event (to prevent nested subevents)
 * - Match the keyword if provided
 * - Include all event types the user has created (competition, workshop, session)
 * - Exclude the current event (if excludeEventId is provided)
 */
export const searchEventsForSubeventSelection = async (
  userId: string,
  authLevel: number,
  keyword?: string,
  excludeEventId?: string
): Promise<
  Array<{
    id: string;
    title: string;
    type: "competition" | "workshop" | "session";
    imageUrl?: string;
    date: string;
    city: string;
    cityId?: number;
    styles: string[];
  }>
> => {
  const session = driver.session();

  try {
    let query = ``;
    const params: any = { userId };

    // If user is moderator, admin, or super_admin, they can see all events
    if (authLevel >= AUTH_LEVELS.MODERATOR) {
      query = `
        MATCH (e:Event)
        WHERE NOT EXISTS {
          (e)-[:SUBEVENT_OF]->(:Event)
        }
      `;

      if (excludeEventId) {
        query += ` AND e.id <> $excludeEventId`;
        params.excludeEventId = excludeEventId;
      }

      if (keyword && keyword.trim()) {
        query += ` AND toLower(e.title) CONTAINS toLower($keyword)`;
        params.keyword = keyword.trim();
      }
    } else {
      // Otherwise, only show events where user is creator or team member
      query = `
        MATCH (u:User {id: $userId})
        OPTIONAL MATCH (u)-[:CREATED]->(e1:Event)
        OPTIONAL MATCH (u)-[:TEAM_MEMBER]->(e2:Event)
        WITH collect(DISTINCT e1) + collect(DISTINCT e2) as events
        UNWIND events as e
        WHERE e IS NOT NULL
          AND NOT EXISTS {
            (e)-[:SUBEVENT_OF]->(:Event)
          }
      `;

      if (excludeEventId) {
        query += ` AND e.id <> $excludeEventId`;
        params.excludeEventId = excludeEventId;
      }

      if (keyword && keyword.trim()) {
        query += ` AND toLower(e.title) CONTAINS toLower($keyword)`;
        params.keyword = keyword.trim();
      }
    }

    query += `
      OPTIONAL MATCH (e)-[:IN]->(c:City)
      OPTIONAL MATCH (e)<-[:POSTER_OF]-(p:Image)
      OPTIONAL MATCH (e)-[:STYLE]->(style:Style)
      WITH e, c, p, collect(DISTINCT style.name) as styles
      RETURN DISTINCT 
        e.id as id,
        e.title as title,
        CASE 
          WHEN 'Competition' IN labels(e) THEN 'competition'
          WHEN 'Workshop' IN labels(e) THEN 'workshop'
          WHEN 'Session' IN labels(e) THEN 'session'
          ELSE 'competition'
        END as type,
        p.url as imageUrl,
        COALESCE(e.startDate, 
          CASE 
            WHEN e.dates IS NOT NULL AND size(e.dates) > 0 THEN e.dates[0].date
            ELSE null
          END
        ) as date,
        COALESCE(c.name, '') as city,
        c.id as cityId,
        styles
      ORDER BY e.title
      LIMIT 20
    `;

    const result = await session.run(query, params);

    return result.records.map((record) => ({
      id: record.get("id"),
      title: record.get("title"),
      type: record.get("type") as "competition" | "workshop" | "session",
      imageUrl: record.get("imageUrl") || undefined,
      date: record.get("date") || "",
      city: record.get("city") || "",
      cityId: record.get("cityId") || undefined,
      styles: record.get("styles") || [],
    }));
  } finally {
    await session.close();
  }
};

export const getEvents = async (): Promise<EventCard[]> => {
  const session = driver.session();

  // Get competitions with basic info (only Event:Competition)
  const eventsResult = await session.run(
    `MATCH (e:Event:Competition)-[:IN]->(c:City)
    OPTIONAL MATCH (e)<-[:POSTER_OF]-(p:Image)
    WITH DISTINCT e, c, p
    RETURN e.id as eventId, e.title as title, e.startDate as date, c.name as city, c.id as cityId, p.url as imageUrl`
  );

  // Get all styles for each competition (from sections and videos)
  const stylesResult = await session.run(
    `MATCH (e:Event:Competition)
    OPTIONAL MATCH (e)<-[:IN]-(s:Section)-[:STYLE]->(sectionStyle:Style)
    OPTIONAL MATCH (e)<-[:IN]-(s2:Section)<-[:IN]-(v:Video)-[:STYLE]->(videoStyle:Style)
    OPTIONAL MATCH (e)<-[:IN]-(s3:Section)<-[:IN]-(b:Bracket)<-[:IN]-(bv:Video)-[:STYLE]->(bracketVideoStyle:Style)
    WITH e.id as eventId, 
         collect(DISTINCT sectionStyle.name) as sectionStyles,
         collect(DISTINCT videoStyle.name) as videoStyles,
         collect(DISTINCT bracketVideoStyle.name) as bracketVideoStyles
    WITH eventId, 
         [style IN sectionStyles WHERE style IS NOT NULL] as filteredSectionStyles,
         [style IN videoStyles WHERE style IS NOT NULL] as filteredVideoStyles,
         [style IN bracketVideoStyles WHERE style IS NOT NULL] as filteredBracketVideoStyles
    RETURN eventId, 
           filteredSectionStyles + filteredVideoStyles + filteredBracketVideoStyles as allStyles`
  );

  // Create a map of eventId -> styles
  const stylesMap = new Map<string, string[]>();
  stylesResult.records.forEach((record) => {
    const eventId = record.get("eventId");
    const allStyles = (record.get("allStyles") || []) as unknown[];
    // Remove duplicates and filter out nulls
    const uniqueStyles = Array.from(
      new Set(
        allStyles.filter(
          (s): s is string => typeof s === "string" && s !== null
        )
      )
    );
    stylesMap.set(eventId, uniqueStyles);
  });

  await session.close();

  // Combine event data with styles
  return eventsResult.records.map((record) => {
    const eventId = record.get("eventId");
    return {
      id: eventId,
      title: record.get("title"),
      series: undefined,
      imageUrl: record.get("imageUrl"),
      date: record.get("date"),
      city: record.get("city"),
      cityId: record.get("cityId") as number | undefined,
      styles: stylesMap.get(eventId) || [],
    };
  });
};

export interface StyleData {
  styleName: string;
  events: EventCard[];
  cityFilteredEvents?: EventCard[];
  sections: Array<{
    id: string;
    title: string;
    eventId: string;
    eventTitle: string;
  }>;
  videos: Array<{
    video: Video;
    eventId: string;
    eventTitle: string;
    sectionId: string;
    sectionTitle: string;
  }>;
  users: Array<{
    id: string;
    displayName: string;
    username: string;
    image?: string;
    styles: string[];
  }>;
  cityFilteredUsers?: Array<{
    id: string;
    displayName: string;
    username: string;
    image?: string;
    styles: string[];
  }>;
  workshops: WorkshopCard[];
  sessions: SessionCard[];
}

export const getStyleData = async (
  styleName: string,
  cityId?: number
): Promise<StyleData | null> => {
  const session = driver.session();

  try {
    // Normalize style name to lowercase for querying
    const normalizedStyleName = normalizeStyleName(styleName);

    // Check if style exists
    const styleCheckResult = await session.run(
      `MATCH (s:Style {name: $styleName})
       RETURN s.name as styleName`,
      { styleName: normalizedStyleName }
    );

    if (styleCheckResult.records.length === 0) {
      return null;
    }

    // Get events with this style (from sections or videos)
    const eventsResult = await session.run(
      `MATCH (style:Style {name: $styleName})
       OPTIONAL MATCH (style)<-[:STYLE]-(s:Section)-[:IN]->(e:Event)
       OPTIONAL MATCH (style)<-[:STYLE]-(v:Video)-[:IN]->(s2:Section)-[:IN]->(e2:Event)
       OPTIONAL MATCH (style)<-[:STYLE]-(v2:Video)-[:IN]->(b:Bracket)-[:IN]->(s3:Section)-[:IN]->(e3:Event)
       WITH collect(DISTINCT e) as events1, collect(DISTINCT e2) as events2, collect(DISTINCT e3) as events3
       WITH [event IN events1 + events2 + events3 WHERE event IS NOT NULL] as allEvents
       UNWIND allEvents as event
       WITH DISTINCT event
      OPTIONAL MATCH (event)-[:IN]->(c:City)
      OPTIONAL MATCH (poster:Image)-[:POSTER_OF]->(event)
      RETURN event.id as eventId, event.title as title, event.startDate as date, c.name as city, c.id as cityId, poster.url as imageUrl
      ORDER BY event.startDate DESC`,
      { styleName: normalizedStyleName }
    );

    // Get sections with this style
    const sectionsResult = await session.run(
      `MATCH (style:Style {name: $styleName})<-[:STYLE]-(s:Section)-[:IN]->(e:Event)
       RETURN s.id as sectionId, s.title as sectionTitle, e.id as eventId, e.title as eventTitle
       ORDER BY e.startDate DESC, s.title`,
      { styleName: normalizedStyleName }
    );

    // Get videos with this style (from sections and brackets)
    const videosResult = await session.run(
      `MATCH (style:Style {name: $styleName})<-[:STYLE]-(v:Video)
       OPTIONAL MATCH (v)-[:IN]->(s:Section)-[:IN]->(e:Event)
       OPTIONAL MATCH (v)-[:IN]->(b:Bracket)-[:IN]->(s2:Section)-[:IN]->(e2:Event)
       WITH v, 
            COALESCE(s, s2) as section,
            COALESCE(e, e2) as event
       WHERE section IS NOT NULL AND event IS NOT NULL
       RETURN v.id as videoId, v.title as videoTitle, v.src as videoSrc,
              section.id as sectionId, section.title as sectionTitle,
              event.id as eventId, event.title as eventTitle
       ORDER BY event.startDate DESC, section.title, v.title`,
      { styleName: normalizedStyleName }
    );

    // Get all styles for each event
    const eventStylesResult = await session.run(
      `MATCH (style:Style {name: $styleName})
       OPTIONAL MATCH (style)<-[:STYLE]-(s:Section)-[:IN]->(e:Event)
       OPTIONAL MATCH (style)<-[:STYLE]-(v:Video)-[:IN]->(s2:Section)-[:IN]->(e2:Event)
       OPTIONAL MATCH (style)<-[:STYLE]-(v2:Video)-[:IN]->(b:Bracket)-[:IN]->(s3:Section)-[:IN]->(e3:Event)
       WITH collect(DISTINCT e) as events1, collect(DISTINCT e2) as events2, collect(DISTINCT e3) as events3
       WITH [event IN events1 + events2 + events3 WHERE event IS NOT NULL] as allEvents
       UNWIND allEvents as event
       WITH DISTINCT event
       OPTIONAL MATCH (event)<-[:IN]-(s:Section)-[:STYLE]->(sectionStyle:Style)
       OPTIONAL MATCH (event)<-[:IN]-(s2:Section)<-[:IN]-(v:Video)-[:STYLE]->(videoStyle:Style)
       OPTIONAL MATCH (event)<-[:IN]-(s3:Section)<-[:IN]-(b:Bracket)<-[:IN]-(bv:Video)-[:STYLE]->(bracketVideoStyle:Style)
       WITH event.id as eventId,
            collect(DISTINCT sectionStyle.name) as sectionStyles,
            collect(DISTINCT videoStyle.name) as videoStyles,
            collect(DISTINCT bracketVideoStyle.name) as bracketVideoStyles
       WITH eventId,
            [style IN sectionStyles WHERE style IS NOT NULL] as filteredSectionStyles,
            [style IN videoStyles WHERE style IS NOT NULL] as filteredVideoStyles,
            [style IN bracketVideoStyles WHERE style IS NOT NULL] as filteredBracketVideoStyles
       RETURN eventId,
              filteredSectionStyles + filteredVideoStyles + filteredBracketVideoStyles as allStyles`,
      { styleName: normalizedStyleName }
    );

    // Create styles map for events
    const eventStylesMap = new Map<string, string[]>();
    eventStylesResult.records.forEach((record) => {
      const eventId = record.get("eventId");
      const allStyles = (record.get("allStyles") || []) as unknown[];
      const uniqueStyles = Array.from(
        new Set(
          allStyles.filter(
            (s): s is string => typeof s === "string" && s !== null
          )
        )
      );
      eventStylesMap.set(eventId, uniqueStyles);
    });

    // Get video styles
    const videoStylesResult = await session.run(
      `MATCH (style:Style {name: $styleName})<-[:STYLE]-(v:Video)
       OPTIONAL MATCH (v)-[:STYLE]->(vs:Style)
       OPTIONAL MATCH (v)-[:IN]->(s:Section)-[:IN]->(e:Event)
       OPTIONAL MATCH (v)-[:IN]->(b:Bracket)-[:IN]->(s2:Section)-[:IN]->(e2:Event)
       WITH v, 
            COALESCE(s, s2) as section,
            COALESCE(e, e2) as event,
            collect(DISTINCT vs.name) as videoStyles
       WHERE section IS NOT NULL AND event IS NOT NULL
       RETURN v.id as videoId, 
              [style IN videoStyles WHERE style IS NOT NULL] as styles`,
      { styleName: normalizedStyleName }
    );

    const videoStylesMap = new Map<string, string[]>();
    videoStylesResult.records.forEach((record) => {
      const videoId = record.get("videoId");
      const styles = (record.get("styles") || []) as string[];
      videoStylesMap.set(videoId, styles);
    });

    // Get tagged users for videos
    const videoUsersResult = await session.run(
      `MATCH (style:Style {name: $styleName})<-[:STYLE]-(v:Video)<-[:IN]-(u:User)
       RETURN v.id as videoId, collect(DISTINCT {
         id: u.id,
         displayName: u.displayName,
         username: u.username
       }) as taggedUsers`,
      { styleName: normalizedStyleName }
    );

    const videoUsersMap = new Map<string, UserSearchItem[]>();
    videoUsersResult.records.forEach((record) => {
      const videoId = record.get("videoId");
      const taggedUsers = record.get("taggedUsers") || [];
      videoUsersMap.set(videoId, taggedUsers);
    });

    // Get users with this style (users who have STYLE relationship)
    const usersResult = await session.run(
      `MATCH (style:Style {name: $styleName})<-[:STYLE]-(u:User)
       OPTIONAL MATCH (u)-[:STYLE]->(s:Style)
       RETURN u.id as id, u.displayName as displayName, u.username as username,
              u.image as image, collect(DISTINCT s.name) as styles
       ORDER BY u.displayName ASC, u.username ASC`,
      { styleName: normalizedStyleName }
    );

    // Get city-filtered events with this style (if cityId is provided)
    let cityFilteredEventsResult: any = null;
    let cityFilteredEventStylesResult: any = null;
    if (cityId !== undefined) {
      cityFilteredEventsResult = await session.run(
        `MATCH (style:Style {name: $styleName})
         OPTIONAL MATCH (style)<-[:STYLE]-(s:Section)-[:IN]->(e:Event)-[:IN]->(c:City {id: $cityId})
         OPTIONAL MATCH (style)<-[:STYLE]-(v:Video)-[:IN]->(s2:Section)-[:IN]->(e2:Event)-[:IN]->(c2:City {id: $cityId})
         OPTIONAL MATCH (style)<-[:STYLE]-(v2:Video)-[:IN]->(b:Bracket)-[:IN]->(s3:Section)-[:IN]->(e3:Event)-[:IN]->(c3:City {id: $cityId})
         WITH collect(DISTINCT e) as events1, collect(DISTINCT e2) as events2, collect(DISTINCT e3) as events3
         WITH [event IN events1 + events2 + events3 WHERE event IS NOT NULL] as allEvents
         UNWIND allEvents as event
         WITH DISTINCT event
         OPTIONAL MATCH (event)-[:IN]->(c:City)
         OPTIONAL MATCH (poster:Image)-[:POSTER_OF]->(event)
         RETURN event.id as eventId, event.title as title, event.startDate as date, c.name as city, c.id as cityId, poster.url as imageUrl
         ORDER BY event.startDate DESC`,
        { styleName: normalizedStyleName, cityId }
      );

      // Get all styles for city-filtered events
      cityFilteredEventStylesResult = await session.run(
        `MATCH (style:Style {name: $styleName})
         OPTIONAL MATCH (style)<-[:STYLE]-(s:Section)-[:IN]->(e:Event)-[:IN]->(c:City {id: $cityId})
         OPTIONAL MATCH (style)<-[:STYLE]-(v:Video)-[:IN]->(s2:Section)-[:IN]->(e2:Event)-[:IN]->(c2:City {id: $cityId})
         OPTIONAL MATCH (style)<-[:STYLE]-(v2:Video)-[:IN]->(b:Bracket)-[:IN]->(s3:Section)-[:IN]->(e3:Event)-[:IN]->(c3:City {id: $cityId})
         WITH collect(DISTINCT e) as events1, collect(DISTINCT e2) as events2, collect(DISTINCT e3) as events3
         WITH [event IN events1 + events2 + events3 WHERE event IS NOT NULL] as allEvents
         UNWIND allEvents as event
         WITH DISTINCT event
         OPTIONAL MATCH (event)<-[:IN]-(s:Section)-[:STYLE]->(sectionStyle:Style)
         OPTIONAL MATCH (event)<-[:IN]-(s2:Section)<-[:IN]-(v:Video)-[:STYLE]->(videoStyle:Style)
         OPTIONAL MATCH (event)<-[:IN]-(s3:Section)<-[:IN]-(b:Bracket)<-[:IN]-(bv:Video)-[:STYLE]->(bracketVideoStyle:Style)
         WITH event.id as eventId,
              collect(DISTINCT sectionStyle.name) as sectionStyles,
              collect(DISTINCT videoStyle.name) as videoStyles,
              collect(DISTINCT bracketVideoStyle.name) as bracketVideoStyles
         WITH eventId,
              [style IN sectionStyles WHERE style IS NOT NULL] as filteredSectionStyles,
              [style IN videoStyles WHERE style IS NOT NULL] as filteredVideoStyles,
              [style IN bracketVideoStyles WHERE style IS NOT NULL] as filteredBracketVideoStyles
         RETURN eventId,
                filteredSectionStyles + filteredVideoStyles + filteredBracketVideoStyles as allStyles`,
        { styleName: normalizedStyleName, cityId }
      );
    }

    // Get city-filtered users with this style (if cityId is provided)
    let cityFilteredUsersResult: any = null;
    if (cityId !== undefined) {
      cityFilteredUsersResult = await session.run(
        `MATCH (style:Style {name: $styleName})<-[:STYLE]-(u:User)-[:LOCATED_IN]->(c:City {id: $cityId})
         OPTIONAL MATCH (u)-[:STYLE]->(s:Style)
         RETURN u.id as id, u.displayName as displayName, u.username as username,
                u.image as image, collect(DISTINCT s.name) as styles
         ORDER BY u.displayName ASC, u.username ASC`,
        { styleName: normalizedStyleName, cityId }
      );
    }

    // Get workshops with this style (from workshop STYLE relationship or videos)
    const workshopsResult = await session.run(
      `MATCH (style:Style {name: $styleName})
       OPTIONAL MATCH (style)<-[:STYLE]-(w:Workshop)
       OPTIONAL MATCH (style)<-[:STYLE]-(v:Video)-[:IN]->(w2:Workshop)
       WITH collect(DISTINCT w) as workshops1, collect(DISTINCT w2) as workshops2
       WITH [w IN workshops1 + workshops2 WHERE w IS NOT NULL] as allWorkshops
       UNWIND allWorkshops as workshop
       WITH DISTINCT workshop
       OPTIONAL MATCH (workshop)-[:IN]->(c:City)
       OPTIONAL MATCH (poster:Image)-[:POSTER_OF]->(workshop)
       RETURN workshop.id as id, workshop.title as title, workshop.startDate as startDate,
              workshop.cost as cost, c.name as city, c.id as cityId, poster.url as imageUrl`,
      { styleName: normalizedStyleName }
    );

    // Get workshop styles
    const workshopStylesResult = await session.run(
      `MATCH (style:Style {name: $styleName})
       OPTIONAL MATCH (style)<-[:STYLE]-(w:Workshop)
       OPTIONAL MATCH (style)<-[:STYLE]-(v:Video)-[:IN]->(w2:Workshop)
       WITH collect(DISTINCT w) as workshops1, collect(DISTINCT w2) as workshops2
       WITH [w IN workshops1 + workshops2 WHERE w IS NOT NULL] as allWorkshops
       UNWIND allWorkshops as workshop
       WITH DISTINCT workshop
       OPTIONAL MATCH (workshop)-[:STYLE]->(ws:Style)
       OPTIONAL MATCH (workshop)<-[:IN]-(v:Video)-[:STYLE]->(vs:Style)
       WITH workshop.id as workshopId,
            collect(DISTINCT ws.name) as workshopStyles,
            collect(DISTINCT vs.name) as videoStyles
       RETURN workshopId,
              [s IN workshopStyles WHERE s IS NOT NULL] + [s IN videoStyles WHERE s IS NOT NULL] as allStyles`,
      { styleName: normalizedStyleName }
    );

    const workshopStylesMap = new Map<string, string[]>();
    workshopStylesResult.records.forEach((record) => {
      const workshopId = record.get("workshopId");
      const allStyles = (record.get("allStyles") || []) as unknown[];
      const uniqueStyles = Array.from(
        new Set(
          allStyles.filter(
            (s): s is string => typeof s === "string" && s !== null
          )
        )
      );
      workshopStylesMap.set(workshopId, uniqueStyles);
    });

    // Get sessions with this style (from session STYLE relationship or videos)
    const sessionsResult = await session.run(
      `MATCH (style:Style {name: $styleName})
       OPTIONAL MATCH (style)<-[:STYLE]-(s:Session)
       OPTIONAL MATCH (style)<-[:STYLE]-(v:Video)-[:IN]->(s2:Session)
       WITH collect(DISTINCT s) as sessions1, collect(DISTINCT s2) as sessions2
       WITH [s IN sessions1 + sessions2 WHERE s IS NOT NULL] as allSessions
       UNWIND allSessions as session
       WITH DISTINCT session
       OPTIONAL MATCH (session)-[:IN]->(c:City)
       OPTIONAL MATCH (poster:Image)-[:POSTER_OF]->(session)
       RETURN session.id as id, session.title as title, session.dates as dates,
              session.cost as cost, c.name as city, c.id as cityId, poster.url as imageUrl`,
      { styleName: normalizedStyleName }
    );

    // Get session styles
    const sessionStylesResult = await session.run(
      `MATCH (style:Style {name: $styleName})
       OPTIONAL MATCH (style)<-[:STYLE]-(s:Session)
       OPTIONAL MATCH (style)<-[:STYLE]-(v:Video)-[:IN]->(s2:Session)
       WITH collect(DISTINCT s) as sessions1, collect(DISTINCT s2) as sessions2
       WITH [s IN sessions1 + sessions2 WHERE s IS NOT NULL] as allSessions
       UNWIND allSessions as session
       WITH DISTINCT session
       OPTIONAL MATCH (session)-[:STYLE]->(ss:Style)
       OPTIONAL MATCH (session)<-[:IN]-(v:Video)-[:STYLE]->(vs:Style)
       WITH session.id as sessionId,
            collect(DISTINCT ss.name) as sessionStyles,
            collect(DISTINCT vs.name) as videoStyles
       RETURN sessionId,
              [s IN sessionStyles WHERE s IS NOT NULL] + [s IN videoStyles WHERE s IS NOT NULL] as allStyles`,
      { styleName: normalizedStyleName }
    );

    const sessionStylesMap = new Map<string, string[]>();
    sessionStylesResult.records.forEach((record) => {
      const sessionId = record.get("sessionId");
      const allStyles = (record.get("allStyles") || []) as unknown[];
      const uniqueStyles = Array.from(
        new Set(
          allStyles.filter(
            (s): s is string => typeof s === "string" && s !== null
          )
        )
      );
      sessionStylesMap.set(sessionId, uniqueStyles);
    });

    await session.close();

    // Build events array
    const events: EventCard[] = eventsResult.records.map((record) => {
      const eventId = record.get("eventId");
      return {
        id: eventId,
        title: record.get("title"),
        series: undefined,
        imageUrl: record.get("imageUrl"),
        date: record.get("date"),
        city: record.get("city"),
        cityId: record.get("cityId") as number | undefined,
        styles: eventStylesMap.get(eventId) || [],
      };
    });

    // Build sections array
    const sections = sectionsResult.records.map((record) => ({
      id: record.get("sectionId"),
      title: record.get("sectionTitle"),
      eventId: record.get("eventId"),
      eventTitle: record.get("eventTitle"),
    }));

    // Build videos array
    const videos = videosResult.records.map((record) => ({
      video: {
        id: record.get("videoId"),
        title: record.get("videoTitle"),
        src: record.get("videoSrc"),
        taggedUsers: videoUsersMap.get(record.get("videoId")) || [],
        styles: videoStylesMap.get(record.get("videoId")) || [],
        type: "battle", // Default type - should be determined from video node labels
      } as Video,
      eventId: record.get("eventId"),
      eventTitle: record.get("eventTitle"),
      sectionId: record.get("sectionId"),
      sectionTitle: record.get("sectionTitle"),
    }));

    // Build users array
    const users = usersResult.records.map((record) => ({
      id: record.get("id"),
      displayName: record.get("displayName") || "",
      username: record.get("username") || "",
      image: record.get("image"),
      styles: (record.get("styles") || []).filter(
        (s: any) => s !== null && s !== undefined
      ) as string[],
    }));

    // Build workshops array
    const workshops: WorkshopCard[] = workshopsResult.records.map((record) => ({
      id: record.get("id"),
      title: record.get("title"),
      date: record.get("startDate"),
      cost: record.get("cost"),
      city: record.get("city") || "",
      cityId: record.get("cityId"),
      imageUrl: record.get("imageUrl"),
      styles: workshopStylesMap.get(record.get("id")) || [],
    }));

    // Build sessions array
    const sessions: SessionCard[] = sessionsResult.records.map((record) => {
      // Parse dates array and extract first date
      let firstDate = "";
      const dates = record.get("dates");
      if (dates) {
        try {
          const parsedDates =
            typeof dates === "string" ? JSON.parse(dates) : dates;
          if (Array.isArray(parsedDates) && parsedDates.length > 0) {
            firstDate = parsedDates[0].date || "";
          }
        } catch (error) {
          console.error("Error parsing dates array:", error);
        }
      }

      return {
        id: record.get("id"),
        title: record.get("title"),
        date: firstDate,
        cost: record.get("cost"),
        city: record.get("city") || "",
        cityId: record.get("cityId"),
        imageUrl: record.get("imageUrl"),
        styles: sessionStylesMap.get(record.get("id")) || [],
      };
    });

    // Build city-filtered events array (if cityId was provided)
    let cityFilteredEvents: EventCard[] = [];
    if (cityFilteredEventsResult && cityFilteredEventStylesResult) {
      // Create styles map for city-filtered events
      const cityFilteredEventStylesMap = new Map<string, string[]>();
      cityFilteredEventStylesResult.records.forEach((record: any) => {
        const eventId = record.get("eventId");
        const allStyles = (record.get("allStyles") || []) as unknown[];
        const uniqueStyles = Array.from(
          new Set(
            allStyles.filter(
              (s): s is string => typeof s === "string" && s !== null
            )
          )
        );
        cityFilteredEventStylesMap.set(eventId, uniqueStyles);
      });

      cityFilteredEvents = cityFilteredEventsResult.records.map(
        (record: any) => {
          const eventId = record.get("eventId");
          return {
            id: eventId,
            title: record.get("title"),
            series: undefined,
            imageUrl: record.get("imageUrl"),
            date: record.get("date"),
            city: record.get("city"),
            cityId: record.get("cityId") as number | undefined,
            styles: cityFilteredEventStylesMap.get(eventId) || [],
          };
        }
      );
    }

    // Build city-filtered users array (if cityId was provided)
    let cityFilteredUsers: Array<{
      id: string;
      displayName: string;
      username: string;
      image?: string;
      styles: string[];
    }> = [];
    if (cityFilteredUsersResult) {
      cityFilteredUsers = cityFilteredUsersResult.records.map(
        (record: any) => ({
          id: record.get("id"),
          displayName: record.get("displayName") || "",
          username: record.get("username") || "",
          image: record.get("image"),
          styles: (record.get("styles") || []).filter(
            (s: any) => s !== null && s !== undefined
          ) as string[],
        })
      );
    }

    return {
      styleName: normalizedStyleName,
      events,
      cityFilteredEvents:
        cityFilteredEvents.length > 0 ? cityFilteredEvents : undefined,
      sections,
      videos,
      users,
      cityFilteredUsers:
        cityFilteredUsers.length > 0 ? cityFilteredUsers : undefined,
      workshops,
      sessions,
    };
  } catch (error) {
    console.error("Error fetching style data:", error);
    await session.close();
    return null;
  }
};

export const getAllStyles = async (): Promise<string[]> => {
  const session = driver.session();

  try {
    const result = await session.run(
      `MATCH (s:Style)
       RETURN DISTINCT s.name as styleName
       ORDER BY s.name ASC`
    );

    await session.close();

    return result.records.map((record) => record.get("styleName") as string);
  } catch (error) {
    console.error("Error fetching all styles:", error);
    await session.close();
    return [];
  }
};

// Gets all images including poster and gallery
// Note: Subevents are now separate events with their own posters, not included here
export const getCompetitionPictures = async (competitionId: string) => {
  const session = driver.session();
  const result = await session.run(
    `MATCH (e:Event:Competition {id: $competitionId})
    OPTIONAL MATCH (e)<-[:POSTER_OF]-(poster:Image)
    OPTIONAL MATCH (e)<-[:PHOTO]-(gallery:Image)

    RETURN poster, gallery
    `,
    {
      competitionId,
    }
  );
  await session.close();

  const pictures: string[] = [];

  result.records.forEach((record) => {
    if (record.get("poster")?.properties["url"]) {
      pictures.push(record.get("poster").properties["url"]);
    }
    if (record.get("gallery")?.properties["url"]) {
      pictures.push(record.get("gallery").properties["url"]);
    }
  });

  return pictures;
};

export interface CityData {
  city: City;
  events: EventCard[];
  users: Array<{
    id: string;
    displayName: string;
    username: string;
    image?: string;
    styles?: string[];
  }>;
}

export interface CalendarEventData {
  id: string;
  title: string;
  startDate: string;
  startTime?: string;
  endTime?: string;
  poster?: {
    id: string;
    title: string;
    url: string;
    type: string;
  } | null;
  styles: string[];
  parentEventId?: string;
  parentEventTitle?: string;
  parentEventType?: "competition" | "workshop" | "session";
}

export interface CalendarSubEventData {
  id: string;
  title: string;
  startDate: string;
  startTime?: string;
  endTime?: string;
  poster?: {
    id: string;
    title: string;
    url: string;
    type: string;
  } | null;
  styles: string[];
  parentEventId: string;
  parentEventTitle: string;
}

export interface CalendarWorkshopData {
  id: string;
  title: string;
  startDate: string;
  startTime?: string;
  endTime?: string;
  poster?: {
    id: string;
    title: string;
    url: string;
    type: string;
  } | null;
  styles: string[];
  parentEventId?: string;
  parentEventTitle?: string;
  parentEventType?: "competition" | "workshop" | "session";
}

export interface CalendarSessionData {
  id: string;
  title: string;
  dates: string; // JSON string of dates array
  poster?: {
    id: string;
    title: string;
    url: string;
    type: string;
  } | null;
  styles: string[];
  parentEventId?: string;
  parentEventTitle?: string;
  parentEventType?: "competition" | "workshop" | "session";
}

export interface CityScheduleData {
  events: CalendarEventData[];
  subevents: CalendarSubEventData[];
  workshops: CalendarWorkshopData[];
  sessions: CalendarSessionData[];
}

export const getAllCities = async (): Promise<City[]> => {
  const session = driver.session();

  try {
    const result = await session.run(
      `MATCH (c:City)
       RETURN DISTINCT c.id as id, c.name as name, c.region as region, 
              c.countryCode as countryCode, c.population as population,
              c.timezone as timezone
       ORDER BY c.name ASC`
    );

    await session.close();

    return result.records.map((record) => ({
      id: record.get("id") as number,
      name: record.get("name") as string,
      region: record.get("region") || "",
      countryCode: record.get("countryCode") || "",
      population: record.get("population") || 0,
      timezone: record.get("timezone"),
    }));
  } catch (error) {
    console.error("Error fetching all cities:", error);
    await session.close();
    return [];
  }
};

export const getCityData = async (cityId: number): Promise<CityData | null> => {
  const session = driver.session();

  try {
    // Check if city exists
    const cityCheckResult = await session.run(
      `MATCH (c:City {id: $cityId})
       RETURN c.id as id, c.name as name, c.region as region,
              c.countryCode as countryCode, c.population as population,
              c.timezone as timezone`,
      { cityId }
    );

    if (cityCheckResult.records.length === 0) {
      return null;
    }

    const cityRecord = cityCheckResult.records[0];

    // Fetch coordinates from GeoDB API
    const coordinates = await fetchCityCoordinates(cityId);

    const city: City = {
      id: cityRecord.get("id") as number,
      name: cityRecord.get("name") as string,
      region: cityRecord.get("region") || "",
      countryCode: cityRecord.get("countryCode") || "",
      population: cityRecord.get("population") || 0,
      timezone: cityRecord.get("timezone"),
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
    };

    // Get events in this city
    const eventsResult = await session.run(
      `MATCH (c:City {id: $cityId})<-[:IN]-(e:Event)
       OPTIONAL MATCH (poster:Image)-[:POSTER_OF]->(e)
       RETURN e.id as eventId, e.title as title, e.startDate as date, 
              poster.url as imageUrl
       ORDER BY e.startDate DESC`,
      { cityId }
    );

    // Get all styles for each event
    const eventStylesResult = await session.run(
      `MATCH (c:City {id: $cityId})<-[:IN]-(e:Event)
       OPTIONAL MATCH (e)<-[:IN]-(s:Section)-[:STYLE]->(sectionStyle:Style)
       OPTIONAL MATCH (e)<-[:IN]-(s2:Section)<-[:IN]-(v:Video)-[:STYLE]->(videoStyle:Style)
       OPTIONAL MATCH (e)<-[:IN]-(s3:Section)<-[:IN]-(b:Bracket)<-[:IN]-(bv:Video)-[:STYLE]->(bracketVideoStyle:Style)
       WITH e.id as eventId,
            collect(DISTINCT sectionStyle.name) as sectionStyles,
            collect(DISTINCT videoStyle.name) as videoStyles,
            collect(DISTINCT bracketVideoStyle.name) as bracketVideoStyles
       WITH eventId,
            [style IN sectionStyles WHERE style IS NOT NULL] as filteredSectionStyles,
            [style IN videoStyles WHERE style IS NOT NULL] as filteredVideoStyles,
            [style IN bracketVideoStyles WHERE style IS NOT NULL] as filteredBracketVideoStyles
       RETURN eventId,
              filteredSectionStyles + filteredVideoStyles + filteredBracketVideoStyles as allStyles`,
      { cityId }
    );

    // Create styles map for events
    const eventStylesMap = new Map<string, string[]>();
    eventStylesResult.records.forEach((record) => {
      const eventId = record.get("eventId");
      const allStyles = (record.get("allStyles") || []) as unknown[];
      const uniqueStyles = Array.from(
        new Set(
          allStyles.filter(
            (s): s is string => typeof s === "string" && s !== null
          )
        )
      );
      eventStylesMap.set(eventId, uniqueStyles);
    });

    // Build events array
    const events: EventCard[] = eventsResult.records.map((record) => {
      const eventId = record.get("eventId");
      return {
        id: eventId,
        title: record.get("title"),
        series: undefined,
        imageUrl: record.get("imageUrl"),
        date: record.get("date"),
        city: city.name,
        styles: eventStylesMap.get(eventId) || [],
      };
    });

    // Get users in this city
    const usersResult = await session.run(
      `MATCH (u:User)-[:LOCATED_IN]->(c:City {id: $cityId})
       OPTIONAL MATCH (u)-[:STYLE]->(s:Style)
       RETURN u.id as id, u.displayName as displayName, u.username as username,
              u.image as image, collect(DISTINCT s.name) as styles
       ORDER BY u.displayName ASC, u.username ASC`,
      { cityId }
    );

    const users = usersResult.records.map((record) => ({
      id: record.get("id"),
      displayName: record.get("displayName") || "",
      username: record.get("username") || "",
      image: record.get("image"),
      styles: (record.get("styles") || []).filter(
        (s: any) => s !== null && s !== undefined
      ) as string[],
    }));

    await session.close();

    return {
      city,
      events,
      users,
    };
  } catch (error) {
    console.error("Error fetching city data:", error);
    await session.close();
    return null;
  }
};

export const getCitySchedule = async (
  cityId: number
): Promise<CityScheduleData | null> => {
  const session = driver.session();

  try {
    // Get events in this city with full details
    const eventsResult = await session.run(
      `MATCH (c:City {id: $cityId})<-[:IN]-(e:Event)
       OPTIONAL MATCH (poster:Image)-[:POSTER_OF]->(e)
       OPTIONAL MATCH (e)-[:SUBEVENT_OF]->(parent:Event)
       RETURN e.id as id, e.title as title, e.startDate as startDate,
              e.startTime as startTime, e.endTime as endTime,
              CASE WHEN poster IS NOT NULL THEN {
                id: poster.id,
                title: poster.title,
                url: poster.url,
                type: poster.type
              } ELSE null END as poster,
              parent.id as parentEventId,
              parent.title as parentEventTitle,
              CASE
                WHEN 'Competition' IN labels(parent) THEN 'competition'
                WHEN 'Workshop' IN labels(parent) THEN 'workshop'
                WHEN 'Session' IN labels(parent) THEN 'session'
                ELSE null
              END as parentEventType`,
      { cityId }
    );

    // Get event styles
    const eventStylesResult = await session.run(
      `MATCH (c:City {id: $cityId})<-[:IN]-(e:Event)
       OPTIONAL MATCH (e)<-[:IN]-(s:Section)-[:STYLE]->(sectionStyle:Style)
       OPTIONAL MATCH (e)<-[:IN]-(s2:Section)<-[:IN]-(v:Video)-[:STYLE]->(videoStyle:Style)
       OPTIONAL MATCH (e)<-[:IN]-(s3:Section)<-[:IN]-(b:Bracket)<-[:IN]-(bv:Video)-[:STYLE]->(bracketVideoStyle:Style)
       WITH e.id as eventId,
            collect(DISTINCT sectionStyle.name) as sectionStyles,
            collect(DISTINCT videoStyle.name) as videoStyles,
            collect(DISTINCT bracketVideoStyle.name) as bracketVideoStyles
       WITH eventId,
            [style IN sectionStyles WHERE style IS NOT NULL] as filteredSectionStyles,
            [style IN videoStyles WHERE style IS NOT NULL] as filteredVideoStyles,
            [style IN bracketVideoStyles WHERE style IS NOT NULL] as filteredBracketVideoStyles
       RETURN eventId,
              filteredSectionStyles + filteredVideoStyles + filteredBracketVideoStyles as allStyles`,
      { cityId }
    );

    // Create styles map for events
    const eventStylesMap = new Map<string, string[]>();
    eventStylesResult.records.forEach((record) => {
      const eventId = record.get("eventId");
      const allStyles = (record.get("allStyles") || []) as unknown[];
      const uniqueStyles = Array.from(
        new Set(
          allStyles.filter(
            (s): s is string => typeof s === "string" && s !== null
          )
        )
      );
      eventStylesMap.set(eventId, uniqueStyles);
    });

    // Build events array
    const events: CalendarEventData[] = eventsResult.records.map((record) => {
      const eventId = record.get("id");
      const parentEventId = record.get("parentEventId");
      const parentEventTitle = record.get("parentEventTitle");
      const parentEventType = record.get("parentEventType");
      return {
        id: eventId,
        title: record.get("title"),
        startDate: record.get("startDate"),
        startTime: record.get("startTime") || undefined,
        endTime: record.get("endTime") || undefined,
        poster: record.get("poster") || null,
        styles: eventStylesMap.get(eventId) || [],
        ...(parentEventId && parentEventTitle
          ? {
              parentEventId,
              parentEventTitle,
              parentEventType: parentEventType || undefined,
            }
          : {}),
      };
    });

    // Get subevents connected to events in this city (now using :SUBEVENT_OF relationship)
    const subEventsResult = await session.run(
      `MATCH (c:City {id: $cityId})<-[:IN]-(mainEvent:Event)
       OPTIONAL MATCH (subEvent:Event)-[:SUBEVENT_OF]->(mainEvent)
       WHERE subEvent IS NOT NULL
       OPTIONAL MATCH (subEvent)-[:IN]->(subCity:City)
       OPTIONAL MATCH (sePoster:Image)-[:POSTER_OF]->(subEvent)
       RETURN subEvent.id as id, subEvent.title as title, subEvent.startDate as startDate,
              subEvent.startTime as startTime, subEvent.endTime as endTime,
              mainEvent.id as parentEventId, mainEvent.title as parentEventTitle,
              CASE WHEN sePoster IS NOT NULL THEN {
                id: sePoster.id,
                title: sePoster.title,
                url: sePoster.url,
                type: sePoster.type
              } ELSE null END as poster`,
      { cityId }
    );

    // Get subevent styles (from subevent itself, not parent)
    const subEventStylesResult = await session.run(
      `MATCH (c:City {id: $cityId})<-[:IN]-(mainEvent:Event)
       OPTIONAL MATCH (subEvent:Event)-[:SUBEVENT_OF]->(mainEvent)
       WHERE subEvent IS NOT NULL
       OPTIONAL MATCH (subEvent)-[:STYLE]->(style:Style)
       WITH subEvent.id as subEventId,
            collect(DISTINCT style.name) as styles
       RETURN subEventId,
              [s IN styles WHERE s IS NOT NULL] as allStyles`,
      { cityId }
    );

    // Create styles map for subevents
    const subEventStylesMap = new Map<string, string[]>();
    subEventStylesResult.records.forEach((record) => {
      const subEventId = record.get("subEventId");
      const allStyles = (record.get("allStyles") || []) as unknown[];
      const uniqueStyles = Array.from(
        new Set(
          allStyles.filter(
            (s): s is string => typeof s === "string" && s !== null
          )
        )
      );
      subEventStylesMap.set(subEventId, uniqueStyles);
    });

    // Build subevents array
    const subevents: CalendarSubEventData[] = subEventsResult.records.map(
      (record) => {
        const subEventId = record.get("id");
        return {
          id: subEventId,
          title: record.get("title"),
          startDate: record.get("startDate"),
          startTime: record.get("startTime") || undefined,
          endTime: record.get("endTime") || undefined,
          poster: record.get("poster") || null,
          styles: subEventStylesMap.get(subEventId) || [],
          parentEventId: record.get("parentEventId"),
          parentEventTitle: record.get("parentEventTitle"),
        };
      }
    );

    // Get workshops in this city
    const workshopsResult = await session.run(
      `MATCH (c:City {id: $cityId})<-[:IN]-(w:Workshop)
       OPTIONAL MATCH (wPoster:Image)-[:POSTER_OF]->(w)
       OPTIONAL MATCH (w)-[:SUBEVENT_OF]->(parent:Event)
       RETURN w.id as id, w.title as title, w.startDate as startDate,
              w.startTime as startTime, w.endTime as endTime,
              CASE WHEN wPoster IS NOT NULL THEN {
                id: wPoster.id,
                title: wPoster.title,
                url: wPoster.url,
                type: wPoster.type
              } ELSE null END as poster,
              parent.id as parentEventId,
              parent.title as parentEventTitle,
              CASE
                WHEN 'Competition' IN labels(parent) THEN 'competition'
                WHEN 'Workshop' IN labels(parent) THEN 'workshop'
                WHEN 'Session' IN labels(parent) THEN 'session'
                ELSE null
              END as parentEventType`,
      { cityId }
    );

    // Get workshop styles
    const workshopStylesResult = await session.run(
      `MATCH (c:City {id: $cityId})<-[:IN]-(w:Workshop)
       OPTIONAL MATCH (w)-[:STYLE]->(style:Style)
       WITH w.id as workshopId, collect(DISTINCT style.name) as styles
       RETURN workshopId, styles`,
      { cityId }
    );

    // Get video styles for workshops
    const workshopVideoStylesResult = await session.run(
      `MATCH (c:City {id: $cityId})<-[:IN]-(w:Workshop)<-[:IN]-(v:Video)-[:STYLE]->(style:Style)
       WITH w.id as workshopId, collect(DISTINCT style.name) as styles
       RETURN workshopId, styles`,
      { cityId }
    );

    // Create styles maps for workshops
    const workshopStylesMap = new Map<string, string[]>();
    workshopStylesResult.records.forEach((record) => {
      workshopStylesMap.set(
        record.get("workshopId"),
        record.get("styles") || []
      );
    });

    const workshopVideoStylesMap = new Map<string, string[]>();
    workshopVideoStylesResult.records.forEach((record) => {
      workshopVideoStylesMap.set(
        record.get("workshopId"),
        record.get("styles") || []
      );
    });

    // Build workshops array
    const workshops: CalendarWorkshopData[] = workshopsResult.records.map(
      (record) => {
        const workshopId = record.get("id");
        const workshopStyles = workshopStylesMap.get(workshopId) || [];
        const videoStyles = workshopVideoStylesMap.get(workshopId) || [];
        const allStyles = Array.from(
          new Set([...workshopStyles, ...videoStyles])
        );

        const parentEventId = record.get("parentEventId");
        const parentEventTitle = record.get("parentEventTitle");
        const parentEventType = record.get("parentEventType");
        return {
          id: workshopId,
          title: record.get("title"),
          startDate: record.get("startDate"),
          startTime: record.get("startTime") || undefined,
          endTime: record.get("endTime") || undefined,
          poster: record.get("poster") || null,
          styles: allStyles,
          ...(parentEventId && parentEventTitle
            ? {
                parentEventId,
                parentEventTitle,
                parentEventType: parentEventType || undefined,
              }
            : {}),
        };
      }
    );

    // Get sessions in this city
    const sessionsResult = await session.run(
      `MATCH (c:City {id: $cityId})<-[:IN]-(s:Session)
       OPTIONAL MATCH (sPoster:Image)-[:POSTER_OF]->(s)
       OPTIONAL MATCH (s)-[:SUBEVENT_OF]->(parent:Event)
       RETURN s.id as id, s.title as title, s.dates as dates,
              CASE WHEN sPoster IS NOT NULL THEN {
                id: sPoster.id,
                title: sPoster.title,
                url: sPoster.url,
                type: sPoster.type
              } ELSE null END as poster,
              parent.id as parentEventId,
              parent.title as parentEventTitle,
              CASE
                WHEN 'Competition' IN labels(parent) THEN 'competition'
                WHEN 'Workshop' IN labels(parent) THEN 'workshop'
                WHEN 'Session' IN labels(parent) THEN 'session'
                ELSE null
              END as parentEventType`,
      { cityId }
    );

    // Get session styles
    const sessionStylesResult = await session.run(
      `MATCH (c:City {id: $cityId})<-[:IN]-(s:Session)
       OPTIONAL MATCH (s)-[:STYLE]->(style:Style)
       WITH s.id as sessionId, collect(DISTINCT style.name) as styles
       RETURN sessionId, styles`,
      { cityId }
    );

    // Get video styles for sessions
    const sessionVideoStylesResult = await session.run(
      `MATCH (c:City {id: $cityId})<-[:IN]-(s:Session)<-[:IN]-(v:Video)-[:STYLE]->(style:Style)
       WITH s.id as sessionId, collect(DISTINCT style.name) as styles
       RETURN sessionId, styles`,
      { cityId }
    );

    // Create styles maps for sessions
    const sessionStylesMap = new Map<string, string[]>();
    sessionStylesResult.records.forEach((record) => {
      sessionStylesMap.set(record.get("sessionId"), record.get("styles") || []);
    });

    const sessionVideoStylesMap = new Map<string, string[]>();
    sessionVideoStylesResult.records.forEach((record) => {
      sessionVideoStylesMap.set(
        record.get("sessionId"),
        record.get("styles") || []
      );
    });

    // Build sessions array
    const sessions: CalendarSessionData[] = sessionsResult.records.map(
      (record) => {
        const sessionId = record.get("id");
        const sessionStyles = sessionStylesMap.get(sessionId) || [];
        const videoStyles = sessionVideoStylesMap.get(sessionId) || [];
        const allStyles = Array.from(
          new Set([...sessionStyles, ...videoStyles])
        );

        const parentEventId = record.get("parentEventId");
        const parentEventTitle = record.get("parentEventTitle");
        const parentEventType = record.get("parentEventType");
        return {
          id: sessionId,
          title: record.get("title"),
          dates: record.get("dates") || "[]", // JSON string
          poster: record.get("poster") || null,
          styles: allStyles,
          ...(parentEventId && parentEventTitle
            ? {
                parentEventId,
                parentEventTitle,
                parentEventType: parentEventType || undefined,
              }
            : {}),
        };
      }
    );

    await session.close();

    return {
      events,
      subevents,
      workshops,
      sessions,
    };
  } catch (error) {
    console.error("Error fetching city schedule:", error);
    await session.close();
    return null;
  }
};
