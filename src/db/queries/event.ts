import driver from "../driver";
import {
  Event,
  Section,
  Bracket,
  Video,
  SubEvent,
  EventCard,
} from "../../types/event";
import { Workshop } from "../../types/workshop";
import { UserSearchItem } from "../../types/user";
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
  taggedWinners: UserSearchItem[];
  taggedDancers: UserSearchItem[];
}

interface SectionVideoUserRecord {
  sectionId: string;
  videoId: string;
  taggedWinners: UserSearchItem[];
  taggedDancers: UserSearchItem[];
}

export const getEvent = async (id: string): Promise<Event> => {
  const session = driver.session();

  // Get main event data
  const eventResult = await session.run(
    `
    MATCH (e:Event {id: $id})
    OPTIONAL MATCH (e)-[:IN]->(c:City)
    OPTIONAL MATCH (poster:Picture)-[:POSTER]->(e)
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
        url: poster.url,
        type: poster.type
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

  // Get roles
  const validRoleFormats = getNeo4jRoleFormats();
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
        username: user.username
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
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)
    RETURN s.id as sectionId, b.id as bracketId, collect({
      id: v.id,
      title: v.title,
      src: v.src
    }) as videos
  `,
    { id }
  );

  // Get tagged users for bracket videos using relationship types - separate winners and dancers
  const bracketVideoUsersResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)
    OPTIONAL MATCH (v)<-[:WINNER]-(winner:User)
    OPTIONAL MATCH (v)<-[:DANCER]-(dancer:User)
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
         }) as allDancers
    WITH s, b, v,
         [w in allWinners WHERE w.id IS NOT NULL] as winners,
         [d in allDancers WHERE d.id IS NOT NULL] as dancers
    WHERE size(winners) > 0 OR size(dancers) > 0
    RETURN s.id as sectionId, b.id as bracketId, v.id as videoId, 
           winners as taggedWinners,
           dancers as taggedDancers
  `,
    { id }
  );

  // Get tagged users for direct section videos using relationship types - separate winners and dancers
  const sectionVideoUsersResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)<-[:IN]-(v:Video)
    OPTIONAL MATCH (v)<-[:WINNER]-(winner:User)
    OPTIONAL MATCH (v)<-[:DANCER]-(dancer:User)
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
         }) as allDancers
    WITH s, v,
         [w in allWinners WHERE w.id IS NOT NULL] as winners,
         [d in allDancers WHERE d.id IS NOT NULL] as dancers
    WHERE size(winners) > 0 OR size(dancers) > 0
    RETURN s.id as sectionId, v.id as videoId, 
           winners as taggedWinners,
           dancers as taggedDancers
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
      username: u.username
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
      taggedWinners: record.get("taggedWinners") || [],
      taggedDancers: record.get("taggedDancers") || [],
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
      if (userData) {
        video.taggedWinners = userData.get("taggedWinners") || [];
        video.taggedDancers = userData.get("taggedDancers") || [];
      } else {
        video.taggedWinners = [];
        video.taggedDancers = [];
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
          if (userData) {
            video.taggedWinners = userData.taggedWinners;
            video.taggedDancers = userData.taggedDancers;
          } else {
            video.taggedWinners = [];
            video.taggedDancers = [];
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

  // Get sub events
  const subEventsResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:PART_OF]-(se:SubEvent)
    OPTIONAL MATCH (sePoster:Picture)-[:POSTER]->(se)
    
    RETURN collect({
      id: se.id,
      title: se.title,
      description: se.description,
      schedule: se.schedule,
      startDate: se.startDate,
      address: se.address,
      startTime: se.startTime,
      endTime: se.endTime,
      poster: sePoster {
        id: sePoster.id,
        title: sePoster.title,
        url: sePoster.url,
        type: sePoster.type
      }
    }) as subEvents
  `,
    { id }
  );

  // Get gallery
  const galleryResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:PHOTO]-(galleryPic:Picture)
    RETURN collect(galleryPic {
      id: galleryPic.id,
      title: galleryPic.title,
      url: galleryPic.url,
      type: galleryPic.type
    }) as gallery
  `,
    { id }
  );

  // Get workshops basic info
  const workshopsResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(w:Workshop)
    OPTIONAL MATCH (wPoster:Picture)-[:POSTER]->(w)
    OPTIONAL MATCH (w)-[:IN]->(c:City)
    OPTIONAL MATCH (creator:User)-[:CREATED]->(w)
    
    RETURN collect({
      id: w.id,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      title: w.title,
      description: w.description,
      schedule: w.schedule,
      startDate: w.startDate,
      address: w.address,
      startTime: w.startTime,
      endTime: w.endTime,
      cost: w.cost,
      creatorId: creator.id,
      poster: wPoster {
        id: wPoster.id,
        title: wPoster.title,
        url: wPoster.url,
        type: wPoster.type
      },
      city: c {
        id: c.id,
        name: c.name,
        countryCode: c.countryCode,
        region: c.region,
        population: c.population,
        timezone: c.timezone
      }
    }) as workshops
  `,
    { id }
  );

  // Get workshop roles
  const workshopRolesResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(w:Workshop)<-[roleRel]-(user:User)
    WHERE type(roleRel) IN $validRoles
    RETURN w.id as workshopId, collect({
      id: type(roleRel),
      title: type(roleRel),
      user: user {
        id: user.id,
        displayName: user.displayName,
        username: user.username
      }
    }) as roles
  `,
    { id, validRoles: WORKSHOP_ROLES }
  );

  // Get workshop videos (workshops don't have dancer/winner tags)
  const workshopVideosResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(w:Workshop)<-[:IN]-(v:Video)
    WITH w.id as workshopId, collect({
      id: v.id,
      title: v.title,
      src: v.src,
      taggedDancers: []
    }) as videos
    RETURN workshopId, videos
  `,
    { id }
  );

  // Get workshop video styles
  const workshopVideoStylesResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(w:Workshop)<-[:IN]-(v:Video)-[:STYLE]->(style:Style)
    RETURN w.id as workshopId, v.id as videoId, collect(style.name) as styles
  `,
    { id }
  );

  // Get workshop gallery
  const workshopGalleryResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(w:Workshop)<-[:PHOTO]-(galleryPic:Picture)
    RETURN w.id as workshopId, collect(galleryPic {
      id: galleryPic.id,
      title: galleryPic.title,
      url: galleryPic.url,
      type: galleryPic.type
    }) as gallery
  `,
    { id }
  );

  session.close();

  const event = eventResult.records[0]?.get("event");
  const roles = rolesResult.records[0]?.get("roles") || [];
  const subEvents = subEventsResult.records[0]?.get("subEvents") || [];
  const gallery = galleryResult.records[0]?.get("gallery") || [];
  const workshops = workshopsResult.records[0]?.get("workshops") || [];

  // Check if event exists
  if (!event) {
    throw new Error(`Event with id ${id} not found`);
  }

  // Create maps for workshop data
  const workshopRolesMap = new Map<string, any[]>();
  workshopRolesResult.records.forEach((record) => {
    workshopRolesMap.set(record.get("workshopId"), record.get("roles") || []);
  });

  const workshopVideosMap = new Map<string, any[]>();
  workshopVideosResult.records.forEach((record) => {
    workshopVideosMap.set(record.get("workshopId"), record.get("videos") || []);
  });

  const workshopVideoStylesMap = new Map<string, string[]>();
  workshopVideoStylesResult.records.forEach((record) => {
    const key = `${record.get("workshopId")}:${record.get("videoId")}`;
    workshopVideoStylesMap.set(key, record.get("styles") || []);
  });

  const workshopGalleryMap = new Map<string, any[]>();
  workshopGalleryResult.records.forEach((record) => {
    workshopGalleryMap.set(
      record.get("workshopId"),
      record.get("gallery") || []
    );
  });

  // Convert subEvent dates to MM/DD/YYYY format
  const formattedSubEvents = subEvents.map((subEvent: SubEvent) => ({
    ...subEvent,
    startDate: subEvent.startDate,
  }));

  // Format workshops with all data
  const formattedWorkshops: Workshop[] = workshops.map((w: any) => {
    const workshopId = w.id;
    const roles = workshopRolesMap.get(workshopId) || [];
    const videos = (workshopVideosMap.get(workshopId) || []).map(
      (video: Video) => {
        const styleKey = `${workshopId}:${video.id}`;
        return {
          ...video,
          styles: workshopVideoStylesMap.get(styleKey) || [],
          taggedWinners: [], // Workshops don't have winners
        };
      }
    );
    const gallery = workshopGalleryMap.get(workshopId) || [];

    return {
      id: workshopId,
      createdAt: w.createdAt ? new Date(w.createdAt) : new Date(),
      updatedAt: w.updatedAt ? new Date(w.updatedAt) : new Date(),
      workshopDetails: {
        title: w.title,
        description: w.description,
        schedule: w.schedule,
        startDate: w.startDate,
        address: w.address,
        startTime: w.startTime,
        endTime: w.endTime,
        cost: w.cost,
        creatorId: w.creatorId || "",
        poster: w.poster,
        city: w.city,
      },
      roles,
      videos,
      gallery,
      associatedEventId: id,
    };
  });

  return {
    ...event,
    eventDetails: {
      title: event.title,
      description: event.description,
      address: event.address,
      prize: event.prize,
      entryCost: event.entryCost,
      startDate: event.startDate,
      startTime: event.startTime,
      endTime: event.endTime,
      schedule: event.schedule,
      creatorId: event.creatorId,
      poster: event.poster,
      city: event.city,
    },
    roles,
    sections,
    subEvents: formattedSubEvents,
    workshops: formattedWorkshops,
    gallery,
  };
};

