import driver from "../driver";
import {
  toNeo4jRoleFormat,
  isValidRole,
  AVAILABLE_ROLES,
  VIDEO_ROLE_DANCER,
  isValidVideoRole,
  isValidSectionRole,
  SECTION_ROLE_WINNER,
  VIDEO_ROLE_WINNER,
} from "@/lib/utils/roles";

/**
 * Get team members (users with edit access) for an event from Neo4j
 * Team members are separate from roles - they grant edit access
 * NOTE: Creators are NOT included as team members - they have separate permissions
 * Returns array of user IDs
 */
export async function getEventTeamMembers(eventId: string): Promise<string[]> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (e:Event {id: $eventId})<-[rel:TEAM_MEMBER]-(user:User)
      RETURN DISTINCT user.id as userId
      `,
      { eventId }
    );

    const teamMemberIds = result.records.map((record) => record.get("userId"));
    return teamMemberIds;
  } finally {
    await session.close();
  }
}

/**
 * Check if an event exists in Neo4j
 */
export async function eventExists(eventId: string): Promise<boolean> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (e:Event {id: $eventId})
      RETURN count(e) as count
      `,
      { eventId }
    );
    const count = result.records[0]?.get("count")?.toNumber() || 0;
    return count > 0;
  } finally {
    await session.close();
  }
}

/**
 * Check if a video exists in Neo4j and belongs to the event
 */
export async function videoExistsInEvent(
  eventId: string,
  videoId: string
): Promise<boolean> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (e:Event {id: $eventId})<-[:IN]-(s:Section)<-[:IN]-(v:Video {id: $videoId})
      RETURN count(v) as count
      UNION
      MATCH (e:Event {id: $eventId})<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video {id: $videoId})
      RETURN count(v) as count
      `,
      { eventId, videoId }
    );
    const total = result.records.reduce(
      (sum, record) => sum + (record.get("count")?.toNumber() || 0),
      0
    );
    return total > 0;
  } finally {
    await session.close();
  }
}

/**
 * Check if a section exists in Neo4j and belongs to the event
 */
export async function sectionExistsInEvent(
  eventId: string,
  sectionId: string
): Promise<boolean> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (e:Event {id: $eventId})<-[:IN]-(s:Section {id: $sectionId})
      RETURN count(s) as count
      `,
      { eventId, sectionId }
    );
    const count = result.records[0]?.get("count")?.toNumber() || 0;
    return count > 0;
  } finally {
    await session.close();
  }
}

/**
 * Get event creator ID from Neo4j
 */
export async function getEventCreator(eventId: string): Promise<string | null> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (creator:User)-[:CREATED]->(e:Event {id: $eventId})
      RETURN creator.id as userId
      LIMIT 1
      `,
      { eventId }
    );

    if (result.records.length === 0) {
      return null;
    }

    return result.records[0].get("userId");
  } finally {
    await session.close();
  }
}

/**
 * Check if a user is a team member of an event
 * Team members have edit access, separate from roles
 * NOTE: Creators are NOT team members - use isEventCreator() to check for creators
 */
export async function isTeamMember(
  eventId: string,
  userId: string
): Promise<boolean> {
  const session = driver.session();
  try {
    // Check if user has TEAM_MEMBER relationship (creators are excluded)
    const result = await session.run(
      `
      MATCH (e:Event {id: $eventId})<-[rel:TEAM_MEMBER]-(user:User {id: $userId})
      RETURN count(rel) as count
      `,
      { eventId, userId }
    );

    const count = result.records[0]?.get("count")?.toNumber() || 0;
    return count > 0;
  } finally {
    await session.close();
  }
}

/**
 * Check if a user is the creator of an event
 */
export async function isEventCreator(
  eventId: string,
  userId: string
): Promise<boolean> {
  const creatorId = await getEventCreator(eventId);
  return creatorId === userId;
}

/**
 * Add a user as a team member to an event in Neo4j
 * Team members get edit access, separate from roles
 * Throws error if event doesn't exist
 */
export async function addTeamMember(
  eventId: string,
  userId: string
): Promise<void> {
  const session = driver.session();
  try {
    // Validate event exists
    const eventExistsCheck = await eventExists(eventId);
    if (!eventExistsCheck) {
      throw new Error(`Event ${eventId} does not exist`);
    }

    await session.run(
      `
      MATCH (e:Event {id: $eventId})
      MATCH (u:User {id: $userId})
      MERGE (u)-[:TEAM_MEMBER]->(e)
      `,
      { eventId, userId }
    );
  } finally {
    await session.close();
  }
}

/**
 * Get all events where a user is a team member (from Neo4j)
 * Team members have edit access, separate from roles
 * NOTE: Creators are NOT included - they should appear in "Your Events" instead
 * Returns array with eventId and eventTitle
 */
export async function getUserTeamMemberships(
  userId: string
): Promise<Array<{ eventId: string; eventTitle: string }>> {
  const session = driver.session();
  try {
    // Get events where user is a team member (exclude creators)
    const teamMemberResult = await session.run(
      `
      MATCH (u:User {id: $userId})-[rel:TEAM_MEMBER]->(e:Event)
      RETURN e.id as eventId, e.title as eventTitle
      `,
      { userId }
    );

    const teamMemberEvents = teamMemberResult.records.map((record) => ({
      eventId: record.get("eventId"),
      eventTitle: record.get("eventTitle") || "Untitled Event",
    }));

    return teamMemberEvents;
  } finally {
    await session.close();
  }
}

/**
 * Get event city ID from Neo4j
 * Note: cityId is stored as number in Neo4j but as string in PostgreSQL
 */
export async function getEventCityId(eventId: string): Promise<string | null> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (e:Event {id: $eventId})-[:IN]->(c:City)
      RETURN c.id as cityId
      LIMIT 1
      `,
      { eventId }
    );

    if (result.records.length === 0) {
      return null;
    }

    const cityId = result.records[0].get("cityId");
    // Convert Neo4j numeric cityId to string for PostgreSQL
    return cityId != null ? String(cityId) : null;
  } finally {
    await session.close();
  }
}

