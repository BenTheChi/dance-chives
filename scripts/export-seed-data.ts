import { PrismaClient } from "@prisma/client";
import driver from "../src/db/driver";
import { getEvent } from "../src/db/queries/event";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// Helper function to format TypeScript code
function formatValue(
  value: any,
  indent: number = 0,
  fieldName?: string
): string {
  const indentStr = "  ".repeat(indent);

  if (value === null) return "null";
  if (value === undefined) return "undefined";

  if (typeof value === "string") {
    // Check if it's an ISO date string
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return `new Date("${value}")`;
    }
    // Escape quotes and newlines
    const escaped = value
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n");
    return `"${escaped}"`;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  // Handle arrays BEFORE objects (arrays are objects in JS)
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value
      .map((item) => `${indentStr}  ${formatValue(item, indent + 1)}`)
      .join(",\n");
    return `[\n${items}\n${indentStr}]`;
  }

  // Handle Date objects - check multiple ways
  if (value instanceof Date) {
    return `new Date("${value.toISOString()}")`;
  }

  // Handle date-like objects (from Prisma/Neo4j serialization)
  if (value && typeof value === "object") {
    // Check if it's a Date object that was serialized
    if (
      value.constructor?.name === "Date" ||
      (value instanceof Object && value.toString().includes("Date"))
    ) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return `new Date("${date.toISOString()}")`;
        }
      } catch (e) {
        // Not a valid date
      }
    }

    // Try to convert to Date if it looks like a date object
    try {
      if (value.toISOString && typeof value.toISOString === "function") {
        return `new Date("${value.toISOString()}")`;
      }
    } catch (e) {
      // Not a date
    }

    // Handle Neo4j Integer type
    if ("toNumber" in value && typeof value.toNumber === "function") {
      return String(value.toNumber());
    }

    // Handle File objects (shouldn't exist in DB, but set to null if found)
    if (value instanceof File || value.constructor?.name === "File") {
      return "null";
    }

    // Check if it's an empty object - if field name suggests it's a date field, return null
    if (Object.keys(value).length === 0) {
      if (
        fieldName &&
        (fieldName.includes("Date") ||
          fieldName.includes("At") ||
          fieldName === "expires" ||
          fieldName === "usedAt")
      ) {
        return "null";
      }
      return "null";
    }
  }

  if (typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => {
        // For picture objects, always set file to null
        if (k === "file" && (value as any).type) {
          return `${indentStr}  ${k}: null`;
        }
        // Pass field name for date detection
        return `${indentStr}  ${k}: ${formatValue(v, indent + 1, k)}`;
      })
      .join(",\n");
    return entries ? `{\n${entries}\n${indentStr}}` : "{}";
  }

  return String(value);
}

// Helper to convert Prisma dates to proper Date objects
function normalizePrismaDates(records: any[]): any[] {
  return records.map((record: any) => {
    // Use structuredClone or manual copying to preserve Date objects
    const normalized: any = {};
    for (const key in record) {
      const value = record[key];
      // Check if this is a date field
      if (
        key.includes("Date") ||
        key.includes("At") ||
        key === "expires" ||
        key === "usedAt"
      ) {
        if (value === null || value === undefined) {
          normalized[key] = value;
        } else if (value instanceof Date) {
          // Preserve Date object directly
          normalized[key] = value;
        } else if (typeof value === "string") {
          // Convert ISO string to Date
          normalized[key] = new Date(value);
        } else if (value && typeof value === "object") {
          // Check if it's an empty object (serialization issue)
          if (Object.keys(value).length === 0) {
            normalized[key] = null;
          } else {
            // Try to extract date from object
            try {
              const dateStr =
                (value as any).toISOString?.() || (value as any).toString();
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                normalized[key] = date;
              } else {
                normalized[key] = null;
              }
            } catch {
              normalized[key] = null;
            }
          }
        } else {
          normalized[key] = value;
        }
      } else {
        // Copy non-date fields as-is
        normalized[key] = value;
      }
    }
    return normalized;
  });
}

