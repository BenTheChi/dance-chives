import driver from "../driver";
import {
  Event,
  Section,
  Bracket,
  EventDetails,
  TEventCard,
  EventType,
  Role,
} from "../../types/event";
import {
  Video,
  BattleVideo,
  FreestyleVideo,
  ChoreographyVideo,
  ClassVideo,
} from "../../types/video";
import { UserSearchItem } from "../../types/user";
import { City } from "../../types/city";
import {
  getNeo4jRoleFormats,
  isValidRole,
  AVAILABLE_ROLES,
} from "@/lib/utils/roles";
import { EventDate } from "../../types/event";
import {
  normalizeStyleNames,
  normalizeStyleName,
} from "@/lib/utils/style-utils";
import { getUserByUsername } from "./user";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { enrichUsersWithCardData } from "./user-cards";
import { Image } from "../../types/image";
import { type Record as Neo4jRecord } from "neo4j-driver";

/**
 * Helper functions to translate between frontend types and backend Neo4j labels
 * This prevents label conflicts (e.g., Battle can be Event, Section, or Video type)
 */

// Event type label translation
export function getEventTypeLabel(eventType?: EventType): string | null {
  if (!eventType) return null;
  const labelMap: Record<EventType, string> = {
    Battle: "BattleEvent",
    Competition: "CompetitionEvent",
    Class: "ClassEvent",
    Workshop: "WorkshopEvent",
    Session: "SessionEvent",
    Party: "PartyEvent",
    Festival: "FestivalEvent",
    Performance: "PerformanceEvent",
    Other: "OtherEvent",
  };
  return labelMap[eventType] || null;
}

export function getEventTypeFromLabel(label: string): EventType | null {
  const reverseMap: Record<string, EventType> = {
    BattleEvent: "Battle",
    CompetitionEvent: "Competition",
    ClassEvent: "Class",
    WorkshopEvent: "Workshop",
    SessionEvent: "Session",
    PartyEvent: "Party",
    FestivalEvent: "Festival",
    PerformanceEvent: "Performance",
  };
  return reverseMap[label] || null;
}

// Section type label translation
export function getSectionTypeLabel(
  sectionType:
    | "Battle"
    | "Tournament"
    | "Competition"
    | "Performance"
    | "Showcase"
    | "Class"
    | "Session"
    | "Mixed"
    | "Other"
): string | null {
  if (!sectionType) return null;
  const labelMap: Record<string, string> = {
    Battle: "BattleSection",
    Tournament: "TournamentSection",
    Competition: "CompetitionSection",
    Performance: "PerformanceSection",
    Showcase: "ShowcaseSection",
    Class: "ClassSection",
    Session: "SessionSection",
    Mixed: "MixedSection",
  };
  return labelMap[sectionType] || null;
}

export function getSectionTypeFromLabel(label: string): string | null {
  const reverseMap: Record<string, string> = {
    BattleSection: "Battle",
    TournamentSection: "Tournament",
    CompetitionSection: "Competition",
    PerformanceSection: "Performance",
    ShowcaseSection: "Showcase",
    ClassSection: "Class",
    SessionSection: "Session",
    MixedSection: "Mixed",
  };
  return reverseMap[label] || null;
}

// Video type label translation
export function getVideoTypeLabel(
  videoType: "battle" | "freestyle" | "choreography" | "class"
): string {
  const labelMap: Record<string, string> = {
    battle: "BattleVideo",
    freestyle: "FreestyleVideo",
    choreography: "ChoreographyVideo",
    class: "ClassVideo",
  };
  return labelMap[videoType] || "FreestyleVideo";
}

export function getVideoTypeFromLabel(
  label: string
): "battle" | "freestyle" | "choreography" | "class" {
  const reverseMap: Record<
    string,
    "battle" | "freestyle" | "choreography" | "class"
  > = {
    BattleVideo: "battle",
    FreestyleVideo: "freestyle",
    ChoreographyVideo: "choreography",
    ClassVideo: "class",
  };
  return reverseMap[label] || "freestyle";
}

// Get all possible section type labels for removal
export function getAllSectionTypeLabels(): string[] {
  return [
    "BattleSection",
    "TournamentSection",
    "CompetitionSection",
    "PerformanceSection",
    "ShowcaseSection",
    "ClassSection",
    "SessionSection",
    "MixedSection",
  ];
}

// Get all possible event type labels for removal
export function getAllEventTypeLabels(): string[] {
  return [
    "BattleEvent",
    "CompetitionEvent",
    "ClassEvent",
    "WorkshopEvent",
    "SessionEvent",
    "PartyEvent",
    "FestivalEvent",
    "PerformanceEvent",
  ];
}

// Get all possible video type labels for removal
export function getAllVideoTypeLabels(): string[] {
  return ["BattleVideo", "FreestyleVideo", "ChoreographyVideo", "ClassVideo"];
}

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

// Neo4j result record type
type Neo4jResultRecord = Neo4jRecord;

// Search params interface
interface SearchParams {
  keyword?: string;
  userId?: string;
}

/**
 * Unified function to get any event by ID
 * Works for all event types (Competition, Workshop, Session, etc.)
 * @param id - Event ID
 * @param userId - Optional user ID for authorization check
 * @param authLevel - Optional auth level for authorization check
 */
