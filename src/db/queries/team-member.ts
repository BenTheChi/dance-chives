import driver from "../driver";
import {
  toNeo4jRoleFormat,
  isValidRole,
  AVAILABLE_ROLES,
  VIDEO_ROLE_DANCER,
  isValidVideoRole,
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
 * Apply a tag to a user in Neo4j (for videos or event roles)
 * Throws error if event or video doesn't exist
 */
export async function applyTag(
  eventId: string,
  videoId: string | null,
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

      // Default to "Dancer" role for video tags if no role specified
      const videoRole = role || VIDEO_ROLE_DANCER;

      // Validate video role (allows both event roles and video-only roles like Dancer)
      if (!isValidVideoRole(videoRole)) {
        throw new Error(
          `Invalid video role: ${videoRole}. Must be one of: ${AVAILABLE_ROLES.join(
            ", "
          )}, or ${VIDEO_ROLE_DANCER}`
        );
      }

      // Tag user in specific video with role property on the relationship
      // Handle both videos directly in sections and videos in brackets
      const neo4jRole = toNeo4jRoleFormat(videoRole);
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
        SET r.role = $role
        `,
        { eventId, videoId, userId, role: neo4jRole }
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
      // Default tagging relationship
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
 * Remove a tag from a user (for videos or event roles)
 * Deletes the relationship in Neo4j
 * Throws error if event or video doesn't exist
 */
export async function removeTag(
  eventId: string,
  videoId: string | null,
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
      await session.run(
        `
        MATCH (u:User {id: $userId})-[r:IN]->(v:Video {id: $videoId})
        WHERE (v)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
           OR (v)-[:IN]->(:Bracket)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
        DELETE r
        `,
        { eventId, videoId, userId }
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
