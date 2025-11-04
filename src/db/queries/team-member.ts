import driver from "../driver";
import {
  toNeo4jRoleFormat,
  isValidRole,
  AVAILABLE_ROLES,
} from "@/lib/utils/roles";

/**
 * Get team members (users with edit access) for an event from Neo4j
 * Team members are separate from roles - they grant edit access
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

    // Also include the event creator as a team member
    const creatorId = await getEventCreator(eventId);
    if (creatorId && !teamMemberIds.includes(creatorId)) {
      teamMemberIds.push(creatorId);
    }

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
 */
export async function isTeamMember(
  eventId: string,
  userId: string
): Promise<boolean> {
  const session = driver.session();
  try {
    // Check if user is creator (creators automatically have team member access)
    const creatorId = await getEventCreator(eventId);
    if (creatorId === userId) {
      return true;
    }

    // Check if user has TEAM_MEMBER relationship
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
 */
export async function getUserTeamMemberships(
  userId: string
): Promise<Array<{ eventId: string }>> {
  const session = driver.session();
  try {
    // Get events where user is a team member
    const teamMemberResult = await session.run(
      `
      MATCH (u:User {id: $userId})-[rel:TEAM_MEMBER]->(e:Event)
      RETURN e.id as eventId
      `,
      { userId }
    );

    const teamMemberEvents = teamMemberResult.records.map((record) => ({
      eventId: record.get("eventId"),
    }));

    // Also include events where user is creator
    const creatorResult = await session.run(
      `
      MATCH (u:User {id: $userId})-[rel:CREATED]->(e:Event)
      RETURN e.id as eventId
      `,
      { userId }
    );

    const creatorEvents = creatorResult.records.map((record) => ({
      eventId: record.get("eventId"),
    }));

    // Combine and deduplicate
    const allEvents = [...teamMemberEvents, ...creatorEvents];
    const uniqueEvents = Array.from(
      new Map(allEvents.map((e) => [e.eventId, e])).values()
    );

    return uniqueEvents;
  } finally {
    await session.close();
  }
}

/**
 * Get event city ID from Neo4j
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

    return result.records[0].get("cityId");
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

      // Tag user in specific video
      await session.run(
        `
        MATCH (u:User {id: $userId})
        MATCH (v:Video {id: $videoId})-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
        MERGE (u)-[:IN]->(v)
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
 * Get event title from Neo4j
 */
export async function getEventTitle(eventId: string): Promise<string | null> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (e:Event {id: $eventId})
      RETURN e.title as title
      LIMIT 1
      `,
      { eventId }
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