export const getEvent = async (
  id: string,
  userId?: string,
  authLevel?: number
): Promise<Event | null> => {
  const session = driver.session();

  // Check if event is hidden and user is not authorized
  if (userId !== undefined) {
    const isModOrAdmin =
      authLevel !== undefined && authLevel >= AUTH_LEVELS.MODERATOR;
    const accessCheck = await session.run(
      `
      MATCH (e:Event {id: $id})
      OPTIONAL MATCH (creator:User {id: $userId})-[:CREATED]->(e)
      OPTIONAL MATCH (teamMember:User {id: $userId})-[:TEAM_MEMBER]->(e)
      WITH e,
           (e.status = 'visible' OR e.status IS NULL) as isVisible,
           (creator IS NOT NULL) as isCreator,
           (teamMember IS NOT NULL) as isTeamMember
      RETURN e IS NOT NULL as exists,
             isVisible,
             isCreator,
             isTeamMember,
             $isModOrAdmin as isModOrAdmin
      `,
      { id, userId, isModOrAdmin }
    );

    if (accessCheck.records.length > 0) {
      const record = accessCheck.records[0];
      const exists = record.get("exists");
      const isVisible = record.get("isVisible");
      const isCreator = record.get("isCreator");
      const isTeamMember = record.get("isTeamMember");
      const isModOrAdmin = record.get("isModOrAdmin");

      if (!exists) {
        await session.close();
        return null;
      }

      // If event is hidden and user is not authorized, return null
      if (!isVisible && !isCreator && !isTeamMember && !isModOrAdmin) {
        await session.close();
        return null;
      }
    }
  }

  // Get main event data - matches any Event node regardless of type labels
  const eventResult = await session.run(
    `
    MATCH (e:Event {id: $id})
    OPTIONAL MATCH (e)-[:IN]->(c:City)
    OPTIONAL MATCH (poster:Image)-[:POSTER_OF]->(e)
    OPTIONAL MATCH (originalPoster:Image)-[:ORIGINAL_POSTER_OF]->(e)
    OPTIONAL MATCH (creator:User)-[:CREATED]->(e)
    
    WITH e, c, poster, originalPoster, creator,
         [label IN labels(e) WHERE label IN ['BattleEvent', 'CompetitionEvent', 'ClassEvent', 'WorkshopEvent', 'SessionEvent', 'PartyEvent', 'FestivalEvent', 'PerformanceEvent']] as eventTypeLabels
    
    RETURN e {
      id: e.id,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      title: e.title,
      description: e.description,
      location: e.location,
      cost: e.cost,
      prize: e.prize,
      startDate: e.startDate,
      dates: e.dates,
      schedule: e.schedule,
      status: COALESCE(e.status, 'visible'),
      creatorId: creator.id
    } as event,
    CASE 
      WHEN size(eventTypeLabels) > 0 THEN 
        CASE eventTypeLabels[0]
          WHEN 'BattleEvent' THEN 'Battle'
          WHEN 'CompetitionEvent' THEN 'Competition'
          WHEN 'ClassEvent' THEN 'Class'
          WHEN 'WorkshopEvent' THEN 'Workshop'
          WHEN 'SessionEvent' THEN 'Session'
          WHEN 'PartyEvent' THEN 'Party'
          WHEN 'FestivalEvent' THEN 'Festival'
          WHEN 'PerformanceEvent' THEN 'Performance'
          ELSE null
        END
      ELSE null 
    END as eventType,
    poster {
      id: poster.id,
      title: poster.title,
      url: poster.url
    } as poster,
    originalPoster {
      id: originalPoster.id,
      title: originalPoster.title,
      url: originalPoster.url
    } as originalPoster,
    c {
      id: c.id,
      name: c.name,
      countryCode: c.countryCode,
      region: c.region,
      timezone: c.timezone
    } as city
  `,
    { id }
  );

  // Get roles (exclude TEAM_MEMBER - team members are shown separately)
  const validRoleFormats = getNeo4jRoleFormats().filter(
    (role) => role !== "TEAM_MEMBER"
  );
  const rolesResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[roleRel]-(user:User)
    WHERE type(roleRel) IN $validRoles
    RETURN collect({
      id: type(roleRel),
      title: type(roleRel),
      user: user {
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        avatar: user.avatar,
        image: user.image
      }
    }) as roles
  `,
    { id, validRoles: validRoleFormats }
  );

  // Get sections with video and bracket counts
  const sectionsResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)
    OPTIONAL MATCH (s)<-[:IN]-(v:Video)
    OPTIONAL MATCH (s)<-[:IN]-(b:Bracket)
    OPTIONAL MATCH (s)<-[:POSTER_OF]-(poster:Image)
    
    WITH s, collect(DISTINCT v) as videos, collect(DISTINCT b) as brackets, poster,
         [label IN labels(s) WHERE label IN ['BattleSection', 'TournamentSection', 'CompetitionSection', 'PerformanceSection', 'ShowcaseSection', 'ClassSection', 'SessionSection', 'MixedSection']] as sectionTypeLabels
    
    RETURN collect({
      id: s.id,
      title: s.title,
      description: s.description,
      sectionType: CASE 
        WHEN size(sectionTypeLabels) > 0 THEN 
          CASE sectionTypeLabels[0]
            WHEN 'BattleSection' THEN 'Battle'
            WHEN 'TournamentSection' THEN 'Tournament'
            WHEN 'CompetitionSection' THEN 'Competition'
            WHEN 'PerformanceSection' THEN 'Performance'
            WHEN 'ShowcaseSection' THEN 'Showcase'
            WHEN 'ClassSection' THEN 'Class'
            WHEN 'SessionSection' THEN 'Session'
            WHEN 'MixedSection' THEN 'Mixed'
            ELSE null
          END
        ELSE null 
      END,
      hasBrackets: size(brackets) > 0,
      bgColor: s.bgColor,
      poster: CASE WHEN poster IS NOT NULL THEN {
        id: poster.id,
        title: poster.title,
        url: poster.url,
        type: "poster"
      } ELSE null END,
      videos: [v in videos | {
        id: v.id,
        title: v.title,
        src: v.src,
        type: CASE 
          WHEN 'BattleVideo' IN labels(v) THEN 'battle'
          WHEN 'FreestyleVideo' IN labels(v) THEN 'freestyle'
          WHEN 'ChoreographyVideo' IN labels(v) THEN 'choreography'
          WHEN 'ClassVideo' IN labels(v) THEN 'class'
          ELSE 'battle'
        END,
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
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)
    RETURN s.id as sectionId, b.id as bracketId, collect({
      id: v.id,
      title: v.title,
      src: v.src,
      type: CASE 
        WHEN 'BattleVideo' IN labels(v) THEN 'battle'
        WHEN 'FreestyleVideo' IN labels(v) THEN 'freestyle'
        WHEN 'ChoreographyVideo' IN labels(v) THEN 'choreography'
        WHEN 'ClassVideo' IN labels(v) THEN 'class'
        ELSE 'battle'
      END
    }) as videos
  `,
    { id }
  );

  // Get tagged users for bracket videos using relationship types
  const bracketVideoUsersResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)
    OPTIONAL MATCH (v)<-[:WINNER]-(winner:User)
    OPTIONAL MATCH (v)<-[:DANCER]-(dancer:User)
    OPTIONAL MATCH (v)<-[:CHOREOGRAPHER]-(choreographer:User)
    OPTIONAL MATCH (v)<-[:TEACHER]-(teacher:User)
    WITH s, b, v, 
         collect(DISTINCT {
           id: winner.id,
           displayName: winner.displayName,
           username: winner.username,
           avatar: winner.avatar,
           image: winner.image
         }) as allWinners,
         collect(DISTINCT {
           id: dancer.id,
           displayName: dancer.displayName,
           username: dancer.username,
           avatar: dancer.avatar,
           image: dancer.image
         }) as allDancers,
         collect(DISTINCT {
           id: choreographer.id,
           displayName: choreographer.displayName,
           username: choreographer.username,
           avatar: choreographer.avatar,
           image: choreographer.image
         }) as allChoreographers,
         collect(DISTINCT {
           id: teacher.id,
           displayName: teacher.displayName,
           username: teacher.username,
           avatar: teacher.avatar,
           image: teacher.image
         }) as allTeachers
    WITH s, b, v,
         [w in allWinners WHERE w.id IS NOT NULL] as winners,
         [d in allDancers WHERE d.id IS NOT NULL] as dancers,
         [c in allChoreographers WHERE c.id IS NOT NULL] as choreographers,
         [t in allTeachers WHERE t.id IS NOT NULL] as teachers,
         CASE 
           WHEN 'BattleVideo' IN labels(v) THEN 'battle'
           WHEN 'FreestyleVideo' IN labels(v) THEN 'freestyle'
           WHEN 'ChoreographyVideo' IN labels(v) THEN 'choreography'
           WHEN 'ClassVideo' IN labels(v) THEN 'class'
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

  // Get tagged users for direct section videos
  const sectionVideoUsersResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)<-[:IN]-(v:Video)
    OPTIONAL MATCH (v)<-[:WINNER]-(winner:User)
    OPTIONAL MATCH (v)<-[:DANCER]-(dancer:User)
    OPTIONAL MATCH (v)<-[:CHOREOGRAPHER]-(choreographer:User)
    OPTIONAL MATCH (v)<-[:TEACHER]-(teacher:User)
    WITH s, v, 
         collect(DISTINCT {
           id: winner.id,
           displayName: winner.displayName,
           username: winner.username,
           avatar: winner.avatar,
           image: winner.image
         }) as allWinners,
         collect(DISTINCT {
           id: dancer.id,
           displayName: dancer.displayName,
           username: dancer.username,
           avatar: dancer.avatar,
           image: dancer.image
         }) as allDancers,
         collect(DISTINCT {
           id: choreographer.id,
           displayName: choreographer.displayName,
           username: choreographer.username,
           avatar: choreographer.avatar,
           image: choreographer.image
         }) as allChoreographers,
         collect(DISTINCT {
           id: teacher.id,
           displayName: teacher.displayName,
           username: teacher.username,
           avatar: teacher.avatar,
           image: teacher.image
         }) as allTeachers
    WITH s, v,
         [w in allWinners WHERE w.id IS NOT NULL] as winners,
         [d in allDancers WHERE d.id IS NOT NULL] as dancers,
         [c in allChoreographers WHERE c.id IS NOT NULL] as choreographers,
         [t in allTeachers WHERE t.id IS NOT NULL] as teachers,
         CASE 
           WHEN 'BattleVideo' IN labels(v) THEN 'battle'
           WHEN 'FreestyleVideo' IN labels(v) THEN 'freestyle'
           WHEN 'ChoreographyVideo' IN labels(v) THEN 'choreography'
           WHEN 'ClassVideo' IN labels(v) THEN 'class'
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
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)<-[r:WINNER]-(u:User)
    RETURN s.id as sectionId, collect({
      id: u.id,
      displayName: u.displayName,
      username: u.username,
      avatar: u.avatar,
      image: u.image
    }) as winners
  `,
    { id }
  );

  // Get section styles
  const sectionStylesResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)-[:STYLE]->(style:Style)
    RETURN s.id as sectionId, collect(style.name) as styles
  `,
    { id }
  );

  // Get video styles (direct section videos)
  const sectionVideoStylesResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)<-[:IN]-(v:Video)-[:STYLE]->(style:Style)
    RETURN s.id as sectionId, v.id as videoId, collect(style.name) as styles
  `,
    { id }
  );

  // Get video styles (bracket videos)
  const bracketVideoStylesResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)-[:STYLE]->(style:Style)
    RETURN s.id as sectionId, b.id as bracketId, v.id as videoId, collect(style.name) as styles
  `,
    { id }
  );

  // Get section applyStylesToVideos property
  const sectionApplyStylesResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)
    RETURN s.id as sectionId, s.applyStylesToVideos as applyStylesToVideos
  `,
    { id }
  );

  // Get event styles
  const eventStylesResult = await session.run(
    `
    MATCH (e:Event {id: $id})-[:STYLE]->(style:Style)
    RETURN collect(style.name) as styles
  `,
    { id }
  );

  // Get gallery
  const galleryResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:PHOTO]-(galleryPic:Image:Gallery)
    RETURN collect({
      id: galleryPic.id,
      title: galleryPic.title,
      url: galleryPic.url,
      caption: galleryPic.caption,
      type: "gallery"
    }) as gallery
  `,
    { id }
  );

  session.close();

  const eventRecord = eventResult.records[0];
  if (!eventRecord) {
    throw new Error(`Event with id ${id} not found`);
  }

  const eventData = eventRecord.get("event");
  const eventType = eventRecord.get("eventType");
  const poster = eventRecord.get("poster");
  const originalPoster = eventRecord.get("originalPoster");
  const city = eventRecord.get("city");
  const roles = rolesResult.records[0]?.get("roles") || [];
  const gallery = galleryResult.records[0]?.get("gallery") || [];
  const eventStyles = eventStylesResult.records[0]?.get("styles") || [];

  // Process sections
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
  const sectionWinnersMap = new Map<string, UserSearchItem[]>();
  sectionWinnersResult.records.forEach((record) => {
    const sectionId = record.get("sectionId");
    const winners = (record.get("winners") || []).filter(
      (w: UserSearchItem) => w.id !== null && w.id !== undefined
    );
    sectionWinnersMap.set(sectionId, winners);
  });

  // Update sections with bracket videos and tagged users
  sections.forEach((section: Section) => {
    section.styles = sectionStylesMap.get(section.id) || [];
    section.applyStylesToVideos =
      sectionApplyStylesMap.get(section.id) || false;
    section.winners = sectionWinnersMap.get(section.id) || [];
    // Poster is already included in the query result

    // Add tagged users and styles to direct section videos
    section.videos.forEach((video: Video) => {
      const userData = sectionVideoUsersResult.records.find(
        (record) =>
          record.get("sectionId") === section.id &&
          record.get("videoId") === video.id
      );
      const videoType = video.type || "battle";

      if (userData) {
        video.taggedWinners = userData.get("taggedWinners") || [];
        video.taggedDancers = userData.get("taggedDancers") || [];
        if (videoType === "choreography") {
          video.taggedChoreographers =
            userData.get("taggedChoreographers") || [];
        }
        if (videoType === "class") {
          video.taggedTeachers = userData.get("taggedTeachers") || [];
        }
      } else {
        video.taggedWinners = [];
        video.taggedDancers = [];
        if (videoType === "choreography") {
          video.taggedChoreographers = [];
        }
        if (videoType === "class") {
          video.taggedTeachers = [];
        }
      }

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

        bracket.videos.forEach((video: Video) => {
          const userData = bracketVideoUsers.find(
            (bvu: BracketVideoUserRecord) =>
              bvu.sectionId === section.id &&
              bvu.bracketId === bracket.id &&
              bvu.videoId === video.id
          );
          const videoType = video.type || "battle";

          if (userData) {
            video.taggedWinners = userData.taggedWinners || [];
            video.taggedDancers = userData.taggedDancers || [];
            if (videoType === "choreography") {
              video.taggedChoreographers = userData.taggedChoreographers || [];
            }
            if (videoType === "class") {
              video.taggedTeachers = userData.taggedTeachers || [];
            }
          } else {
            video.taggedWinners = [];
            video.taggedDancers = [];
            if (videoType === "choreography") {
              video.taggedChoreographers = [];
            }
            if (videoType === "class") {
              video.taggedTeachers = [];
            }
          }

          const styleKey = `${section.id}:${bracket.id}:${video.id}`;
          video.styles = bracketVideoStylesMap.get(styleKey) || [];
        });
      } else {
        bracket.videos = [];
      }
    });
  });

  // Parse dates - must be an array (required)
  let dates: EventDate[] = [];
  if (eventData.dates) {
    try {
      const parsedDates =
        typeof eventData.dates === "string"
          ? JSON.parse(eventData.dates)
          : eventData.dates;
      dates = Array.isArray(parsedDates) ? parsedDates : [];
    } catch (error) {
      console.error("Error parsing dates array:", error);
      dates = [];
    }
  }

  // Build eventDetails object with all possible properties
  const eventDetails: EventDetails = {
    title: eventData.title,
    description: eventData.description,
    location: eventData.location,
    cost: eventData.cost,
    prize: eventData.prize,
    schedule: eventData.schedule,
    creatorId: eventData.creatorId,
    poster: poster || null,
    originalPoster: originalPoster || null,
    city: city || {
      id: "",
      name: "",
      countryCode: "",
      region: "",
    },
    dates: dates || [],
    styles: eventStyles,
    eventType: (eventType as EventType) || "Other", // Always set eventType, default to "Other"
    status: (eventData.status as "hidden" | "visible") || "visible",
  };

  // Enrich all users with city and styles from Postgres UserCard table
  // Collect all users that need enrichment
  const allUsers: UserSearchItem[] = [];

  // Collect role users
  roles.forEach((role: Role) => {
    if (role.user) {
      allUsers.push(role.user);
    }
  });

  // Collect section winners and video tagged users
  sections.forEach((section: Section) => {
    if (section.winners) {
      allUsers.push(...section.winners);
    }
    section.videos.forEach((video: Video) => {
      if (video.taggedDancers) allUsers.push(...video.taggedDancers);
      if (video.taggedWinners) allUsers.push(...video.taggedWinners);
      if ((video as ChoreographyVideo).taggedChoreographers) {
        allUsers.push(...(video as ChoreographyVideo).taggedChoreographers!);
      }
      if ((video as ClassVideo).taggedTeachers) {
        allUsers.push(...(video as ClassVideo).taggedTeachers!);
      }
    });
    section.brackets?.forEach((bracket: Bracket) => {
      bracket.videos.forEach((video: Video) => {
        if (video.taggedDancers) allUsers.push(...video.taggedDancers);
        if (video.taggedWinners) allUsers.push(...video.taggedWinners);
        if ((video as ChoreographyVideo).taggedChoreographers) {
          allUsers.push(...(video as ChoreographyVideo).taggedChoreographers!);
        }
        if ((video as ClassVideo).taggedTeachers) {
          allUsers.push(...(video as ClassVideo).taggedTeachers!);
        }
      });
    });
  });

  // Enrich all users at once
  const enrichedUsers = await enrichUsersWithCardData(allUsers);

  // Create a map for quick lookup by user ID
  const enrichedUserMap = new Map(enrichedUsers.map((u) => [u.id, u]));

  // Apply enriched data back to all user references
  const applyEnrichment = (user: UserSearchItem): UserSearchItem => {
    const enriched = user.id ? enrichedUserMap.get(user.id) : undefined;
    if (enriched) {
      user.city = enriched.city;
      user.styles = enriched.styles;
      user.image = user.image || enriched.image;
    }
    return user;
  };

  // Apply to roles
  roles.forEach((role: Role) => {
    if (role.user) {
      applyEnrichment(role.user);
    }
  });

  // Apply to sections and videos
  sections.forEach((section: Section) => {
    section.winners?.forEach(applyEnrichment);
    section.videos.forEach((video: Video) => {
      video.taggedDancers?.forEach(applyEnrichment);
      video.taggedWinners?.forEach(applyEnrichment);
      (video as ChoreographyVideo).taggedChoreographers?.forEach(
        applyEnrichment
      );
      (video as ClassVideo).taggedTeachers?.forEach(applyEnrichment);
    });
    section.brackets?.forEach((bracket: Bracket) => {
      bracket.videos.forEach((video: Video) => {
        video.taggedDancers?.forEach(applyEnrichment);
        video.taggedWinners?.forEach(applyEnrichment);
        (video as ChoreographyVideo).taggedChoreographers?.forEach(
          applyEnrichment
        );
        (video as ClassVideo).taggedTeachers?.forEach(applyEnrichment);
      });
    });
  });

  // Build the result object
  const result: Event = {
    id: eventData.id,
    createdAt: new Date(eventData.createdAt),
    updatedAt: new Date(eventData.updatedAt),
    eventDetails: eventDetails,
    roles,
    sections,
    gallery,
  };

  return result;
};

