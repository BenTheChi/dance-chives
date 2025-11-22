import driver from "../driver";
import {
  Session,
  SessionCard,
  SessionRole,
  SessionDate,
} from "../../types/session";
import { UserSearchItem } from "../../types/user";
import { City } from "../../types/city";
import { Video } from "../../types/video";
import { Image } from "../../types/image";
import {
  getNeo4jRoleFormats,
  toNeo4jRoleFormat,
  isValidRole,
  AVAILABLE_ROLES,
} from "@/lib/utils/roles";
import { normalizeStyleNames } from "@/lib/utils/style-utils";
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

export const getSession = async (id: string): Promise<Session> => {
  const session = driver.session();

  // Get main session data
  const sessionResult = await session.run(
    `
    MATCH (s:Event:Session {id: $id})
    OPTIONAL MATCH (s)-[:IN]->(c:City)
    OPTIONAL MATCH (poster:Image)-[:POSTER_OF]->(s)
    OPTIONAL MATCH (creator:User)-[:CREATED]->(s)
    
    RETURN s {
      id: s.id,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      title: s.title,
      description: s.description,
      address: s.address,
      cost: s.cost,
      dates: s.dates,
      schedule: s.schedule,
      creatorId: creator.id
    } as session,
    poster.id as posterId,
    poster.title as posterTitle,
    poster.url as posterUrl,
    c.id as cityId,
    c.name as cityName,
    c.countryCode as cityCountryCode,
    c.region as cityRegion,
    c.population as cityPopulation,
    c.timezone as cityTimezone
  `,
    { id }
  );

  // Get parent event if this session is a subevent
  const parentEventResult = await session.run(
    `
    MATCH (s:Event:Session {id: $id})-[:SUBEVENT_OF]->(parent:Event)
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
    MATCH (s:Event:Event:Session {id: $id})<-[roleRel]-(user:User)
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

  // Get videos with their types determined from labels
  const videosResult = await session.run(
    `
    MATCH (s:Event:Session {id: $id})<-[:IN]-(v:Video)
    RETURN collect({
      id: v.id,
      title: v.title,
      src: v.src,
      type: CASE 
        WHEN 'Battle' IN labels(v) THEN 'battle'
        WHEN 'Freestyle' IN labels(v) THEN 'freestyle'
        WHEN 'Choreography' IN labels(v) THEN 'choreography'
        WHEN 'Class' IN labels(v) THEN 'class'
        ELSE 'freestyle'
      END
    }) as videos
  `,
    { id }
  );

  // Get tagged users for videos using relationship types - separate winners, dancers, choreographers, teachers
  const videoUsersResult = await session.run(
    `
    MATCH (s:Event:Session {id: $id})<-[:IN]-(v:Video)
    OPTIONAL MATCH (v)<-[:WINNER]-(winner:User)
    OPTIONAL MATCH (v)<-[:DANCER]-(dancer:User)
    OPTIONAL MATCH (v)<-[:CHOREOGRAPHER]-(choreographer:User)
    OPTIONAL MATCH (v)<-[:TEACHER]-(teacher:User)
    WITH v,
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
    WITH v,
         [w in allWinners WHERE w.id IS NOT NULL] as winners,
         [d in allDancers WHERE d.id IS NOT NULL] as dancers,
         [c in allChoreographers WHERE c.id IS NOT NULL] as choreographers,
         [t in allTeachers WHERE t.id IS NOT NULL] as teachers
    RETURN v.id as videoId, 
           winners as taggedWinners,
           dancers as taggedDancers,
           choreographers as taggedChoreographers,
           teachers as taggedTeachers
  `,
    { id }
  );

  // Get video styles
  const videoStylesResult = await session.run(
    `
    MATCH (s:Event:Session {id: $id})<-[:IN]-(v:Video)-[:STYLE]->(style:Style)
    RETURN v.id as videoId, collect(style.name) as styles
  `,
    { id }
  );

  // Get session styles
  const sessionStylesResult = await session.run(
    `
    MATCH (s:Event:Session {id: $id})-[:STYLE]->(style:Style)
    RETURN collect(style.name) as styles
  `,
    { id }
  );

  // Get gallery
  const galleryResult = await session.run(
    `
    MATCH (s:Event:Session {id: $id})<-[:PHOTO]-(galleryPic:Image:Gallery)
    WITH galleryPic
    RETURN collect({
      id: galleryPic.id,
      title: galleryPic.title,
      url: galleryPic.url
    }) as gallery
  `,
    { id }
  );

  // Get sub events - now using :SUBEVENT_OF relationship between Event nodes
  // Subevents can be any event type (Competition, Workshop, Session)
  const subEventsResult = await session.run(
    `
    MATCH (s:Event:Session {id: $id})
    OPTIONAL MATCH (subEvent:Event)-[:SUBEVENT_OF]->(s)
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

  session.close();

  const sessionRecord = sessionResult.records[0];
  const sessionData = sessionRecord?.get("session");
  const posterId = sessionRecord?.get("posterId");
  const cityId = sessionRecord?.get("cityId");
  const roles = rolesResult.records[0]?.get("roles") || [];
  const videos = videosResult.records[0]?.get("videos") || [];
  const videoUsers = videoUsersResult.records;
  const videoStyles = videoStylesResult.records;
  const sessionStyles = sessionStylesResult.records[0]?.get("styles") || [];
  const gallery = galleryResult.records[0]?.get("gallery") || [];
  const subEvents = subEventsResult.records[0]?.get("subEvents") || [];
  const parentEvent = parentEventResult.records[0]?.get("parentEvent") || null;

  // Check if session exists
  if (!sessionData) {
    throw new Error(`Session with id ${id} not found`);
  }

  // Construct poster object from individual fields
  const poster = posterId
    ? {
        id: posterId,
        title: sessionRecord?.get("posterTitle") || "",
        url: sessionRecord?.get("posterUrl") || "",
      }
    : null;

  // Construct city object from individual fields
  const city = cityId
    ? {
        id: cityId,
        name: sessionRecord?.get("cityName") || "",
        countryCode: sessionRecord?.get("cityCountryCode") || "",
        region: sessionRecord?.get("cityRegion") || "",
        population: sessionRecord?.get("cityPopulation") || 0,
        timezone: sessionRecord?.get("cityTimezone"),
      }
    : null;

  // Parse dates array from JSON string
  let dates: SessionDate[] = [];
  if (sessionData.dates) {
    try {
      dates =
        typeof sessionData.dates === "string"
          ? JSON.parse(sessionData.dates)
          : sessionData.dates;
    } catch (error) {
      console.error("Error parsing dates array:", error);
      dates = [];
    }
  }

  // Create maps for video users and styles
  const videoUsersMap = new Map<string, any>();
  videoUsers.forEach((record: any) => {
    videoUsersMap.set(record.get("videoId"), {
      taggedWinners: record.get("taggedWinners") || [],
      taggedDancers: record.get("taggedDancers") || [],
      taggedChoreographers: record.get("taggedChoreographers") || [],
      taggedTeachers: record.get("taggedTeachers") || [],
    });
  });

  const videoStylesMap = new Map<string, string[]>();
  videoStyles.forEach((record: any) => {
    videoStylesMap.set(record.get("videoId"), record.get("styles"));
  });

  // Merge videos with tagged users and styles
  const videosWithStyles = videos.map((video: Video) => {
    const userData = videoUsersMap.get(video.id);
    const videoType = video.type || "freestyle";

    const result: any = {
      ...video,
      styles: videoStylesMap.get(video.id) || [],
      taggedDancers: userData?.taggedDancers || [],
    };

    // Only include taggedWinners for battle videos
    if (videoType === "battle") {
      result.taggedWinners = userData?.taggedWinners || [];
    }

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

  return {
    ...sessionData,
    eventDetails: {
      title: sessionData.title,
      description: sessionData.description,
      address: sessionData.address,
      cost: sessionData.cost,
      dates: dates,
      schedule: sessionData.schedule,
      creatorId: sessionData.creatorId,
      parentEvent: parentEvent,
      poster: poster,
      city: city,
      styles: sessionStyles,
    },
    roles,
    videos: videosWithStyles,
    gallery,
    subEvents: subEvents.map((se: any) => ({
      id: se.id,
      title: se.title,
      type: se.type,
      imageUrl: se.poster?.url,
      date: se.startDate || "",
      city: se.city?.name || "",
      cityId: se.city?.id,
      styles: se.styles || [],
    })),
  };
};

export const getSessions = async (): Promise<SessionCard[]> => {
  const session = driver.session();

  const result = await session.run(
    `
    MATCH (s:Event:Session)
    OPTIONAL MATCH (s)-[:IN]->(c:City)
    OPTIONAL MATCH (poster:Image)-[:POSTER_OF]->(s)
    RETURN collect({
      id: s.id,
      title: s.title,
      dates: s.dates,
      cost: s.cost,
      city: c.name,
      cityId: c.id,
      imageUrl: poster.url
    }) as sessions
  `,
    {}
  );

  // Get session styles
  const sessionStylesResult = await session.run(
    `
    MATCH (s:Event:Session)-[:STYLE]->(style:Style)
    RETURN s.id as sessionId, collect(style.name) as styles
  `,
    {}
  );

  // Get video styles for sessions
  const videoStylesResult = await session.run(
    `
    MATCH (s:Event:Session)<-[:IN]-(v:Video)-[:STYLE]->(style:Style)
    WITH s.id as sessionId, collect(DISTINCT style.name) as styles
    RETURN sessionId, styles
  `,
    {}
  );

  session.close();

  const sessions = result.records[0]?.get("sessions") || [];

  // Create maps for styles
  const sessionStylesMap = new Map<string, string[]>();
  sessionStylesResult.records.forEach((record) => {
    sessionStylesMap.set(record.get("sessionId"), record.get("styles") || []);
  });

  const videoStylesMap = new Map<string, string[]>();
  videoStylesResult.records.forEach((record) => {
    videoStylesMap.set(record.get("sessionId"), record.get("styles") || []);
  });

  return sessions.map((s: any) => {
    // Parse dates array and extract first date
    let firstDate = "";
    if (s.dates) {
      try {
        const dates =
          typeof s.dates === "string" ? JSON.parse(s.dates) : s.dates;
        if (Array.isArray(dates) && dates.length > 0) {
          firstDate = dates[0].date || "";
        }
      } catch (error) {
        console.error("Error parsing dates array:", error);
      }
    }

    const sessionStyles = sessionStylesMap.get(s.id) || [];
    const videoStyles = videoStylesMap.get(s.id) || [];
    // Combine session styles and video styles, dedupe
    const allStyles = Array.from(new Set([...sessionStyles, ...videoStyles]));

    return {
      id: s.id,
      title: s.title,
      date: firstDate,
      cost: s.cost,
      city: s.city || "",
      cityId: s.cityId,
      imageUrl: s.imageUrl,
      styles: allStyles,
    };
  });
};

// Helper function to create session videos
const createSessionVideos = async (
  sessionId: string,
  videos: Video[]
): Promise<void> => {
  if (videos.length === 0) return;

  const session = driver.session();
  try {
    for (const vid of videos) {
      // Get video type label
      const videoType = vid.type || "freestyle"; // Default to freestyle for sessions
      const videoLabel = videoType.charAt(0).toUpperCase() + videoType.slice(1);

      await session.run(
        `MATCH (s:Event:Session {id: $sessionId})
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
        {
          sessionId,
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
  } finally {
    await session.close();
  }
};

// Helper function to create user relationships for a video based on video type
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

// Helper function to update user relationships for a video
// First deletes all existing relationships, then creates new ones
async function updateVideoUserRelationships(
  video: Video,
  videoId: string,
  tx: any
): Promise<void> {
  // Delete all existing user-video relationships for this video
  await tx.run(
    `MATCH (v:Video {id: $videoId})<-[r:DANCER|WINNER|CHOREOGRAPHER|TEACHER]-(:User)
     DELETE r`,
    { videoId }
  );

  // Create new relationships based on video type
  if (video.type === "battle") {
    const battleVideo = video as any;
    // Create DANCER relationships
    if (battleVideo.taggedDancers && battleVideo.taggedDancers.length > 0) {
      for (const dancer of battleVideo.taggedDancers) {
        const userId = await getUserIdFromUserSearchItem(dancer);
        await tx.run(
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
        await tx.run(
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
        await tx.run(
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
        await tx.run(
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
        await tx.run(
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
        await tx.run(
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
        await tx.run(
          `MATCH (v:Video {id: $videoId})
           MERGE (u:User {id: $userId})
           MERGE (u)-[:DANCER]->(v)`,
          { videoId, userId }
        );
      }
    }
  }
}

// Helper function to create session styles
const createSessionStyles = async (
  sessionId: string,
  styles: string[] | undefined
): Promise<void> => {
  if (!styles || styles.length === 0) return;

  const session = driver.session();
  try {
    const normalizedStyles = normalizeStyleNames(styles);
    await session.run(
      `
      MATCH (s:Event:Session {id: $sessionId})
      WITH s, $styles AS styles
      UNWIND styles AS styleName
      MERGE (style:Style {name: styleName})
      MERGE (s)-[:STYLE]->(style)
      `,
      { sessionId, styles: normalizedStyles }
    );
  } finally {
    await session.close();
  }
};

// Helper function to create session posters
const createSessionPoster = async (
  sessionId: string,
  poster: Image | null
): Promise<void> => {
  if (!poster?.id) return;

  const session = driver.session();
  try {
    await session.run(
      `MATCH (s:Event:Session {id: $sessionId})
       OPTIONAL MATCH (oldPoster:Image)-[r:POSTER_OF]->(s)
       DELETE r
       WITH s
       MERGE (p:Image:Gallery {id: $posterId})
       ON CREATE SET
         p.title = $title,
         p.url = $url
       ON MATCH SET
         p.title = $title,
         p.url = $url
       MERGE (p)-[:POSTER_OF]->(s)`,
      {
        sessionId,
        posterId: poster.id,
        title: poster.title,
        url: poster.url,
      }
    );
  } finally {
    await session.close();
  }
};

// Helper function to create gallery photos
const createSessionGalleryPhotos = async (
  sessionId: string,
  gallery: Image[]
): Promise<void> => {
  if (gallery.length === 0) return;

  const session = driver.session();
  try {
    for (const pic of gallery) {
      await session.run(
        `MATCH (s:Event:Session {id: $sessionId})
         MERGE (p:Image:Gallery {id: $picId})
         ON CREATE SET
           p.title = $title,
           p.url = $url
         ON MATCH SET
           p.title = $title,
           p.url = $url
         MERGE (p)-[:PHOTO]->(s)`,
        {
          sessionId,
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

export const insertSession = async (session: Session): Promise<any> => {
  // Validate all roles before inserting
  if (session.roles && session.roles.length > 0) {
    for (const role of session.roles) {
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
      session.roles.map(async (role) => {
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
      (role) =>
        role !== null && role.user !== null && role.user.id !== undefined
    ) as SessionRole[];
    session = {
      ...session,
      roles: validRoles,
    };
  }

  const sessionDriver = driver.session();

  // Convert dates array to JSON string
  const datesJson = JSON.stringify(session.eventDetails.dates || []);

  const result = await sessionDriver.run(
    `
    MERGE (s:Event:Session {id: $sessionId})
    ON CREATE SET 
      s.title = $title,
      s.description = $description,
      s.address = $address,
      s.cost = $cost,
      s.dates = $dates,
      s.schedule = $schedule,
      s.createdAt = $createdAt,
      s.updatedAt = $updatedAt
    ON MATCH SET
      s.title = $title,
      s.description = $description,
      s.address = $address,
      s.cost = $cost,
      s.dates = $dates,
      s.schedule = $schedule,
      s.updatedAt = $updatedAt

    WITH s
    MERGE (c:City {id: $city.id})
    ON CREATE SET 
      c.name = $city.name,
      c.countryCode = $city.countryCode,
      c.region = $city.region,
      c.population = $city.population,
      c.timezone = $city.timezone
    ON MATCH SET
      c.population = $city.population
    MERGE (s)-[:IN]->(c)

    WITH s
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
    )

    WITH s
    MATCH (creator:User {id: $creatorId})
    MERGE (creator)-[:CREATED]->(s)

    WITH s
    CALL {
      WITH s
      WITH s, $roles AS roles
      UNWIND roles AS roleData
      WITH s, roleData
      WHERE roleData.user.id IS NOT NULL
      MATCH (u:User { id: roleData.user.id })
      WITH u, s, roleData,
        CASE 
          WHEN roleData.title = 'Team Member' THEN 'TEAM_MEMBER'
          ELSE toUpper(roleData.title)
        END AS relationshipType
      CALL apoc.merge.relationship(u, relationshipType, {}, {}, s) YIELD rel
      RETURN count(rel) AS roleCount
    }

    WITH s
    RETURN s as session
  `,
    {
      sessionId: session.id,
      creatorId: session.eventDetails.creatorId,
      title: session.eventDetails.title,
      description: session.eventDetails.description,
      address: session.eventDetails.address,
      cost: session.eventDetails.cost,
      dates: datesJson,
      schedule: session.eventDetails.schedule || null,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      poster: session.eventDetails.poster,
      city: session.eventDetails.city,
      roles: session.roles,
    }
  );

  // Check if query returned results
  if (!result.records || result.records.length === 0) {
    await sessionDriver.close();
    throw new Error(
      `Failed to create session ${session.id}: No records returned from query`
    );
  }

  const sessionNode = result.records[0].get("session");
  if (!sessionNode) {
    await sessionDriver.close();
    throw new Error(
      `Failed to create session ${session.id}: Session node not found in result`
    );
  }

  await sessionDriver.close();

  // Create videos, gallery, poster, and styles in separate queries
  await createSessionVideos(session.id, session.videos);
  await createSessionPoster(session.id, session.eventDetails.poster || null);
  await createSessionGalleryPhotos(session.id, session.gallery);
  await createSessionStyles(session.id, session.eventDetails.styles);

  return sessionNode.properties;
};

export const editSession = async (
  sessionId: string,
  session: Session
): Promise<boolean> => {
  // Validate all roles before editing
  if (session.roles && session.roles.length > 0) {
    for (const role of session.roles) {
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
      session.roles.map(async (role) => {
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
      (role) =>
        role !== null && role.user !== null && role.user.id !== undefined
    ) as SessionRole[];
    session = {
      ...session,
      roles: validRoles,
    };
  }

  const sessionDriver = driver.session();

  try {
    const tx = sessionDriver.beginTransaction();

    // Convert dates array to JSON string
    const datesJson = JSON.stringify(session.eventDetails.dates || []);

    // Update session properties
    await tx.run(
      `
      MATCH (s:Event:Session {id: $id})
      SET s.title = $title,
          s.description = $description,
          s.address = $address,
          s.cost = $cost,
          s.dates = $dates,
          s.schedule = $schedule,
          s.updatedAt = $updatedAt
    `,
      {
        id: sessionId,
        title: session.eventDetails.title,
        description: session.eventDetails.description,
        address: session.eventDetails.address,
        cost: session.eventDetails.cost,
        dates: datesJson,
        schedule: session.eventDetails.schedule || null,
        updatedAt: session.updatedAt.toISOString(),
      }
    );

    // Update city relationship
    await tx.run(
      `
      MATCH (s:Event:Session {id: $id})
      OPTIONAL MATCH (s)-[oldCityRel:IN]->(:City)
      DELETE oldCityRel
      WITH s
      MERGE (c:City {id: $city.id})
      ON CREATE SET 
        c.name = $city.name,
        c.countryCode = $city.countryCode,
        c.region = $city.region,
        c.population = $city.population,
        c.timezone = $city.timezone
      ON MATCH SET
        c.population = $city.population
      MERGE (s)-[:IN]->(c)
    `,
      { id: sessionId, city: session.eventDetails.city }
    );

    // Update poster
    await tx.run(
      `
      MATCH (s:Event:Session {id: $id})
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
      )
    `,
      { id: sessionId, poster: session.eventDetails.poster }
    );

    // Update session styles
    await tx.run(
      `MATCH (s:Event:Session {id: $id})-[r:STYLE]->(:Style)
       DELETE r`,
      { id: sessionId }
    );

    if (session.eventDetails.styles && session.eventDetails.styles.length > 0) {
      const normalizedStyles = normalizeStyleNames(session.eventDetails.styles);
      await tx.run(
        `
        MATCH (s:Event:Session {id: $id})
        WITH s, $styles AS styles
        UNWIND styles AS styleName
        MERGE (style:Style {name: styleName})
        MERGE (s)-[:STYLE]->(style)
        `,
        { id: sessionId, styles: normalizedStyles }
      );
    }

    // Update roles
    const validRoleFormats = getNeo4jRoleFormats();
    if (session.roles && session.roles.length > 0) {
      await tx.run(
        `MATCH (s:Event:Session {id: $id})
         UNWIND $roles AS roleData
         WITH s, roleData
         WHERE roleData.user.id IS NOT NULL
         MERGE (u:User { id: roleData.user.id })
         WITH u, s, roleData,
           CASE 
             WHEN roleData.title = 'Team Member' THEN 'TEAM_MEMBER'
             ELSE toUpper(roleData.title)
           END AS relationshipType
         CALL apoc.merge.relationship(u, relationshipType, {}, {}, s)
         YIELD rel
         RETURN s, u
         `,
        { id: sessionId, roles: session.roles }
      );

      // Delete roles not in the new list
      await tx.run(
        `MATCH (s:Event:Session {id: $id})
         MATCH (u:User)-[r]->(s)
         WHERE type(r) IN $validRoles AND type(r) <> 'TEAM_MEMBER' AND type(r) <> 'CREATED'
         AND NOT u.id IN [role IN $roles WHERE role.user.id IS NOT NULL | role.user.id]
         DELETE r`,
        { id: sessionId, roles: session.roles, validRoles: validRoleFormats }
      );
    } else {
      // Remove all roles if none provided (except TEAM_MEMBER and CREATED)
      await tx.run(
        `MATCH (s:Event:Session {id: $id})
         MATCH (u:User)-[r]->(s)
         WHERE type(r) IN $validRoles AND type(r) <> 'TEAM_MEMBER' AND type(r) <> 'CREATED'
         DELETE r`,
        { id: sessionId, validRoles: validRoleFormats }
      );
    }

    // Delete videos not in the new list
    await tx.run(
      `MATCH (s:Event:Session {id: $id})
       MATCH (v:Video)-[:IN]->(s)
       WHERE NOT v.id IN [vid IN $videos | vid.id]
       DETACH DELETE v`,
      { id: sessionId, videos: session.videos }
    );

    // Update videos
    for (const vid of session.videos) {
      // Get video type label
      const videoType = vid.type || "freestyle";
      const videoLabel = videoType.charAt(0).toUpperCase() + videoType.slice(1);

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
        `MATCH (s:Event:Session {id: $id})
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
          id: sessionId,
          videoId: vid.id,
          title: vid.title,
          src: vid.src,
        }
      );
    }

    // Update video styles
    for (const vid of session.videos) {
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

    // Update video user relationships (tagged dancers, winners, choreographers, teachers)
    for (const vid of session.videos) {
      await updateVideoUserRelationships(vid, vid.id, tx);
    }

    // Update gallery
    await tx.run(
      `MATCH (s:Event:Session {id: $id})
       FOREACH (pic IN $gallery |
         MERGE (g:Image:Gallery { id: pic.id, title: pic.title, url: pic.url })
         MERGE (g)-[:PHOTO]->(s)
       )`,
      { id: sessionId, gallery: session.gallery }
    );

    // Delete gallery items not in the new list
    await tx.run(
      `MATCH (s:Event:Session {id: $id})
       MATCH (g:Image)-[:PHOTO]->(s)
       WHERE NOT g.id IN [pic IN $gallery | pic.id]
       DETACH DELETE g`,
      { id: sessionId, gallery: session.gallery }
    );

    // Commit transaction
    await tx.commit();
    await sessionDriver.close();

    return true;
  } catch (error) {
    // Rollback transaction on error
    if (sessionDriver) {
      await sessionDriver.close();
    }
    throw error;
  }
};

export const deleteSession = async (sessionId: string): Promise<boolean> => {
  const session = driver.session();

  try {
    await session.run(
      `
      MATCH (s:Event:Session {id: $id})
      DETACH DELETE s
    `,
      { id: sessionId }
    );

    await session.close();
    return true;
  } catch (error) {
    await session.close();
    throw error;
  }
};

export const getSessionImages = async (
  sessionId: string
): Promise<string[]> => {
  const session = driver.session();
  const result = await session.run(
    `MATCH (s:Event:Session {id: $sessionId})
    OPTIONAL MATCH (s)<-[:POSTER_OF]-(poster:Image)
    OPTIONAL MATCH (s)<-[:PHOTO]-(gallery:Image)

    RETURN poster, gallery
    `,
    {
      sessionId,
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

export const getSessionCreator = async (
  sessionId: string
): Promise<string | null> => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User)-[:CREATED]->(s:Event:Session {id: $sessionId})
      RETURN u.id as creatorId
      LIMIT 1
    `,
      { sessionId }
    );

    if (result.records.length === 0) {
      return null;
    }

    return result.records[0].get("creatorId");
  } finally {
    await session.close();
  }
};

export const isSessionCreator = async (
  sessionId: string,
  userId: string
): Promise<boolean> => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})-[:CREATED]->(s:Event:Session {id: $sessionId})
      RETURN count(*) as count
    `,
      { sessionId, userId }
    );

    const count = result.records[0]?.get("count")?.toNumber() || 0;
    return count > 0;
  } finally {
    await session.close();
  }
};