// Extract PostgreSQL data
async function extractPostgreSQLData() {
  console.log("📊 Extracting PostgreSQL data...");

  const data: any = {};

  // Extract Users
  const usersRaw = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });
  data.users = normalizePrismaDates(usersRaw);
  console.log(`  ✅ Extracted ${data.users.length} users`);

  // Extract Accounts
  const accountsRaw = await prisma.account.findMany({
    orderBy: { createdAt: "asc" },
  });
  data.accounts = normalizePrismaDates(accountsRaw);
  console.log(`  ✅ Extracted ${data.accounts.length} accounts`);

  // Extract Events (PostgreSQL references)
  data.events = await prisma.event.findMany({
    orderBy: { id: "asc" },
  });
  console.log(`  ✅ Extracted ${data.events.length} event references`);

  // Extract TaggingRequests
  const taggingRequestsRaw = await prisma.taggingRequest.findMany({
    orderBy: { createdAt: "asc" },
  });
  data.taggingRequests = normalizePrismaDates(taggingRequestsRaw);
  console.log(`  ✅ Extracted ${data.taggingRequests.length} tagging requests`);

  // Extract TeamMemberRequests
  const teamMemberRequestsRaw = await prisma.teamMemberRequest.findMany({
    orderBy: { createdAt: "asc" },
  });
  data.teamMemberRequests = normalizePrismaDates(teamMemberRequestsRaw);
  console.log(
    `  ✅ Extracted ${data.teamMemberRequests.length} team member requests`
  );

  // Extract AuthLevelChangeRequests
  const authLevelChangeRequestsRaw =
    await prisma.authLevelChangeRequest.findMany({
      orderBy: { createdAt: "asc" },
    });
  data.authLevelChangeRequests = normalizePrismaDates(
    authLevelChangeRequestsRaw
  );
  console.log(
    `  ✅ Extracted ${data.authLevelChangeRequests.length} auth level change requests`
  );

  // Extract RequestApprovals
  const requestApprovalsRaw = await prisma.requestApproval.findMany({
    orderBy: { createdAt: "asc" },
  });
  data.requestApprovals = normalizePrismaDates(requestApprovalsRaw);
  console.log(
    `  ✅ Extracted ${data.requestApprovals.length} request approvals`
  );

  // Extract Notifications
  const notificationsRaw = await prisma.notification.findMany({
    orderBy: { createdAt: "asc" },
  });
  data.notifications = normalizePrismaDates(notificationsRaw);
  console.log(`  ✅ Extracted ${data.notifications.length} notifications`);

  // Extract Sessions (NextAuth)
  const sessionsRaw = await prisma.session.findMany({
    orderBy: { createdAt: "asc" },
  });
  data.sessions = normalizePrismaDates(sessionsRaw);
  console.log(`  ✅ Extracted ${data.sessions.length} sessions`);

  // Extract VerificationTokens
  const verificationTokensRaw = await prisma.verificationToken.findMany({
    orderBy: { identifier: "asc" },
  });
  data.verificationTokens = verificationTokensRaw.map((token: any) => ({
    ...token,
    expires:
      token.expires instanceof Date ? token.expires : new Date(token.expires),
  }));
  console.log(
    `  ✅ Extracted ${data.verificationTokens.length} verification tokens`
  );

  // Extract Authenticators
  data.authenticators = await prisma.authenticator.findMany({
    orderBy: { userId: "asc" },
  });
  console.log(`  ✅ Extracted ${data.authenticators.length} authenticators`);

  return data;
}