// Helper function to create subevents
const createSubEvents = async (eventId: string, subEvents: any[]) => {
  if (subEvents.length === 0) return;
  const session = driver.session();
  try {
    for (const sub of subEvents) {
      await session.run(
        `MATCH (e:Event {id: $eventId})
         MERGE (se:SubEvent {id: $subEventId})
         ON CREATE SET
           se.title = $title,
           se.description = $description,
           se.schedule = $schedule,
           se.startDate = $startDate,
           se.address = $address,
           se.startTime = $startTime,
           se.endTime = $endTime
         ON MATCH SET
           se.title = $title,
           se.description = $description,
           se.schedule = $schedule,
           se.startDate = $startDate,
           se.address = $address,
           se.startTime = $startTime,
           se.endTime = $endTime
         MERGE (se)-[:PART_OF]->(e)`,
        {
          eventId,
          subEventId: sub.id,
          title: sub.title,
          description: sub.description,
          schedule: sub.schedule,
          startDate: sub.startDate,
          address: sub.address,
          startTime: sub.startTime,
          endTime: sub.endTime,
        }
      );
    }
  } finally {
    await session.close();
  }
};

// Helper function to create subevent posters
const createSubEventPosters = async (subEvents: any[]) => {
  const subEventsWithPosters = subEvents.filter((sub) => sub.poster?.id);
  if (subEventsWithPosters.length === 0) return;

  const session = driver.session();
  try {
    for (const sub of subEventsWithPosters) {
      await session.run(
        `MATCH (se:SubEvent {id: $subEventId})
         OPTIONAL MATCH (oldPoster:Picture)-[r:POSTER]->(se)
         DELETE r
         WITH se
         MERGE (p:Picture {id: $posterId})
         ON CREATE SET
           p.title = $title,
           p.url = $url,
           p.type = 'poster'
         ON MATCH SET
           p.title = $title,
           p.url = $url
         MERGE (p)-[:POSTER]->(se)`,
        {
          subEventId: sub.id,
          posterId: sub.poster.id,
          title: sub.poster.title,
          url: sub.poster.url,
        }
      );
    }
  } finally {
    await session.close();
  }
};

