import driver from "../driver";
import {
  toNeo4jRoleFormat,
  isValidRole,
  AVAILABLE_ROLES,
  VIDEO_ROLE_DANCER,
  isValidVideoRole,
  VIDEO_ROLE_WINNER,
} from "@/lib/utils/roles";
import {
  getAllEventTypeLabels,
  getEventTypeFromLabel,
} from "@/db/queries/event";

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
 * Check if a video belongs to a workshop
 */
export async function videoBelongsToWorkshop(
  videoId: string
): Promise<boolean> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (v:Video {id: $videoId})-[:IN]->(w:Event:Workshop)
      RETURN count(v) as count
      `,
      { videoId }
    );
    const count = result.records[0]?.get("count")?.toNumber() || 0;
    return count > 0;
  } finally {
    await session.close();
  }
}

/**
 * Check if a video belongs to a session
 */
export async function videoBelongsToSession(videoId: string): Promise<boolean> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (v:Video {id: $videoId})-[:IN]->(s:Event:Session)
      RETURN count(v) as count
      `,
      { videoId }
    );
    const count = result.records[0]?.get("count")?.toNumber() || 0;
    return count > 0;
  } finally {
    await session.close();
  }
}

/**
 * Check if a video exists in Neo4j and belongs to the event
 * Supports videos in competitions (through Sections/Brackets), workshops, and sessions
 */
export async function videoExistsInEvent(
  eventId: string,
  videoId: string
): Promise<boolean> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      // Check for competition videos (through Sections)
      MATCH (e:Event {id: $eventId})<-[:IN]-(s:Section)<-[:IN]-(v:Video {id: $videoId})
      RETURN count(v) as count
      UNION
      // Check for competition videos (through Brackets)
      MATCH (e:Event {id: $eventId})<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video {id: $videoId})
      RETURN count(v) as count
      UNION
      // Check for workshop videos (directly connected)
      MATCH (e:Event:Workshop {id: $eventId})<-[:IN]-(v:Video {id: $videoId})
      RETURN count(v) as count
      UNION
      // Check for session videos (directly connected)
      MATCH (e:Event:Session {id: $eventId})<-[:IN]-(v:Video {id: $videoId})
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
// Generic function to check if user is event creator (works for all event types)
export async function isEventCreator(
  eventId: string,
  userId: string
): Promise<boolean> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (e:Event {id: $eventId})<-[:CREATED]-(u:User {id: $userId})
      RETURN count(e) as count
      `,
      { eventId, userId }
    );
    const count = result.records[0]?.get("count")?.toNumber() || 0;
    return count > 0;
  } finally {
    await session.close();
  }
}

// Legacy alias for backwards compatibility
export async function isCompetitionCreator(
  competitionId: string,
  userId: string
): Promise<boolean> {
  const creatorId = await getEventCreator(competitionId);
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
 * Remove a user as a team member from an event in Neo4j
 * Works for all event types (competitions, workshops, sessions)
 */
export async function removeTeamMember(
  eventId: string,
  userId: string
): Promise<void> {
  const session = driver.session();
  try {
    await session.run(
      `
      MATCH (e:Event {id: $eventId})<-[rel:TEAM_MEMBER]-(u:User {id: $userId})
      DELETE rel
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
 * Note: cityId is stored as string (place_id) in both Neo4j and PostgreSQL
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
    // cityId is already a string (place_id)
    return cityId != null ? String(cityId) : null;
  } finally {
    await session.close();
  }
}

/**
 * Set video roles for a user declaratively
 * Replaces all existing role relationships with the specified roles
 * Uses relationship types :DANCER, :WINNER, :CHOREOGRAPHER, and :TEACHER
 * Automatically ensures DANCER is present if WINNER is specified
 * Supports videos in competitions (through Sections/Brackets), workshops, and sessions
 */
