import driver from "../driver";
import { Workshop, WorkshopCard, WorkshopRole } from "../../types/workshop";
import { UserSearchItem } from "../../types/user";
import { City } from "../../types/city";
import { Video } from "../../types/video";
import { Image } from "../../types/image";
import {
  isValidWorkshopRole,
  WORKSHOP_ROLES,
  toNeo4jRoleFormat,
} from "@/lib/utils/roles";
import { normalizeStyleNames } from "@/lib/utils/style-utils";
import { getUserByUsername } from "./user";

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

export const getWorkshop = async (id: string): Promise<Workshop> => {
  const session = driver.session();

  // Get main workshop data - now using Event:Event:Workshop labels
  const workshopResult = await session.run(
    `
    MATCH (w:Event:Event:Workshop {id: $id})
    OPTIONAL MATCH (w)-[:IN]->(c:City)
    OPTIONAL MATCH (poster:Image)-[:POSTER_OF]->(w)
    OPTIONAL MATCH (creator:User)-[:CREATED]->(w)
    
    RETURN w {
      id: w.id,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      title: w.title,
      description: w.description,
      address: w.address,
      cost: w.cost,
      startDate: w.startDate,
      startTime: w.startTime,
      endTime: w.endTime,
      schedule: w.schedule,
      creatorId: creator.id
    } as workshop,
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

  // Get parent event if this workshop is a subevent
  const parentEventResult = await session.run(
    `
    MATCH (w:Event:Workshop {id: $id})-[:SUBEVENT_OF]->(parent:Event)
    RETURN parent {
      id: parent.id,
      title: parent.title
    } as parentEvent
    `,
    { id }
  );

  // Get roles (exclude TEAM_MEMBER - team members are shown separately)
  const validRoles = WORKSHOP_ROLES.filter((role) => role !== "TEAM_MEMBER");
  const rolesResult = await session.run(
    `
    MATCH (w:Event:Event:Workshop {id: $id})<-[roleRel]-(user:User)
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
    { id, validRoles }
  );

  // Get videos (workshops don't have dancer/winner tags)
  const videosResult = await session.run(
    `
    MATCH (w:Event:Workshop {id: $id})<-[:IN]-(v:Video)
    RETURN collect({
      id: v.id,
      title: v.title,
      src: v.src,
      type: "freestyle", // Default type - should be determined from video node labels
      taggedDancers: []
    }) as videos
  `,
    { id }
  );

  // Get video styles
  const videoStylesResult = await session.run(
    `
    MATCH (w:Event:Workshop {id: $id})<-[:IN]-(v:Video)-[:STYLE]->(style:Style)
    RETURN v.id as videoId, collect(style.name) as styles
  `,
    { id }
  );

  // Get workshop styles
  const workshopStylesResult = await session.run(
    `
    MATCH (w:Event:Workshop {id: $id})-[:STYLE]->(style:Style)
    RETURN collect(style.name) as styles
  `,
    { id }
  );

  // Get gallery
  const galleryResult = await session.run(
    `
    MATCH (w:Event:Workshop {id: $id})<-[:PHOTO]-(galleryPic:Image:Gallery)
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
    MATCH (w:Event:Workshop {id: $id})
    OPTIONAL MATCH (subEvent:Event)-[:SUBEVENT_OF]->(w)
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

  const workshopRecord = workshopResult.records[0];
  const workshop = workshopRecord?.get("workshop");
  const posterId = workshopRecord?.get("posterId");
  const cityId = workshopRecord?.get("cityId");
  const roles = rolesResult.records[0]?.get("roles") || [];
  const videos = videosResult.records[0]?.get("videos") || [];
  const videoStyles = videoStylesResult.records;
  const workshopStyles = workshopStylesResult.records[0]?.get("styles") || [];
  const gallery = galleryResult.records[0]?.get("gallery") || [];
  const parentEvent = parentEventResult.records[0]?.get("parentEvent") || null;

  // Check if workshop exists
  if (!workshop) {
    throw new Error(`Workshop with id ${id} not found`);
  }

  // Construct poster object from individual fields
  const poster = posterId
    ? {
        id: posterId,
        title: workshopRecord?.get("posterTitle") || "",
        url: workshopRecord?.get("posterUrl") || "",
      }
    : null;

  // Construct city object from individual fields
  const city = cityId
    ? {
        id: cityId,
        name: workshopRecord?.get("cityName") || "",
        countryCode: workshopRecord?.get("cityCountryCode") || "",
        region: workshopRecord?.get("cityRegion") || "",
        population: workshopRecord?.get("cityPopulation") || 0,
        timezone: workshopRecord?.get("cityTimezone"),
      }
    : null;

  // Add styles to videos
  const videoStylesMap = new Map<string, string[]>();
  videoStyles.forEach((record: any) => {
    videoStylesMap.set(record.get("videoId"), record.get("styles"));
  });

  const videosWithStyles = videos.map((video: Video) => ({
    ...video,
    styles: videoStylesMap.get(video.id) || [],
  }));

  const subEvents = subEventsResult.records[0]?.get("subEvents") || [];

  return {
    ...workshop,
    eventDetails: {
      title: workshop.title,
      description: workshop.description,
      address: workshop.address,
      cost: workshop.cost,
      startDate: workshop.startDate,
      startTime: workshop.startTime,
      endTime: workshop.endTime,
      schedule: workshop.schedule,
      creatorId: workshop.creatorId,
      poster: poster,
      city: city,
      styles: workshopStyles,
      parentEvent: parentEvent,
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

export const getWorkshops = async (): Promise<WorkshopCard[]> => {
  const session = driver.session();

  const result = await session.run(
    `
    MATCH (w:Event:Workshop)
    OPTIONAL MATCH (w)-[:IN]->(c:City)
    OPTIONAL MATCH (poster:Image)-[:POSTER_OF]->(w)
    RETURN collect({
      id: w.id,
      title: w.title,
      startDate: w.startDate,
      cost: w.cost,
      city: c.name,
      cityId: c.id,
      imageUrl: poster.url
    }) as workshops
  `,
    {}
  );

  // Get workshop styles
  const workshopStylesResult = await session.run(
    `
    MATCH (w:Event:Workshop)-[:STYLE]->(style:Style)
    RETURN w.id as workshopId, collect(style.name) as styles
  `,
    {}
  );

  // Get video styles for workshops
  const videoStylesResult = await session.run(
    `
    MATCH (w:Event:Workshop)<-[:IN]-(v:Video)-[:STYLE]->(style:Style)
    WITH w.id as workshopId, collect(DISTINCT style.name) as styles
    RETURN workshopId, styles
  `,
    {}
  );

  session.close();

  const workshops = result.records[0]?.get("workshops") || [];

  // Create maps for styles
  const workshopStylesMap = new Map<string, string[]>();
  workshopStylesResult.records.forEach((record) => {
    workshopStylesMap.set(record.get("workshopId"), record.get("styles") || []);
  });

  const videoStylesMap = new Map<string, string[]>();
  videoStylesResult.records.forEach((record) => {
    videoStylesMap.set(record.get("workshopId"), record.get("styles") || []);
  });

  return workshops.map((w: any) => {
    // Combine workshop styles and video styles, dedupe
    const workshopStyles = workshopStylesMap.get(w.id) || [];
    const videoStyles = videoStylesMap.get(w.id) || [];
    const allStyles = Array.from(new Set([...workshopStyles, ...videoStyles]));

    return {
      id: w.id,
      title: w.title,
      date: w.startDate,
      cost: w.cost,
      city: w.city || "",
      cityId: w.cityId,
      imageUrl: w.imageUrl,
      styles: allStyles,
    };
  });
};

// Helper function to create workshop videos
const createWorkshopVideos = async (
  workshopId: string,
  videos: Video[]
): Promise<void> => {
  if (videos.length === 0) return;

  const session = driver.session();
  try {
    for (const vid of videos) {
      // Get video type label
      const videoType = vid.type || "freestyle"; // Default to freestyle for workshops
      const videoLabel = videoType.charAt(0).toUpperCase() + videoType.slice(1);

      await session.run(
        `MATCH (w:Event:Workshop {id: $workshopId})
         MERGE (v:Video {id: $videoId})
         ON CREATE SET
           v.title = $title,
           v.src = $src
         ON MATCH SET
           v.title = $title,
           v.src = $src
         WITH v, w
         CALL apoc.create.addLabels(v, ['Video', '${videoLabel}']) YIELD node
         MERGE (v)-[:IN]->(w)`,
        {
          workshopId,
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

// Helper function to create workshop posters
const createWorkshopPoster = async (
  workshopId: string,
  poster: Image | null
): Promise<void> => {
  if (!poster?.id) return;

  const session = driver.session();
  try {
    await session.run(
      `MATCH (w:Event:Workshop {id: $workshopId})
       OPTIONAL MATCH (oldPoster:Image)-[r:POSTER_OF]->(w)
       DELETE r
       WITH w
       MERGE (p:Image:Gallery {id: $posterId})
       ON CREATE SET
         p.title = $title,
         p.url = $url
       ON MATCH SET
         p.title = $title,
         p.url = $url
       MERGE (p)-[:POSTER_OF]->(w)`,
      {
        workshopId,
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
const createWorkshopGalleryPhotos = async (
  workshopId: string,
  gallery: Image[]
): Promise<void> => {
  if (gallery.length === 0) return;

  const session = driver.session();
  try {
    for (const pic of gallery) {
      await session.run(
        `MATCH (w:Event:Workshop {id: $workshopId})
         MERGE (p:Image:Gallery {id: $picId})
         ON CREATE SET
           p.title = $title,
           p.url = $url
         ON MATCH SET
           p.title = $title,
           p.url = $url
         MERGE (p)-[:PHOTO]->(w)`,
        {
          workshopId,
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

// Helper function to create workshop styles
const createWorkshopStyles = async (
  workshopId: string,
  styles: string[] | undefined
): Promise<void> => {
  if (!styles || styles.length === 0) return;

  const session = driver.session();
  try {
    const normalizedStyles = normalizeStyleNames(styles);
    await session.run(
      `
      MATCH (w:Event:Workshop {id: $workshopId})
      WITH w, $styles AS styles
      UNWIND styles AS styleName
      MERGE (style:Style {name: styleName})
      MERGE (w)-[:STYLE]->(style)
      `,
      { workshopId, styles: normalizedStyles }
    );
  } finally {
    await session.close();
  }
};

export const insertWorkshop = async (workshop: Workshop): Promise<any> => {
  // Validate all roles before inserting
  if (workshop.roles && workshop.roles.length > 0) {
    for (const role of workshop.roles) {
      if (!isValidWorkshopRole(role.title)) {
        throw new Error(
          `Invalid role: ${role.title}. Must be one of: ${WORKSHOP_ROLES.join(
            ", "
          )}`
        );
      }
    }

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
      (role) =>
        role !== null && role.user !== null && role.user.id !== undefined
    ) as WorkshopRole[];
    workshop = {
      ...workshop,
      roles: validRoles,
    };
  }

  const session = driver.session();

  const result = await session.run(
    `
    MERGE (w:Event:Workshop {id: $workshopId})
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
    MERGE (w)-[:IN]->(c)

    WITH w
    OPTIONAL MATCH (oldPoster:Image)-[r:POSTER_OF]->(w)
    DELETE r
    WITH w
    FOREACH (poster IN CASE WHEN $poster IS NOT NULL AND $poster.id IS NOT NULL THEN [$poster] ELSE [] END |
      MERGE (newPoster:Image:Gallery {id: poster.id})
      ON CREATE SET
        newPoster.title = poster.title,
        newPoster.url = poster.url
      SET
        newPoster.title = poster.title,
        newPoster.url = poster.url
      MERGE (newPoster)-[:POSTER_OF]->(w)
    )

    WITH w
    MATCH (creator:User {id: $creatorId})
    MERGE (creator)-[:CREATED]->(w)

    WITH w
    CALL {
      WITH w
      WITH w, $roles AS roles
      UNWIND roles AS roleData
      WITH w, roleData
      WHERE roleData.user.id IS NOT NULL
      MATCH (u:User { id: roleData.user.id })
      WITH u, w, roleData,
        CASE 
          WHEN roleData.title = 'TEAM_MEMBER' THEN 'TEAM_MEMBER'
          ELSE toUpper(roleData.title)
        END AS relationshipType
      CALL apoc.merge.relationship(u, relationshipType, {}, {}, w) YIELD rel
      RETURN count(rel) AS roleCount
    }

    WITH w
    RETURN w as workshop
  `,
    {
      workshopId: workshop.id,
      creatorId: workshop.eventDetails.creatorId,
      title: workshop.eventDetails.title,
      description: workshop.eventDetails.description,
      address: workshop.eventDetails.address,
      cost: workshop.eventDetails.cost,
      startDate: workshop.eventDetails.startDate,
      startTime: workshop.eventDetails.startTime,
      endTime: workshop.eventDetails.endTime,
      schedule: workshop.eventDetails.schedule || null,
      createdAt: workshop.createdAt.toISOString(),
      updatedAt: workshop.updatedAt.toISOString(),
      poster: workshop.eventDetails.poster,
      city: workshop.eventDetails.city,
      roles: workshop.roles,
    }
  );

  // Check if query returned results
  if (!result.records || result.records.length === 0) {
    await session.close();
    throw new Error(
      `Failed to create workshop ${workshop.id}: No records returned from query`
    );
  }

  const workshopNode = result.records[0].get("workshop");
  if (!workshopNode) {
    await session.close();
    throw new Error(
      `Failed to create workshop ${workshop.id}: Workshop node not found in result`
    );
  }

  await session.close();

  // Create videos, gallery, poster, and styles in separate queries
  await createWorkshopVideos(workshop.id, workshop.videos);
  await createWorkshopPoster(workshop.id, workshop.eventDetails.poster || null);
  await createWorkshopGalleryPhotos(workshop.id, workshop.gallery);
  await createWorkshopStyles(workshop.id, workshop.eventDetails.styles);

  return workshopNode.properties;
};

export const editWorkshop = async (
  workshopId: string,
  workshop: Workshop
): Promise<boolean> => {
  // Validate all roles before editing
  if (workshop.roles && workshop.roles.length > 0) {
    for (const role of workshop.roles) {
      if (!isValidWorkshopRole(role.title)) {
        throw new Error(
          `Invalid role: ${role.title}. Must be one of: ${WORKSHOP_ROLES.join(
            ", "
          )}`
        );
      }
    }

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
      (role) =>
        role !== null && role.user !== null && role.user.id !== undefined
    ) as WorkshopRole[];
    workshop = {
      ...workshop,
      roles: validRoles,
    };
  }

  const session = driver.session();

  try {
    const tx = session.beginTransaction();

    // Update workshop properties
    await tx.run(
      `
      MATCH (w:Event:Workshop {id: $id})
      SET w.title = $title,
          w.description = $description,
          w.address = $address,
          w.cost = $cost,
          w.startDate = $startDate,
          w.startTime = $startTime,
          w.endTime = $endTime,
          w.schedule = $schedule,
          w.updatedAt = $updatedAt
    `,
      {
        id: workshopId,
        title: workshop.eventDetails.title,
        description: workshop.eventDetails.description,
        address: workshop.eventDetails.address,
        cost: workshop.eventDetails.cost,
        startDate: workshop.eventDetails.startDate,
        startTime: workshop.eventDetails.startTime,
        endTime: workshop.eventDetails.endTime,
        schedule: workshop.eventDetails.schedule || null,
        updatedAt: workshop.updatedAt.toISOString(),
      }
    );

    // Update city relationship
    await tx.run(
      `
      MATCH (w:Event:Workshop {id: $id})
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
      MERGE (w)-[:IN]->(c)
    `,
      { id: workshopId, city: workshop.eventDetails.city }
    );

    // Update poster
    await tx.run(
      `
      MATCH (w:Event:Workshop {id: $id})
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
      )
    `,
      { id: workshopId, poster: workshop.eventDetails.poster }
    );

    // Update roles
    if (workshop.roles && workshop.roles.length > 0) {
      await tx.run(
        `MATCH (w:Event:Workshop {id: $id})
         UNWIND $roles AS roleData
         WITH w, roleData
         WHERE roleData.user.id IS NOT NULL
         MERGE (u:User { id: roleData.user.id })
         WITH u, w, roleData
         CALL apoc.merge.relationship(u, toUpper(roleData.title), {}, {}, w)
         YIELD rel
         RETURN w, u
         `,
        { id: workshopId, roles: workshop.roles }
      );

      // Delete roles not in the new list
      await tx.run(
        `MATCH (w:Event:Workshop {id: $id})
         MATCH (u:User)-[r]->(w)
         WHERE type(r) IN $validRoles AND NOT u.id IN [role IN $roles WHERE role.user.id IS NOT NULL | role.user.id]
         DELETE r`,
        { id: workshopId, roles: workshop.roles, validRoles: WORKSHOP_ROLES }
      );
    } else {
      // Remove all roles if none provided
      await tx.run(
        `MATCH (w:Event:Workshop {id: $id})
         MATCH (u:User)-[r]->(w)
         WHERE type(r) IN $validRoles
         DELETE r`,
        { id: workshopId, validRoles: WORKSHOP_ROLES }
      );
    }

    // Update workshop styles
    await tx.run(
      `MATCH (w:Event:Workshop {id: $id})-[r:STYLE]->(:Style)
       DELETE r`,
      { id: workshopId }
    );

    if (
      workshop.eventDetails.styles &&
      workshop.eventDetails.styles.length > 0
    ) {
      const normalizedStyles = normalizeStyleNames(
        workshop.eventDetails.styles
      );
      await tx.run(
        `
        MATCH (w:Event:Workshop {id: $id})
        WITH w, $styles AS styles
        UNWIND styles AS styleName
        MERGE (style:Style {name: styleName})
        MERGE (w)-[:STYLE]->(style)
        `,
        { id: workshopId, styles: normalizedStyles }
      );
    }

    // Delete videos not in the new list
    await tx.run(
      `MATCH (w:Event:Workshop {id: $id})
       MATCH (v:Video)-[:IN]->(w)
       WHERE NOT v.id IN [vid IN $videos | vid.id]
       DETACH DELETE v`,
      { id: workshopId, videos: workshop.videos }
    );

    // Update videos
    for (const vid of workshop.videos) {
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
        `MATCH (w:Event:Workshop {id: $id})
         MERGE (v:Video { id: $videoId })
         ON CREATE SET
           v.title = $title,
           v.src = $src
         ON MATCH SET
           v.title = $title,
           v.src = $src
         WITH v, w
         CALL apoc.create.addLabels(v, ['Video', '${videoLabel}']) YIELD node
         MERGE (v)-[:IN]->(w)`,
        {
          id: workshopId,
          videoId: vid.id,
          title: vid.title,
          src: vid.src,
        }
      );
    }

    // Update video styles
    for (const vid of workshop.videos) {
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
    for (const vid of workshop.videos) {
      await updateVideoUserRelationships(vid, vid.id, tx);
    }

    // Update gallery
    await tx.run(
      `MATCH (w:Event:Workshop {id: $id})
       FOREACH (pic IN $gallery |
         MERGE (g:Image:Gallery { id: pic.id, title: pic.title, url: pic.url })
         MERGE (g)-[:PHOTO]->(w)
       )`,
      { id: workshopId, gallery: workshop.gallery }
    );

    // Delete gallery items not in the new list
    await tx.run(
      `MATCH (w:Event:Workshop {id: $id})
       MATCH (g:Image)-[:PHOTO]->(w)
       WHERE NOT g.id IN [pic IN $gallery | pic.id]
       DETACH DELETE g`,
      { id: workshopId, gallery: workshop.gallery }
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

export const deleteWorkshop = async (workshopId: string): Promise<boolean> => {
  const session = driver.session();

  try {
    await session.run(
      `
      MATCH (w:Event:Workshop {id: $id})
      DETACH DELETE w
    `,
      { id: workshopId }
    );

    await session.close();
    return true;
  } catch (error) {
    await session.close();
    throw error;
  }
};

export const getWorkshopCreator = async (
  workshopId: string
): Promise<string | null> => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User)-[:CREATED]->(w:Event:Workshop {id: $workshopId})
      RETURN u.id as creatorId
      LIMIT 1
    `,
      { workshopId }
    );

    if (result.records.length === 0) {
      return null;
    }

    return result.records[0].get("creatorId");
  } finally {
    await session.close();
  }
};