// Extract Neo4j data
async function extractNeo4jData() {
  console.log("📊 Extracting Neo4j data...");
  const session = driver.session();

  try {
    const data: any = {};

    // Extract Users with profiles
    const usersResult = await session.run(`
      MATCH (u:User)
      OPTIONAL MATCH (u)-[:LOCATED_IN]->(c:City)
      OPTIONAL MATCH (u)-[:STYLE]->(s:Style)
      RETURN u, c, collect(s.name) as styles
      ORDER BY u.id
    `);

    data.users = usersResult.records.map((record) => {
      const user = record.get("u").properties;
      const city = record.get("c");
      const styles = record.get("styles") || [];

      return {
        id: user.id,
        displayName: user.displayName || null,
        username: user.username || null,
        bio: user.bio || null,
        instagram: user.instagram || null,
        website: user.website || null,
        image: user.image || null,
        date: user.date || null,
        city: city
          ? {
              id: String(city.properties.id),
              name: city.properties.name,
              countryCode: city.properties.countryCode,
              region: city.properties.region || null,
              timezone: city.properties.timezone || null,
              latitude: city.properties.latitude
                ? Number(city.properties.latitude)
                : null,
              longitude: city.properties.longitude
                ? Number(city.properties.longitude)
                : null,
            }
          : null,
        styles: styles.filter((s: any) => s !== null),
      };
    });
    console.log(`  ✅ Extracted ${data.users.length} Neo4j users`);

    // Extract Cities
    const citiesResult = await session.run(`
      MATCH (c:City)
      RETURN c
      ORDER BY c.id
    `);

    data.cities = citiesResult.records.map((record) => {
      const city = record.get("c").properties;
      return {
        id: String(city.id),
        name: city.name,
        countryCode: city.countryCode,
        region: city.region || null,
        timezone: city.timezone || null,
        latitude: city.latitude ? Number(city.latitude) : null,
        longitude: city.longitude ? Number(city.longitude) : null,
      };
    });
    console.log(`  ✅ Extracted ${data.cities.length} cities`);

    // Get all event IDs first (excluding workshops and sessions which are handled separately)
    const eventIdsResult = await session.run(`
      MATCH (e:Event)
      WHERE NOT ('WorkshopEvent' IN labels(e) OR 'SessionEvent' IN labels(e))
      RETURN e.id as eventId
      ORDER BY e.id
    `);

    const eventIds = eventIdsResult.records.map((r) => r.get("eventId"));
    console.log(`  📋 Found ${eventIds.length} events to extract`);

    // Extract Events using existing getEvent function
    data.events = [];
    for (const eventId of eventIds) {
      try {
        const event = await getEvent(eventId);
        data.events.push(event);
      } catch (error) {
        console.error(`  ⚠️  Error extracting event ${eventId}:`, error);
      }
    }
    console.log(`  ✅ Extracted ${data.events.length} events`);

    // Get all workshop event IDs (Events with WorkshopEvent label)
    const workshopIdsResult = await session.run(`
      MATCH (e:Event:WorkshopEvent)
      RETURN e.id as eventId
      ORDER BY e.id
    `);

    const workshopIds = workshopIdsResult.records.map((r) => r.get("eventId"));
    console.log(`  📋 Found ${workshopIds.length} workshop events to extract`);

    // Extract Workshop events using getEvent function
    data.workshops = [];
    for (const workshopId of workshopIds) {
      try {
        const workshop = await getEvent(workshopId);
        data.workshops.push(workshop);
      } catch (error) {
        console.error(
          `  ⚠️  Error extracting workshop event ${workshopId}:`,
          error
        );
      }
    }
    console.log(`  ✅ Extracted ${data.workshops.length} workshop events`);

    // Get all session event IDs (Events with SessionEvent label)
    const sessionIdsResult = await session.run(`
      MATCH (e:Event:SessionEvent)
      RETURN e.id as eventId
      ORDER BY e.id
    `);

    const sessionIds = sessionIdsResult.records.map((r) => r.get("eventId"));
    console.log(`  📋 Found ${sessionIds.length} session events to extract`);

    // Extract Session events using getEvent function
    data.sessions = [];
    for (const sessionId of sessionIds) {
      try {
        const session = await getEvent(sessionId);
        data.sessions.push(session);
      } catch (error) {
        console.error(
          `  ⚠️  Error extracting session event ${sessionId}:`,
          error
        );
      }
    }
    console.log(`  ✅ Extracted ${data.sessions.length} session events`);

    // Extract video roles (DANCER, WINNER relationships)
    const videoRolesResult = await session.run(`
      MATCH (u:User)-[r:DANCER|WINNER]->(v:Video)
      OPTIONAL MATCH (v)-[:IN]->(s:Section)-[:IN]->(e:Event)
      OPTIONAL MATCH (v)-[:IN]->(b:Bracket)-[:IN]->(s2:Section)-[:IN]->(e2:Event)
      RETURN u.id as userId, v.id as videoId, type(r) as role, 
             coalesce(e.id, e2.id) as eventId,
             coalesce(s.id, s2.id) as sectionId,
             b.id as bracketId
    `);

    data.videoRoles = videoRolesResult.records.map((r) => ({
      userId: r.get("userId"),
      videoId: r.get("videoId"),
      role: r.get("role"),
      eventId: r.get("eventId"),
      sectionId: r.get("sectionId"),
      bracketId: r.get("bracketId"),
    }));
    console.log(
      `  ✅ Extracted ${data.videoRoles.length} video role relationships`
    );

    // Extract section winners
    const sectionWinnersResult = await session.run(`
      MATCH (u:User)-[r:WINNER]->(s:Section)
      OPTIONAL MATCH (s)-[:IN]->(e:Event)
      RETURN u.id as userId, s.id as sectionId, e.id as eventId
    `);

    data.sectionWinners = sectionWinnersResult.records.map((r) => ({
      userId: r.get("userId"),
      sectionId: r.get("sectionId"),
      eventId: r.get("eventId"),
    }));
    console.log(
      `  ✅ Extracted ${data.sectionWinners.length} section winner relationships`
    );

    // Extract team members (all events including workshops and sessions are Event nodes)
    const teamMembersResult = await session.run(`
      MATCH (u:User)-[r:TEAM_MEMBER]->(target:Event)
      RETURN u.id as userId, target.id as targetId, 
             CASE 
               WHEN 'WorkshopEvent' IN labels(target) THEN 'Workshop'
               WHEN 'SessionEvent' IN labels(target) THEN 'Session'
               ELSE 'Event'
             END as targetType
    `);

    data.teamMembers = teamMembersResult.records.map((r) => ({
      userId: r.get("userId"),
      targetId: r.get("targetId"),
      targetType: r.get("targetType"),
    }));
    console.log(
      `  ✅ Extracted ${data.teamMembers.length} team member relationships`
    );

    return data;
  } finally {
    await session.close();
  }
}