export async function setVideoRoles(
  eventId: string,
  videoId: string,
  userId: string,
  roles: string[]
): Promise<void> {
  const session = driver.session();
  try {
    // Validate event exists
    const eventExistsCheck = await eventExists(eventId);
    if (!eventExistsCheck) {
      throw new Error(`Event ${eventId} does not exist`);
    }

    // Validate video exists and belongs to event
    const videoExists = await videoExistsInEvent(eventId, videoId);
    if (!videoExists) {
      throw new Error(`Video ${videoId} does not exist in event ${eventId}`);
    }

    // Validate all roles - allow Choreographer and Teacher in addition to Dancer and Winner
    for (const role of roles) {
      const roleUpper = role.toUpperCase();
      const isValid =
        isValidVideoRole(role) ||
        roleUpper === "CHOREOGRAPHER" ||
        roleUpper === "TEACHER";
      if (!isValid) {
        throw new Error(
          `Invalid video role: ${role}. Must be one of: ${AVAILABLE_ROLES.join(
            ", "
          )}, ${VIDEO_ROLE_DANCER}, ${VIDEO_ROLE_WINNER}, Choreographer, or Teacher`
        );
      }
    }

    // Normalize roles to Neo4j format and ensure DANCER if WINNER is present
    const normalizedRoles = roles.map((r) => {
      const rUpper = r.toUpperCase();
      if (rUpper === "CHOREOGRAPHER" || rUpper === "TEACHER") {
        return rUpper;
      }
      return toNeo4jRoleFormat(r);
    });
    const hasWinner =
      normalizedRoles.includes("WINNER") ||
      normalizedRoles.includes(VIDEO_ROLE_WINNER.toUpperCase());
    const hasDancer =
      normalizedRoles.includes("DANCER") ||
      normalizedRoles.includes(VIDEO_ROLE_DANCER.toUpperCase());

    // Ensure DANCER is included if WINNER is present
    const finalRoles = new Set(normalizedRoles);
    if (hasWinner && !hasDancer) {
      finalRoles.add("DANCER");
    }

    console.log(
      `✅ [setVideoRoles] Setting roles for user ${userId} in video ${videoId}:`,
      Array.from(finalRoles)
    );

    // Delete all existing role relationships for this user-video pair
    await session.run(
      `
      MATCH (u:User {id: $userId})-[r:DANCER|WINNER|CHOREOGRAPHER|TEACHER]->(v:Video {id: $videoId})
      WHERE (v)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
         OR (v)-[:IN]->(:Bracket)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
         OR (v)-[:IN]->(:Event:Workshop {id: $eventId})
         OR (v)-[:IN]->(:Event:Session {id: $eventId})
      DELETE r
      `,
      { eventId, videoId, userId }
    );

    // Create new relationships for each role
    // Use conditional logic since Cypher doesn't support dynamic relationship types in MERGE
    const whereClause = `WHERE (v)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
           OR (v)-[:IN]->(:Bracket)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
           OR (v)-[:IN]->(:Event:Workshop {id: $eventId})
           OR (v)-[:IN]->(:Event:Session {id: $eventId})`;

    if (finalRoles.has("DANCER")) {
      await session.run(
        `
        MATCH (u:User {id: $userId})
        MATCH (v:Video {id: $videoId})
        ${whereClause}
        MERGE (u)-[:DANCER]->(v)
        `,
        { eventId, videoId, userId }
      );
    }
    if (finalRoles.has("WINNER")) {
      await session.run(
        `
        MATCH (u:User {id: $userId})
        MATCH (v:Video {id: $videoId})
        ${whereClause}
        MERGE (u)-[:WINNER]->(v)
        `,
        { eventId, videoId, userId }
      );
    }
    if (finalRoles.has("CHOREOGRAPHER")) {
      await session.run(
        `
        MATCH (u:User {id: $userId})
        MATCH (v:Video {id: $videoId})
        ${whereClause}
        MERGE (u)-[:CHOREOGRAPHER]->(v)
        `,
        { eventId, videoId, userId }
      );
    }
    if (finalRoles.has("TEACHER")) {
      await session.run(
        `
        MATCH (u:User {id: $userId})
        MATCH (v:Video {id: $videoId})
        ${whereClause}
        MERGE (u)-[:TEACHER]->(v)
        `,
        { eventId, videoId, userId }
      );
    }
  } finally {
    await session.close();
  }
}