/**
 * Apply a tag to a user in Neo4j (for videos, sections, or event roles)
 * Throws error if event, video, or section doesn't exist
 * Role is required for videos and sections
 */
export async function applyTag(
  eventId: string,
  videoId: string | null,
  sectionId: string | null,
  userId: string,
  role?: string
): Promise<void> {
  const session = driver.session();
  try {
    // Validate event exists
    const eventExistsCheck = await eventExists(eventId);
    if (!eventExistsCheck) {
      throw new Error(`Event ${eventId} does not exist`);
    }

    // Validate parameter combinations:
    // - videoId + role: video tagging with role (e.g., "Dancer", "Winner")
    // - sectionId + role: section tagging with role (e.g., "Winner")
    // - role only: event role tagging (e.g., "Organizer", "DJ")
    // Invalid: videoId + sectionId, videoId without role, sectionId without role
    if (videoId && sectionId) {
      throw new Error("Cannot provide both videoId and sectionId");
    }
    if (videoId && !role) {
      throw new Error("Role is required when videoId is provided");
    }
    if (sectionId && !role) {
      throw new Error("Role is required when sectionId is provided");
    }
    if (!videoId && !sectionId && !role) {
      throw new Error(
        "At least one of videoId, sectionId, or role must be provided"
      );
    }

    if (videoId) {
      // Validate video exists and belongs to event
      const videoExists = await videoExistsInEvent(eventId, videoId);
      if (!videoExists) {
        throw new Error(`Video ${videoId} does not exist in event ${eventId}`);
      }

      // Role is required for video tags
      if (!role) {
        throw new Error("Role is required for video tags");
      }

      // Validate video role (allows both event roles and video-only roles like Dancer, Winner)
      if (!isValidVideoRole(role)) {
        throw new Error(
          `Invalid video role: ${role}. Must be one of: ${AVAILABLE_ROLES.join(
            ", "
          )}, ${VIDEO_ROLE_DANCER}, or ${VIDEO_ROLE_WINNER}`
        );
      }

      // Tag user in specific video with role property on the relationship
      // Support multiple roles by storing roles in an array
      // Handle both videos directly in sections and videos in brackets
      const neo4jRole = toNeo4jRoleFormat(role);
      console.log(
        "✅ [applyTag] Neo4j role:",
        eventId,
        videoId,
        userId,
        neo4jRole
      );
      await session.run(
        `
        MATCH (u:User {id: $userId})
        MATCH (v:Video {id: $videoId})
        WHERE (v)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
           OR (v)-[:IN]->(:Bracket)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
        MERGE (u)-[r:IN]->(v)
        ON CREATE SET r.roles = [$role]
        ON MATCH SET r.roles = CASE 
          WHEN $role IN r.roles THEN r.roles 
          ELSE r.roles + $role 
        END
        `,
        { eventId, videoId, userId, role: neo4jRole }
      );
    } else if (sectionId) {
      // Validate section exists and belongs to event
      const sectionExists = await sectionExistsInEvent(eventId, sectionId);
      if (!sectionExists) {
        throw new Error(
          `Section ${sectionId} does not exist in event ${eventId}`
        );
      }

      // Role is required for section tags
      if (!role) {
        throw new Error("Role is required for section tags");
      }

      // Validate section role (currently only Winner is supported)
      if (!isValidSectionRole(role)) {
        throw new Error(
          `Invalid section role: ${role}. Must be: ${SECTION_ROLE_WINNER}`
        );
      }

      // Tag user in specific section with role property on the relationship
      const neo4jRole = toNeo4jRoleFormat(role);
      console.log(
        "✅ [applyTag] Section tag:",
        eventId,
        sectionId,
        userId,
        neo4jRole
      );
      await session.run(
        `
        MATCH (u:User {id: $userId})
        MATCH (s:Section {id: $sectionId})
        WHERE (s)-[:IN]->(:Event {id: $eventId})
        MERGE (u)-[r:IN]->(s)
        SET r.role = $role
        `,
        { eventId, sectionId, userId, role: neo4jRole }
      );
    } else if (role) {
      // Validate role
      if (!isValidRole(role)) {
        throw new Error(
          `Invalid role: ${role}. Must be one of: ${AVAILABLE_ROLES.join(", ")}`
        );
      }

      // Tag user in event with specific role (converted to Neo4j format)
      const neo4jRole = toNeo4jRoleFormat(role);
      await session.run(
        `
        MATCH (u:User {id: $userId})
        MATCH (e:Event {id: $eventId})
        MERGE (u)-[r:${neo4jRole}]->(e)
        `,
        { eventId, userId, role: neo4jRole }
      );
    } else {
      // Default tagging relationship (no role specified)
      await session.run(
        `
        MATCH (u:User {id: $userId})
        MATCH (e:Event {id: $eventId})
        MERGE (u)-[:TAGGED]->(e)
        `,
        { eventId, userId }
      );
    }
  } finally {
    await session.close();
  }
}