// Normalize extracted data to ensure it matches expected types
function normalizeExtractedData(data: any): any {
  // Ensure picture objects have file: null and preserve Date objects
  function normalizePictures(obj: any): any {
    if (obj instanceof Date) {
      // Preserve Date objects
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(normalizePictures);
    }
    if (obj && typeof obj === "object") {
      if (obj.type && (obj.type === "poster" || obj.type === "photo")) {
        // This is a picture object
        return {
          ...obj,
          file: null,
        };
      }
      const normalized: any = {};
      for (const key in obj) {
        const value = obj[key];
        // Preserve Date objects
        if (value instanceof Date) {
          normalized[key] = value;
        } else {
          normalized[key] = normalizePictures(value);
        }
      }
      return normalized;
    }
    return obj;
  }

  return normalizePictures(data);
}

// Generate PostgreSQL seed code
function generatePostgreSQLSeedCode(pgData: any): string {
  // Normalize data before generating code
  pgData = normalizeExtractedData(pgData);

  // Ensure all array fields are initialized
  if (!Array.isArray(pgData.users)) pgData.users = [];
  if (!Array.isArray(pgData.accounts)) pgData.accounts = [];
  if (!Array.isArray(pgData.events)) pgData.events = [];
  if (!Array.isArray(pgData.taggingRequests)) pgData.taggingRequests = [];
  if (!Array.isArray(pgData.teamMemberRequests)) pgData.teamMemberRequests = [];
  if (!Array.isArray(pgData.authLevelChangeRequests))
    pgData.authLevelChangeRequests = [];
  if (!Array.isArray(pgData.requestApprovals)) pgData.requestApprovals = [];
  if (!Array.isArray(pgData.notifications)) pgData.notifications = [];
  if (!Array.isArray(pgData.sessions)) pgData.sessions = [];
  if (!Array.isArray(pgData.verificationTokens)) pgData.verificationTokens = [];
  if (!Array.isArray(pgData.authenticators)) pgData.authenticators = [];
  let code = `import { PrismaClient } from "@prisma/client";
import { insertEvent } from "../src/db/queries/event";
import { signupUser } from "../src/db/queries/user";
import { Event } from "../src/types/event";
import { City } from "../src/types/city";
import driver from "../src/db/driver";
import {
  setVideoRoles,
  setSectionWinner,
  setEventRoles,
  addTeamMember,
} from "../src/db/queries/team-member";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PostgreSQL database...");

  // Clear Neo4j data FIRST before creating anything
  console.log("🧹 Clearing existing Neo4j data...");
  const clearSession = driver.session();
  try {
    await clearSession.run("MATCH (n) DETACH DELETE n");
    console.log("✅ Neo4j database cleared");
  } catch (error) {
    console.error("⚠️  Error clearing Neo4j database:", error);
  } finally {
    await clearSession.close();
  }

  // Clear all existing data
  console.log("🗑️  Clearing existing PostgreSQL data...");

  const safeDelete = async (
    operation: () => Promise<any>,
    tableName: string
  ) => {
    try {
      await operation();
    } catch (error: any) {
      if (error.code === "P2021" || error.message?.includes("does not exist")) {
        console.log(\`⚠️  Table \${tableName} does not exist, skipping...\`);
      } else {
        throw error;
      }
    }
  };

  await safeDelete(
    () => prisma.requestApproval.deleteMany(),
    "RequestApproval"
  );
  await safeDelete(() => prisma.notification.deleteMany(), "Notification");
  await safeDelete(
    () => prisma.authLevelChangeRequest.deleteMany(),
    "AuthLevelChangeRequest"
  );
  await safeDelete(
    () => prisma.teamMemberRequest.deleteMany(),
    "TeamMemberRequest"
  );
  await safeDelete(() => prisma.taggingRequest.deleteMany(), "TaggingRequest");
  await prisma.event.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Cleared all existing data");

  // Create Users
  console.log(\`🌱 Creating \${${pgData.users.length}} users...\`);
  const users = ${formatValue(pgData.users, 2)};

  if (users && users.length > 0) {
    for (const userData of users) {
      await prisma.user.create({
        data: userData,
      });
      console.log(\`✅ Created user: \${userData.email}\`);
    }
  }

  // Create Accounts
  console.log(\`🌱 Creating \${${pgData.accounts.length}} accounts...\`);
  const accounts = ${formatValue(pgData.accounts, 2)};

  if (accounts && accounts.length > 0) {
    for (const accountData of accounts) {
      await prisma.account.create({
        data: accountData,
      });
      console.log(\`✅ Created account for user: \${accountData.userId}\`);
    }
  }

  // Create Event references
  console.log(\`🌱 Creating \${${pgData.events.length}} event references...\`);
  const eventReferences = ${formatValue(pgData.events, 2)};

  if (eventReferences && eventReferences.length > 0) {
    for (const eventRef of eventReferences) {
      await prisma.event.create({
        data: eventRef,
      });
      console.log(\`✅ Created event reference: \${eventRef.eventId}\`);
    }
  }

  // Create TaggingRequests
  if (${pgData.taggingRequests.length} > 0) {
    console.log(\`🌱 Creating \${${
      pgData.taggingRequests.length
    }} tagging requests...\`);
    const taggingRequests = ${formatValue(pgData.taggingRequests, 2)};

    for (const request of taggingRequests) {
      await prisma.taggingRequest.create({
        data: request,
      });
    }
    console.log(\`✅ Created \${${
      pgData.taggingRequests.length
    }} tagging requests\`);
  }

  // Create TeamMemberRequests
  if (${pgData.teamMemberRequests.length} > 0) {
    console.log(\`🌱 Creating \${${
      pgData.teamMemberRequests.length
    }} team member requests...\`);
    const teamMemberRequests = ${formatValue(pgData.teamMemberRequests, 2)};

    for (const request of teamMemberRequests) {
      await prisma.teamMemberRequest.create({
        data: request,
      });
    }
    console.log(\`✅ Created \${${
      pgData.teamMemberRequests.length
    }} team member requests\`);
  }

  // Create AuthLevelChangeRequests
  if (${pgData.authLevelChangeRequests.length} > 0) {
    console.log(\`🌱 Creating \${${
      pgData.authLevelChangeRequests.length
    }} auth level change requests...\`);
    const authLevelChangeRequests = ${formatValue(
      pgData.authLevelChangeRequests,
      2
    )};

    for (const request of authLevelChangeRequests) {
      await prisma.authLevelChangeRequest.create({
        data: request,
      });
    }
    console.log(\`✅ Created \${${
      pgData.authLevelChangeRequests.length
    }} auth level change requests\`);
  }

  // Create RequestApprovals
  if (${pgData.requestApprovals.length} > 0) {
    console.log(\`🌱 Creating \${${
      pgData.requestApprovals.length
    }} request approvals...\`);
    const requestApprovals = ${formatValue(pgData.requestApprovals, 2)};

    for (const approval of requestApprovals) {
      await prisma.requestApproval.create({
        data: approval,
      });
    }
    console.log(\`✅ Created \${${
      pgData.requestApprovals.length
    }} request approvals\`);
  }

  // Create Notifications
  if (${pgData.notifications.length} > 0) {
    console.log(\`🌱 Creating \${${
      pgData.notifications.length
    }} notifications...\`);
    const notifications = ${formatValue(pgData.notifications, 2)};

    for (const notification of notifications) {
      await prisma.notification.create({
        data: notification,
      });
    }
    console.log(\`✅ Created \${${
      pgData.notifications.length
    }} notifications\`);
  }

  // Create Sessions (NextAuth)
  if (${pgData.sessions.length} > 0) {
    console.log(\`🌱 Creating \${${pgData.sessions.length}} sessions...\`);
    const sessions = ${formatValue(pgData.sessions, 2)};

    for (const sessionData of sessions) {
      await prisma.session.create({
        data: sessionData,
      });
    }
    console.log(\`✅ Created \${${pgData.sessions.length}} sessions\`);
  }

  // Create VerificationTokens
  if (${pgData.verificationTokens.length} > 0) {
    console.log(\`🌱 Creating \${${
      pgData.verificationTokens.length
    }} verification tokens...\`);
    const verificationTokens = ${formatValue(pgData.verificationTokens, 2)};

    for (const token of verificationTokens) {
      await prisma.verificationToken.create({
        data: token,
      });
    }
    console.log(\`✅ Created \${${
      pgData.verificationTokens.length
    }} verification tokens\`);
  }

  // Create Authenticators
  if (${pgData.authenticators.length} > 0) {
    console.log(\`🌱 Creating \${${
      pgData.authenticators.length
    }} authenticators...\`);
    const authenticators = ${formatValue(pgData.authenticators, 2)};

    for (const authenticator of authenticators) {
      await prisma.authenticator.create({
        data: authenticator,
      });
    }
    console.log(\`✅ Created \${${
      pgData.authenticators.length
    }} authenticators\`);
  }

  // Create Neo4j user profiles
  console.log("🌱 Creating Neo4j user profiles...");
`;

  // Add Neo4j user creation code
  if (pgData.neo4jUsers && pgData.neo4jUsers.length > 0) {
    code += `  const neo4jUserProfiles = ${formatValue(pgData.neo4jUsers, 2)};

  for (const profile of neo4jUserProfiles) {
    try {
      await signupUser(profile.userId, profile.profile);
      console.log(\`✅ Created Neo4j profile for \${profile.userId}\`);
    } catch (error) {
      console.log(\`ℹ️  Neo4j profile for \${profile.userId} may already exist\`);
    }
  }

`;
  }

  // Add Neo4j events, workshops, sessions creation
  if (pgData.neo4jEvents && pgData.neo4jEvents.length > 0) {
    code += `  // Create Events in Neo4j
  console.log(\`🌱 Creating \${${
    pgData.neo4jEvents.length
  }} events in Neo4j...\`);
  const events = ${formatValue(pgData.neo4jEvents, 2)};

  for (const event of events) {
    try {
      await insertEvent(event);
      console.log(\`✅ Created event: \${event.eventDetails.title}\`);
    } catch (error) {
      console.error(\`⚠️  Error creating event \${event.id}:\`, error);
    }
  }

`;
  }

  if (pgData.neo4jWorkshops && pgData.neo4jWorkshops.length > 0) {
    code += `  // Create Workshop events in Neo4j
  console.log(\`🌱 Creating \${${
    pgData.neo4jWorkshops.length
  }} workshop events in Neo4j...\`);
  const workshops = ${formatValue(pgData.neo4jWorkshops, 2)};

  for (const workshop of workshops) {
    try {
      await insertEvent(workshop);
      console.log(\`✅ Created workshop event: \${workshop.eventDetails.title}\`);
    } catch (error) {
      console.error(\`⚠️  Error creating workshop event \${workshop.id}:\`, error);
    }
  }

`;
  }

  if (pgData.neo4jSessions && pgData.neo4jSessions.length > 0) {
    code += `  // Create Session events in Neo4j
  console.log(\`🌱 Creating \${${
    pgData.neo4jSessions.length
  }} session events in Neo4j...\`);
  const sessions = ${formatValue(pgData.neo4jSessions, 2)};

  for (const session of sessions) {
    try {
      await insertEvent(session);
      console.log(\`✅ Created session event: \${session.eventDetails.title}\`);
    } catch (error) {
      console.error(\`⚠️  Error creating session event \${session.id}:\`, error);
    }
  }

`;
  }

  // Add video roles, section winners, event roles, team members
  if (pgData.videoRoles && pgData.videoRoles.length > 0) {
    code += `  // Set video roles
  console.log(\`🌱 Setting \${${
    pgData.videoRoles.length
  }} video role relationships...\`);
  const videoRoles = ${formatValue(pgData.videoRoles, 2)};

  for (const videoRole of videoRoles) {
    try {
      const roles = [videoRole.role];
      if (videoRole.role === "WINNER") {
        roles.push("DANCER"); // Ensure DANCER is present if WINNER is specified
      }
      await setVideoRoles(videoRole.eventId, videoRole.videoId, videoRole.userId, roles);
    } catch (error) {
      console.error(\`⚠️  Error setting video role for \${videoRole.userId} in \${videoRole.videoId}:\`, error);
    }
  }

`;
  }

  if (pgData.sectionWinners && pgData.sectionWinners.length > 0) {
    code += `  // Set section winners
  console.log(\`🌱 Setting \${${
    pgData.sectionWinners.length
  }} section winner relationships...\`);
  const sectionWinners = ${formatValue(pgData.sectionWinners, 2)};

  for (const sectionWinner of sectionWinners) {
    try {
      await setSectionWinner(sectionWinner.eventId, sectionWinner.sectionId, sectionWinner.userId);
    } catch (error) {
      console.error(\`⚠️  Error setting section winner for \${sectionWinner.userId} in \${sectionWinner.sectionId}:\`, error);
    }
  }

`;
  }

  if (pgData.eventRoles && pgData.eventRoles.length > 0) {
    code += `  // Set event roles
  console.log(\`🌱 Setting \${${
    pgData.eventRoles.length
  }} event role relationships...\`);
  const eventRoles = ${formatValue(pgData.eventRoles, 2)};

  for (const eventRole of eventRoles) {
    try {
      await setEventRoles(eventRole.eventId, eventRole.userId, eventRole.role);
    } catch (error) {
      console.error(\`⚠️  Error setting event role for \${eventRole.userId} in \${eventRole.eventId}:\`, error);
    }
  }

`;
  }

  if (pgData.teamMembers && pgData.teamMembers.length > 0) {
    code += `  // Add team members
  console.log(\`🌱 Adding \${${
    pgData.teamMembers.length
  }} team member relationships...\`);
  const teamMembers = ${formatValue(pgData.teamMembers, 2)};

  for (const teamMember of teamMembers) {
    try {
      // All events (including workshops and sessions) use the unified addTeamMember function
      await addTeamMember(teamMember.targetId, teamMember.userId);
    } catch (error) {
      console.error(\`⚠️  Error adding team member \${teamMember.userId} to \${teamMember.targetType} \${teamMember.targetId}:\`, error);
    }
  }

`;
  }

  code += `  console.log("🎉 PostgreSQL seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ PostgreSQL seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await driver.close();
    console.log("✅ Database connections closed");
  });
`;

  return code;
}