/**
 * Set section winner declaratively
 * Uses :WINNER relationship type instead of :IN with property
 * If userId is null, removes all winners from the section
 */
export async function setSectionWinner(
  eventId: string,
  sectionId: string,
  userId: string | null
): Promise<void> {
  const session = driver.session();
  try {
    // Validate event exists
    const eventExistsCheck = await eventExists(eventId);
    if (!eventExistsCheck) {
      throw new Error(`Event ${eventId} does not exist`);
    }

    // Validate section exists and belongs to event
    const sectionExists = await sectionExistsInEvent(eventId, sectionId);
    if (!sectionExists) {
      throw new Error(
        `Section ${sectionId} does not exist in event ${eventId}`
      );
    }

    if (userId === null) {
      // Remove all winners from section
      console.log(
        `✅ [setSectionWinner] Removing all winners from section ${sectionId}`
      );
      await session.run(
        `
        MATCH (s:Section {id: $sectionId})<-[r:WINNER]-(u:User)
        WHERE (s)-[:IN]->(:Event {id: $eventId})
        DELETE r
        `,
        { eventId, sectionId }
      );
    } else {
      // Set user as winner (remove all other winners first, then add this one)
      console.log(
        `✅ [setSectionWinner] Setting user ${userId} as winner of section ${sectionId}`
      );
      await session.run(
        `
        MATCH (s:Section {id: $sectionId})<-[r:WINNER]-(u:User)
        WHERE (s)-[:IN]->(:Event {id: $eventId})
        DELETE r
        WITH s
        MATCH (u:User {id: $userId})
        MATCH (s:Section {id: $sectionId})
        WHERE (s)-[:IN]->(:Event {id: $eventId})
        MERGE (u)-[:WINNER]->(s)
        `,
        { eventId, sectionId, userId }
      );
    }
  } finally {
    await session.close();
  }
}

/**
 * Set multiple section winners declaratively
 * Uses :WINNER relationship type instead of :IN with property
 * If userIds is empty array, removes all winners from the section
 * Replaces all existing winners with the new set
 */
export async function setSectionWinners(
  eventId: string,
  sectionId: string,
  userIds: string[]
): Promise<void> {
  const session = driver.session();
  try {
    // Validate event exists
    const eventExistsCheck = await eventExists(eventId);
    if (!eventExistsCheck) {
      throw new Error(`Event ${eventId} does not exist`);
    }

    // Validate section exists and belongs to event
    const sectionExists = await sectionExistsInEvent(eventId, sectionId);
    if (!sectionExists) {
      throw new Error(
        `Section ${sectionId} does not exist in event ${eventId}`
      );
    }

    // Remove all existing winners first
    await session.run(
      `
      MATCH (s:Section {id: $sectionId})<-[r:WINNER]-(u:User)
      WHERE (s)-[:IN]->(:Event {id: $eventId})
      DELETE r
      `,
      { eventId, sectionId }
    );

    // Add new winners if any
    if (userIds.length > 0) {
      console.log(
        `✅ [setSectionWinners] Setting ${userIds.length} winners for section ${sectionId}`
      );
      await session.run(
        `
        MATCH (s:Section {id: $sectionId})
        WHERE (s)-[:IN]->(:Event {id: $eventId})
        WITH s
        UNWIND $userIds as userId
        MATCH (u:User {id: userId})
        MERGE (u)-[:WINNER]->(s)
        `,
        { eventId, sectionId, userIds }
      );
    } else {
      console.log(
        `✅ [setSectionWinners] Removed all winners from section ${sectionId}`
      );
    }
  } finally {
    await session.close();
  }
}