/**
 * Delete an event and all its associated nodes (images, sections, brackets, videos)
 */
export const deleteEvent = async (eventId: string): Promise<boolean> => {
  const session = driver.session();

  try {
    await session.run(
      `
      MATCH (e:Event {id: $id})
      DETACH DELETE e
    `,
      { id: eventId }
    );

    await session.close();
    return true;
  } catch (error) {
    await session.close();
    throw error;
  }
};

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
      const battleVideo = video as BattleVideo;
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
      const freestyleVideo = video as FreestyleVideo;
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
      const choreographyVideo = video as ChoreographyVideo;
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
      const classVideo = video as ClassVideo;
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

/**
 * Helper function to create gallery photos
 */
const createGalleryPhotos = async (eventId: string, gallery: Image[]) => {
  if (gallery.length === 0) return;
  const session = driver.session();
  try {
    for (const pic of gallery) {
      // Normalize caption: trim whitespace and set to null if empty
      const caption = pic.caption?.trim() || null;

      await session.run(
        `MATCH (e:Event {id: $eventId})
         MERGE (p:Image:Gallery {id: $picId})
         ON CREATE SET
           p.title = $title,
           p.url = $url,
           p.caption = $caption
         ON MATCH SET
           p.title = $title,
           p.url = $url,
           p.caption = $caption
         MERGE (p)-[:PHOTO]->(e)`,
        {
          eventId,
          picId: pic.id,
          title: pic.title,
          url: pic.url,
          caption: caption,
        }
      );
    }
  } finally {
    await session.close();
  }
};

/**
 * Helper function to create sections
 */