// Generate Neo4j seed code
function generateNeo4jSeedCode(neo4jData: any): string {
  // Format users for signupUser function
  const formattedUsers = (neo4jData.users || []).map((user: any) => ({
    id: user.id,
    profile: {
      displayName: user.displayName || "",
      username: user.username || "",
      city: user.city || null,
      date: user.date || "",
      bio: user.bio || "",
      instagram: user.instagram || "",
      website: user.website || "",
      image: user.image || "",
    },
  }));

  let code = `import { signupUser } from "../src/db/queries/user";
import driver from "../src/db/driver";

async function seedNeo4j() {
  console.log("🌱 Seeding Neo4j database using existing query functions...");
  console.log("ℹ️  Note: Neo4j data is cleared by prisma/seed.ts");
  console.log(
    "ℹ️  This script only creates users if they don't exist (using MERGE)"
  );

  try {
    // Create users matching the Prisma seed structure
    const testUsers = ${formatValue(formattedUsers, 2)};

    // Create users using the signupUser function
    for (const user of testUsers) {
      try {
        await signupUser(user.id, user.profile);
        console.log(
          \`✅ Created user: \${user.profile.displayName} (\${user.profile.username})\`
        );
      } catch (error) {
        console.log(
          \`ℹ️  User \${user.profile.username} may already exist, skipping...\`
        );
      }
    }

    // Note: Events, Workshops, and Sessions are created by prisma/seed.ts, not here
    // This prevents duplicates when both seed scripts run
    console.log(
      "ℹ️  Events, Workshops, and Sessions are created by prisma/seed.ts, skipping here."
    );

    console.log("🎉 Neo4j seeding completed using existing query functions!");
  } catch (error) {
    console.error("❌ Neo4j seeding failed:", error);
    throw error;
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedNeo4j()
    .then(() => {
      console.log("✅ Neo4j seeding script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Neo4j seeding script failed:", error);
      process.exit(1);
    });
}

export { seedNeo4j };
`;

  return code;
}