/**
 * Set section judge declaratively
 * Uses :JUDGE relationship type instead of :IN with property
 * If userId is null, removes all judges from the section
 */
export async function setSectionJudge(
  eventId: string,
  sectionId: string,
  userId: string | null
): Promise<void> {
  const session = driver.session();
  try {
    // Validate event exists
    const eventExistsCheck = await eventExists(eventId);
    if (!eventExistsCheck) {
      throw new Error(`Event ${eventId} does not exist`);
    }

    // Validate section exists and belongs to event
    const sectionExists = await sectionExistsInEvent(eventId, sectionId);
    if (!sectionExists) {
      throw new Error(
        `Section ${sectionId} does not exist in event ${eventId}`
      );
    }

    if (userId === null) {
      // Remove all judges from section
      console.log(
        `✅ [setSectionJudge] Removing all judges from section ${sectionId}`
      );
      await session.run(
        `
        MATCH (s:Section {id: $sectionId})<-[r:JUDGE]-(u:User)
        WHERE (s)-[:IN]->(:Event {id: $eventId})
        DELETE r
        `,
        { eventId, sectionId }
      );
    } else {
      // Set user as judge (remove all other judges first, then add this one)
      console.log(
        `✅ [setSectionJudge] Setting user ${userId} as judge of section ${sectionId}`
      );
      await session.run(
        `
        MATCH (s:Section {id: $sectionId})<-[r:JUDGE]-(u:User)
        WHERE (s)-[:IN]->(:Event {id: $eventId})
        DELETE r
        WITH s
        MATCH (u:User {id: $userId})
        MATCH (s:Section {id: $sectionId})
        WHERE (s)-[:IN]->(:Event {id: $eventId})
        MERGE (u)-[:JUDGE]->(s)
        `,
        { eventId, sectionId, userId }
      );
    }
  } finally {
    await session.close();
  }
}

/**
 * Set multiple section judges declaratively
 * Uses :JUDGE relationship type instead of :IN with property
 * If userIds is empty array, removes all judges from the section
 * Replaces all existing judges with the new set
 */
export async function setSectionJudges(
  eventId: string,
  sectionId: string,
  userIds: string[]
): Promise<void> {
  const session = driver.session();
  try {
    // Validate event exists
    const eventExistsCheck = await eventExists(eventId);
    if (!eventExistsCheck) {
      throw new Error(`Event ${eventId} does not exist`);
    }

    // Validate section exists and belongs to event
    const sectionExists = await sectionExistsInEvent(eventId, sectionId);
    if (!sectionExists) {
      throw new Error(
        `Section ${sectionId} does not exist in event ${eventId}`
      );
    }

    // Remove all existing judges first
    await session.run(
      `
      MATCH (s:Section {id: $sectionId})<-[r:JUDGE]-(u:User)
      WHERE (s)-[:IN]->(:Event {id: $eventId})
      DELETE r
      `,
      { eventId, sectionId }
    );

    // Add new judges if any
    if (userIds.length > 0) {
      console.log(
        `✅ [setSectionJudges] Setting ${userIds.length} judges for section ${sectionId}`
      );
      await session.run(
        `
        MATCH (s:Section {id: $sectionId})
        WHERE (s)-[:IN]->(:Event {id: $eventId})
        WITH s
        UNWIND $userIds as userId
        MATCH (u:User {id: userId})
        MERGE (u)-[:JUDGE]->(s)
        `,
        { eventId, sectionId, userIds }
      );
    } else {
      console.log(
        `✅ [setSectionJudges] Removed all judges from section ${sectionId}`
      );
    }
  } finally {
    await session.close();
  }
}

/**
 * Set event role for a user in Neo4j
 * Creates a relationship between the user and event with the specified role
 * Throws error if event doesn't exist or role is invalid
 */
