"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import {
  signupUser,
  getUser,
  getUserByUsername,
  getUserWithStyles,
  getUserEvents,
  updateUser,
} from "@/db/queries/user";
import { uploadProfilePictureToR2, deleteFromR2 } from "@/lib/R2";
import { getNeo4jRoleFormats } from "@/lib/utils/roles";
import driver from "@/db/driver";
import { auth } from "@/auth";
import { prisma } from "@/lib/primsa";
import crypto from "crypto";
import { AUTH_LEVELS } from "@/lib/utils/auth-utils";
import { City } from "@/types/city";

export async function signInWithGoogle() {
  const { error } = await signIn("google");

  if (error) {
    console.error(error);
    return;
  }

  redirect("/dashboard");
}

export async function signOutAccount() {
  await signOut({ redirectTo: "/" });
}

export async function signup(formData: FormData) {
  const session = await auth();

  if (!session) {
    console.error("No user session found");
    return;
  }

  if (
    !formData.get("displayName") ||
    !formData.get("username") ||
    !formData.get("date") ||
    !formData.get("city")
  ) {
    console.error("Missing required fields");
    return;
  }

  try {
    // Check if this is a predefined admin user
    const ADMIN_USERS = [
      {
        email: "benthechi@gmail.com",
        authLevel: AUTH_LEVELS.SUPER_ADMIN, // SUPER_ADMIN
        defaultData: {
          displayName: "heartbreaker",
          username: "heartbreakdancer",
          city: "Seattle",
          date: "07/03/1990",
        },
      },
    ];

    const adminUser = ADMIN_USERS.find(
      (admin) => admin.email === session.user.email
    );

    // Extract styles from formData
    const stylesJson = formData.get("Dance Styles") as string | null;
    let styles: string[] = [];
    if (stylesJson) {
      try {
        styles = JSON.parse(stylesJson);
      } catch (e) {
        console.error("Failed to parse styles:", e);
      }
    }

    // Extract optional fields
    const bio = (formData.get("bio") as string) || "";
    const instagram = (formData.get("instagram") as string) || "";
    const website = (formData.get("website") as string) || "";

    // Handle profile picture upload if provided
    let imageUrl: string | null = null;
    const profilePicture = formData.get("profilePicture") as File | null;
    if (profilePicture && profilePicture.size > 0) {
      const uploadResult = await uploadProfilePictureToR2(
        profilePicture,
        session.user.id
      );
      if (uploadResult.success && uploadResult.url) {
        imageUrl = uploadResult.url;
      }
    }

    // Parse city from formData (it's stored as JSON string)
    let cityData: City | string;
    const cityJson = formData.get("city") as string;
    if (cityJson) {
      try {
        cityData = JSON.parse(cityJson);
      } catch {
        // Fallback to string if JSON parsing fails
        cityData = cityJson;
      }
    } else {
      throw new Error("City is required");
    }

    // Use admin defaults if this is an admin user, otherwise use form data
    const profileData = adminUser
      ? {
          displayName: adminUser.defaultData.displayName,
          username: adminUser.defaultData.username,
          city: adminUser.defaultData.city as string, // Admin defaults use string for now
          date: adminUser.defaultData.date,
          styles: [],
          bio: "",
          instagram: "",
          website: "",
          image: null,
        }
      : {
          displayName: formData.get("displayName") as string,
          username: formData.get("username") as string,
          city: cityData,
          date: formData.get("date") as string,
          styles,
          bio: bio || null,
          instagram: instagram || null,
          website: website || null,
          image: imageUrl,
        };

    // Update user in Neo4j with profile information
    const userResult = await signupUser(session.user.id, profileData);

    // Determine auth level
    const authLevel = adminUser ? adminUser.authLevel : AUTH_LEVELS.BASE_USER; // Base user level

    // Mark account as verified in PostgreSQL (user completed registration)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        accountVerified: new Date(),
        name: profileData.displayName || session.user.name,
        auth: authLevel,
      },
    });

    if (adminUser) {
      console.log(
        `🔑 Auto-assigned SUPER_ADMIN (${authLevel}) to ${session.user.email}`
      );
      console.log(`📝 Used predefined profile data for admin user`);
    }

    console.log("✅ User registration completed:", userResult);
    console.log("✅ Account marked as verified in PostgreSQL");
  } catch (error) {
    console.error("❌ Signup failed:", error);
    throw error;
  }

  redirect("/dashboard");
}