const createSections = async (eventId: string, sections: Section[]) => {
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
      // Get section type label (if provided)
      const sectionType = sec.sectionType;
      const sectionTypeLabel = getSectionTypeLabel(sectionType);

      // Create section
      await session.run(
        `MATCH (e:Event {id: $eventId})
         MERGE (s:Section {id: $sectionId})
         ON CREATE SET
           s.title = $title,
           s.description = $description,
           s.applyStylesToVideos = $applyStylesToVideos,
           s.bgColor = $bgColor
         ON MATCH SET
           s.title = $title,
           s.description = $description,
           s.applyStylesToVideos = $applyStylesToVideos,
           s.bgColor = $bgColor
         WITH s, e
         // Remove old section type labels if section type changed
         CALL apoc.create.removeLabels(s, $sectionTypeLabels) YIELD node as removedNode
         WITH removedNode as s, e
         MERGE (s)-[:IN]->(e)`,
        {
          eventId,
          sectionId: sec.id,
          title: sec.title,
          description: sec.description || null,
          applyStylesToVideos: sec.applyStylesToVideos || false,
          bgColor: sec.bgColor || null,
          sectionTypeLabels: getAllSectionTypeLabels(),
        }
      );

      // Add section type label if provided
      if (sectionTypeLabel) {
        await session.run(
          `MATCH (s:Section {id: $sectionId})
           CALL apoc.create.addLabels(s, [$sectionTypeLabel]) YIELD node
           RETURN node`,
          {
            sectionId: sec.id,
            sectionTypeLabel: sectionTypeLabel,
          }
        );
      }

      // Handle section poster
      await session.run(
        `MATCH (s:Section {id: $sectionId})
         OPTIONAL MATCH (oldPoster:Image)-[r:POSTER_OF]->(s)
         DELETE r
         WITH s
         FOREACH (poster IN CASE WHEN $poster IS NOT NULL AND $poster.id IS NOT NULL THEN [$poster] ELSE [] END |
           MERGE (newPoster:Image:Gallery {id: poster.id})
           ON CREATE SET
             newPoster.title = poster.title,
             newPoster.url = poster.url
           SET
             newPoster.title = poster.title,
             newPoster.url = poster.url
           MERGE (newPoster)-[:POSTER_OF]->(s)
         )`,
        {
          sectionId: sec.id,
          poster: sec.poster || null,
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

/**
 * Helper function to create brackets
 */
const createBrackets = async (sections: Section[]) => {
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

/**
 * Helper function to create videos in brackets
 */
const createBracketVideos = async (sections: Section[]) => {
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
          const videoType = vid.type || "battle";
          const videoLabel = getVideoTypeLabel(videoType);

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
             CALL apoc.create.removeLabels(v, ${JSON.stringify(
               getAllVideoTypeLabels()
             )}) YIELD node as removedNode
             WITH removedNode as v, b
             CALL apoc.create.addLabels(v, ['Video', $videoLabel]) YIELD node
             MERGE (v)-[:IN]->(b)`,
            {
              bracketId: br.id,
              videoId: vid.id,
              title: vid.title,
              src: vid.src,
              videoLabel: videoLabel,
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

/**
 * Helper function to create videos directly in sections
 */
const createSectionVideos = async (sections: Section[]) => {
  const sectionsWithVideos = sections.filter(
    (s) => !s.hasBrackets && s.videos?.length > 0
  );
  if (sectionsWithVideos.length === 0) return;

  const session = driver.session();
  try {
    for (const sec of sectionsWithVideos) {
      for (const vid of sec.videos) {
        // Get video type label
        const videoType = vid.type || "battle";
        const videoLabel = getVideoTypeLabel(videoType);

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
           CALL apoc.create.removeLabels(v, ${JSON.stringify(
             getAllVideoTypeLabels()
           )}) YIELD node as removedNode
           WITH removedNode as v, s
           CALL apoc.create.addLabels(v, ['Video', $videoLabel]) YIELD node
           MERGE (v)-[:IN]->(s)`,
          {
            sectionId: sec.id,
            videoId: vid.id,
            title: vid.title,
            src: vid.src,
            videoLabel: videoLabel,
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
  } finally {
    await session.close();
  }
};

/**
 * Unified function to insert any event
 * Handles event type labels dynamically based on eventDetails.eventType
 * @param event - The event object to insert
 * @param teamMembers - Array of team members (separate from roles)
 */
export const insertEvent = async (
  event: Event,
  teamMembers?: Array<{ id: string; username: string; displayName: string }>
): Promise<Event> => {
  // Validate all roles before inserting
  if (event.roles && event.roles.length > 0) {
    for (const role of event.roles) {
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
      event.roles.map(async (role) => {
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
    event = {
      ...event,
      roles: processedRoles,
    };
  }

  const session = driver.session();
  const eventDetails = event.eventDetails;
  // Ensure eventType is always set (default to "Battle" if not provided)
  const eventType = eventDetails?.eventType || "Battle";

  // Build event type label if specified
  const eventTypeLabel = getEventTypeLabel(eventType);

  // Handle dates array for Session events
  const datesJson = eventDetails.dates
    ? JSON.stringify(eventDetails.dates)
    : null;

  try {
    const result = await session.run(
      `
      MERGE (e:Event {id: $eventId})
      ON CREATE SET 
        e.title = $title,
        e.description = $description,
        e.location = $location,
        e.cost = $cost,
        e.prize = $prize,
        e.startDate = $startDate,
        e.dates = $dates,
        e.schedule = $schedule,
        e.status = $status,
        e.createdAt = $createdAt,
        e.updatedAt = $updatedAt
      ON MATCH SET
        e.title = $title,
        e.description = $description,
        e.location = $location,
        e.cost = $cost,
        e.prize = $prize,
        e.startDate = $startDate,
        e.dates = $dates,
        e.schedule = $schedule,
        e.status = $status,
        e.updatedAt = $updatedAt

      WITH e
      CALL apoc.create.removeLabels(e, ${JSON.stringify(
        getAllEventTypeLabels()
      )}) YIELD node
      RETURN node as e
    `,
      {
        eventId: event.id,
        creatorId: eventDetails.creatorId,
        title: eventDetails.title,
        description: eventDetails.description,
        location: eventDetails.location,
        cost: eventDetails.cost || null,
        prize: eventDetails.prize || null,
        // Derive startDate from first date in dates array for database storage
        startDate:
          eventDetails.dates && eventDetails.dates.length > 0
            ? eventDetails.dates[0].date
            : null,
        dates: datesJson,
        schedule: eventDetails.schedule || null,
        status: eventDetails.status || "visible",
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      }
    );

    // Add event type label if specified
    if (eventTypeLabel) {
      await session.run(
        `MATCH (e:Event {id: $eventId})
         CALL apoc.create.addLabels(e, [$eventTypeLabel]) YIELD node
         RETURN node`,
        { eventId: event.id, eventTypeLabel: eventTypeLabel }
      );
    }

    // Continue with city, poster, creator, and roles
    await session.run(
      `
      MATCH (e:Event {id: $eventId})
      
      MERGE (c:City {id: $city.id})
      ON CREATE SET 
        c.name = $city.name,
        c.countryCode = $city.countryCode,
        c.region = $city.region,
        c.timezone = $city.timezone,
        c.latitude = $city.latitude,
        c.longitude = $city.longitude
      ON MATCH SET
        c.name = $city.name,
        c.countryCode = $city.countryCode,
        c.region = $city.region,
        c.timezone = $city.timezone,
        c.latitude = $city.latitude,
        c.longitude = $city.longitude
      MERGE (e)-[:IN]->(c)

      WITH e
      OPTIONAL MATCH (oldPoster:Image)-[r:POSTER_OF]->(e)
      DELETE r
      WITH e
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
      OPTIONAL MATCH (oldOriginalPoster:Image)-[r2:ORIGINAL_POSTER_OF]->(e)
      DELETE r2
      WITH e
      FOREACH (originalPoster IN CASE WHEN $originalPoster IS NOT NULL AND $originalPoster.id IS NOT NULL THEN [$originalPoster] ELSE [] END |
        MERGE (newOriginalPoster:Image:Gallery {id: originalPoster.id})
        ON CREATE SET
          newOriginalPoster.title = originalPoster.title,
          newOriginalPoster.url = originalPoster.url
        SET
          newOriginalPoster.title = originalPoster.title,
          newOriginalPoster.url = originalPoster.url
        MERGE (newOriginalPoster)-[:ORIGINAL_POSTER_OF]->(e)
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
        WITH u, e, roleData
        CALL apoc.merge.relationship(u, toUpper(roleData.title), {}, {}, e) YIELD rel
        RETURN count(rel) AS roleCount
      }

      WITH e
      CALL {
        WITH e
        WITH e, $teamMembers AS teamMembers
        UNWIND teamMembers AS memberData
        MATCH (u:User { id: memberData.id })
        MERGE (u)-[:TEAM_MEMBER]->(e)
        RETURN count(u) AS teamMemberCount
      }

      WITH e
      RETURN e as event
    `,
      {
        eventId: event.id,
        creatorId: eventDetails.creatorId,
        teamMembers: teamMembers || [],
        title: eventDetails.title,
        description: eventDetails.description,
        location: eventDetails.location,
        cost: eventDetails.cost || null,
        prize: eventDetails.prize || null,
        // Derive startDate from first date in dates array for database storage
        startDate:
          eventDetails.dates && eventDetails.dates.length > 0
            ? eventDetails.dates[0].date
            : null,
        dates: datesJson,
        schedule: eventDetails.schedule || null,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        poster: eventDetails.poster,
        originalPoster: eventDetails.originalPoster,
        city: eventDetails.city,
        roles: event.roles,
      }
    );

    // Check if query returned results
    if (!result.records || result.records.length === 0) {
      await session.close();
      throw new Error(
        `Failed to create event ${event.id}: No records returned from query`
      );
    }

    // Create event styles
    if (eventDetails.styles && eventDetails.styles.length > 0) {
      const normalizedStyles = normalizeStyleNames(eventDetails.styles);
      await session.run(
        `
        MATCH (e:Event {id: $eventId})
        WITH e, $styles AS styles
        UNWIND styles AS styleName
        MERGE (style:Style {name: styleName})
        MERGE (e)-[:STYLE]->(style)
        `,
        { eventId: event.id, styles: normalizedStyles }
      );
    }

    await session.close();

    // Create sections, brackets, videos, and gallery
    await createSections(event.id, event.sections);
    await createBrackets(event.sections);
    await createBracketVideos(event.sections);
    await createSectionVideos(event.sections);
    await createGalleryPhotos(event.id, event.gallery);

    // Create section winners
    for (const section of event.sections) {
      if (section.winners && section.winners.length > 0) {
        const session = driver.session();
        try {
          for (const winner of section.winners) {
            const userId = await getUserIdFromUserSearchItem(winner);
            await session.run(
              `MATCH (s:Section {id: $sectionId})
               MERGE (u:User {id: $userId})
               MERGE (u)-[:WINNER]->(s)`,
              { sectionId: section.id, userId }
            );
          }
        } finally {
          await session.close();
        }
      }
    }

    return event;
  } catch (error) {
    await session.close();
    throw error;
  }
};

/**
 * Unified function to edit any event
 * Handles event type label updates dynamically
 * @param event - The event object to edit
 * @param teamMembers - Array of team members (separate from roles)
 */
export const editEvent = async (
  event: Event,
  teamMembers?: Array<{ id: string; username: string; displayName: string }>
): Promise<Event> => {
  const { id } = event;
  const eventDetails = event.eventDetails;

  // Validate all roles before editing
  if (event.roles && event.roles.length > 0) {
    for (const role of event.roles) {
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
      event.roles.map(async (role) => {
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
    event = {
      ...event,
      roles: processedRoles,
    };
  }

  const session = driver.session();
  // Ensure eventType is always set (default to "Battle" if not provided)
  const eventType = eventDetails.eventType || "Battle";
  const eventTypeLabel = getEventTypeLabel(eventType);

  // Handle dates array for Session events
  const datesJson = eventDetails.dates
    ? JSON.stringify(eventDetails.dates)
    : null;

  try {
    // Start transaction
    const tx = session.beginTransaction();

    // Get current event type labels to remove
    const currentLabelsResult = await tx.run(
      `MATCH (e:Event {id: $id})
       RETURN labels(e) as labels`,
      { id }
    );

    const currentLabels = currentLabelsResult.records[0]?.get("labels") || [];
    const allEventTypeLabels = getAllEventTypeLabels();
    const currentEventTypeLabels = currentLabels.filter((label: string) =>
      allEventTypeLabels.includes(label)
    );

    // Update event properties
    await tx.run(
      `MATCH (e:Event {id: $id})
       SET e.title = $title,
           e.description = $description,
           e.location = $location,
           e.cost = $cost,
           e.prize = $prize,
           e.startDate = $startDate,
           e.dates = $dates,
           e.schedule = $schedule,
           e.status = COALESCE($status, e.status, 'visible'),
           e.updatedAt = $updatedAt`,
      {
        id,
        title: eventDetails.title,
        description: eventDetails.description,
        location: eventDetails.location,
        cost: eventDetails.cost || null,
        prize: eventDetails.prize || null,
        // Derive startDate from first date in dates array for database storage
        startDate:
          eventDetails.dates && eventDetails.dates.length > 0
            ? eventDetails.dates[0].date
            : null,
        dates: datesJson,
        schedule: eventDetails.schedule || null,
        status: eventDetails.status || null,
        updatedAt: event.updatedAt.toISOString(),
      }
    );

    // Remove old event type labels and add new one
    if (currentEventTypeLabels.length > 0) {
      await tx.run(
        `MATCH (e:Event {id: $id})
         CALL apoc.create.removeLabels(e, $oldLabels) YIELD node
         RETURN node`,
        { id, oldLabels: currentEventTypeLabels }
      );
    }

    // Add new event type label if specified
    if (eventTypeLabel) {
      await tx.run(
        `MATCH (e:Event {id: $id})
         CALL apoc.create.addLabels(e, [$eventTypeLabel]) YIELD node
         RETURN node`,
        { id, eventTypeLabel: eventTypeLabel }
      );
    }

    // Update city relationship
    await tx.run(
      `MATCH (e:Event {id: $id})-[i:IN]->(c:City)
       DELETE i
       WITH e
       MERGE (c:City {id: $city.id})
       ON CREATE SET 
         c.name = $city.name,
         c.countryCode = $city.countryCode,
         c.region = $city.region,
         c.timezone = $city.timezone,
         c.latitude = $city.latitude,
         c.longitude = $city.longitude
       ON MATCH SET
         c.name = $city.name,
         c.countryCode = $city.countryCode,
         c.region = $city.region,
         c.timezone = $city.timezone,
         c.latitude = $city.latitude,
         c.longitude = $city.longitude
       MERGE (e)-[:IN]->(c)`,
      { id, city: eventDetails.city }
    );

    // Update poster
    await tx.run(
      `MATCH (e:Event {id: $id})
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

    // Update originalPoster
    await tx.run(
      `MATCH (e:Event {id: $id})
       OPTIONAL MATCH (oldOriginalPoster:Image)-[r:ORIGINAL_POSTER_OF]->(e)
       DELETE r
       WITH e
       FOREACH (originalPoster IN CASE WHEN $originalPoster IS NOT NULL AND $originalPoster.id IS NOT NULL THEN [$originalPoster] ELSE [] END |
         MERGE (newOriginalPoster:Image:Gallery { id: originalPoster.id })
         ON CREATE SET
           newOriginalPoster.title = originalPoster.title,
           newOriginalPoster.url = originalPoster.url
         SET
           newOriginalPoster.title = originalPoster.title,
           newOriginalPoster.url = originalPoster.url
         MERGE (newOriginalPoster)-[:ORIGINAL_POSTER_OF]->(e)
       )`,
      { id, originalPoster: eventDetails.originalPoster }
    );

    // Update event styles
    await tx.run(
      `MATCH (e:Event {id: $id})-[r:STYLE]->(:Style)
       DELETE r`,
      { id }
    );

    if (eventDetails.styles && eventDetails.styles.length > 0) {
      const normalizedStyles = normalizeStyleNames(eventDetails.styles);
      await tx.run(
        `
        MATCH (e:Event {id: $id})
        WITH e, $styles AS styles
        UNWIND styles AS styleName
        MERGE (style:Style {name: styleName})
        MERGE (e)-[:STYLE]->(style)
        `,
        { id, styles: normalizedStyles }
      );
    }

    // Update roles (exclude TEAM_MEMBER - team members are handled separately)
    const validRoleFormats = getNeo4jRoleFormats().filter(
      (r) => r !== "TEAM_MEMBER"
    );
    const regularRoles = event.roles.filter(
      (r) => r.user && r.title !== "TEAM_MEMBER"
    );

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

    // Delete roles not in the new list (but preserve CREATED relationship)
    if (regularRoles.length > 0) {
      await tx.run(
        `MATCH (e:Event {id: $id})
         MATCH (u:User)-[r]->(e)
         WHERE type(r) IN $validRoles AND NOT u.id IN [role IN $roles | role.user.id]
         DELETE r`,
        { id, roles: regularRoles, validRoles: validRoleFormats }
      );
    } else {
      await tx.run(
        `MATCH (e:Event {id: $id})
         MATCH (u:User)-[r]->(e)
         WHERE type(r) IN $validRoles
         DELETE r`,
        { id, validRoles: validRoleFormats }
      );
    }

    // Handle Team Members (separate from roles)
    if (teamMembers && teamMembers.length > 0) {
      // Add/update team members
      await tx.run(
        `MATCH (e:Event {id: $id})
         UNWIND $teamMembers AS memberData
         MERGE (u:User { id: memberData.id })
         MERGE (u)-[:TEAM_MEMBER]->(e)
         RETURN e, u
         `,
        { id, teamMembers }
      );

      // Delete team members not in the new list
      await tx.run(
        `MATCH (e:Event {id: $id})
         MATCH (u:User)-[r:TEAM_MEMBER]->(e)
         WHERE NOT u.id IN [member IN $teamMembers | member.id]
         DELETE r`,
        { id, teamMembers }
      );
    } else {
      // Remove all team members if none provided
      await tx.run(
        `MATCH (e:Event {id: $id})
         MATCH (u:User)-[r:TEAM_MEMBER]->(e)
         DELETE r`,
        { id }
      );
    }

    // Ensure creator relationship is preserved
    if (eventDetails.creatorId) {
      await tx.run(
        `MATCH (e:Event {id: $id})
         MATCH (creator:User {id: $creatorId})
         MERGE (creator)-[:CREATED]->(e)`,
        { id, creatorId: eventDetails.creatorId }
      );
    }

    // Delete all existing sections and their relationships
    await tx.run(
      `MATCH (e:Event {id: $id})<-[:IN]-(s:Section)
       DETACH DELETE s`,
      { id }
    );

    // Commit transaction
    await tx.commit();
    await session.close();

    // Recreate sections, brackets, videos, and gallery
    await createSections(event.id, event.sections);
    await createBrackets(event.sections);
    await createBracketVideos(event.sections);
    await createSectionVideos(event.sections);
    await createGalleryPhotos(event.id, event.gallery);

    // Create section winners
    for (const section of event.sections) {
      if (section.winners && section.winners.length > 0) {
        const session = driver.session();
        try {
          for (const winner of section.winners) {
            const userId = await getUserIdFromUserSearchItem(winner);
            await session.run(
              `MATCH (s:Section {id: $sectionId})
               MERGE (u:User {id: $userId})
               MERGE (u)-[:WINNER]->(s)`,
              { sectionId: section.id, userId }
            );
          }
        } finally {
          await session.close();
        }
      }
    }

    return event;
  } catch (error) {
    await session.close();
    throw error;
  }
};

// Save event for user
export async function saveEventForUser(userId: string, eventId: string) {
  const session = driver.session();
  try {
    await session.run(
      `
      MATCH (u:User {id: $userId})
      MATCH (e:Event {id: $eventId})
      MERGE (u)-[:SAVE]->(e)
      `,
      { userId, eventId }
    );
  } finally {
    await session.close();
  }
}

// Unsave event for user
export async function unsaveEventForUser(userId: string, eventId: string) {
  const session = driver.session();
  try {
    await session.run(
      `
      MATCH (u:User {id: $userId})-[r:SAVE]->(e:Event {id: $eventId})
      DELETE r
      `,
      { userId, eventId }
    );
  } finally {
    await session.close();
  }
}

// Check if event is saved by user
export async function isEventSavedByUser(userId: string, eventId: string) {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})-[r:SAVE]->(e:Event {id: $eventId})
      RETURN COUNT(r) > 0 AS saved
      `,
      { userId, eventId }
    );

    return result.records[0].get("saved");
  } finally {
    await session.close();
  }
}

// Toggle save event for user
// If SAVE relationship exists → delete it and return { saved: false }
// If not → create it with createdAt and return { saved: true }
export async function toggleSaveCypher(
  userId: string,
  eventId: string
): Promise<{ saved: boolean }> {
  const session = driver.session();
  try {
    // First, check if the relationship exists
    const checkResult = await session.run(
      `
      MATCH (u:User {id: $userId})-[r:SAVE]->(e:Event {id: $eventId})
      RETURN r
      `,
      { userId, eventId }
    );

    const relationshipExists = checkResult.records.length > 0;

    if (relationshipExists) {
      // Delete the relationship
      await session.run(
        `
        MATCH (u:User {id: $userId})-[r:SAVE]->(e:Event {id: $eventId})
        DELETE r
        `,
        { userId, eventId }
      );
      return { saved: false };
    } else {
      // Create the relationship with createdAt timestamp
      const createdAt = new Date().toISOString();
      await session.run(
        `
        MATCH (u:User {id: $userId})
        MATCH (e:Event {id: $eventId})
        MERGE (u)-[r:SAVE]->(e)
        ON CREATE SET r.createdAt = $createdAt
        `,
        { userId, eventId, createdAt }
      );
      return { saved: true };
    }
  } finally {
    await session.close();
  }
}

/**
 * Get all hidden events (for admin dashboard)
 * Returns event cards for all events with status = "hidden"
 */
export async function getHiddenEvents(): Promise<TEventCard[]> {
  const session = driver.session();

  try {
    // Get all hidden events
    const eventsResult = await session.run(
      `
      MATCH (e:Event)
      WHERE e.status = 'hidden'
      OPTIONAL MATCH (e)-[:IN]->(c:City)
      OPTIONAL MATCH (e)<-[:POSTER_OF]-(p:Image)
      WITH DISTINCT e, c, p,
           [label IN labels(e) WHERE label IN ['BattleEvent', 'CompetitionEvent', 'ClassEvent', 'WorkshopEvent', 'SessionEvent', 'PartyEvent', 'FestivalEvent', 'PerformanceEvent']] as eventTypeLabels
      RETURN e.id as eventId, 
             e.title as title, 
             e.startDate as startDate,
             e.dates as dates,
             c.name as city, 
             c.id as cityId, 
             p.url as imageUrl,
             CASE 
               WHEN size(eventTypeLabels) > 0 THEN 
                 CASE eventTypeLabels[0]
                   WHEN 'BattleEvent' THEN 'Battle'
                   WHEN 'CompetitionEvent' THEN 'Competition'
                   WHEN 'ClassEvent' THEN 'Class'
                   WHEN 'WorkshopEvent' THEN 'Workshop'
                   WHEN 'SessionEvent' THEN 'Session'
                   WHEN 'PartyEvent' THEN 'Party'
                   WHEN 'FestivalEvent' THEN 'Festival'
                   WHEN 'PerformanceEvent' THEN 'Performance'
                   ELSE null
                 END
               ELSE null 
             END as eventType
      ORDER BY e.startDate ASC, e.createdAt ASC
      `,
      {}
    );

    // Get all styles for each hidden event
    const stylesResult = await session.run(
      `
      MATCH (e:Event)
      WHERE e.status = 'hidden'
      OPTIONAL MATCH (e)-[:STYLE]->(eventStyle:Style)
      OPTIONAL MATCH (e)<-[:IN]-(s:Section)-[:STYLE]->(sectionStyle:Style)
      OPTIONAL MATCH (e)<-[:IN]-(s2:Section)<-[:IN]-(v:Video)-[:STYLE]->(videoStyle:Style)
      OPTIONAL MATCH (e)<-[:IN]-(s3:Section)<-[:IN]-(b:Bracket)<-[:IN]-(bv:Video)-[:STYLE]->(bracketVideoStyle:Style)
      WITH e.id as eventId, 
           collect(DISTINCT eventStyle.name) as eventStyles,
           collect(DISTINCT sectionStyle.name) as sectionStyles,
           collect(DISTINCT videoStyle.name) as videoStyles,
           collect(DISTINCT bracketVideoStyle.name) as bracketVideoStyles
      WITH eventId, 
           [style IN eventStyles WHERE style IS NOT NULL] as filteredEventStyles,
           [style IN sectionStyles WHERE style IS NOT NULL] as filteredSectionStyles,
           [style IN videoStyles WHERE style IS NOT NULL] as filteredVideoStyles,
           [style IN bracketVideoStyles WHERE style IS NOT NULL] as filteredBracketVideoStyles
      RETURN eventId, 
             filteredEventStyles + filteredSectionStyles + filteredVideoStyles + filteredBracketVideoStyles as allStyles
      `,
      {}
    );

    // Create a map of eventId -> styles
    const stylesMap = new Map<string, string[]>();
    stylesResult.records.forEach((record) => {
      const eventId = record.get("eventId");
      const allStyles = (record.get("allStyles") || []) as unknown[];
      const uniqueStyles = Array.from(
        new Set(
          allStyles.filter(
            (s): s is string => typeof s === "string" && s !== null
          )
        )
      );
      stylesMap.set(eventId, uniqueStyles);
    });

    // Combine event data with styles
    return eventsResult.records.map((record) => {
      const eventId = record.get("eventId");
      const startDate = record.get("startDate");
      const dates = record.get("dates");

      // Determine date to display
      let displayDate = "";
      if (startDate) {
        displayDate = startDate;
      } else if (dates) {
        try {
          const datesArray =
            typeof dates === "string" ? JSON.parse(dates) : dates;
          if (Array.isArray(datesArray) && datesArray.length > 0) {
            displayDate = datesArray[0].date || "";
          }
        } catch (error) {
          console.error("Error parsing dates array:", error);
        }
      }

      const eventType = record.get("eventType") as EventType | null;
      return {
        id: eventId,
        title: record.get("title"),
        series: undefined,
        imageUrl: record.get("imageUrl"),
        date: displayDate,
        city: record.get("city") || "",
        cityId: record.get("cityId") ? String(record.get("cityId")) : undefined,
        styles: stylesMap.get(eventId) || [],
        eventType: eventType || undefined,
        status: "hidden" as const,
      };
    });
  } finally {
    await session.close();
  }
}

/**
 * Check if a user can access a hidden event
 * Returns true if user is creator, team member, moderator, or admin
 */
export async function canAccessHiddenEvent(
  eventId: string,
  userId: string,
  authLevel?: number
): Promise<boolean> {
  const session = driver.session();
  try {
    // Check if user is moderator or admin (authLevel >= 2)
    if (authLevel !== undefined && authLevel >= AUTH_LEVELS.MODERATOR) {
      return true;
    }

    // Check if user is creator or team member
    const result = await session.run(
      `
      MATCH (e:Event {id: $eventId})
      OPTIONAL MATCH (u:User {id: $userId})-[:CREATED]->(e)
      OPTIONAL MATCH (u)-[:TEAM_MEMBER]->(e)
      RETURN count(u) > 0 as canAccess
      `,
      { eventId, userId }
    );

    return result.records[0]?.get("canAccess") || false;
  } finally {
    await session.close();
  }
}

// Get all saved event IDs for a user
export async function getSavedEventIds(
  userId: string,
  authLevel?: number
): Promise<string[]> {
  const session = driver.session();
  try {
    // Check if user is moderator/admin
    const isModOrAdmin =
      authLevel !== undefined && authLevel >= AUTH_LEVELS.MODERATOR;

    // Get all saved events with their status
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})-[r:SAVE]->(e:Event)
      OPTIONAL MATCH (creator:User {id: $userId})-[:CREATED]->(e)
      OPTIONAL MATCH (teamMember:User {id: $userId})-[:TEAM_MEMBER]->(e)
      WITH e, 
           (e.status = 'visible' OR e.status IS NULL) as isVisible,
           (creator IS NOT NULL) as isCreator,
           (teamMember IS NOT NULL) as isTeamMember
      WHERE isVisible OR isCreator OR isTeamMember OR $isModOrAdmin
      RETURN DISTINCT e.id as eventId
      `,
      {
        userId,
        isModOrAdmin: isModOrAdmin,
      }
    );

    return result.records.map((record) => record.get("eventId") as string);
  } finally {
    await session.close();
  }
}

/**
 * Get event cards for events created by a user
 * Includes hidden events (since user is the creator)
 */
export async function getUserCreatedEventCards(
  userId: string
): Promise<TEventCard[]> {
  const session = driver.session();

  try {
    // Get events created by user (including hidden ones)
    const eventsResult = await session.run(
      `
      MATCH (u:User {id: $userId})-[:CREATED]->(e:Event)
      OPTIONAL MATCH (e)-[:IN]->(c:City)
      OPTIONAL MATCH (e)<-[:POSTER_OF]-(p:Image)
      WITH DISTINCT e, c, p,
           [label IN labels(e) WHERE label IN ['BattleEvent', 'CompetitionEvent', 'ClassEvent', 'WorkshopEvent', 'SessionEvent', 'PartyEvent', 'FestivalEvent', 'PerformanceEvent']] as eventTypeLabels
      RETURN e.id as eventId, 
             e.title as title, 
             e.startDate as startDate,
             e.dates as dates,
             e.status as status,
             c.name as city, 
             c.id as cityId, 
             p.url as imageUrl,
             CASE 
               WHEN size(eventTypeLabels) > 0 THEN 
                 CASE eventTypeLabels[0]
                   WHEN 'BattleEvent' THEN 'Battle'
                   WHEN 'CompetitionEvent' THEN 'Competition'
                   WHEN 'ClassEvent' THEN 'Class'
                   WHEN 'WorkshopEvent' THEN 'Workshop'
                   WHEN 'SessionEvent' THEN 'Session'
                   WHEN 'PartyEvent' THEN 'Party'
                   WHEN 'FestivalEvent' THEN 'Festival'
                   WHEN 'PerformanceEvent' THEN 'Performance'
                   ELSE null
                 END
               ELSE null 
             END as eventType
      ORDER BY e.startDate ASC, e.createdAt ASC
      `,
      { userId }
    );

    // Get all styles for each event
    const stylesResult = await session.run(
      `
      MATCH (u:User {id: $userId})-[:CREATED]->(e:Event)
      OPTIONAL MATCH (e)-[:STYLE]->(eventStyle:Style)
      OPTIONAL MATCH (e)<-[:IN]-(s:Section)-[:STYLE]->(sectionStyle:Style)
      OPTIONAL MATCH (e)<-[:IN]-(s2:Section)<-[:IN]-(v:Video)-[:STYLE]->(videoStyle:Style)
      OPTIONAL MATCH (e)<-[:IN]-(s3:Section)<-[:IN]-(b:Bracket)<-[:IN]-(bv:Video)-[:STYLE]->(bracketVideoStyle:Style)
      WITH e.id as eventId, 
           collect(DISTINCT eventStyle.name) as eventStyles,
           collect(DISTINCT sectionStyle.name) as sectionStyles,
           collect(DISTINCT videoStyle.name) as videoStyles,
           collect(DISTINCT bracketVideoStyle.name) as bracketVideoStyles
      WITH eventId, 
           [style IN eventStyles WHERE style IS NOT NULL] as filteredEventStyles,
           [style IN sectionStyles WHERE style IS NOT NULL] as filteredSectionStyles,
           [style IN videoStyles WHERE style IS NOT NULL] as filteredVideoStyles,
           [style IN bracketVideoStyles WHERE style IS NOT NULL] as filteredBracketVideoStyles
      RETURN eventId, 
             filteredEventStyles + filteredSectionStyles + filteredVideoStyles + filteredBracketVideoStyles as allStyles
      `,
      { userId }
    );

    // Create a map of eventId -> styles
    const stylesMap = new Map<string, string[]>();
    stylesResult.records.forEach((record) => {
      const eventId = record.get("eventId");
      const allStyles = (record.get("allStyles") || []) as unknown[];
      const uniqueStyles = Array.from(
        new Set(
          allStyles.filter(
            (s): s is string => typeof s === "string" && s !== null
          )
        )
      );
      stylesMap.set(eventId, uniqueStyles);
    });

    // Combine event data with styles
    return eventsResult.records.map((record) => {
      const eventId = record.get("eventId");
      const startDate = record.get("startDate");
      const dates = record.get("dates");

      // Determine date to display
      let displayDate = "";
      if (startDate) {
        displayDate = startDate;
      } else if (dates) {
        try {
          const datesArray =
            typeof dates === "string" ? JSON.parse(dates) : dates;
          if (Array.isArray(datesArray) && datesArray.length > 0) {
            displayDate = datesArray[0].date || "";
          }
        } catch (error) {
          console.error("Error parsing dates array:", error);
        }
      }

      const eventType = record.get("eventType") as EventType | null;
      return {
        id: eventId,
        title: record.get("title"),
        series: undefined,
        imageUrl: record.get("imageUrl"),
        date: displayDate,
        city: record.get("city") || "",
        cityId: record.get("cityId") ? String(record.get("cityId")) : undefined,
        styles: stylesMap.get(eventId) || [],
        eventType: eventType || undefined,
        status: (record.get("status") as "hidden" | "visible") || "visible",
      };
    });
  } finally {
    await session.close();
  }
}

// Get all saved events for a user with full EventCard data
export async function getSavedEventsForUser(
  userId: string,
  authLevel?: number
): Promise<TEventCard[]> {
  const session = driver.session();

  try {
    // Check if user is moderator/admin
    const isModOrAdmin =
      authLevel !== undefined && authLevel >= AUTH_LEVELS.MODERATOR;

    // Get saved events with basic info, filtering hidden events unless user is authorized
    const eventsResult = await session.run(
      `
      MATCH (u:User {id: $userId})-[r:SAVE]->(e:Event)
      OPTIONAL MATCH (creator:User {id: $userId})-[:CREATED]->(e)
      OPTIONAL MATCH (teamMember:User {id: $userId})-[:TEAM_MEMBER]->(e)
      WITH e, r,
           (e.status = 'visible' OR e.status IS NULL) as isVisible,
           (creator IS NOT NULL) as isCreator,
           (teamMember IS NOT NULL) as isTeamMember
      WHERE isVisible OR isCreator OR isTeamMember OR $isModOrAdmin
      OPTIONAL MATCH (e)-[:IN]->(c:City)
      OPTIONAL MATCH (e)<-[:POSTER_OF]-(p:Image)
      WITH DISTINCT e, c, p, r.createdAt as savedAt,
           [label IN labels(e) WHERE label IN ['BattleEvent', 'CompetitionEvent', 'ClassEvent', 'WorkshopEvent', 'SessionEvent', 'PartyEvent', 'FestivalEvent', 'PerformanceEvent']] as eventTypeLabels
      RETURN e.id as eventId, 
             e.title as title, 
             e.startDate as startDate,
             e.dates as dates,
             c.name as city, 
             c.id as cityId, 
             p.url as imageUrl,
             CASE 
               WHEN size(eventTypeLabels) > 0 THEN 
                 CASE eventTypeLabels[0]
                   WHEN 'BattleEvent' THEN 'Battle'
                   WHEN 'CompetitionEvent' THEN 'Competition'
                   WHEN 'ClassEvent' THEN 'Class'
                   WHEN 'WorkshopEvent' THEN 'Workshop'
                   WHEN 'SessionEvent' THEN 'Session'
                   WHEN 'PartyEvent' THEN 'Party'
                   WHEN 'FestivalEvent' THEN 'Festival'
                   WHEN 'PerformanceEvent' THEN 'Performance'
                   ELSE null
                 END
               ELSE null 
             END as eventType
      ORDER BY e.startDate ASC, e.createdAt ASC
      `,
      {
        userId,
        isModOrAdmin: isModOrAdmin,
      }
    );

    // Get all styles for each saved event (from event, sections, and videos)
    // Only include events that user can access (visible or authorized)
    const stylesResult = await session.run(
      `
      MATCH (u:User {id: $userId})-[r:SAVE]->(e:Event)
      OPTIONAL MATCH (creator:User {id: $userId})-[:CREATED]->(e)
      OPTIONAL MATCH (teamMember:User {id: $userId})-[:TEAM_MEMBER]->(e)
      WITH e,
           (e.status = 'visible' OR e.status IS NULL) as isVisible,
           (creator IS NOT NULL) as isCreator,
           (teamMember IS NOT NULL) as isTeamMember
      WHERE isVisible OR isCreator OR isTeamMember OR $isModOrAdmin
      OPTIONAL MATCH (e)-[:STYLE]->(eventStyle:Style)
      OPTIONAL MATCH (e)<-[:IN]-(s:Section)-[:STYLE]->(sectionStyle:Style)
      OPTIONAL MATCH (e)<-[:IN]-(s2:Section)<-[:IN]-(v:Video)-[:STYLE]->(videoStyle:Style)
      OPTIONAL MATCH (e)<-[:IN]-(s3:Section)<-[:IN]-(b:Bracket)<-[:IN]-(bv:Video)-[:STYLE]->(bracketVideoStyle:Style)
      WITH e.id as eventId, 
           collect(DISTINCT eventStyle.name) as eventStyles,
           collect(DISTINCT sectionStyle.name) as sectionStyles,
           collect(DISTINCT videoStyle.name) as videoStyles,
           collect(DISTINCT bracketVideoStyle.name) as bracketVideoStyles
      WITH eventId, 
           [style IN eventStyles WHERE style IS NOT NULL] as filteredEventStyles,
           [style IN sectionStyles WHERE style IS NOT NULL] as filteredSectionStyles,
           [style IN videoStyles WHERE style IS NOT NULL] as filteredVideoStyles,
           [style IN bracketVideoStyles WHERE style IS NOT NULL] as filteredBracketVideoStyles
      RETURN eventId, 
             filteredEventStyles + filteredSectionStyles + filteredVideoStyles + filteredBracketVideoStyles as allStyles
      `,
      { userId, isModOrAdmin: isModOrAdmin }
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

    // Combine event data with styles
    return eventsResult.records.map((record) => {
      const eventId = record.get("eventId");
      const startDate = record.get("startDate");
      const dates = record.get("dates");

      // Determine date to display
      let displayDate = "";
      if (startDate) {
        displayDate = startDate;
      } else if (dates) {
        try {
          const datesArray =
            typeof dates === "string" ? JSON.parse(dates) : dates;
          if (Array.isArray(datesArray) && datesArray.length > 0) {
            displayDate = datesArray[0].date || "";
          }
        } catch (error) {
          console.error("Error parsing dates array:", error);
        }
      }

      const eventType = record.get("eventType") as EventType | null;
      return {
        id: eventId,
        title: record.get("title"),
        series: undefined,
        imageUrl: record.get("imageUrl"),
        date: displayDate,
        city: record.get("city") || "",
        cityId: record.get("cityId") ? String(record.get("cityId")) : undefined,
        styles: stylesMap.get(eventId) || [],
        eventType: eventType || undefined,
      };
    });
  } finally {
    await session.close();
  }
}

// City helper functions for Neo4j operations

/**
 * Search Neo4j for cities matching keyword (name, region)
 * Uses text matching with indexes on name and region
 */
export async function searchCitiesInNeo4j(keyword: string): Promise<City[]> {
  const session = driver.session();

  try {
    const result = await session.run(
      `MATCH (c:City)
       WHERE toLower(c.name) CONTAINS toLower($keyword)
          OR toLower(c.region) CONTAINS toLower($keyword)
       RETURN c.id as id, c.name as name, c.region as region,
              c.countryCode as countryCode, c.timezone as timezone,
              c.latitude as latitude, c.longitude as longitude
       ORDER BY c.name ASC
       LIMIT 5`,
      { keyword }
    );

    return result.records.map((record) => ({
      id: String(record.get("id")),
      name: record.get("name") as string,
      region: record.get("region") || "",
      countryCode: record.get("countryCode") || "",
      timezone: record.get("timezone") || undefined,
      latitude: record.get("latitude")
        ? Number(record.get("latitude"))
        : undefined,
      longitude: record.get("longitude")
        ? Number(record.get("longitude"))
        : undefined,
    }));
  } catch (error) {
    console.error("Error searching cities in Neo4j:", error);
    return [];
  } finally {
    await session.close();
  }
}

/**
 * Get city from Neo4j by place_id
 * Returns stored data including timezone and coordinates
 */
export async function getCityFromNeo4j(placeId: string): Promise<City | null> {
  const session = driver.session();

  try {
    const result = await session.run(
      `MATCH (c:City {id: $placeId})
       RETURN c.id as id, c.name as name, c.region as region,
              c.countryCode as countryCode, c.timezone as timezone,
              c.latitude as latitude, c.longitude as longitude`,
      { placeId }
    );

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    return {
      id: String(record.get("id")),
      name: record.get("name") as string,
      region: record.get("region") || "",
      countryCode: record.get("countryCode") || "",
      timezone: record.get("timezone") || undefined,
      latitude: record.get("latitude")
        ? Number(record.get("latitude"))
        : undefined,
      longitude: record.get("longitude")
        ? Number(record.get("longitude"))
        : undefined,
    };
  } catch (error) {
    console.error(`Error fetching city from Neo4j: ${placeId}`, error);
    return null;
  } finally {
    await session.close();
  }
}

/**
 * Store/update city data in Neo4j
 * Stores: id, name, region, countryCode, latitude, longitude, timezone
 */
export async function storeCityData(cityData: City): Promise<void> {
  const session = driver.session();

  try {
    await session.run(
      `MERGE (c:City {id: $id})
       ON CREATE SET
         c.name = $name,
         c.region = $region,
         c.countryCode = $countryCode,
         c.latitude = $latitude,
         c.longitude = $longitude,
         c.timezone = $timezone
       ON MATCH SET
         c.name = $name,
         c.region = $region,
         c.countryCode = $countryCode,
         c.latitude = $latitude,
         c.longitude = $longitude,
         c.timezone = $timezone`,
      {
        id: cityData.id,
        name: cityData.name,
        region: cityData.region || "",
        countryCode: cityData.countryCode || "",
        latitude: cityData.latitude ?? null,
        longitude: cityData.longitude ?? null,
        timezone: cityData.timezone || null,
      }
    );
  } catch (error) {
    console.error("Error storing city data in Neo4j:", error);
    throw error;
  } finally {
    await session.close();
  }
}

// Types and interfaces for style, city, and calendar data
export interface StyleData {
  styleName: string;
  events: TEventCard[];
  cityFilteredEvents?: TEventCard[];
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
}

export interface CityData {
  city: City;
  events: TEventCard[];
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
  startDate?: string; // Kept for backward compatibility, prefer dates[0].date
  startTime?: string; // Kept for backward compatibility, prefer dates[0].startTime
  endTime?: string; // Kept for backward compatibility, prefer dates[0].endTime
  dates?: Array<{
    date: string;
    startTime?: string;
    endTime?: string;
  }>;
  eventType?: EventType;
  poster?: {
    id: string;
    title: string;
    url: string;
    type: string;
  } | null;
  styles: string[];
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
}

export interface CityScheduleData {
  events: CalendarEventData[];
  workshops: CalendarWorkshopData[];
  sessions: CalendarSessionData[];
}

export const getStyleData = async (
  styleName: string,
  cityId?: string
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
       WHERE (event.status = 'visible' OR event.status IS NULL)
      OPTIONAL MATCH (event)-[:IN]->(c:City)
      OPTIONAL MATCH (poster:Image)-[:POSTER_OF]->(event)
      WITH event, c, poster,
           [label IN labels(event) WHERE label IN ['BattleEvent', 'CompetitionEvent', 'ClassEvent', 'WorkshopEvent', 'SessionEvent', 'PartyEvent', 'FestivalEvent', 'PerformanceEvent']] as eventTypeLabels
      RETURN event.id as eventId, event.title as title, event.startDate as date, c.name as city, c.id as cityId, poster.url as imageUrl,
             CASE 
               WHEN size(eventTypeLabels) > 0 THEN 
                 CASE eventTypeLabels[0]
                   WHEN 'BattleEvent' THEN 'Battle'
                   WHEN 'CompetitionEvent' THEN 'Competition'
                   WHEN 'ClassEvent' THEN 'Class'
                   WHEN 'WorkshopEvent' THEN 'Workshop'
                   WHEN 'SessionEvent' THEN 'Session'
                   WHEN 'PartyEvent' THEN 'Party'
                   WHEN 'FestivalEvent' THEN 'Festival'
                   WHEN 'PerformanceEvent' THEN 'Performance'
                   ELSE null
                 END
               ELSE null 
             END as eventType
      ORDER BY event.startDate DESC`,
      { styleName: normalizedStyleName }
    );

    // Get sections with this style
    const sectionsResult = await session.run(
      `MATCH (style:Style {name: $styleName})<-[:STYLE]-(s:Section)-[:IN]->(e:Event)
       WHERE (e.status = 'visible' OR e.status IS NULL)
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
       WHERE section IS NOT NULL AND event IS NOT NULL AND (event.status = 'visible' OR event.status IS NULL)
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
         username: u.username,
         avatar: u.avatar,
         image: u.image
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
    let cityFilteredEventsResult: Awaited<
      ReturnType<typeof session.run>
    > | null = null;
    let cityFilteredEventStylesResult: Awaited<
      ReturnType<typeof session.run>
    > | null = null;
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
         WHERE (event.status = 'visible' OR event.status IS NULL)
         OPTIONAL MATCH (event)-[:IN]->(c:City)
         OPTIONAL MATCH (poster:Image)-[:POSTER_OF]->(event)
         WITH event, c, poster,
              [label IN labels(event) WHERE label IN ['BattleEvent', 'CompetitionEvent', 'ClassEvent', 'WorkshopEvent', 'SessionEvent', 'PartyEvent', 'FestivalEvent', 'PerformanceEvent']] as eventTypeLabels
         RETURN event.id as eventId, event.title as title, event.startDate as date, c.name as city, c.id as cityId, poster.url as imageUrl,
                CASE 
                  WHEN size(eventTypeLabels) > 0 THEN 
                    CASE eventTypeLabels[0]
                      WHEN 'BattleEvent' THEN 'Battle'
                      WHEN 'CompetitionEvent' THEN 'Competition'
                      WHEN 'ClassEvent' THEN 'Class'
                      WHEN 'WorkshopEvent' THEN 'Workshop'
                      WHEN 'SessionEvent' THEN 'Session'
                      WHEN 'PartyEvent' THEN 'Party'
                      WHEN 'FestivalEvent' THEN 'Festival'
                      WHEN 'PerformanceEvent' THEN 'Performance'
                      ELSE null
                    END
                  ELSE null 
                END as eventType
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
         WHERE (event.status = 'visible' OR event.status IS NULL)
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
    let cityFilteredUsersResult: Awaited<
      ReturnType<typeof session.run>
    > | null = null;
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

    await session.close();

    // Build events array
    const events: TEventCard[] = eventsResult.records.map((record) => {
      const eventId = record.get("eventId");
      return {
        id: eventId,
        title: record.get("title"),
        series: undefined,
        imageUrl: record.get("imageUrl"),
        date: record.get("date"),
        city: record.get("city"),
        cityId: record.get("cityId") ? String(record.get("cityId")) : undefined,
        styles: eventStylesMap.get(eventId) || [],
        eventType: record.get("eventType") as EventType | undefined,
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
        (s: unknown): s is string =>
          s !== null && s !== undefined && typeof s === "string"
      ) as string[],
    }));

    // Build city-filtered events array (if cityId was provided)
    let cityFilteredEvents: TEventCard[] = [];
    if (cityFilteredEventsResult && cityFilteredEventStylesResult) {
      // Create styles map for city-filtered events
      const cityFilteredEventStylesMap = new Map<string, string[]>();
      cityFilteredEventStylesResult.records.forEach(
        (record: Neo4jResultRecord) => {
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
        }
      );

      cityFilteredEvents = cityFilteredEventsResult.records.map(
        (record: Neo4jResultRecord) => {
          const eventId = record.get("eventId");
          return {
            id: eventId,
            title: record.get("title"),
            series: undefined,
            imageUrl: record.get("imageUrl"),
            date: record.get("date"),
            city: record.get("city"),
            cityId: record.get("cityId")
              ? String(record.get("cityId"))
              : undefined,
            styles: cityFilteredEventStylesMap.get(eventId) || [],
            eventType: record.get("eventType") as EventType | undefined,
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
        (record: Neo4jResultRecord) => ({
          id: record.get("id"),
          displayName: record.get("displayName") || "",
          username: record.get("username") || "",
          image: record.get("image"),
          styles: (record.get("styles") || []).filter(
            (s: unknown): s is string =>
              s !== null && s !== undefined && typeof s === "string"
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
export const getEventImages = async (eventId: string) => {
  const session = driver.session();
  const result = await session.run(
    `MATCH (e:Event {id: $eventId})
    OPTIONAL MATCH (e)<-[:POSTER_OF]-(poster:Image)
    OPTIONAL MATCH (e)<-[:PHOTO]-(gallery:Image)

    RETURN poster, gallery
    `,
    {
      eventId,
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

export const getAllCities = async (): Promise<City[]> => {
  const session = driver.session();

  try {
    const result = await session.run(
      `MATCH (c:City)
       RETURN DISTINCT c.id as id, c.name as name, c.region as region, 
              c.countryCode as countryCode, c.timezone as timezone,
              c.latitude as latitude, c.longitude as longitude
       ORDER BY c.name ASC`
    );

    await session.close();

    return result.records.map((record) => ({
      id: String(record.get("id")),
      name: record.get("name") as string,
      region: record.get("region") || "",
      countryCode: record.get("countryCode") || "",
      timezone: record.get("timezone") || undefined,
      latitude: record.get("latitude")
        ? Number(record.get("latitude"))
        : undefined,
      longitude: record.get("longitude")
        ? Number(record.get("longitude"))
        : undefined,
    }));
  } catch (error) {
    console.error("Error fetching all cities:", error);
    await session.close();
    return [];
  }
};

export const getCityData = async (cityId: string): Promise<CityData | null> => {
  const session = driver.session();

  try {
    // Check if city exists - use stored coordinates from Neo4j (no API calls)
    const cityCheckResult = await session.run(
      `MATCH (c:City {id: $cityId})
       RETURN c.id as id, c.name as name, c.region as region,
              c.countryCode as countryCode, c.timezone as timezone,
              c.latitude as latitude, c.longitude as longitude`,
      { cityId }
    );

    if (cityCheckResult.records.length === 0) {
      return null;
    }

    const cityRecord = cityCheckResult.records[0];

    const city: City = {
      id: String(cityRecord.get("id")),
      name: cityRecord.get("name") as string,
      region: cityRecord.get("region") || "",
      countryCode: cityRecord.get("countryCode") || "",
      timezone: cityRecord.get("timezone") || undefined,
      latitude: cityRecord.get("latitude")
        ? Number(cityRecord.get("latitude"))
        : undefined,
      longitude: cityRecord.get("longitude")
        ? Number(cityRecord.get("longitude"))
        : undefined,
    };

    // Get events in this city
    const eventsResult = await session.run(
      `MATCH (c:City {id: $cityId})<-[:IN]-(e:Event)
       WHERE (e.status = 'visible' OR e.status IS NULL)
       OPTIONAL MATCH (poster:Image)-[:POSTER_OF]->(e)
       WITH e, poster,
            [label IN labels(e) WHERE label IN ['BattleEvent', 'CompetitionEvent', 'ClassEvent', 'WorkshopEvent', 'SessionEvent', 'PartyEvent', 'FestivalEvent', 'PerformanceEvent']] as eventTypeLabels
       RETURN e.id as eventId, e.title as title, e.startDate as date, 
              poster.url as imageUrl,
              CASE 
                WHEN size(eventTypeLabels) > 0 THEN 
                  CASE eventTypeLabels[0]
                    WHEN 'BattleEvent' THEN 'Battle'
                    WHEN 'CompetitionEvent' THEN 'Competition'
                    WHEN 'ClassEvent' THEN 'Class'
                    WHEN 'WorkshopEvent' THEN 'Workshop'
                    WHEN 'SessionEvent' THEN 'Session'
                    WHEN 'PartyEvent' THEN 'Party'
                    WHEN 'FestivalEvent' THEN 'Festival'
                    WHEN 'PerformanceEvent' THEN 'Performance'
                    ELSE null
                  END
                ELSE null 
              END as eventType
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
    const events: TEventCard[] = eventsResult.records.map((record) => {
      const eventId = record.get("eventId");
      return {
        id: eventId,
        title: record.get("title"),
        series: undefined,
        imageUrl: record.get("imageUrl"),
        date: record.get("date"),
        city: city.name,
        styles: eventStylesMap.get(eventId) || [],
        eventType: record.get("eventType") as EventType | undefined,
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
        (s: unknown): s is string =>
          s !== null && s !== undefined && typeof s === "string"
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
  cityId: string
): Promise<CityScheduleData | null> => {
  const session = driver.session();

  try {
    // Get events in this city with full details
    const eventsResult = await session.run(
      `MATCH (c:City {id: $cityId})<-[:IN]-(e:Event)
       WHERE (e.status = 'visible' OR e.status IS NULL)
       OPTIONAL MATCH (poster:Image)-[:POSTER_OF]->(e)
       WITH e, poster,
            [label IN labels(e) WHERE label IN ['BattleEvent', 'CompetitionEvent', 'ClassEvent', 'WorkshopEvent', 'SessionEvent', 'PartyEvent', 'FestivalEvent', 'PerformanceEvent']][0] as eventTypeLabel
       RETURN e.id as id, e.title as title, e.startDate as startDate,
              e.startTime as startTime, e.endTime as endTime, e.dates as dates,
              eventTypeLabel,
              CASE WHEN poster IS NOT NULL THEN {
                id: poster.id,
                title: poster.title,
                url: poster.url,
                type: poster.type
              } ELSE null END as poster`,
      { cityId }
    );

    // Get event styles (including event-level styles)
    const eventStylesResult = await session.run(
      `MATCH (c:City {id: $cityId})<-[:IN]-(e:Event)
       WHERE (e.status = 'visible' OR e.status IS NULL)
       OPTIONAL MATCH (e)-[:STYLE]->(eventStyle:Style)
       OPTIONAL MATCH (e)<-[:IN]-(s:Section)-[:STYLE]->(sectionStyle:Style)
       OPTIONAL MATCH (e)<-[:IN]-(s2:Section)<-[:IN]-(v:Video)-[:STYLE]->(videoStyle:Style)
       OPTIONAL MATCH (e)<-[:IN]-(s3:Section)<-[:IN]-(b:Bracket)<-[:IN]-(bv:Video)-[:STYLE]->(bracketVideoStyle:Style)
       WITH e.id as eventId,
            collect(DISTINCT eventStyle.name) as eventStyles,
            collect(DISTINCT sectionStyle.name) as sectionStyles,
            collect(DISTINCT videoStyle.name) as videoStyles,
            collect(DISTINCT bracketVideoStyle.name) as bracketVideoStyles
       WITH eventId,
            [style IN eventStyles WHERE style IS NOT NULL] as filteredEventStyles,
            [style IN sectionStyles WHERE style IS NOT NULL] as filteredSectionStyles,
            [style IN videoStyles WHERE style IS NOT NULL] as filteredVideoStyles,
            [style IN bracketVideoStyles WHERE style IS NOT NULL] as filteredBracketVideoStyles
       RETURN eventId,
              filteredEventStyles + filteredSectionStyles + filteredVideoStyles + filteredBracketVideoStyles as allStyles`,
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
      const dates = record.get("dates");
      const eventTypeLabel = record.get("eventTypeLabel");
      let parsedDates: EventDate[] = [];
      if (dates) {
        try {
          parsedDates = typeof dates === "string" ? JSON.parse(dates) : dates;
        } catch {
          parsedDates = [];
        }
      }
      return {
        id: eventId,
        title: record.get("title"),
        startDate: record.get("startDate"), // Keep for backward compatibility
        startTime: record.get("startTime") || undefined,
        endTime: record.get("endTime") || undefined,
        dates: Array.isArray(parsedDates) ? parsedDates : undefined,
        eventType: eventTypeLabel
          ? getEventTypeFromLabel(eventTypeLabel) || "Other"
          : "Other",
        poster: record.get("poster") || null,
        styles: eventStylesMap.get(eventId) || [],
      };
    });

    // Get workshops in this city
    const workshopsResult = await session.run(
      `MATCH (c:City {id: $cityId})<-[:IN]-(w:Workshop)
       OPTIONAL MATCH (wPoster:Image)-[:POSTER_OF]->(w)
       RETURN w.id as id, w.title as title, w.startDate as startDate,
              w.startTime as startTime, w.endTime as endTime,
              CASE WHEN wPoster IS NOT NULL THEN {
                id: wPoster.id,
                title: wPoster.title,
                url: wPoster.url,
                type: wPoster.type
              } ELSE null END as poster`,
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

    // Convert workshops to CalendarEventData format and add to events array
    const workshopEvents: CalendarEventData[] = workshopsResult.records.map(
      (record) => {
        const workshopId = record.get("id");
        const workshopStyles = workshopStylesMap.get(workshopId) || [];
        const videoStyles = workshopVideoStylesMap.get(workshopId) || [];
        const allStyles = Array.from(
          new Set([...workshopStyles, ...videoStyles])
        );

        return {
          id: workshopId,
          title: record.get("title"),
          startDate: record.get("startDate"),
          startTime: record.get("startTime") || undefined,
          endTime: record.get("endTime") || undefined,
          dates: undefined, // Workshops use single date
          eventType: "Workshop" as EventType,
          poster: record.get("poster") || null,
          styles: allStyles,
        };
      }
    );

    // Build workshops array for backward compatibility
    const workshops: CalendarWorkshopData[] = workshopsResult.records.map(
      (record) => {
        const workshopId = record.get("id");
        const workshopStyles = workshopStylesMap.get(workshopId) || [];
        const videoStyles = workshopVideoStylesMap.get(workshopId) || [];
        const allStyles = Array.from(
          new Set([...workshopStyles, ...videoStyles])
        );

        return {
          id: workshopId,
          title: record.get("title"),
          startDate: record.get("startDate"),
          startTime: record.get("startTime") || undefined,
          endTime: record.get("endTime") || undefined,
          poster: record.get("poster") || null,
          styles: allStyles,
        };
      }
    );

    // Get sessions in this city
    const sessionsResult = await session.run(
      `MATCH (c:City {id: $cityId})<-[:IN]-(s:Session)
       OPTIONAL MATCH (sPoster:Image)-[:POSTER_OF]->(s)
       RETURN s.id as id, s.title as title, s.dates as dates,
              CASE WHEN sPoster IS NOT NULL THEN {
                id: sPoster.id,
                title: sPoster.title,
                url: sPoster.url,
                type: sPoster.type
              } ELSE null END as poster`,
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

    // Convert sessions to CalendarEventData format and add to events array
    const sessionEvents: CalendarEventData[] = sessionsResult.records.map(
      (record) => {
        const sessionId = record.get("id");
        const sessionStyles = sessionStylesMap.get(sessionId) || [];
        const videoStyles = sessionVideoStylesMap.get(sessionId) || [];
        const allStyles = Array.from(
          new Set([...sessionStyles, ...videoStyles])
        );

        const datesStr = record.get("dates") || "[]";
        let parsedDates: EventDate[] = [];
        try {
          parsedDates =
            typeof datesStr === "string" ? JSON.parse(datesStr) : datesStr;
        } catch {
          parsedDates = [];
        }

        return {
          id: sessionId,
          title: record.get("title"),
          startDate: parsedDates.length > 0 ? parsedDates[0].date : undefined,
          startTime:
            parsedDates.length > 0 ? parsedDates[0].startTime : undefined,
          endTime: parsedDates.length > 0 ? parsedDates[0].endTime : undefined,
          dates:
            Array.isArray(parsedDates) && parsedDates.length > 0
              ? parsedDates
              : undefined,
          eventType: "Session" as EventType,
          poster: record.get("poster") || null,
          styles: allStyles,
        };
      }
    );

    // Build sessions array for backward compatibility
    const sessions: CalendarSessionData[] = sessionsResult.records.map(
      (record) => {
        const sessionId = record.get("id");
        const sessionStyles = sessionStylesMap.get(sessionId) || [];
        const videoStyles = sessionVideoStylesMap.get(sessionId) || [];
        const allStyles = Array.from(
          new Set([...sessionStyles, ...videoStyles])
        );

        return {
          id: sessionId,
          title: record.get("title"),
          dates: record.get("dates") || "[]", // JSON string
          poster: record.get("poster") || null,
          styles: allStyles,
        };
      }
    );

    await session.close();

    // Merge all events into a single array
    const allEvents = [...events, ...workshopEvents, ...sessionEvents];

    return {
      events: allEvents, // All events including workshops and sessions
      workshops, // Kept for backward compatibility
      sessions, // Kept for backward compatibility
    };
  } catch (error) {
    console.error("Error fetching city schedule:", error);
    await session.close();
    return null;
  }
};

export const searchEvents = async (
  keyword?: string
): Promise<Array<{ id: string; title: string }>> => {
  const session = driver.session();

  try {
    let query = `MATCH (e:Event)
                 WHERE (e.status = 'visible' OR e.status IS NULL)`;
    const params: SearchParams = {};

    if (keyword && keyword.trim()) {
      query += ` AND toLower(e.title) CONTAINS toLower($keyword)`;
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
    const params: SearchParams & { userId: string } = { userId };

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