export async function setEventRoles(
  eventId: string,
  userId: string,
  role: string
): Promise<void> {
  const session = driver.session();
  try {
    // Validate event exists
    const eventExistsCheck = await eventExists(eventId);
    if (!eventExistsCheck) {
      throw new Error(`Event ${eventId} does not exist`);
    }

    // Validate role
    if (!isValidRole(role)) {
      throw new Error(
        `Invalid role: ${role}. Must be one of: ${AVAILABLE_ROLES.join(", ")}`
      );
    }

    // Tag user in event with specific role (converted to Neo4j format)
    const neo4jRole = toNeo4jRoleFormat(role);
    console.log(
      "✅ [setEventRoles] Setting event role:",
      eventId,
      userId,
      neo4jRole
    );
    await session.run(
      `
      MATCH (u:User {id: $userId})
      MATCH (e:Event {id: $eventId})
      MERGE (u)-[r:${neo4jRole}]->(e)
      `,
      { eventId, userId, role: neo4jRole }
    );
  } finally {
    await session.close();
  }
}

/**
 * Set workshop role for a user in Neo4j
 * Creates a relationship between the user and workshop with the specified role
 * Throws error if workshop doesn't exist or role is invalid
 */
export async function setWorkshopRoles(
  workshopId: string,
  userId: string,
  role: string
): Promise<void> {
  const session = driver.session();
  try {
    // Validate workshop exists
    const workshopCheck = await session.run(
      `
      MATCH (w:Workshop {id: $workshopId})
      RETURN w
      `,
      { workshopId }
    );
    if (workshopCheck.records.length === 0) {
      throw new Error(`Workshop ${workshopId} does not exist`);
    }

    // Import here to avoid circular dependency
    const { isValidWorkshopRole, WORKSHOP_ROLES } = await import(
      "@/lib/utils/roles"
    );

    // Validate role
    if (!isValidWorkshopRole(role)) {
      throw new Error(
        `Invalid role: ${role}. Must be one of: ${WORKSHOP_ROLES.join(", ")}`
      );
    }

    // Tag user in workshop with specific role
    // Workshop roles are already in uppercase format
    const neo4jRole = role.toUpperCase();
    console.log(
      "✅ [setWorkshopRoles] Setting workshop role:",
      workshopId,
      userId,
      neo4jRole
    );
    await session.run(
      `
      MATCH (u:User {id: $userId})
      MATCH (w:Workshop {id: $workshopId})
      MERGE (u)-[r:${neo4jRole}]->(w)
      `,
      { workshopId, userId, role: neo4jRole }
    );
  } finally {
    await session.close();
  }
}

/**
 * Set session role for a user in Neo4j
 * Creates a relationship between the user and session with the specified role
 * Throws error if session doesn't exist or role is invalid
 */