// Main function
async function main() {
  try {
    console.log("🚀 Starting database seed file export...\n");

    // Extract data from both databases
    const pgData = await extractPostgreSQLData();
    const neo4jData = await extractNeo4jData();

    // Combine Neo4j users into PostgreSQL seed data
    pgData.neo4jUsers = (neo4jData.users || []).map((user: any) => ({
      userId: user.id,
      profile: {
        displayName: user.displayName || "",
        username: user.username || "",
        city: user.city || null,
        date: user.date || "",
        bio: user.bio || "",
        instagram: user.instagram || "",
        website: user.website || "",
        image: user.image || "",
      },
    }));

    // Extract event roles from events
    pgData.eventRoles = [];
    for (const event of neo4jData.events || []) {
      for (const role of event.roles || []) {
        if (role.user && role.user.id) {
          pgData.eventRoles.push({
            eventId: event.id,
            userId: role.user.id,
            role: role.title || role.id,
          });
        }
      }
    }

    // Add Neo4j events, workshops, sessions to pgData for code generation
    // Normalize picture objects to include file: null
    pgData.neo4jEvents = (neo4jData.events || []).map((event: any) => ({
      ...event,
      eventDetails: event.eventDetails
        ? {
            ...event.eventDetails,
            poster: event.eventDetails.poster
              ? { ...event.eventDetails.poster, file: null }
              : null,
          }
        : null,
      gallery: (event.gallery || []).map((pic: any) => ({
        ...pic,
        file: null,
      })),
      subEvents: (event.subEvents || []).map((se: any) => ({
        ...se,
        eventDetails: se.eventDetails
          ? {
              ...se.eventDetails,
              poster: se.eventDetails.poster
                ? { ...se.eventDetails.poster, file: null }
                : null,
            }
          : null,
        gallery: (se.gallery || []).map((pic: any) => ({ ...pic, file: null })),
      })),
      workshops: (event.workshops || []).map((w: any) => ({
        ...w,
        eventDetails: w.eventDetails
          ? {
              ...w.eventDetails,
              poster: w.eventDetails.poster
                ? { ...w.eventDetails.poster, file: null }
                : null,
            }
          : null,
        gallery: (w.gallery || []).map((pic: any) => ({ ...pic, file: null })),
      })),
    }));

    pgData.neo4jWorkshops = (neo4jData.workshops || []).map(
      (workshop: any) => ({
        ...workshop,
        eventDetails: workshop.eventDetails
          ? {
              ...workshop.eventDetails,
              poster: workshop.eventDetails.poster
                ? { ...workshop.eventDetails.poster, file: null }
                : null,
            }
          : null,
        gallery: (workshop.gallery || []).map((pic: any) => ({
          ...pic,
          file: null,
        })),
      })
    );

    pgData.neo4jSessions = (neo4jData.sessions || []).map((session: any) => ({
      ...session,
      eventDetails: session.eventDetails
        ? {
            ...session.eventDetails,
            poster: session.eventDetails.poster
              ? { ...session.eventDetails.poster, file: null }
              : null,
          }
        : null,
      gallery: (session.gallery || []).map((pic: any) => ({
        ...pic,
        file: null,
      })),
    }));

    pgData.videoRoles = neo4jData.videoRoles || [];
    pgData.sectionWinners = neo4jData.sectionWinners || [];
    pgData.teamMembers = neo4jData.teamMembers || [];

    // Generate seed code
    console.log("\n📝 Generating seed file code...");
    const pgSeedCode = generatePostgreSQLSeedCode(pgData);
    const neo4jSeedCode = generateNeo4jSeedCode(neo4jData);

    // Create backups
    console.log("\n💾 Creating backups...");
    const pgSeedPath = path.join(process.cwd(), "prisma", "seed.ts");
    const neo4jSeedPath = path.join(process.cwd(), "scripts", "seed-neo4j.ts");

    if (fs.existsSync(pgSeedPath)) {
      const backupPath = `${pgSeedPath}.backup.${Date.now()}`;
      fs.copyFileSync(pgSeedPath, backupPath);
      console.log(
        `  ✅ Backed up prisma/seed.ts to ${path.basename(backupPath)}`
      );
    }

    if (fs.existsSync(neo4jSeedPath)) {
      const backupPath = `${neo4jSeedPath}.backup.${Date.now()}`;
      fs.copyFileSync(neo4jSeedPath, backupPath);
      console.log(
        `  ✅ Backed up scripts/seed-neo4j.ts to ${path.basename(backupPath)}`
      );
    }

    // Write seed files
    console.log("\n✍️  Writing seed files...");
    fs.writeFileSync(pgSeedPath, pgSeedCode, "utf-8");
    console.log("  ✅ Wrote prisma/seed.ts");

    fs.writeFileSync(neo4jSeedPath, neo4jSeedCode, "utf-8");
    console.log("  ✅ Wrote scripts/seed-neo4j.ts");

    console.log("\n🎉 Database seed file export completed successfully!");
    console.log("\n✅ Seed files have been generated and written.");
    console.log("   Run 'npm run db:seed' to test the generated seed files.");
  } catch (error) {
    console.error("\n❌ Error exporting seed data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await driver.close();
  }
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