export const isWorkshopCreator = async (
  workshopId: string,
  userId: string
): Promise<boolean> => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})-[:CREATED]->(w:Event:Workshop {id: $workshopId})
      RETURN count(*) as count
    `,
      { workshopId, userId }
    );

    const count = result.records[0]?.get("count")?.toNumber() || 0;
    return count > 0;
  } finally {
    await session.close();
  }
};

export const getWorkshopTeamMembers = async (
  workshopId: string
): Promise<string[]> => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (w:Event:Workshop {id: $workshopId})<-[rel:TEAM_MEMBER]-(user:User)
      RETURN DISTINCT user.id as userId
    `,
      { workshopId }
    );

    const teamMemberIds = result.records.map((record) => record.get("userId"));
    return teamMemberIds;
  } finally {
    await session.close();
  }
};

export const isWorkshopTeamMember = async (
  workshopId: string,
  userId: string
): Promise<boolean> => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (w:Event:Workshop {id: $workshopId})<-[rel:TEAM_MEMBER]-(user:User {id: $userId})
      RETURN count(rel) as count
    `,
      { workshopId, userId }
    );

    const count = result.records[0]?.get("count")?.toNumber() || 0;
    return count > 0;
  } finally {
    await session.close();
  }
};

export const getWorkshopsByEvent = async (
  eventId: string
): Promise<Workshop[]> => {
  const session = driver.session();

  const result = await session.run(
    `
    MATCH (e:Event {id: $eventId})<-[:IN]-(w:Event:Workshop)
    RETURN collect(w.id) as workshopIds
  `,
    { eventId }
  );

  session.close();

  const workshopIds = result.records[0]?.get("workshopIds") || [];
  const workshops = await Promise.all(
    workshopIds.map((id: string) => getWorkshop(id))
  );

  return workshops;
};