/**
 * Get event title and createdAt from Neo4j
 */
export async function getEventTitle(eventId: string): Promise<string | null>;
export async function getEventTitle(
  eventId: string,
  includeCreatedAt: true
): Promise<{ title: string | null; createdAt: string | null }>;
export async function getEventTitle(
  eventId: string,
  includeCreatedAt?: boolean
): Promise<string | null | { title: string | null; createdAt: string | null }> {
  const session = driver.session();
  try {
    const result = await session.run(
      includeCreatedAt
        ? `
      MATCH (e:Event {id: $eventId})
      RETURN e.title as title, e.createdAt as createdAt
      LIMIT 1
      `
        : `
      MATCH (e:Event {id: $eventId})
      RETURN e.title as title
      LIMIT 1
      `,
      { eventId }
    );

    if (result.records.length === 0) {
      return includeCreatedAt ? { title: null, createdAt: null } : null;
    }

    if (includeCreatedAt) {
      return {
        title: result.records[0].get("title"),
        createdAt: result.records[0].get("createdAt"),
      };
    }

    return result.records[0].get("title");
  } finally {
    await session.close();
  }
}

/**
 * Get video title from Neo4j
 */
export async function getVideoTitle(videoId: string): Promise<string | null> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (v:Video {id: $videoId})
      RETURN v.title as title
      LIMIT 1
      `,
      { videoId }
    );

    if (result.records.length === 0) {
      return null;
    }

    return result.records[0].get("title");
  } finally {
    await session.close();
  }
}

/**
 * Check if a user is tagged in a video
 * Returns true if user has (User)-[:IN]->(Video) relationship
 */
export async function isUserTaggedInVideo(
  eventId: string,
  videoId: string,
  userId: string
): Promise<boolean> {
  const session = driver.session();
  try {
    // Validate video exists and belongs to event
    const videoExists = await videoExistsInEvent(eventId, videoId);
    if (!videoExists) {
      return false;
    }

    const result = await session.run(
      `
      MATCH (u:User {id: $userId})-[:IN]->(v:Video {id: $videoId})
      WHERE (v)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
         OR (v)-[:IN]->(:Bracket)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
      RETURN count(v) as count
      `,
      { eventId, videoId, userId }
    );

    const count = result.records[0]?.get("count")?.toNumber() || 0;
    return count > 0;
  } finally {
    await session.close();
  }
}

/**
 * Check if a user has a specific role in a video
 * Returns true if user has (User)-[r:IN]->(Video) relationship with the specified role
 */
export async function isUserTaggedInVideoWithRole(
  eventId: string,
  videoId: string,
  userId: string,
  role: string
): Promise<boolean> {
  const session = driver.session();
  try {
    // Validate video exists and belongs to event
    const videoExists = await videoExistsInEvent(eventId, videoId);
    if (!videoExists) {
      return false;
    }

    const neo4jRole = toNeo4jRoleFormat(role);

    const result = await session.run(
      `
      MATCH (u:User {id: $userId})-[r:IN]->(v:Video {id: $videoId})
      WHERE (v)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
         OR (v)-[:IN]->(:Bracket)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
      WITH r, v,
           CASE 
             WHEN r.roles IS NOT NULL THEN r.roles
             WHEN r.role IS NOT NULL THEN [r.role]
             ELSE []
           END as roles
      WHERE $role IN roles
      RETURN count(v) as count
      `,
      { eventId, videoId, userId, role: neo4jRole }
    );

    const count = result.records[0]?.get("count")?.toNumber() || 0;
    return count > 0;
  } finally {
    await session.close();
  }
}

/**
 * Check if a user is a winner of a section
 * Returns true if user has (User)-[r:IN {role: "WINNER"}]->(Section) relationship
 */
export async function isUserWinnerOfSection(
  eventId: string,
  sectionId: string,
  userId: string
): Promise<boolean> {
  const session = driver.session();
  try {
    // Validate section exists and belongs to event
    const sectionExists = await sectionExistsInEvent(eventId, sectionId);
    if (!sectionExists) {
      return false;
    }

    const result = await session.run(
      `
      MATCH (u:User {id: $userId})-[r:IN]->(s:Section {id: $sectionId})
      WHERE (s)-[:IN]->(:Event {id: $eventId})
      WITH r, s,
           CASE 
             WHEN r.roles IS NOT NULL THEN r.roles
             WHEN r.role IS NOT NULL THEN [r.role]
             ELSE []
           END as roles
      WHERE "WINNER" IN roles
      RETURN count(s) as count
      `,
      { eventId, sectionId, userId }
    );

    const count = result.records[0]?.get("count")?.toNumber() || 0;
    return count > 0;
  } finally {
    await session.close();
  }
}

/**
 * Remove a tag from a user (for videos, sections, or event roles)
 * Deletes the relationship in Neo4j
 * Throws error if event, video, or section doesn't exist
 */
export async function removeTag(
  eventId: string,
  videoId: string | null,
  sectionId: string | null,
  userId: string,
  role?: string
): Promise<void> {
  const session = driver.session();
  try {
    // Validate event exists
    const eventExistsCheck = await eventExists(eventId);
    if (!eventExistsCheck) {
      throw new Error(`Event ${eventId} does not exist`);
    }

    if (videoId) {
      // Validate video exists and belongs to event
      const videoExists = await videoExistsInEvent(eventId, videoId);
      if (!videoExists) {
        throw new Error(`Video ${videoId} does not exist in event ${eventId}`);
      }

      // Remove user tag from specific video
      // If role is specified, remove only that role from the array; otherwise delete the relationship
      if (role) {
        const neo4jRole = toNeo4jRoleFormat(role);
        await session.run(
          `
          MATCH (u:User {id: $userId})-[r:IN]->(v:Video {id: $videoId})
          WHERE (v)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
             OR (v)-[:IN]->(:Bracket)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
          WITH r,
               CASE 
                 WHEN r.roles IS NOT NULL THEN [role IN r.roles WHERE role <> $role]
                 WHEN r.role = $role THEN []
                 ELSE []
               END as newRoles
          SET r.roles = newRoles
          WITH r, newRoles
          WHERE size(newRoles) = 0
          DELETE r
          `,
          { eventId, videoId, userId, role: neo4jRole }
        );
      } else {
        // Remove entire relationship if no specific role
        await session.run(
          `
          MATCH (u:User {id: $userId})-[r:IN]->(v:Video {id: $videoId})
          WHERE (v)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
             OR (v)-[:IN]->(:Bracket)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
          DELETE r
          `,
          { eventId, videoId, userId }
        );
      }
    } else if (sectionId) {
      // Validate section exists and belongs to event
      const sectionExists = await sectionExistsInEvent(eventId, sectionId);
      if (!sectionExists) {
        throw new Error(
          `Section ${sectionId} does not exist in event ${eventId}`
        );
      }

      // Remove user tag from specific section
      await session.run(
        `
        MATCH (u:User {id: $userId})-[r:IN]->(s:Section {id: $sectionId})
        WHERE (s)-[:IN]->(:Event {id: $eventId})
        DELETE r
        `,
        { eventId, sectionId, userId }
      );
    } else if (role) {
      // Validate role
      if (!isValidRole(role)) {
        throw new Error(
          `Invalid role: ${role}. Must be one of: ${AVAILABLE_ROLES.join(", ")}`
        );
      }

      // Remove role relationship (converted to Neo4j format)
      const neo4jRole = toNeo4jRoleFormat(role);
      await session.run(
        `
        MATCH (u:User {id: $userId})-[r:${neo4jRole}]->(e:Event {id: $eventId})
        DELETE r
        `,
        { eventId, userId, role: neo4jRole }
      );
    } else {
      // Remove default tagging relationship
      await session.run(
        `
        MATCH (u:User {id: $userId})-[r:TAGGED]->(e:Event {id: $eventId})
        DELETE r
        `,
        { eventId, userId }
      );
    }
  } finally {
    await session.close();
  }
}