export const searchSessions = async (
  keyword?: string
): Promise<Array<{ id: string; title: string }>> => {
  const session = driver.session();

  try {
    let query = `MATCH (s:Event:Session)`;
    const params: any = {};

    if (keyword && keyword.trim()) {
      query += ` WHERE toLower(s.title) CONTAINS toLower($keyword)`;
      params.keyword = keyword.trim();
    }

    query += ` RETURN s.id as id, s.title as title ORDER BY s.title LIMIT 20`;

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
 * Search sessions that a user has access to (created, team member, moderator, admin, super_admin)
 */
export const searchAccessibleSessions = async (
  userId: string,
  authLevel: number,
  keyword?: string
): Promise<Array<{ id: string; title: string }>> => {
  const session = driver.session();

  try {
    let query = ``;
    const params: any = { userId };

    // If user is moderator, admin, or super_admin, they can see all sessions
    if (authLevel >= AUTH_LEVELS.MODERATOR) {
      query = `MATCH (s:Event:Session)`;

      if (keyword && keyword.trim()) {
        query += ` WHERE toLower(s.title) CONTAINS toLower($keyword)`;
        params.keyword = keyword.trim();
      }
    } else {
      // Otherwise, only show sessions where user is creator or team member
      query = `
        MATCH (u:User {id: $userId})
        OPTIONAL MATCH (u)-[:CREATED]->(s1:Event:Session)
        OPTIONAL MATCH (u)-[:TEAM_MEMBER]->(s2:Event:Session)
        WITH collect(DISTINCT s1) + collect(DISTINCT s2) as sessions
        UNWIND sessions as s
        WHERE s IS NOT NULL
      `;

      if (keyword && keyword.trim()) {
        query += ` AND toLower(s.title) CONTAINS toLower($keyword)`;
        params.keyword = keyword.trim();
      }
    }

    query += ` RETURN DISTINCT s.id as id, s.title as title ORDER BY s.title LIMIT 20`;

    const result = await session.run(query, params);

    return result.records.map((record) => ({
      id: record.get("id"),
      title: record.get("title"),
    }));
  } finally {
    await session.close();
  }
};