// Helper function to create gallery photos
const createGalleryPhotos = async (eventId: string, gallery: any[]) => {
  if (gallery.length === 0) return;
  const session = driver.session();
  try {
    for (const pic of gallery) {
      await session.run(
        `MATCH (e:Event {id: $eventId})
         MERGE (p:Picture {id: $picId})
         ON CREATE SET
           p.title = $title,
           p.url = $url,
           p.type = 'photo'
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
          await session.run(
            `MATCH (b:Bracket {id: $bracketId})
             MERGE (v:Video {id: $videoId})
             ON CREATE SET
               v.title = $title,
               v.src = $src
             ON MATCH SET
               v.title = $title,
               v.src = $src
             MERGE (v)-[:IN]->(b)`,
            {
              bracketId: br.id,
              videoId: vid.id,
              title: vid.title,
              src: vid.src,
            }
          );

          // Link tagged users
          for (const user of vid.taggedUsers || []) {
            const userId = await getUserIdFromUserSearchItem(user);
            await session.run(
              `MATCH (v:Video {id: $videoId})
               MERGE (u:User {id: $userId})
               MERGE (u)-[:IN]->(v)`,
              { videoId: vid.id, userId }
            );
          }

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
        await session.run(
          `MATCH (s:Section {id: $sectionId})
           MERGE (v:Video {id: $videoId})
           ON CREATE SET
             v.title = $title,
             v.src = $src
           ON MATCH SET
             v.title = $title,
             v.src = $src
           MERGE (v)-[:IN]->(s)`,
          { sectionId: sec.id, videoId: vid.id, title: vid.title, src: vid.src }
        );

        // Link tagged users
        for (const user of vid.taggedUsers || []) {
          const userId = await getUserIdFromUserSearchItem(user);
          await session.run(
            `MATCH (v:Video {id: $videoId})
             MERGE (u:User {id: $userId})
             MERGE (u)-[:IN]->(v)`,
            { videoId: vid.id, userId }
          );
        }

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

export const insertEvent = async (event: Event) => {
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

  const result = await session.run(
    `
MERGE (e:Event {id: $eventId})
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
OPTIONAL MATCH (oldPoster:Picture)-[r:POSTER]->(e)
DELETE r
WITH e
// Create or merge poster only if poster exists
FOREACH (poster IN CASE WHEN $poster IS NOT NULL AND $poster.id IS NOT NULL THEN [$poster] ELSE [] END |
  MERGE (newPoster:Picture {id: poster.id})
  ON CREATE SET
    newPoster.title = poster.title,
    newPoster.url = poster.url,
    newPoster.type = 'poster'
  ON MATCH SET
    newPoster.title = poster.title,
    newPoster.url = poster.url
  MERGE (newPoster)-[:POSTER]->(e)
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
  CALL apoc.merge.relationship(u, toUpper(roleData.title), {}, {}, e) YIELD rel
  RETURN count(rel) AS roleCount
}

WITH e
RETURN e as event
`,
    {
      eventId: event.id,
      creatorId: event.eventDetails.creatorId,
      title: event.eventDetails.title,
      description: event.eventDetails.description,
      address: event.eventDetails.address,
      prize: event.eventDetails.prize,
      entryCost: event.eventDetails.entryCost,
      startDate: event.eventDetails.startDate,
      startTime: event.eventDetails.startTime,
      endTime: event.eventDetails.endTime,
      schedule: event.eventDetails.schedule,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      poster: event.eventDetails.poster,
      city: event.eventDetails.city,
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

  const eventNode = result.records[0].get("event");
  if (!eventNode) {
    await session.close();
    throw new Error(
      `Failed to create event ${event.id}: Event node not found in result`
    );
  }

  await session.close();

  // Create subevents, gallery, sections, brackets, and videos in separate queries
  await createSubEvents(event.id, event.subEvents);
  await createSubEventPosters(event.subEvents);
  await createGalleryPhotos(event.id, event.gallery);
  await createSections(event.id, event.sections);
  await createBrackets(event.sections);
  await createBracketVideos(event.sections);
  await createSectionVideos(event.sections);

  return eventNode.properties;
};

export const getEventSections = async (id: string) => {
  const session = driver.session();

  // Get event title
  const eventResult = await session.run(
    `
    MATCH (e:Event {id: $id})
    RETURN e.title as title
  `,
    { id }
  );

  // Get sections with full video and bracket data
  const sectionsResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)
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
        src: v.src
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
      src: v.src
    }) as videos
  `,
    { id }
  );

  // Get tagged users for all videos in sections using relationship types - separate winners and dancers
  const sectionVideoUsersResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)<-[:IN]-(v:Video)
    OPTIONAL MATCH (v)<-[:WINNER]-(winner:User)
    OPTIONAL MATCH (v)<-[:DANCER]-(dancer:User)
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
         }) as allDancers
    WITH s, v,
         [w in allWinners WHERE w.id IS NOT NULL] as winners,
         [d in allDancers WHERE d.id IS NOT NULL] as dancers
    WHERE size(winners) > 0 OR size(dancers) > 0
    RETURN s.id as sectionId, v.id as videoId, 
           winners as taggedWinners,
           dancers as taggedDancers
  `,
    { id }
  );

  // Get tagged users for bracket videos using relationship types - separate winners and dancers
  const bracketVideoUsersResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)
    OPTIONAL MATCH (v)<-[:WINNER]-(winner:User)
    OPTIONAL MATCH (v)<-[:DANCER]-(dancer:User)
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
         }) as allDancers
    WITH s, b, v,
         [w in allWinners WHERE w.id IS NOT NULL] as winners,
         [d in allDancers WHERE d.id IS NOT NULL] as dancers
    WHERE size(winners) > 0 OR size(dancers) > 0
    RETURN s.id as sectionId, b.id as bracketId, v.id as videoId, 
           winners as taggedWinners,
           dancers as taggedDancers
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

  // Get section winners using :WINNER relationship type
  const sectionWinnersResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)<-[r:WINNER]-(u:User)
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
        taggedWinners: record.get("taggedWinners") || [],
        taggedDancers: record.get("taggedDancers") || [],
      })
    );

  const bracketVideoUsers = bracketVideoUsersResult.records.map(
    (record): BracketVideoUserRecord => ({
      sectionId: record.get("sectionId"),
      bracketId: record.get("bracketId"),
      videoId: record.get("videoId"),
      taggedWinners: record.get("taggedWinners") || [],
      taggedDancers: record.get("taggedDancers") || [],
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
      return {
        ...video,
        taggedWinners: userData?.taggedWinners || [],
        taggedDancers: userData?.taggedDancers || [],
        styles: sectionVideoStylesMap.get(styleKey) || [],
      };
    });

    // Add videos and tagged users to brackets
    section.brackets.forEach((bracket: Bracket) => {
      const bracketVideoData = bracketVideos.find(
        (bv) => bv.sectionId === section.id && bv.bracketId === bracket.id
      );
      if (bracketVideoData) {
        // Create new video objects with taggedWinners/taggedDancers and styles to avoid mutating Neo4j objects
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
            styles: bracketVideoStylesMap.get(styleKey) || [],
          };
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

  console.log(sectionId, eventId);

  try {
    // Get section by UUID directly, optionally verify it belongs to the event
    const sectionResult = await session.run(
      `
      MATCH (s:Section {id: $sectionId})-[:IN]->(e:Event {id: $eventId})
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
          src: v.src
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
           }) as allDancers
      WITH s, v,
           [w in allWinners WHERE w.id IS NOT NULL] as winners,
           [d in allDancers WHERE d.id IS NOT NULL] as dancers
      WHERE size(winners) > 0 OR size(dancers) > 0
      RETURN s.id as sectionId, v.id as videoId, 
             winners as taggedWinners,
             dancers as taggedDancers
    `,
      { sectionId }
    );

    // Get tagged users for bracket videos
    const bracketVideoUsersResult = await session.run(
      `
      MATCH (s:Section {id: $sectionId})<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)
      OPTIONAL MATCH (v)<-[:WINNER]-(winner:User)
      OPTIONAL MATCH (v)<-[:DANCER]-(dancer:User)
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
           }) as allDancers
      WITH s, b, v,
           [w in allWinners WHERE w.id IS NOT NULL] as winners,
           [d in allDancers WHERE d.id IS NOT NULL] as dancers
      WHERE size(winners) > 0 OR size(dancers) > 0
      RETURN s.id as sectionId, b.id as bracketId, v.id as videoId, 
             winners as taggedWinners,
             dancers as taggedDancers
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
          taggedWinners: record.get("taggedWinners") || [],
          taggedDancers: record.get("taggedDancers") || [],
        })
      );

    const bracketVideoUsers = bracketVideoUsersResult.records.map(
      (record): BracketVideoUserRecord => ({
        sectionId: record.get("sectionId"),
        bracketId: record.get("bracketId"),
        videoId: record.get("videoId"),
        taggedWinners: record.get("taggedWinners") || [],
        taggedDancers: record.get("taggedDancers") || [],
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

export const EditEvent = async (event: Event) => {
  const { id, eventDetails } = event;

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

  try {
    // Start transaction
    const tx = session.beginTransaction();

    // Update event properties
    await tx.run(
      `MATCH (e:Event {id: $id})
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
        schedule: eventDetails.schedule,
      }
    );

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
         c.population = $city.population,
         c.timezone = $city.timezone
       ON MATCH SET
         c.population = $city.population
       MERGE (e)-[:IN]->(c)`,
      { id, city: eventDetails.city }
    );

    // Update poster
    await tx.run(
      `MATCH (e:Event {id: $id})
       OPTIONAL MATCH (oldPoster:Picture)-[r:POSTER]->(e)
       DETACH DELETE oldPoster
       WITH e
       FOREACH (poster IN CASE WHEN $poster IS NOT NULL THEN [$poster] ELSE [] END |
         MERGE (newPoster:Picture { id: poster.id, title: poster.title, url: poster.url, type: poster.type })
         MERGE (newPoster)-[:POSTER]->(e)
       )`,
      { id, poster: eventDetails.poster }
    );

    // Update roles
    await tx.run(
      `MATCH (e:Event {id: $id})
       UNWIND $roles AS roleData
       MERGE (u:User { id: roleData.user.id })
       WITH u, e, roleData
       CALL apoc.merge.relationship(u, toUpper(roleData.title), {}, {}, e)
       YIELD rel
       RETURN e, u
       `,
      { id, roles: event.roles }
    );

    // Delete roles not in the new list
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (u:User)-[r]->(e)
       WHERE NOT u.id IN [role IN $roles | role.user.id]
       DELETE r`,
      { id, roles: event.roles }
    );

    // Update sub events
    await tx.run(
      `MATCH (e:Event {id: $id})
       // First, remove all existing poster relationships for subevents
       OPTIONAL MATCH (se:SubEvent)-[:PART_OF]->(e)
       OPTIONAL MATCH (oldPoster:Picture)-[r:POSTER]->(se)
       DELETE r
       
       WITH e
       FOREACH (sub IN $subEvents |
         MERGE (se:SubEvent { id: sub.id })
         ON CREATE SET 
           se.title = sub.title,
           se.description = sub.description,
           se.schedule = sub.schedule,
           se.startDate = sub.startDate,
           se.address = sub.address,
           se.startTime = sub.startTime,
           se.endTime = sub.endTime
         ON MATCH SET 
           se.title = sub.title,
           se.description = sub.description,
           se.schedule = sub.schedule,
           se.startDate = sub.startDate,
           se.address = sub.address,
           se.startTime = sub.startTime,
           se.endTime = sub.endTime
         MERGE (se)-[:PART_OF]->(e)

         FOREACH (poster IN CASE WHEN sub.poster IS NOT NULL THEN [sub.poster] ELSE [] END |
           MERGE (subPic:Picture { id: poster.id, title: poster.title, url: poster.url, type: poster.type })
           MERGE (subPic)-[:POSTER]->(se)
         )
       )`,
      { id, subEvents: event.subEvents }
    );

    // Clean up orphaned poster nodes that are no longer connected to any subevents
    await tx.run(
      `MATCH (p:Picture)
       WHERE p.type = 'poster' AND NOT (p)--()
       DELETE p`
    );

    // Delete sub events not in the new list
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (se:SubEvent)-[:PART_OF]->(e)
       WHERE NOT se.id IN [sub IN $subEvents | sub.id]
       DETACH DELETE se`,
      { id, subEvents: event.subEvents }
    );

    // Delete all user-video relationships
    await tx.run(
      `MATCH (e:Event {id: $id})
       OPTIONAL MATCH (e)<-[:IN]-(s:Section)<-[:IN]-(v:Video)<-[r:IN]-(u:User)
       DELETE r`,
      { id }
    );

    await tx.run(
      `MATCH (e:Event {id: $id})
       OPTIONAL MATCH (e)<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)<-[r:IN]-(u:User)
       DELETE r`,
      { id }
    );

    // Delete all existing style relationships for sections and videos
    await tx.run(
      `MATCH (e:Event {id: $id})
       OPTIONAL MATCH (e)<-[:IN]-(s:Section)-[rs:STYLE]->(:Style)
       DELETE rs`,
      { id }
    );

    await tx.run(
      `MATCH (e:Event {id: $id})
       OPTIONAL MATCH (e)<-[:IN]-(s:Section)<-[:IN]-(v:Video)-[rv:STYLE]->(:Style)
       DELETE rv`,
      { id }
    );

    await tx.run(
      `MATCH (e:Event {id: $id})
       OPTIONAL MATCH (e)<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)-[rv:STYLE]->(:Style)
       DELETE rv`,
      { id }
    );

    // Update sections
    await tx.run(
      `MATCH (e:Event {id: $id})
       FOREACH (sec IN $sections |
         MERGE (s:Section { id: sec.id })
         ON MATCH SET
           s.title = sec.title,
           s.description = sec.description,
           s.applyStylesToVideos = COALESCE(sec.applyStylesToVideos, false)
         ON CREATE SET
           s.applyStylesToVideos = COALESCE(sec.applyStylesToVideos, false)
         MERGE (s)-[:IN]->(e)
       )`,
      { id, sections: event.sections }
    );

    // Create section style relationships (only if applyStylesToVideos is true)
    for (const sec of event.sections) {
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
      { id, sections: event.sections }
    );

    // Cascade delete direct section videos if section hasBrackets is true
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (vid:Video)-[:IN]->(s:Section)-[:IN]->(e)
       WHERE ANY(sec IN $sections WHERE sec.id = s.id AND sec.hasBrackets = true)
       DETACH DELETE vid`,
      { id, sections: event.sections }
    );

    // Handle sections with brackets (hasBrackets = true)
    // First create sections
    await tx.run(
      `MATCH (e:Event {id: $id})
       UNWIND [s IN $sections WHERE s.hasBrackets = true] AS sec
       MERGE (s:Section {id: sec.id})
       MERGE (s)-[:IN]->(e)`,
      { id, sections: event.sections }
    );

    // Then create brackets
    for (const sec of event.sections) {
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
    for (const sec of event.sections) {
      if (sec.hasBrackets && sec.brackets) {
        for (const br of sec.brackets) {
          if (br.videos) {
            for (const bvid of br.videos) {
              await tx.run(
                `MATCH (b:Bracket {id: $bracketId})
                 MERGE (bv:Video { id: $videoId })
                 ON CREATE SET
                   bv.title = $title,
                   bv.src = $src
                 ON MATCH SET
                   bv.title = $title,
                   bv.src = $src
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
    for (const sec of event.sections) {
      if (sec.hasBrackets && sec.brackets) {
        for (const br of sec.brackets) {
          if (br.videos) {
            for (const bvid of br.videos) {
              const taggedUsers = [
                ...(bvid.taggedWinners || []),
                ...(bvid.taggedDancers || []),
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
    for (const sec of event.sections) {
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
      { id, sections: event.sections }
    );

    // Then create videos
    for (const sec of event.sections) {
      if (!sec.hasBrackets && sec.videos) {
        for (const vid of sec.videos) {
          await tx.run(
            `MATCH (e:Event {id: $id})<-[:IN]-(s:Section {id: $sectionId})
             MERGE (v:Video { id: $videoId })
             ON CREATE SET
               v.title = $title,
               v.src = $src
             ON MATCH SET
               v.title = $title,
               v.src = $src
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
    for (const sec of event.sections) {
      if (!sec.hasBrackets && sec.videos) {
        for (const vid of sec.videos) {
          const taggedUsers = [
            ...(vid.taggedWinners || []),
            ...(vid.taggedDancers || []),
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
    for (const sec of event.sections) {
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
      { id, sections: event.sections }
    );

    // Delete brackets not in the new list
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (b:Bracket)-[:IN]->(s:Section)-[:IN]->(e)
       WHERE NOT ANY(sec IN $sections WHERE ANY(br IN sec.brackets WHERE br.id = b.id))
       DETACH DELETE b`,
      { id, sections: event.sections }
    );

    // Delete videos not in the new list (but preserve user nodes)
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (v:Video)-[:IN]->(s:Section)-[:IN]->(e)
       WHERE NOT ANY(sec IN $sections WHERE ANY(vid IN sec.videos WHERE vid.id = v.id))
       DETACH DELETE v`,
      { id, sections: event.sections }
    );

    // Delete videos in brackets not in the new list (but preserve user nodes)
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (v:Video)-[:IN]->(b:Bracket)-[:IN]->(s:Section)-[:IN]->(e)
       WHERE NOT ANY(sec IN $sections WHERE ANY(br IN sec.brackets WHERE ANY(vid IN br.videos WHERE vid.id = v.id)))
       DETACH DELETE v`,
      { id, sections: event.sections }
    );

    // Update workshops
    if (event.workshops && event.workshops.length > 0) {
      for (const workshop of event.workshops) {
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
           OPTIONAL MATCH (oldPoster:Picture)-[r:POSTER]->(w)
           DELETE r
           WITH w
           FOREACH (poster IN CASE WHEN $poster IS NOT NULL AND $poster.id IS NOT NULL THEN [$poster] ELSE [] END |
             MERGE (newPoster:Picture {id: poster.id})
             ON CREATE SET
               newPoster.title = poster.title,
               newPoster.url = poster.url,
               newPoster.type = 'poster'
             ON MATCH SET
               newPoster.title = poster.title,
               newPoster.url = poster.url
             MERGE (newPoster)-[:POSTER]->(w)
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

          if (validRoles.length > 0) {
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
              { workshopId: workshop.id, roles: validRoles }
            );

            // Delete roles not in the new list
            await tx.run(
              `MATCH (w:Workshop {id: $workshopId})
               MATCH (u:User)-[r]->(w)
               WHERE type(r) IN ['ORGANIZER', 'TEACHER'] AND NOT u.id IN [role IN $roles WHERE role.user.id IS NOT NULL | role.user.id]
               DELETE r`,
              { workshopId: workshop.id, roles: validRoles }
            );
          } else {
            // If no valid roles, remove all existing roles
            await tx.run(
              `MATCH (w:Workshop {id: $workshopId})
               MATCH (u:User)-[r]->(w)
               WHERE type(r) IN ['ORGANIZER', 'TEACHER']
               DELETE r`,
              { workshopId: workshop.id }
            );
          }
        } else {
          // Remove all roles if none provided
          await tx.run(
            `MATCH (w:Workshop {id: $workshopId})
             MATCH (u:User)-[r]->(w)
             WHERE type(r) IN ['ORGANIZER', 'TEACHER']
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
             MERGE (g:Picture { id: pic.id, title: pic.title, url: pic.url, type: pic.type })
             MERGE (g)-[:PHOTO]->(w)
           )`,
          { workshopId: workshop.id, gallery: workshop.gallery }
        );

        // Delete gallery items not in the new list
        await tx.run(
          `MATCH (w:Workshop {id: $workshopId})
           MATCH (g:Picture)-[:PHOTO]->(w)
           WHERE NOT g.id IN [pic IN $gallery | pic.id]
           DETACH DELETE g`,
          { workshopId: workshop.id, gallery: workshop.gallery }
        );
      }
    }

    // Remove workshop relationships (not delete workshops) for workshops not in the new list
    await tx.run(
      `MATCH (e:Event {id: $id})<-[r:IN]-(w:Workshop)
       WHERE NOT w.id IN [workshop IN $workshops | workshop.id]
       DELETE r`,
      { id, workshops: event.workshops || [] }
    );

    // Update gallery
    await tx.run(
      `MATCH (e:Event {id: $id})
       FOREACH (pic IN $gallery |
         MERGE (g:Picture { id: pic.id, title: pic.title, url: pic.url, type: pic.type })
         MERGE (g)-[:PHOTO]->(e)
       )`,
      { id, gallery: event.gallery }
    );

    // Delete gallery items not in the new list
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (g:Picture)-[:PHOTO]->(e)
       WHERE NOT g.id IN [pic IN $gallery | pic.id]
       DETACH DELETE g`,
      { id, gallery: event.gallery }
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

export const deleteEvent = async (eventId: string) => {
  const session = driver.session();
  try {
    await session.run(
      `MATCH (e:Event {id: $id})
    OPTIONAL MATCH (e)<-[:POSTER|PHOTO]-(pic:Picture)
    OPTIONAL MATCH (e)<-[:PART_OF]-(se:SubEvent)<-[:POSTER]-(sePic:Picture)
    OPTIONAL MATCH (e)<-[:IN]-(s:Section)
    OPTIONAL MATCH (s)<-[:IN]-(b:Bracket)
    OPTIONAL MATCH (s)<-[:IN]-(v1:Video)
    OPTIONAL MATCH (b)<-[:IN]-(v2:Video)
    
    DETACH DELETE pic, se, sePic, s, b, v1, v2, e
    
    RETURN count(*) as deletedNodes`,
      {
        id: eventId,
      }
    );
    await session.close();
    return true;
  } catch (error) {
    console.error("Error deleting event:", error);
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

export const getEvents = async (): Promise<EventCard[]> => {
  const session = driver.session();

  // Get events with basic info
  const eventsResult = await session.run(
    `MATCH (e:Event)-[:IN]->(c:City)
    OPTIONAL MATCH (e)<-[:POSTER]-(p:Picture)
    WITH DISTINCT e, c, p
    RETURN e.id as eventId, e.title as title, e.startDate as date, c.name as city, c.id as cityId, p.url as imageUrl`
  );

  // Get all styles for each event (from sections and videos)
  const stylesResult = await session.run(
    `MATCH (e:Event)
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
}

export const getStyleData = async (
  styleName: string
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
      OPTIONAL MATCH (poster:Picture)-[:POSTER]->(event)
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
      } as Video,
      eventId: record.get("eventId"),
      eventTitle: record.get("eventTitle"),
      sectionId: record.get("sectionId"),
      sectionTitle: record.get("sectionTitle"),
    }));

    return {
      styleName: normalizedStyleName,
      events,
      sections,
      videos,
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

//Gets all pictures including poster, gallery, and subevent posters
export const getEventPictures = async (eventId: string) => {
  const session = driver.session();
  const result = await session.run(
    `MATCH (e:Event {id: $eventId})
    OPTIONAL MATCH (e)<-[:POSTER]-(poster:Picture)
    OPTIONAL MATCH (e)<-[:PHOTO]-(gallery:Picture)
    OPTIONAL MATCH (e)<-[:PART_OF]-(se:SubEvent)<-[:POSTER]-(subEventPoster:Picture)

    RETURN poster, gallery, subEventPoster
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
    if (record.get("subEventPoster")?.properties["url"]) {
      pictures.push(record.get("subEventPoster").properties["url"]);
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
       OPTIONAL MATCH (poster:Picture)-[:POSTER]->(e)
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
