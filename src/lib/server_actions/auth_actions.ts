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
import { uploadProfilePictureToGCloudStorage } from "@/lib/GCloud";
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
      const uploadResult = await uploadProfilePictureToGCloudStorage(
        profilePicture
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
 * Accept an invitation and upgrade user level
 */
export async function acceptInvitation(token: string) {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.email) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Find the invitation
    const invitation = await prisma.invitation.findFirst({
      where: {
        token: token,
        expires: { gt: new Date() },
        used: false,
        email: session.user.email, // Must match the invited email
      },
      include: {
        inviter: {
          select: { name: true, email: true },
        },
      },
    });

    if (!invitation) {
      return {
        success: false,
        error: "Invalid, expired, or already used invitation",
      };
    }

    // Update user's auth level and mark invitation as used
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          auth: invitation.authLevel,
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          used: true,
          usedAt: new Date(),
        },
      }),
    ]);

    console.log(
      `✅ User ${session.user.email} accepted invitation from ${invitation.inviter.email} for auth level ${invitation.authLevel}`
    );

    return {
      success: true,
      user: updatedUser,
      newAuthLevel: invitation.authLevel,
      invitedBy: invitation.inviter.name || invitation.inviter.email,
    };
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    return { success: false, error: "Failed to accept invitation" };
  }
}

/**
 * Create a new invitation (admin function)
 */
export async function createInvitation(
  email: string,
  authLevel: number,
  expiresInDays: number = 7
) {
  const session = await auth();

  // Check if current user has permission to invite
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  // TODO: Add proper admin check here
  // if (!session.user.auth || session.user.auth < AUTH_LEVELS.ADMIN) {
  //   return { success: false, error: "Insufficient permissions" };
  // }

  try {
    // Check if user already exists and has equal or higher auth level
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { auth: true, name: true },
    });

    if (existingUser && existingUser.auth && existingUser.auth >= authLevel) {
      return {
        success: false,
        error: `User already has auth level ${existingUser.auth} (${authLevel} requested)`,
      };
    }

    // Check for existing unused invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        used: false,
        expires: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return {
        success: false,
        error: "User already has a pending invitation",
      };
    }

    // Generate secure token
    const token = crypto.randomUUID();
    const expires = new Date();
    expires.setDate(expires.getDate() + expiresInDays);

    const invitation = await prisma.invitation.create({
      data: {
        email,
        authLevel,
        invitedBy: session.user.id,
        token,
        expires,
      },
      include: {
        inviter: {
          select: { name: true, email: true },
        },
      },
    });

    // TODO: Send email via SendGrid
    const magicLink = `${process.env.NEXTAUTH_URL}/accept-invitation?token=${token}`;
    console.log(`📧 [PLACEHOLDER] Send invitation email to ${email}`);
    console.log(
      `   From: ${invitation.inviter.name || invitation.inviter.email}`
    );
    console.log(`   Auth Level: ${authLevel}`);
    console.log(`   Magic Link: ${magicLink}`);
    console.log(`   Expires: ${expires.toLocaleDateString()}`);

    return {
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        authLevel: invitation.authLevel,
        expires: invitation.expires,
        magicLink, // Include for testing purposes
      },
    };
  } catch (error) {
    console.error("Failed to create invitation:", error);
    return { success: false, error: "Failed to create invitation" };
  }
}

/**
 * Get pending invitations (admin function)
 */
export async function getPendingInvitations() {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  // TODO: Add proper admin check here
  // if (!session.user.auth || session.user.auth < AUTH_LEVELS.ADMIN) {
  //   return { success: false, error: "Insufficient permissions" };
  // }

  try {
    const invitations = await prisma.invitation.findMany({
      where: {
        used: false,
        expires: { gt: new Date() },
      },
      include: {
        inviter: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, invitations };
  } catch (error) {
    console.error("Failed to get pending invitations:", error);
    return { success: false, error: "Failed to get pending invitations" };
  }
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
      RETURN e.id as eventId, e.title as eventTitle, e.startDate as startDate,
             e.createdAt as createdAt, poster.url as imageUrl, c.name as city, c.id as cityId,
             collect(DISTINCT s.name) as styles
      ORDER BY e.createdAt DESC
      `,
      { userId }
    );

    const eventsCreated = eventsCreatedResult.records.map((record) => ({
      eventId: record.get("eventId"),
      eventTitle: record.get("eventTitle") || "Untitled Event",
      startDate: record.get("startDate"),
      createdAt: record.get("createdAt"),
      imageUrl: record.get("imageUrl"),
      city: record.get("city"),
      cityId: record.get("cityId") as number | undefined,
      styles: record.get("styles") || [],
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
             collect(DISTINCT s.name) as styles
      ORDER BY e.createdAt DESC
      `,
      { userId, validRoles: validRoleFormats }
    );

    const eventsWithRoles = eventsWithRolesResult.records.map((record) => ({
      eventId: record.get("eventId"),
      eventTitle: record.get("eventTitle") || "Untitled Event",
      roles: record.get("roles") || [],
      createdAt: record.get("createdAt"),
      startDate: record.get("startDate"),
      imageUrl: record.get("imageUrl"),
      city: record.get("city"),
      cityId: record.get("cityId") as number | undefined,
      styles: record.get("styles") || [],
    }));

    // Get videos where user is tagged with full video data (collecting all roles)
    const taggedVideosResult = await session.run(
      `
      MATCH (u:User {id: $userId})-[r:IN]->(v:Video)
      OPTIONAL MATCH (v)-[:IN]->(s:Section)-[:IN]->(e:Event)
      OPTIONAL MATCH (v)-[:IN]->(b:Bracket)-[:IN]->(s2:Section)-[:IN]->(e2:Event)
      OPTIONAL MATCH (v)-[:STYLE]->(style:Style)
      WITH v, COALESCE(e, e2) as event, COALESCE(s, s2) as section, r.role as role, style
      WHERE event IS NOT NULL
      RETURN v.id as videoId, v.title as videoTitle, v.src as videoSrc,
             event.id as eventId, event.title as eventTitle, event.createdAt as eventCreatedAt,
             section.id as sectionId, section.title as sectionTitle, 
             collect(DISTINCT role) as roles, collect(DISTINCT style.name) as styles
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
        MATCH (v:Video)<-[r:IN]-(u:User)
        WHERE v.id IN $videoIds
        RETURN v.id as videoId, collect(DISTINCT {
          id: u.id,
          displayName: u.displayName,
          username: u.username,
          role: r.role
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
      const uploadResult = await uploadProfilePictureToGCloudStorage(
        profilePicture
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