/**
 * Update user's auth level in PostgreSQL
 */
export async function updateUserAuthLevel(userId: string, authLevel: number) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        auth: authLevel,
      },
      select: {
        id: true,
        email: true,
        name: true,
        auth: true,
      },
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Failed to update user auth level:", error);
    return { success: false, error: "Failed to update auth level" };
  }
}

/**
 * Update current user's auth level (for self-service)
 */
export async function updateMyAuthLevel(authLevel: number) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  return await updateUserAuthLevel(session.user.id, authLevel);
}

/**
 * Get user's current auth level from PostgreSQL
 */
export async function getUserAuthLevel(userId?: string) {
  const session = await auth();
  const targetUserId = userId || session?.user?.id;

  if (!targetUserId) {
    return { success: false, error: "No user ID provided" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { auth: true, email: true, name: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, authLevel: user.auth, user };
  } catch (error) {
    console.error("Failed to get user auth level:", error);
    return { success: false, error: "Failed to get auth level" };
  }
}

/**
 * Get complete user profile from Neo4j by userId or username
 * Includes styles, events created, events with roles, and tagged videos
 */
export async function getUserProfile(userIdOrUsername: string) {
  try {
    const session = driver.session();

    // Try to get user by username first, then by id
    let userWithStyles = await getUserWithStyles(userIdOrUsername);
    if (!userWithStyles) {
      // If not found by id, try by username
      const userByUsername = await getUserByUsername(userIdOrUsername);
      if (userByUsername) {
        userWithStyles = await getUserWithStyles(userByUsername.id);
      }
    }

    if (!userWithStyles) {
      return { success: false, error: "User not found" };
    }

    const userId = userWithStyles.id;

    // Get events created by user with full event data
    const eventsCreatedResult = await session.run(
      `
      MATCH (u:User {id: $userId})-[:CREATED]->(e:Event)
      OPTIONAL MATCH (e)-[:IN]->(c:City)
      OPTIONAL MATCH (poster:Picture)-[:POSTER]->(e)
      OPTIONAL MATCH (e)-[:STYLE]->(s:Style)
      RETURN e.id as eventId, e.title as eventTitle, e.startDate as startDate, e.dates as dates,
             e.createdAt as createdAt, poster.url as imageUrl, c.name as city, c.id as cityId,
             collect(DISTINCT s.name) as styles,
             CASE
               WHEN 'Competition' IN labels(e) THEN 'competition'
               WHEN 'Workshop' IN labels(e) THEN 'workshop'
               WHEN 'Session' IN labels(e) THEN 'session'
               ELSE 'competition'
             END as eventType
      ORDER BY e.createdAt DESC
      `,
      { userId }
    );

    const eventsCreated = eventsCreatedResult.records.map((record) => {
      const dates = record.get("dates");
      let parsedDates: any[] = [];
      if (dates) {
        try {
          parsedDates = typeof dates === "string" ? JSON.parse(dates) : dates;
        } catch (e) {
          parsedDates = [];
        }
      }
      return {
        eventId: record.get("eventId"),
        eventTitle: record.get("eventTitle") || "Untitled Event",
        startDate: record.get("startDate"), // Keep for backward compatibility
        dates: Array.isArray(parsedDates) ? parsedDates : [],
        createdAt: record.get("createdAt"),
        imageUrl: record.get("imageUrl"),
        city: record.get("city"),
        cityId: record.get("cityId") as number | undefined,
        styles: record.get("styles") || [],
      eventType: record.get("eventType") as
        | "competition"
        | "workshop"
        | "session",
    }));

    // Get events where user has roles with full event data (collecting all roles)
    const validRoleFormats = getNeo4jRoleFormats();
    const eventsWithRolesResult = await session.run(
      `
      MATCH (u:User {id: $userId})-[roleRel]->(e:Event)
      WHERE type(roleRel) IN $validRoles
      OPTIONAL MATCH (e)-[:IN]->(c:City)
      OPTIONAL MATCH (poster:Picture)-[:POSTER]->(e)
      OPTIONAL MATCH (e)-[:STYLE]->(s:Style)
      WITH e, c, poster, s, type(roleRel) as role
      RETURN e.id as eventId, e.title as eventTitle, 
             collect(DISTINCT role) as roles,
             e.createdAt as createdAt, e.startDate as startDate,
             head(collect(DISTINCT poster.url)) as imageUrl, 
             head(collect(DISTINCT c.name)) as city,
             head(collect(DISTINCT c.id)) as cityId,
             collect(DISTINCT s.name) as styles,
             CASE
               WHEN 'Competition' IN labels(e) THEN 'competition'
               WHEN 'Workshop' IN labels(e) THEN 'workshop'
               WHEN 'Session' IN labels(e) THEN 'session'
               ELSE 'competition'
             END as eventType
      ORDER BY e.createdAt DESC
      `,
      { userId, validRoles: validRoleFormats }
    );

    const eventsWithRoles = eventsWithRolesResult.records.map((record) => {
      const dates = record.get("dates");
      let parsedDates: any[] = [];
      if (dates) {
        try {
          parsedDates = typeof dates === "string" ? JSON.parse(dates) : dates;
        } catch (e) {
          parsedDates = [];
        }
      }
      return {
        eventId: record.get("eventId"),
        eventTitle: record.get("eventTitle") || "Untitled Event",
        roles: record.get("roles") || [],
        createdAt: record.get("createdAt"),
        startDate: record.get("startDate"), // Keep for backward compatibility
        dates: Array.isArray(parsedDates) ? parsedDates : [],
        imageUrl: record.get("imageUrl"),
        city: record.get("city"),
        cityId: record.get("cityId") as number | undefined,
        styles: record.get("styles") || [],
      eventType: record.get("eventType") as
        | "competition"
        | "workshop"
        | "session",
    }));

    // Get videos where user is tagged with full video data (collecting all roles)
    // Use relationship types :DANCER and :WINNER
    const taggedVideosResult = await session.run(
      `
      MATCH (u:User {id: $userId})-[r:DANCER|WINNER]->(v:Video)
      OPTIONAL MATCH (v)-[:IN]->(s:Section)-[:IN]->(e:Event)
      OPTIONAL MATCH (v)-[:IN]->(b:Bracket)-[:IN]->(s2:Section)-[:IN]->(e2:Event)
      OPTIONAL MATCH (v)-[:STYLE]->(style:Style)
      WITH v, COALESCE(e, e2) as event, COALESCE(s, s2) as section, style, type(r) as role
      WHERE event IS NOT NULL
      RETURN v.id as videoId, v.title as videoTitle, v.src as videoSrc,
             event.id as eventId, event.title as eventTitle, event.createdAt as eventCreatedAt,
             section.id as sectionId, section.title as sectionTitle, 
             collect(DISTINCT role) as roles, collect(DISTINCT style.name) as styles
      ORDER BY eventCreatedAt DESC
      `,
      { userId }
    );

    // Get winning videos (where user has :WINNER relationship)
    const winningVideosResult = await session.run(
      `
      MATCH (u:User {id: $userId})-[r:WINNER]->(v:Video)
      OPTIONAL MATCH (v)-[:IN]->(s:Section)-[:IN]->(e:Event)
      OPTIONAL MATCH (v)-[:IN]->(b:Bracket)-[:IN]->(s2:Section)-[:IN]->(e2:Event)
      OPTIONAL MATCH (v)-[:STYLE]->(style:Style)
      WITH v, COALESCE(e, e2) as event, COALESCE(s, s2) as section, style
      WHERE event IS NOT NULL
      RETURN v.id as videoId, v.title as videoTitle, v.src as videoSrc,
             event.id as eventId, event.title as eventTitle, event.createdAt as eventCreatedAt,
             section.id as sectionId, section.title as sectionTitle,
             collect(DISTINCT style.name) as styles
      ORDER BY eventCreatedAt DESC
      `,
      { userId }
    );

    // Get winning sections (where user has :WINNER relationship)
    const winningSectionsResult = await session.run(
      `
      MATCH (u:User {id: $userId})-[r:WINNER]->(s:Section)
      MATCH (s)-[:IN]->(e:Event)
      OPTIONAL MATCH (e)-[:IN]->(c:City)
      OPTIONAL MATCH (poster:Picture)-[:POSTER]->(e)
      WITH s, e, c, poster,
           [label IN labels(s) WHERE label IN ['BattleSection', 'TournamentSection', 'CompetitionSection', 'PerformanceSection', 'ShowcaseSection', 'ClassSection', 'SessionSection', 'MixedSection']] as sectionTypeLabels
      RETURN s.id as sectionId, s.title as sectionTitle,
             CASE 
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
             END as sectionType,
             e.id as eventId, e.title as eventTitle, e.startDate as startDate, e.dates as dates,
             e.createdAt as eventCreatedAt, poster.url as imageUrl,
             c.name as city, c.id as cityId
      ORDER BY eventCreatedAt DESC
      `,
      { userId }
    );

    // Get all tagged users for each video
    const videoIds = taggedVideosResult.records.map((record) =>
      record.get("videoId")
    );
    const taggedUsersMap = new Map<string, any[]>();

    if (videoIds.length > 0) {
      const taggedUsersResult = await session.run(
        `
        MATCH (v:Video)<-[r:DANCER|WINNER]-(u:User)
        WHERE v.id IN $videoIds
        WITH v, u, type(r) as role
        RETURN v.id as videoId, collect({
          id: u.id,
          displayName: u.displayName,
          username: u.username,
          role: role
        }) as taggedUsers
        `,
        { videoIds }
      );

      taggedUsersResult.records.forEach((record) => {
        const videoId = record.get("videoId");
        const taggedUsers = (record.get("taggedUsers") || []).filter(
          (tu: any) => tu.id !== null && tu.id !== undefined
        );
        taggedUsersMap.set(videoId, taggedUsers);
      });
    }

    const taggedVideos = taggedVideosResult.records.map((record) => ({
      videoId: record.get("videoId"),
      videoTitle: record.get("videoTitle") || "Untitled Video",
      videoSrc: record.get("videoSrc"),
      eventId: record.get("eventId"),
      eventTitle: record.get("eventTitle") || "Untitled Event",
      sectionId: record.get("sectionId"),
      sectionTitle: record.get("sectionTitle") || "Untitled Section",
      roles: record.get("roles") || [],
      styles: record.get("styles") || [],
      taggedUsers: taggedUsersMap.get(record.get("videoId")) || [],
    }));

    // Get all tagged users for winning videos
    const winningVideoIds = winningVideosResult.records.map((record) =>
      record.get("videoId")
    );
    const winningVideoUsersMap = new Map<string, any[]>();

    if (winningVideoIds.length > 0) {
      const winningVideoUsersResult = await session.run(
        `
        MATCH (v:Video)<-[r:IN]-(u:User)
        WHERE v.id IN $videoIds
        WITH v, u, r,
             CASE 
               WHEN r.roles IS NOT NULL THEN r.roles
               WHEN r.role IS NOT NULL THEN [r.role]
               ELSE []
             END as roles
        UNWIND roles as role
        WITH v, u, role
        RETURN v.id as videoId, collect({
          id: u.id,
          displayName: u.displayName,
          username: u.username,
          role: role
        }) as taggedUsers
        `,
        { videoIds: winningVideoIds }
      );

      winningVideoUsersResult.records.forEach((record) => {
        const videoId = record.get("videoId");
        const taggedUsers = (record.get("taggedUsers") || []).filter(
          (tu: any) => tu.id !== null && tu.id !== undefined
        );
        winningVideoUsersMap.set(videoId, taggedUsers);
      });
    }

    const winningVideos = winningVideosResult.records.map((record) => ({
      videoId: record.get("videoId"),
      videoTitle: record.get("videoTitle") || "Untitled Video",
      videoSrc: record.get("videoSrc"),
      eventId: record.get("eventId"),
      eventTitle: record.get("eventTitle") || "Untitled Event",
      sectionId: record.get("sectionId"),
      sectionTitle: record.get("sectionTitle") || "Untitled Section",
      styles: record.get("styles") || [],
      taggedUsers: winningVideoUsersMap.get(record.get("videoId")) || [],
    }));

    const winningSections = winningSectionsResult.records.map((record) => {
      const dates = record.get("dates");
      let parsedDates: any[] = [];
      if (dates) {
        try {
          parsedDates = typeof dates === "string" ? JSON.parse(dates) : dates;
        } catch (e) {
          parsedDates = [];
        }
      }
      return {
        sectionId: record.get("sectionId"),
        sectionTitle: record.get("sectionTitle") || "Untitled Section",
        sectionType: record.get("sectionType"),
        eventId: record.get("eventId"),
        eventTitle: record.get("eventTitle") || "Untitled Event",
        startDate: record.get("startDate"), // Keep for backward compatibility
        dates: Array.isArray(parsedDates) ? parsedDates : [],
        createdAt: record.get("eventCreatedAt"),
        imageUrl: record.get("imageUrl"),
        city: record.get("city"),
        cityId: record.get("cityId") as number | undefined,
      };
    });

    session.close();

    // Exclude id from being sent to client
    const { id, ...userWithoutId } = userWithStyles || {};

    return {
      success: true,
      profile: {
        ...userWithoutId,
        eventsCreated,
        eventsWithRoles,
        taggedVideos,
        winningVideos,
        winningSections,
      },
    };
  } catch (error) {
    console.error("Failed to get user profile:", error);
    return { success: false, error: "Failed to get user profile" };
  }
}

/**
 * Update user profile in Neo4j
 * Does NOT update username (cannot be changed after signup)
 */
export async function updateUserProfile(userId: string, formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  // Users can only update their own profile (unless admin)
  if (session.user.id !== userId) {
    // TODO: Add admin check if needed
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Validate required fields
    const displayName = formData.get("displayName") as string;
    const cityJson = formData.get("city") as string;

    if (!displayName || !cityJson) {
      return {
        success: false,
        error: "Display name and city are required",
      };
    }

    // Parse city from JSON
    let cityData: City;
    try {
      cityData = JSON.parse(cityJson);
    } catch {
      return {
        success: false,
        error: "Invalid city data format",
      };
    }

    // Get current user to preserve username
    const currentUser = await getUser(userId);
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // Extract optional fields
    const bio = (formData.get("bio") as string) || "";
    const instagram = (formData.get("instagram") as string) || "";
    const website = (formData.get("website") as string) || "";
    const date = (formData.get("date") as string) || currentUser.date || "";

    // Extract styles
    const stylesJson = formData.get("Dance Styles") as string | null;
    let styles: string[] = [];
    if (stylesJson) {
      try {
        styles = JSON.parse(stylesJson);
      } catch (e) {
        console.error("Failed to parse styles:", e);
      }
    }

    // Handle profile picture upload if provided
    let imageUrl = currentUser.image;
    const profilePicture = formData.get("profilePicture") as File | null;
    if (profilePicture && profilePicture.size > 0) {
      // Delete old profile picture if it exists
      if (currentUser.image) {
        await deleteFromR2(currentUser.image);
      }

      const uploadResult = await uploadProfilePictureToR2(
        profilePicture,
        userId
      );
      if (uploadResult.success && uploadResult.url) {
        imageUrl = uploadResult.url;
      }
    }

    // Build user update object (preserve username, don't update it)
    const userUpdate: { [key: string]: any } = {
      id: userId,
      username: currentUser.username, // Preserve username
      displayName,
      city: cityData,
      date,
      bio: bio || null,
      instagram: instagram || null,
      website: website || null,
      image: imageUrl || null,
    };

    // Update user in Neo4j with styles
    await updateUser(userId, userUpdate, styles);

    return { success: true };
  } catch (error) {
    console.error("Failed to update user profile:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}