export async function setSessionRoles(
  sessionId: string,
  userId: string,
  role: string
): Promise<void> {
  const session = driver.session();
  try {
    // Validate session exists
    const sessionCheck = await session.run(
      `
      MATCH (s:Session {id: $sessionId})
      RETURN s
      `,
      { sessionId }
    );
    if (sessionCheck.records.length === 0) {
      throw new Error(`Session ${sessionId} does not exist`);
    }

    // Validate role (sessions use Event roles)
    if (!isValidRole(role)) {
      throw new Error(
        `Invalid role: ${role}. Must be one of: ${AVAILABLE_ROLES.join(", ")}`
      );
    }

    // Tag user in session with specific role (converted to Neo4j format)
    const neo4jRole = toNeo4jRoleFormat(role);
    console.log(
      "✅ [setSessionRoles] Setting session role:",
      sessionId,
      userId,
      neo4jRole
    );
    await session.run(
      `
      MATCH (u:User {id: $userId})
      MATCH (s:Session {id: $sessionId})
      MERGE (u)-[r:${neo4jRole}]->(s)
      `,
      { sessionId, userId, role: neo4jRole }
    );
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
 * Get event type from Neo4j
 */
export async function getEventType(eventId: string): Promise<string | null> {
  const session = driver.session();
  try {
    const allEventTypeLabels = getAllEventTypeLabels();
    const result = await session.run(
      `
      MATCH (e:Event {id: $eventId})
      WITH [label IN labels(e) WHERE label IN $allEventTypeLabels][0] as eventTypeLabel
      RETURN eventTypeLabel
      LIMIT 1
      `,
      { eventId, allEventTypeLabels }
    );

    if (result.records.length === 0) {
      return null;
    }

    const eventTypeLabel = result.records[0].get("eventTypeLabel");
    if (!eventTypeLabel) {
      return null;
    }

    // Convert label to EventType using helper function
    return getEventTypeFromLabel(eventTypeLabel);
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
 * Get session title from Neo4j
 */
export async function getSessionTitle(
  sessionId: string
): Promise<string | null> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (s:Session {id: $sessionId})
      RETURN s.title as title
      LIMIT 1
      `,
      { sessionId }
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
 * Get workshop title from Neo4j
 */
export async function getWorkshopTitle(
  workshopId: string
): Promise<string | null> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (w:Workshop {id: $workshopId})
      RETURN w.title as title
      LIMIT 1
      `,
      { workshopId }
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
 * Returns true if user has any role relationship (:DANCER, :WINNER, :CHOREOGRAPHER, or :TEACHER) with the video
 * Supports videos in competitions (through Sections/Brackets), workshops, and sessions
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
      MATCH (u:User {id: $userId})-[r:DANCER|WINNER|CHOREOGRAPHER|TEACHER]->(v:Video {id: $videoId})
      WHERE (v)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
         OR (v)-[:IN]->(:Bracket)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
         OR (v)-[:IN]->(:Event:Workshop {id: $eventId})
         OR (v)-[:IN]->(:Event:Session {id: $eventId})
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
 * Returns true if user has relationship of the specified type (:DANCER, :WINNER, :CHOREOGRAPHER, or :TEACHER) with the video
 * Supports videos in competitions (through Sections/Brackets), workshops, and sessions
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
    const roleUpper = role.toUpperCase();

    // Map role to relationship type - use conditional queries since Cypher doesn't support dynamic relationship types
    let result;
    if (neo4jRole === "DANCER" || roleUpper === "DANCER") {
      result = await session.run(
        `
        MATCH (u:User {id: $userId})-[r:DANCER]->(v:Video {id: $videoId})
        WHERE (v)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
           OR (v)-[:IN]->(:Bracket)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
           OR (v)-[:IN]->(:Event:Workshop {id: $eventId})
           OR (v)-[:IN]->(:Event:Session {id: $eventId})
        RETURN count(v) as count
        `,
        { eventId, videoId, userId }
      );
    } else if (neo4jRole === "WINNER" || roleUpper === "WINNER") {
      result = await session.run(
        `
        MATCH (u:User {id: $userId})-[r:WINNER]->(v:Video {id: $videoId})
        WHERE (v)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
           OR (v)-[:IN]->(:Bracket)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
           OR (v)-[:IN]->(:Event:Workshop {id: $eventId})
           OR (v)-[:IN]->(:Event:Session {id: $eventId})
        RETURN count(v) as count
        `,
        { eventId, videoId, userId }
      );
    } else if (roleUpper === "CHOREOGRAPHER") {
      result = await session.run(
        `
        MATCH (u:User {id: $userId})-[r:CHOREOGRAPHER]->(v:Video {id: $videoId})
        WHERE (v)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
           OR (v)-[:IN]->(:Bracket)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
           OR (v)-[:IN]->(:Event:Workshop {id: $eventId})
           OR (v)-[:IN]->(:Event:Session {id: $eventId})
        RETURN count(v) as count
        `,
        { eventId, videoId, userId }
      );
    } else if (roleUpper === "TEACHER") {
      result = await session.run(
        `
        MATCH (u:User {id: $userId})-[r:TEACHER]->(v:Video {id: $videoId})
        WHERE (v)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
           OR (v)-[:IN]->(:Bracket)-[:IN]->(:Section)-[:IN]->(:Event {id: $eventId})
           OR (v)-[:IN]->(:Event:Workshop {id: $eventId})
           OR (v)-[:IN]->(:Event:Session {id: $eventId})
        RETURN count(v) as count
        `,
        { eventId, videoId, userId }
      );
    } else {
      return false;
    }

    const count = result.records[0]?.get("count")?.toNumber() || 0;
    return count > 0;
  } finally {
    await session.close();
  }
}

/**
 * Check if a user is a winner of a section
 * Returns true if user has :WINNER relationship with the section
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
      MATCH (u:User {id: $userId})-[r:WINNER]->(s:Section {id: $sectionId})
      WHERE (s)-[:IN]->(:Event {id: $eventId})
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
 * Check if a user is a judge of a section
 * Returns true if user has :JUDGE relationship with the section
 */
export async function isUserJudgeOfSection(
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
      MATCH (u:User {id: $userId})-[r:JUDGE]->(s:Section {id: $sectionId})
      WHERE (s)-[:IN]->(:Event {id: $eventId})
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
 * Get all winner user IDs for a section
 * Returns array of user IDs who are winners of the section
 */
export async function getSectionWinnerIds(
  eventId: string,
  sectionId: string
): Promise<string[]> {
  const session = driver.session();
  try {
    // Validate section exists and belongs to event
    const sectionExists = await sectionExistsInEvent(eventId, sectionId);
    if (!sectionExists) {
      return [];
    }

    const result = await session.run(
      `
      MATCH (u:User)-[r:WINNER]->(s:Section {id: $sectionId})
      WHERE (s)-[:IN]->(:Event {id: $eventId})
      RETURN collect(u.id) as winnerIds
      `,
      { eventId, sectionId }
    );

    const winnerIds = result.records[0]?.get("winnerIds") || [];
    return winnerIds;
  } finally {
    await session.close();
  }
}

/**
 * Get all judge user IDs for a section
 * Returns array of user IDs who are judges of the section
 */
export async function getSectionJudgeIds(
  eventId: string,
  sectionId: string
): Promise<string[]> {
  const session = driver.session();
  try {
    // Validate section exists and belongs to event
    const sectionExists = await sectionExistsInEvent(eventId, sectionId);
    if (!sectionExists) {
      return [];
    }

    const result = await session.run(
      `
      MATCH (u:User)-[r:JUDGE]->(s:Section {id: $sectionId})
      WHERE (s)-[:IN]->(:Event {id: $eventId})
      RETURN collect(u.id) as judgeIds
      `,
      { eventId, sectionId }
    );

    const judgeIds = result.records[0]?.get("judgeIds") || [];
    return judgeIds;
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

/**
 * Get the type of a video from its Neo4j labels
 * Returns "battle", "freestyle", "choreography", "class", or "other"
 */
export async function getVideoType(videoId: string): Promise<string | null> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (v:Video {id: $videoId})
      RETURN labels(v) as labels
      `,
      { videoId }
    );

    if (result.records.length === 0) {
      return null;
    }

    const labels = result.records[0]?.get("labels") || [];

    if (labels.includes("Battle")) {
      return "battle";
    } else if (labels.includes("Freestyle")) {
      return "freestyle";
    } else if (labels.includes("Choreography")) {
      return "choreography";
    } else if (labels.includes("Class")) {
      return "class";
    } else if (labels.includes("Other")) {
      return "other";
    }

    // Default to battle for backwards compatibility
    return "battle";
  } finally {
    await session.close();
  }
}
