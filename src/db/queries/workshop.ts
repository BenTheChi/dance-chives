import driver from "../driver";
import { Workshop, WorkshopCard, WorkshopRole } from "../../types/workshop";
import { UserSearchItem } from "../../types/user";
import { City } from "../../types/city";
import { Video, Picture } from "../../types/event";
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

  // Get main workshop data
  const workshopResult = await session.run(
    `
    MATCH (w:Workshop {id: $id})
    OPTIONAL MATCH (w)-[:IN]->(c:City)
    OPTIONAL MATCH (w)-[:IN]->(e:Event)
    OPTIONAL MATCH (poster:Picture)-[:POSTER]->(w)
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
      creatorId: creator.id,
      associatedEventId: e.id,
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
    } as workshop
  `,
    { id }
  );

  // Get roles
  const rolesResult = await session.run(
    `
    MATCH (w:Workshop {id: $id})<-[roleRel]-(user:User)
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
    { id, validRoles: WORKSHOP_ROLES }
  );

  // Get videos (workshops don't have dancer/winner tags)
  const videosResult = await session.run(
    `
    MATCH (w:Workshop {id: $id})<-[:IN]-(v:Video)
    RETURN collect({
      id: v.id,
      title: v.title,
      src: v.src,
      taggedDancers: []
    }) as videos
  `,
    { id }
  );

  // Get video styles
  const videoStylesResult = await session.run(
    `
    MATCH (w:Workshop {id: $id})<-[:IN]-(v:Video)-[:STYLE]->(style:Style)
    RETURN v.id as videoId, collect(style.name) as styles
  `,
    { id }
  );

  // Get gallery
  const galleryResult = await session.run(
    `
    MATCH (w:Workshop {id: $id})<-[:PHOTO]-(galleryPic:Picture)
    RETURN collect(galleryPic {
      id: galleryPic.id,
      title: galleryPic.title,
      url: galleryPic.url,
      type: galleryPic.type
    }) as gallery
  `,
    { id }
  );

  session.close();

  const workshop = workshopResult.records[0]?.get("workshop");
  const roles = rolesResult.records[0]?.get("roles") || [];
  const videos = videosResult.records[0]?.get("videos") || [];
  const videoStyles = videoStylesResult.records;
  const gallery = galleryResult.records[0]?.get("gallery") || [];

  // Check if workshop exists
  if (!workshop) {
    throw new Error(`Workshop with id ${id} not found`);
  }

  // Add styles to videos
  const videoStylesMap = new Map<string, string[]>();
  videoStyles.forEach((record: any) => {
    videoStylesMap.set(record.get("videoId"), record.get("styles"));
  });

  const videosWithStyles = videos.map((video: Video) => ({
    ...video,
    styles: videoStylesMap.get(video.id) || [],
  }));

  return {
    ...workshop,
    workshopDetails: {
      title: workshop.title,
      description: workshop.description,
      address: workshop.address,
      cost: workshop.cost,
      startDate: workshop.startDate,
      startTime: workshop.startTime,
      endTime: workshop.endTime,
      schedule: workshop.schedule,
      creatorId: workshop.creatorId,
      poster: workshop.poster,
      city: workshop.city,
    },
    roles,
    videos: videosWithStyles,
    gallery,
    associatedEventId: workshop.associatedEventId,
  };
};

export const getWorkshops = async (): Promise<WorkshopCard[]> => {
  const session = driver.session();

  const result = await session.run(
    `
    MATCH (w:Workshop)
    OPTIONAL MATCH (w)-[:IN]->(c:City)
    OPTIONAL MATCH (poster:Picture)-[:POSTER]->(w)
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

  session.close();

  const workshops = result.records[0]?.get("workshops") || [];
  return workshops.map((w: any) => ({
    id: w.id,
    title: w.title,
    date: w.startDate,
    cost: w.cost,
    city: w.city || "",
    cityId: w.cityId,
    imageUrl: w.imageUrl,
  }));
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
      await session.run(
        `MATCH (w:Workshop {id: $workshopId})
         MERGE (v:Video {id: $videoId})
         ON CREATE SET
           v.title = $title,
           v.src = $src
         ON MATCH SET
           v.title = $title,
           v.src = $src
         MERGE (v)-[:IN]->(w)`,
        {
          workshopId,
          videoId: vid.id,
          title: vid.title,
          src: vid.src,
        }
      );

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

// Helper function to create workshop posters
const createWorkshopPoster = async (
  workshopId: string,
  poster: Picture | null
): Promise<void> => {
  if (!poster?.id) return;

  const session = driver.session();
  try {
    await session.run(
      `MATCH (w:Workshop {id: $workshopId})
       OPTIONAL MATCH (oldPoster:Picture)-[r:POSTER]->(w)
       DELETE r
       WITH w
       MERGE (p:Picture {id: $posterId})
       ON CREATE SET
         p.title = $title,
         p.url = $url,
         p.type = 'poster'
       ON MATCH SET
         p.title = $title,
         p.url = $url
       MERGE (p)-[:POSTER]->(w)`,
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
  gallery: Picture[]
): Promise<void> => {
  if (gallery.length === 0) return;

  const session = driver.session();
  try {
    for (const pic of gallery) {
      await session.run(
        `MATCH (w:Workshop {id: $workshopId})
         MERGE (p:Picture {id: $picId})
         ON CREATE SET
           p.title = $title,
           p.url = $url,
           p.type = 'photo'
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
      CALL apoc.merge.relationship(u, toUpper(roleData.title), {}, {}, w) YIELD rel
      RETURN count(rel) AS roleCount
    }

    WITH w
    FOREACH (eventId IN CASE WHEN $eventId IS NOT NULL THEN [$eventId] ELSE [] END |
      MERGE (e:Event {id: eventId})
      MERGE (w)-[:IN]->(e)
    )

    WITH w
    RETURN w as workshop
  `,
    {
      workshopId: workshop.id,
      creatorId: workshop.workshopDetails.creatorId,
      title: workshop.workshopDetails.title,
      description: workshop.workshopDetails.description,
      address: workshop.workshopDetails.address,
      cost: workshop.workshopDetails.cost,
      startDate: workshop.workshopDetails.startDate,
      startTime: workshop.workshopDetails.startTime,
      endTime: workshop.workshopDetails.endTime,
      schedule: workshop.workshopDetails.schedule,
      createdAt: workshop.createdAt.toISOString(),
      updatedAt: workshop.updatedAt.toISOString(),
      poster: workshop.workshopDetails.poster,
      city: workshop.workshopDetails.city,
      roles: workshop.roles,
      eventId: workshop.associatedEventId || null,
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

  // Create videos, gallery, and poster in separate queries
  await createWorkshopVideos(workshop.id, workshop.videos);
  await createWorkshopPoster(
    workshop.id,
    workshop.workshopDetails.poster || null
  );
  await createWorkshopGalleryPhotos(workshop.id, workshop.gallery);

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
      MATCH (w:Workshop {id: $id})
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
        title: workshop.workshopDetails.title,
        description: workshop.workshopDetails.description,
        address: workshop.workshopDetails.address,
        cost: workshop.workshopDetails.cost,
        startDate: workshop.workshopDetails.startDate,
        startTime: workshop.workshopDetails.startTime,
        endTime: workshop.workshopDetails.endTime,
        schedule: workshop.workshopDetails.schedule,
        updatedAt: workshop.updatedAt.toISOString(),
      }
    );

    // Update city relationship
    await tx.run(
      `
      MATCH (w:Workshop {id: $id})
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
      { id: workshopId, city: workshop.workshopDetails.city }
    );

    // Update poster
    await tx.run(
      `
      MATCH (w:Workshop {id: $id})
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
      )
    `,
      { id: workshopId, poster: workshop.workshopDetails.poster }
    );

    // Update roles
    if (workshop.roles && workshop.roles.length > 0) {
      await tx.run(
        `MATCH (w:Workshop {id: $id})
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
        `MATCH (w:Workshop {id: $id})
         MATCH (u:User)-[r]->(w)
         WHERE type(r) IN $validRoles AND NOT u.id IN [role IN $roles WHERE role.user.id IS NOT NULL | role.user.id]
         DELETE r`,
        { id: workshopId, roles: workshop.roles, validRoles: WORKSHOP_ROLES }
      );
    } else {
      // Remove all roles if none provided
      await tx.run(
        `MATCH (w:Workshop {id: $id})
         MATCH (u:User)-[r]->(w)
         WHERE type(r) IN $validRoles
         DELETE r`,
        { id: workshopId, validRoles: WORKSHOP_ROLES }
      );
    }

    // Update event association
    await tx.run(
      `
      MATCH (w:Workshop {id: $id})
      OPTIONAL MATCH (w)-[oldEventRel:IN]->(:Event)
      DELETE oldEventRel
      WITH w
      FOREACH (eventId IN CASE WHEN $eventId IS NOT NULL THEN [$eventId] ELSE [] END |
        MERGE (e:Event {id: eventId})
        MERGE (w)-[:IN]->(e)
      )
    `,
      { id: workshopId, eventId: workshop.associatedEventId || null }
    );

    // Delete videos not in the new list
    await tx.run(
      `MATCH (w:Workshop {id: $id})
       MATCH (v:Video)-[:IN]->(w)
       WHERE NOT v.id IN [vid IN $videos | vid.id]
       DETACH DELETE v`,
      { id: workshopId, videos: workshop.videos }
    );

    // Update videos
    for (const vid of workshop.videos) {
      await tx.run(
        `MATCH (w:Workshop {id: $id})
         MERGE (v:Video { id: $videoId })
         ON CREATE SET
           v.title = $title,
           v.src = $src
         ON MATCH SET
           v.title = $title,
           v.src = $src
         MERGE (v)-[:IN]->(w)`,
        {
          id: workshopId,
          videoId: vid.id,
          title: vid.title,
          src: vid.src,
        }
      );
    }

    // Update video styles (workshops don't have dancer/winner tags)
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

    // Update gallery
    await tx.run(
      `MATCH (w:Workshop {id: $id})
       FOREACH (pic IN $gallery |
         MERGE (g:Picture { id: pic.id, title: pic.title, url: pic.url, type: pic.type })
         MERGE (g)-[:PHOTO]->(w)
       )`,
      { id: workshopId, gallery: workshop.gallery }
    );

    // Delete gallery items not in the new list
    await tx.run(
      `MATCH (w:Workshop {id: $id})
       MATCH (g:Picture)-[:PHOTO]->(w)
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
      MATCH (w:Workshop {id: $id})
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
      MATCH (u:User)-[:CREATED]->(w:Workshop {id: $workshopId})
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
      MATCH (u:User {id: $userId})-[:CREATED]->(w:Workshop {id: $workshopId})
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
      MATCH (w:Workshop {id: $workshopId})<-[rel:TEAM_MEMBER]-(user:User)
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
      MATCH (w:Workshop {id: $workshopId})<-[rel:TEAM_MEMBER]-(user:User {id: $userId})
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
    MATCH (e:Event {id: $eventId})<-[:IN]-(w:Workshop)
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
