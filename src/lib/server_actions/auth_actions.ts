"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  signupUser,
  getUser,
  getUserByUsername,
  getUserWithStyles,
  updateUser,
  UpdateUserInput,
} from "@/db/queries/user";
import {
  uploadProfilePictureToR2,
  uploadProfileAndAvatarToR2,
  deleteFromR2,
} from "@/lib/R2";
import { getNeo4jRoleFormats } from "@/lib/utils/roles";
import driver from "@/db/driver";
import { auth } from "@/auth";
import { prisma } from "@/lib/primsa";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import {
  getCitySlug,
  revalidateCalendarForSlugs,
} from "@/lib/server_actions/calendar_revalidation";
import { City } from "@/types/city";
import { signIn, signOut } from "@/auth";
import { EventDate, EventType, Event, EventDetails } from "@/types/event";
import {
  getEventTypeFromLabel,
  getAllEventTypeLabels,
} from "@/db/queries/event";
import { UserSearchItem } from "@/types/user";
import { Image } from "@/types/image";
import {
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_USERNAME,
  isReservedUsername,
  canUseReservedUsername,
  getOrCreateSuperAdminUser,
} from "@/lib/utils/admin-user";
import { deleteUser } from "@/db/queries/user";
import { getUserEvents } from "@/db/queries/user";
import { deleteEvent, getEvent, getEventImages } from "@/db/queries/event";
import { addMailerLiteSubscriber } from "@/lib/mailerlite";
import { randomUUID } from "crypto";
import { normalizeInstagramHandle } from "@/lib/utils/instagram";

export async function signInWithGoogle() {
  const result = (await signIn("google", { redirectTo: "/signup" })) as any;

  if (result?.error) {
    console.error(result.error);
    return;
  }

  if (result?.redirect) {
    // NextAuth returns the provider redirect URL; forward it to the client.
    redirect(result.redirect);
  }

  // Fallback: if no redirect was provided, send user based on registration status.
  const session = await auth();
  if (session?.user?.accountVerified) {
    redirect("/dashboard");
  } else {
    redirect("/signup");
  }
}

export async function signOutAccount() {
  await signOut({ redirectTo: "/" });
}

async function findUnclaimedUserByInstagram(instagram: string) {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User {instagram: $instagram, claimed: false})
      RETURN u
      LIMIT 1
      `,
      { instagram },
    );
    if (result.records.length === 0) {
      return null;
    }
    return result.records[0].get("u").properties as UserSearchItem;
  } finally {
    await session.close();
  }
}

async function removeAllUserRelationships(userId: string) {
  const session = driver.session();
  try {
    await session.run(
      `
      MATCH (u:User {id: $userId})-[r]-()
      DELETE r
      `,
      { userId },
    );
  } finally {
    await session.close();
  }
}

async function transferUserRelationships(
  sourceUserId: string,
  targetUserId: string,
) {
  const session = driver.session();
  try {
    // Get all relationships from source
    const relsResult = await session.run(
      `
      MATCH (source:User {id: $sourceUserId})-[r]-(other)
      RETURN 
        type(r) as relType, 
        startNode(r).id as startId,
        endNode(r).id as endId,
        properties(r) as props
      `,
      { sourceUserId },
    );

    // Process each relationship
    for (const record of relsResult.records) {
      const relType = record.get("relType");
      const startId = record.get("startId");
      const endId = record.get("endId");
      const props = record.get("props");

      const isOutgoing = startId === sourceUserId;
      const otherNodeId = isOutgoing ? endId : startId;

      // Skip user-to-user relationships to avoid duplicates
      if (otherNodeId === targetUserId) continue;

      // Create new relationship from/to target user using APOC
      if (isOutgoing) {
        await session.run(
          `
          MATCH (target:User {id: $targetUserId})
          MATCH (other {id: $otherNodeId})
          CALL apoc.create.relationship(target, $relType, $props, other) YIELD rel
          RETURN rel
          `,
          { targetUserId, otherNodeId, relType, props },
        );
      } else {
        await session.run(
          `
          MATCH (target:User {id: $targetUserId})
          MATCH (other {id: $otherNodeId})
          CALL apoc.create.relationship(other, $relType, $props, target) YIELD rel
          RETURN rel
          `,
          { targetUserId, otherNodeId, relType, props },
        );
      }
    }

    // Delete old relationships from source
    await session.run(
      `
      MATCH (source:User {id: $sourceUserId})-[r]-()
      DELETE r
      `,
      { sourceUserId },
    );
  } finally {
    await session.close();
  }
}

async function instagramExistsInNeo4j(instagram: string): Promise<boolean> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User {instagram: $instagram})
      RETURN count(u) as count
      `,
      { instagram },
    );
    const count = result.records[0]?.get("count")?.toNumber?.() || 0;
    return count > 0;
  } finally {
    await session.close();
  }
}

export async function getUnclaimedUserTagCount(
  userId: string,
): Promise<number> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})
      OPTIONAL MATCH (u)-[r]-()
      RETURN count(r) as relCount
      `,
      { userId },
    );
    return result.records[0]?.get("relCount")?.toNumber?.() || 0;
  } finally {
    await session.close();
  }
}

export async function executeAccountMerge(params: {
  sourceUserId: string;
  targetUserId: string;
  wipeRelationships?: boolean;
  targetInstagram?: string | null;
}) {
  const { sourceUserId, targetUserId, wipeRelationships, targetInstagram } =
    params;

  if (sourceUserId === targetUserId) {
    return { success: true };
  }

  const [sourceUser, targetUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: sourceUserId } }),
    prisma.user.findUnique({ where: { id: targetUserId } }),
  ]);

  if (!sourceUser || !targetUser) {
    throw new Error("Source or target user not found");
  }

  const sourceProfile = await getUser(sourceUserId);
  const targetProfile = await getUser(targetUserId);

  // Only allow wiping relationships when the target is an unclaimed account.
  // If the target is already a claimed account (i.e., a real user switching IG),
  // we should preserve their existing tags/relationships.
  const allowWipe = wipeRelationships && !targetUser.claimed;

  if (allowWipe) {
    await removeAllUserRelationships(targetUserId);
  }

  // Move OAuth accounts from source onto target
  await prisma.account.updateMany({
    where: { userId: sourceUserId },
    data: { userId: targetUserId },
  });

  // Transfer relationships from source to target (unless we wiped them above)
  if (!allowWipe) {
    await transferUserRelationships(sourceUserId, targetUserId);
  }

  // Determine the Instagram to use:
  // 1. Use targetInstagram if provided (from the claim request)
  // 2. Otherwise use target's existing Instagram (preserve it)
  // 3. Fall back to source's Instagram if target doesn't have one
  const instagramToUse =
    targetInstagram ||
    targetProfile?.instagram ||
    sourceProfile?.instagram ||
    null;

  // Build profile data from source profile to apply to target
  const profileData = sourceProfile
    ? {
        displayName: sourceProfile.displayName || sourceUser.name || "",
        username: sourceProfile.username || targetUser.email.split("@")[0],
        city: sourceProfile.city || "",
        date: (sourceProfile.date as string) || "",
        styles: sourceProfile.styles || [],
        bio: sourceProfile.bio || null,
        instagram: instagramToUse,
        website: sourceProfile.website || null,
        image: sourceProfile.image || sourceUser.image || null,
        avatar: (sourceProfile as { avatar?: string | null }).avatar || null,
      }
    : null;

  if (profileData) {
    await prisma.userCard.deleteMany({
      where: { userId: sourceUserId },
    });

    await signupUser(targetUserId, {
      ...profileData,
      claimed: true,
    });

    await prisma.userCard.upsert({
      where: { userId: targetUserId },
      update: {
        username: profileData.username,
        displayName: profileData.displayName,
        imageUrl: profileData.image ?? null,
        cityId:
          typeof profileData.city === "object"
            ? (profileData.city?.id ?? null)
            : null,
        cityName:
          typeof profileData.city === "object"
            ? (profileData.city?.name ?? null)
            : ((profileData.city as string) ?? null),
        styles: (profileData.styles || []).map((s: string) =>
          s.toUpperCase().trim(),
        ),
      },
      create: {
        userId: targetUserId,
        username: profileData.username,
        displayName: profileData.displayName,
        imageUrl: profileData.image ?? null,
        cityId:
          typeof profileData.city === "object"
            ? (profileData.city?.id ?? null)
            : null,
        cityName:
          typeof profileData.city === "object"
            ? (profileData.city?.name ?? null)
            : ((profileData.city as string) ?? null),
        styles: (profileData.styles || []).map((s: string) =>
          s.toUpperCase().trim(),
        ),
      },
    });
  }

  // Clear the source user's username first to avoid unique constraint violation,
  // then update target user's verification and claimed status
  const usernameToApply = profileData?.username;
  if (usernameToApply && usernameToApply !== targetUser.username) {
    // Clear the source user's username so we can assign it to the target
    await prisma.user.update({
      where: { id: sourceUserId },
      data: { username: `deleted-${sourceUserId}` } as any,
    });
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      accountVerified: targetUser.accountVerified ?? new Date(),
      name: sourceUser.name ?? targetUser.name,
      username: usernameToApply ?? undefined,
      claimed: true,
    } as any,
  });

  // Delete the source user after merge is complete (from both PostgreSQL and Neo4j)
  await prisma.user.delete({
    where: { id: sourceUserId },
  });

  // Delete the source user node from Neo4j
  const neoSession = driver.session();
  try {
    await neoSession.run(
      `
      MATCH (source:User {id: $sourceUserId})
      DETACH DELETE source
      `,
      { sourceUserId },
    );
  } finally {
    await neoSession.close();
  }

  return { success: true };
}

export async function createUnclaimedUser(
  displayName: string,
  instagram: string,
): Promise<{ success: boolean; user?: UserSearchItem; error?: string }> {
  try {
    const normalizedInstagram = normalizeInstagramHandle(instagram || "");
    if (!displayName?.trim()) {
      return { success: false, error: "Display name is required" };
    }
    if (!normalizedInstagram) {
      return { success: false, error: "Instagram handle is required" };
    }

    const igExists = await instagramExistsInNeo4j(normalizedInstagram);
    if (igExists) {
      return { success: false, error: "Existing account" };
    }

    const username = `user-${randomUUID()}`;
    const email = `${username}@unclaimed.com`;

    const createdUser = await prisma.user.create({
      data: {
        name: displayName,
        email,
        username,
        // Prisma client types may lag migrations; claimed column exists in schema
        claimed: false,
        auth: null,
      } as any,
    });

    // Create the Neo4j User node WITHOUT creating a City node (unclaimed users don't have a city yet).
    // This avoids creating Cities with empty ids/slugs which can break Radix Select dropdowns.
    const neoSession = driver.session();
    try {
      await neoSession.run(
        `
        MERGE (u:User {id: $id})
        SET
          u.displayName = $displayName,
          u.username = $username,
          u.date = "",
          u.bio = null,
          u.instagram = $instagram,
          u.website = null,
          u.image = null,
          u.avatar = null,
          u.claimed = false
        RETURN u
        `,
        {
          id: createdUser.id,
          displayName,
          username,
          instagram: normalizedInstagram,
        },
      );
    } finally {
      await neoSession.close();
    }

    await prisma.userCard.upsert({
      where: { userId: createdUser.id },
      update: {
        username,
        displayName,
        imageUrl: null,
        cityId: null,
        cityName: null,
        styles: [],
      },
      create: {
        userId: createdUser.id,
        username,
        displayName,
        imageUrl: null,
        cityId: null,
        cityName: null,
        styles: [],
      },
    });

    // Make sure the profiles list picks up the new unclaimed account immediately.
    revalidatePath("/profiles");

    return {
      success: true,
      user: {
        id: createdUser.id,
        username,
        displayName,
        instagram: normalizedInstagram,
        claimed: false,
        avatar: null,
        image: null,
      },
    };
  } catch (error) {
    console.error("Error creating unclaimed user:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create unclaimed user",
    };
  }
}

export async function signup(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session) {
    console.error("No user session found");
    return { success: false, error: "No user session found" };
  }

  if (
    !formData.get("displayName") ||
    !formData.get("username") ||
    !formData.get("date") ||
    !formData.get("city")
  ) {
    console.error("Missing required fields");
    return { success: false, error: "Missing required fields" };
  }

  // Validate agreement checkboxes
  const termsAccepted = formData.get("termsAccepted") === "true";
  const contentUsageAccepted = formData.get("contentUsageAccepted") === "true";

  if (!termsAccepted) {
    return {
      success: false,
      error: "You must agree to the terms of service and privacy policy",
    };
  }

  if (!contentUsageAccepted) {
    return {
      success: false,
      error: "You must agree to the content usage and marketing policy",
    };
  }

  try {
    // Validate username - check if it's reserved
    const requestedUsername = (formData.get("username") as string)
      ?.toLowerCase()
      .trim();

    if (!requestedUsername) {
      return { success: false, error: "Username is required" };
    }

    // Check if username is reserved
    if (isReservedUsername(requestedUsername)) {
      // Only allow the reserved username for the super admin email
      if (!canUseReservedUsername(requestedUsername, session.user.email)) {
        return {
          success: false,
          error: `The username "${requestedUsername}" is reserved and cannot be used.`,
        };
      }
    }

    // Check if username is already taken (unless it's the admin user signing up)
    const existingUser = await getUserByUsername(requestedUsername);
    if (
      existingUser &&
      existingUser.id !== session.user.id &&
      !(
        isReservedUsername(requestedUsername) &&
        session.user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
      )
    ) {
      return {
        success: false,
        error: "Username is already taken",
      };
    }

    // Check if this is the super admin user
    const isSuperAdminUser =
      session.user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

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
    const accountClaimTargetId =
      (formData.get("accountClaimTargetId") as string) || null;
    const accountClaimTagCountRaw = formData.get("accountClaimTagCount");
    const accountClaimTagCount =
      typeof accountClaimTagCountRaw === "string"
        ? parseInt(accountClaimTagCountRaw, 10)
        : null;
    const wipeRelationships = formData.get("wipeRelationships") === "true";

    const normalizedInstagram = normalizeInstagramHandle(
      instagram || session.user.instagram || "",
    );

    let targetUserId = session.user.id;
    let resolvedAccountClaimTargetId = accountClaimTargetId;
    let resolvedAccountClaimTagCount = accountClaimTagCount;

    if (normalizedInstagram) {
      const sessionNeo = driver.session();
      try {
        const result = await sessionNeo.run(
          `
        MATCH (u:User {instagram: $instagram})
        RETURN u.id as id, u.claimed as claimed
        LIMIT 1
        `,
          { instagram: normalizedInstagram },
        );
        if (result.records.length > 0) {
          const record = result.records[0];
          const claimed = record.get("claimed") === true;
          const foundId = record.get("id") as string;
          if (claimed) {
            return {
              success: false,
              error: "Instagram handle is already taken",
            };
          }
          resolvedAccountClaimTargetId = foundId;
          resolvedAccountClaimTagCount =
            resolvedAccountClaimTagCount ??
            (await getUnclaimedUserTagCount(foundId));
        }
      } finally {
        await sessionNeo.close();
      }
    }

    // Handle profile and avatar picture uploads if provided
    let imageUrl: string | null = null;
    let avatarUrl: string | null = null;
    const profilePicture = formData.get("profilePicture") as File | null;
    const avatarPicture = formData.get("avatarPicture") as File | null;

    if (
      profilePicture &&
      profilePicture.size > 0 &&
      avatarPicture &&
      avatarPicture.size > 0
    ) {
      // Use username for R2 paths (public-facing identifier)
      const username = requestedUsername;
      if (!username) {
        console.error("Username is required for profile picture upload");
      } else {
        const uploadResult = await uploadProfileAndAvatarToR2(
          profilePicture,
          avatarPicture,
          username,
        );
        if (uploadResult.success) {
          imageUrl = uploadResult.profileUrl || null;
          avatarUrl = uploadResult.avatarUrl || null;
        }
      }
    } else if (profilePicture && profilePicture.size > 0) {
      // Fallback to single upload if only profile picture is provided
      const username = requestedUsername;
      if (!username) {
        console.error("Username is required for profile picture upload");
      } else {
        const uploadResult = await uploadProfilePictureToR2(
          profilePicture,
          username,
        );
        if (uploadResult.success && uploadResult.url) {
          imageUrl = uploadResult.url;
        }
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

    type ProfileData = {
      displayName: string;
      username: string;
      city: City | string;
      date: string;
      styles: string[];
      bio: string | null;
      instagram: string | null;
      website: string | null;
      image: string | null;
      avatar?: string | null;
    };

    // For super admin user, ensure username is "admin"
    const finalUsername = isSuperAdminUser
      ? SUPER_ADMIN_USERNAME
      : requestedUsername;

    // Determine if we should set the Instagram handle
    // Don't set if we're claiming an unclaimed profile (wait for approval)
    const shouldSetInstagram = !resolvedAccountClaimTargetId;
    const instagramToSet = shouldSetInstagram
      ? normalizedInstagram || null
      : null;

    // Use form data for profile
    const profileData: ProfileData = {
      displayName: formData.get("displayName") as string,
      username: finalUsername,
      city: cityData,
      date: formData.get("date") as string,
      styles,
      bio: bio || null,
      instagram: instagramToSet,
      website: website || null,
      image: imageUrl,
      avatar: avatarUrl,
    };

    // Update user in Neo4j with profile information
    const userResult = await signupUser(targetUserId, {
      ...profileData,
      claimed: true,
    });

    // Upsert Postgres user_cards projection (for fast user card feeds)
    const cityObj =
      typeof profileData.city === "object" ? profileData.city : null;
    await prisma.userCard.upsert({
      where: { userId: targetUserId },
      update: {
        username: profileData.username,
        displayName: profileData.displayName,
        imageUrl: profileData.image ?? null,
        cityId: cityObj?.id ?? null,
        cityName:
          cityObj?.name ??
          (typeof profileData.city === "string" ? profileData.city : null),
        styles: (profileData.styles || []).map((s) => s.toUpperCase().trim()),
      },
      create: {
        userId: targetUserId,
        username: profileData.username,
        displayName: profileData.displayName,
        imageUrl: profileData.image ?? null,
        cityId: cityObj?.id ?? null,
        cityName:
          cityObj?.name ??
          (typeof profileData.city === "string" ? profileData.city : null),
        styles: (profileData.styles || []).map((s) => s.toUpperCase().trim()),
      },
    });

    // Determine auth level
    let authLevel: number;
    if (isSuperAdminUser) {
      // Super admin user automatically gets SUPER_ADMIN privileges
      authLevel = AUTH_LEVELS.SUPER_ADMIN;
    } else {
      // Check if user wants to be a creator (one-time decision during signup)
      const isCreator = formData.get("isCreator") === "true";
      authLevel = isCreator ? AUTH_LEVELS.CREATOR : AUTH_LEVELS.BASE_USER;
    }

    // Mark account as verified in PostgreSQL (user completed registration)
    // Store agreement dates when account is verified
    const verificationDate = new Date();
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        accountVerified: verificationDate,
        termsAcceptedAt: verificationDate,
        contentUsageAcceptedAt: verificationDate,
        name: profileData.displayName || session.user.name,
        username: profileData.username,
        auth: authLevel,
        // Prisma client types may lag migrations; claimed column exists in schema
        claimed: true,
      } as any,
    });

    if (isSuperAdminUser) {
      console.log(
        `🔑 Auto-assigned SUPER_ADMIN (${authLevel}) to ${session.user.email}`,
      );
      console.log(
        `📝 Super admin user created with username: ${SUPER_ADMIN_USERNAME}`,
      );
    }

    // Handle newsletter subscription if user opted in
    const newsletterSubscribed =
      formData.get("newsletterSubscribed") === "true";
    if (newsletterSubscribed && session.user.email) {
      try {
        const mailerLiteResult = await addMailerLiteSubscriber(
          session.user.email,
          profileData.displayName,
          "subscribers",
        );
        if (mailerLiteResult.success) {
          console.log("✅ User subscribed to MailerLite newsletter");
        } else {
          console.warn(
            "⚠️  Failed to subscribe user to newsletter:",
            mailerLiteResult.error,
          );
          // Don't fail the signup if newsletter subscription fails
        }
      } catch (error) {
        console.error("Error subscribing to newsletter:", error);
        // Don't fail the signup if newsletter subscription fails
      }
    }

    // Create account claim request if applicable
    if (resolvedAccountClaimTargetId && normalizedInstagram) {
      const existingClaim = await prisma.accountClaimRequest.findFirst({
        where: {
          senderId: targetUserId,
          targetUserId: resolvedAccountClaimTargetId,
          status: "PENDING",
        },
      });

      if (!existingClaim) {
        await prisma.accountClaimRequest.create({
          data: {
            senderId: targetUserId,
            targetUserId: resolvedAccountClaimTargetId,
            instagramHandle: normalizedInstagram,
            tagCount:
              resolvedAccountClaimTagCount ??
              (await getUnclaimedUserTagCount(resolvedAccountClaimTargetId)),
            wipeRelationships,
          },
        });
      }
    }

    // Revalidate profiles list page to show new profile
    revalidatePath("/profiles");
    // Also revalidate the individual profile page
    revalidatePath(`/profiles/${profileData.username}`);

    return { success: true };
  } catch (error) {
    console.error("❌ Signup failed:", error);
    return { success: false, error: "Failed to signup" };
  }
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
    const allEventTypeLabels = getAllEventTypeLabels();

    // Get events created by user with full event data
    const eventsCreatedResult = await session.run(
      `
      MATCH (u:User {id: $userId})-[:CREATED]->(e:Event)
      OPTIONAL MATCH (e)-[:IN]->(c:City)
      OPTIONAL MATCH (poster:Image)-[:POSTER_OF]->(e)
      OPTIONAL MATCH (e)-[:STYLE]->(s:Style)
      WITH e, c, poster, s, u,
           [label IN labels(e) WHERE label IN $allEventTypeLabels][0] as eventTypeLabel
      RETURN e.id as eventId, e.title as eventTitle, e.startDate as startDate, e.dates as dates,
             e.createdAt as createdAt, e.updatedAt as updatedAt, u.id as creatorId,
             poster.id as posterId, poster.title as posterTitle, poster.url as imageUrl, 
             c.name as cityName, c.id as cityId, c.countryCode as cityCountryCode, 
             c.region as cityRegion, c.timezone as cityTimezone,
             collect(DISTINCT s.name) as styles, eventTypeLabel
      ORDER BY e.createdAt DESC
      `,
      { userId, allEventTypeLabels },
    );

    const eventsCreated: Event[] = eventsCreatedResult.records.map((record) => {
      const dates = record.get("dates");
      const eventTypeLabel = record.get("eventTypeLabel");
      let parsedDates: EventDate[] = [];
      if (dates) {
        try {
          parsedDates = typeof dates === "string" ? JSON.parse(dates) : dates;
        } catch {
          parsedDates = [];
        }
      }

      const eventId = record.get("eventId");
      const imageUrl = record.get("imageUrl");
      const posterId = record.get("posterId");
      const posterTitle = record.get("posterTitle");
      const cityId = record.get("cityId");
      const cityName = record.get("cityName");

      // Build poster Image object if imageUrl exists
      const poster: Image | null = imageUrl
        ? {
            id: posterId || "",
            title: posterTitle || "",
            url: imageUrl,
            type: "poster",
            file: null,
          }
        : null;

      // Build City object
      const city: City = cityId
        ? {
            id: String(cityId),
            name: cityName || "",
            countryCode: record.get("cityCountryCode") || "",
            region: record.get("cityRegion") || "",
            timezone: record.get("cityTimezone") || undefined,
          }
        : {
            id: "",
            name: "",
            countryCode: "",
            region: "",
          };

      // Build eventDetails
      const creatorId = record.get("creatorId") || userId;
      const eventDetails: EventDetails = {
        title: record.get("eventTitle") || "Untitled Event",
        dates: Array.isArray(parsedDates) ? parsedDates : [],
        poster: poster,
        city: city,
        styles: record.get("styles") || [],
        eventType: eventTypeLabel
          ? (getEventTypeFromLabel(eventTypeLabel) as EventType)
          : "Other",
        creatorId: creatorId,
      };

      // Build Event object
      const createdAt = record.get("createdAt");
      const updatedAt = record.get("updatedAt");

      return {
        id: eventId,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
        eventDetails: eventDetails,
        roles: [],
        gallery: [],
        sections: [],
      };
    });

    // Get events where user has roles with full event data (collecting all roles)
    const validRoleFormats = getNeo4jRoleFormats();
    const eventsWithRolesResult = await session.run(
      `
      MATCH (u:User {id: $userId})-[roleRel]->(e:Event)
      WHERE type(roleRel) IN $validRoles
      OPTIONAL MATCH (e)-[:IN]->(c:City)
      OPTIONAL MATCH (poster:Image)-[:POSTER_OF]->(e)
      OPTIONAL MATCH (e)-[:STYLE]->(s:Style)
      OPTIONAL MATCH (creator:User)-[:CREATED]->(e)
      WITH e, c, poster, s, creator, type(roleRel) as role,
           [label IN labels(e) WHERE label IN $allEventTypeLabels][0] as eventTypeLabel
      RETURN e.id as eventId, e.title as eventTitle, 
             collect(DISTINCT role) as roles,
             e.createdAt as createdAt, e.updatedAt as updatedAt, e.startDate as startDate,
             e.dates as dates, creator.id as creatorId,
             head(collect(DISTINCT poster.id)) as posterId,
             head(collect(DISTINCT poster.title)) as posterTitle,
             head(collect(DISTINCT poster.url)) as imageUrl, 
             head(collect(DISTINCT c.name)) as cityName,
             head(collect(DISTINCT c.id)) as cityId,
             head(collect(DISTINCT c.countryCode)) as cityCountryCode,
             head(collect(DISTINCT c.region)) as cityRegion,
             head(collect(DISTINCT c.timezone)) as cityTimezone,
             collect(DISTINCT s.name) as styles, eventTypeLabel
      ORDER BY e.createdAt DESC
      `,
      { userId, validRoles: validRoleFormats, allEventTypeLabels },
    );

    const eventsWithRoles: Event[] = eventsWithRolesResult.records.map(
      (record) => {
        const dates = record.has("dates") ? record.get("dates") : undefined;
        const eventTypeLabel = record.get("eventTypeLabel");
        let parsedDates: EventDate[] = [];
        if (dates) {
          try {
            parsedDates = typeof dates === "string" ? JSON.parse(dates) : dates;
          } catch {
            parsedDates = [];
          }
        }

        const eventId = record.get("eventId");
        const imageUrl = record.get("imageUrl");
        const posterId = record.get("posterId");
        const posterTitle = record.get("posterTitle");
        const cityId = record.get("cityId");
        const cityName = record.get("cityName");
        const roles = record.get("roles") || [];

        // Build poster Image object if imageUrl exists
        const poster: Image | null = imageUrl
          ? {
              id: posterId || "",
              title: posterTitle || "",
              url: imageUrl,
              type: "poster",
              file: null,
            }
          : null;

        // Build City object
        const city: City = cityId
          ? {
              id: String(cityId),
              name: cityName || "",
              countryCode: record.get("cityCountryCode") || "",
              region: record.get("cityRegion") || "",
              timezone: record.get("cityTimezone") || undefined,
            }
          : {
              id: "",
              name: "",
              countryCode: "",
              region: "",
            };

        // Build eventDetails
        const creatorId = record.get("creatorId") || "";
        const eventDetails: EventDetails = {
          title: record.get("eventTitle") || "Untitled Event",
          dates: Array.isArray(parsedDates) ? parsedDates : [],
          poster: poster,
          city: city,
          styles: record.get("styles") || [],
          eventType: eventTypeLabel
            ? (getEventTypeFromLabel(eventTypeLabel) as EventType)
            : "Other",
          creatorId: creatorId,
        };

        // Build Event object with roles
        const createdAt = record.get("createdAt");
        const updatedAt = record.get("updatedAt");

        // Transform roles to Role[] format
        const roleObjects = roles.map((roleTitle: string) => ({
          id: `${eventId}-${roleTitle}`,
          title: roleTitle,
          user: null, // We don't have user info for roles in this query
        }));

        return {
          id: eventId,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
          updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
          eventDetails: eventDetails,
          roles: roleObjects,
          gallery: [],
          sections: [],
        };
      },
    );

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
      { userId },
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
      { userId },
    );

    // Get winning sections (where user has :WINNER relationship)
    const winningSectionsResult = await session.run(
      `
      MATCH (u:User {id: $userId})-[r:WINNER]->(s:Section)
      MATCH (s)-[:IN]->(e:Event)
      OPTIONAL MATCH (e)-[:IN]->(c:City)
      OPTIONAL MATCH (poster:Image)-[:POSTER_OF]->(e)
      WITH s, e, c, poster,
           [label IN labels(s) WHERE label IN ['BattleSection', 'CompetitionSection', 'PerformanceSection', 'ExhibitionSection', 'ShowcaseSection', 'ClassSection', 'SessionSection', 'PartySection']] as sectionTypeLabels
      RETURN s.id as sectionId, s.title as sectionTitle,
             CASE 
               WHEN size(sectionTypeLabels) > 0 THEN 
                 CASE sectionTypeLabels[0]
                   WHEN 'BattleSection' THEN 'Battle'
                   WHEN 'CompetitionSection' THEN 'Competition'
                   WHEN 'PerformanceSection' THEN 'Performance'
                   WHEN 'ExhibitionSection' THEN 'Exhibition'
                   WHEN 'ShowcaseSection' THEN 'Showcase'
                   WHEN 'ClassSection' THEN 'Class'
                   WHEN 'SessionSection' THEN 'Session'
                   WHEN 'PartySection' THEN 'Party'
                   ELSE null
                 END
               ELSE null 
             END as sectionType,
             e.id as eventId, e.title as eventTitle, e.startDate as startDate, e.dates as dates,
             e.createdAt as eventCreatedAt, poster.url as imageUrl,
             c.name as city, c.id as cityId
      ORDER BY eventCreatedAt DESC
      `,
      { userId },
    );

    // Get all tagged users for each video
    const videoIds = taggedVideosResult.records.map((record) =>
      record.get("videoId"),
    );
    const taggedUsersMap = new Map<string, UserSearchItem[]>();

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
          avatar: u.avatar,
          image: u.image,
          role: role
        }) as taggedUsers
        `,
        { videoIds },
      );

      taggedUsersResult.records.forEach((record) => {
        const videoId = record.get("videoId");
        const taggedUsers = (record.get("taggedUsers") || []).filter(
          (tu: UserSearchItem) => tu.id !== null && tu.id !== undefined,
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
      eventCreatedAt: record.get("eventCreatedAt"),
    }));

    // Get all tagged users for winning videos
    const winningVideoIds = winningVideosResult.records.map((record) =>
      record.get("videoId"),
    );
    const winningVideoUsersMap = new Map<string, UserSearchItem[]>();

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
          avatar: u.avatar,
          image: u.image,
          role: role
        }) as taggedUsers
        `,
        { videoIds: winningVideoIds },
      );

      winningVideoUsersResult.records.forEach((record) => {
        const videoId = record.get("videoId");
        const taggedUsers = (record.get("taggedUsers") || []).filter(
          (tu: UserSearchItem) => tu.id !== null && tu.id !== undefined,
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
      let parsedDates: EventDate[] = [];
      if (dates) {
        try {
          parsedDates = typeof dates === "string" ? JSON.parse(dates) : dates;
        } catch {
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
        cityId: record.get("cityId") ? String(record.get("cityId")) : undefined,
      };
    });

    session.close();

    // Exclude id from being sent to client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...userWithoutId } = userWithStyles || {};

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
    const accountClaimTargetId =
      (formData.get("accountClaimTargetId") as string) || null;
    const accountClaimTagCountRaw = formData.get("accountClaimTagCount");
    const accountClaimTagCount =
      typeof accountClaimTagCountRaw === "string"
        ? parseInt(accountClaimTagCountRaw, 10)
        : null;
    const wipeRelationships = formData.get("wipeRelationships") === "true";

    const normalizedInstagram = normalizeInstagramHandle(instagram || "");
    let resolvedAccountClaimTargetId = accountClaimTargetId;
    let resolvedAccountClaimTagCount = accountClaimTagCount;

    if (normalizedInstagram) {
      const sessionNeo = driver.session();
      try {
        const result = await sessionNeo.run(
          `
          MATCH (u:User {instagram: $instagram})
          RETURN u.id as id, u.claimed as claimed
          LIMIT 1
          `,
          { instagram: normalizedInstagram },
        );
        if (result.records.length > 0) {
          const record = result.records[0];
          const claimed = record.get("claimed") === true;
          const foundId = record.get("id") as string;
          if (claimed && foundId !== userId) {
            return {
              success: false,
              error: "Instagram handle is already taken",
            };
          }
          if (foundId !== userId && !claimed) {
            resolvedAccountClaimTargetId = foundId;
            resolvedAccountClaimTagCount =
              resolvedAccountClaimTagCount ??
              (await getUnclaimedUserTagCount(foundId));
          }
        }
      } finally {
        await sessionNeo.close();
      }
    }

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

    // Handle profile and avatar picture uploads if provided
    let imageUrl = currentUser.image;
    let avatarUrl = (currentUser as { avatar?: string | null }).avatar || null;
    const profilePicture = formData.get("profilePicture") as File | null;
    const avatarPicture = formData.get("avatarPicture") as File | null;

    if (
      profilePicture &&
      profilePicture.size > 0 &&
      avatarPicture &&
      avatarPicture.size > 0
    ) {
      // Delete old profile and avatar pictures if they exist
      if (currentUser.image) {
        await deleteFromR2(currentUser.image);
      }
      if (avatarUrl) {
        await deleteFromR2(avatarUrl);
      }

      // Use username for R2 paths (public-facing identifier)
      const username = currentUser.username;
      if (!username) {
        console.error("Username is required for profile picture upload");
      } else {
        const uploadResult = await uploadProfileAndAvatarToR2(
          profilePicture,
          avatarPicture,
          username,
        );
        if (uploadResult.success) {
          imageUrl = uploadResult.profileUrl || currentUser.image;
          avatarUrl = uploadResult.avatarUrl || null;
        }
      }
    } else if (profilePicture && profilePicture.size > 0) {
      // Fallback to single upload if only profile picture is provided
      if (currentUser.image) {
        await deleteFromR2(currentUser.image);
      }

      const username = currentUser.username;
      if (!username) {
        console.error("Username is required for profile picture upload");
      } else {
        const uploadResult = await uploadProfilePictureToR2(
          profilePicture,
          username,
        );
        if (uploadResult.success && uploadResult.url) {
          imageUrl = uploadResult.url;
        }
      }
    }

    // Determine if we should update the Instagram handle
    // Don't update if we're claiming an unclaimed profile (wait for approval)
    const shouldUpdateInstagram = !resolvedAccountClaimTargetId;
    const instagramToSet = shouldUpdateInstagram
      ? normalizedInstagram || null
      : currentUser.instagram || null;

    // Build user update object (preserve username, don't update it)
    const userUpdate: UpdateUserInput = {
      id: userId,
      username: currentUser.username, // Preserve username
      displayName,
      city: cityData,
      date,
      bio: bio || null,
      instagram: instagramToSet,
      website: website || null,
      image: imageUrl || null,
      avatar: avatarUrl || null,
    };

    // Update user in Neo4j with styles
    await updateUser(userId, userUpdate, styles);

    // Upsert Postgres user_cards projection (for fast user card feeds)
    await prisma.userCard.upsert({
      where: { userId },
      update: {
        username: currentUser.username,
        displayName: userUpdate.displayName || currentUser.displayName || "",
        imageUrl: (userUpdate.image as string | null) ?? null,
        cityId: cityData?.id ?? null,
        cityName: cityData?.name ?? null,
        styles: (styles || []).map((s) => s.toUpperCase().trim()),
      },
      create: {
        userId,
        username: currentUser.username,
        displayName: userUpdate.displayName || currentUser.displayName || "",
        imageUrl: (userUpdate.image as string | null) ?? null,
        cityId: cityData?.id ?? null,
        cityName: cityData?.name ?? null,
        styles: (styles || []).map((s) => s.toUpperCase().trim()),
      },
    });

    if (resolvedAccountClaimTargetId && normalizedInstagram) {
      const existingClaim = await prisma.accountClaimRequest.findFirst({
        where: {
          senderId: userId,
          targetUserId: resolvedAccountClaimTargetId,
          status: "PENDING",
        },
      });
      if (!existingClaim) {
        await prisma.accountClaimRequest.create({
          data: {
            senderId: userId,
            targetUserId: resolvedAccountClaimTargetId,
            instagramHandle: normalizedInstagram,
            tagCount:
              resolvedAccountClaimTagCount ??
              (await getUnclaimedUserTagCount(resolvedAccountClaimTargetId)),
            wipeRelationships,
          },
        });
      }
    }

    // Revalidate profiles list page to show updated profile
    revalidatePath("/profiles");
    // Also revalidate the individual profile page
    revalidatePath(`/profiles/${currentUser.username}`);

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

/**
 * Get all event IDs created by a user
 */
async function getUserCreatedEventIds(userId: string): Promise<string[]> {
  const events = await getUserEvents(userId);
  return events.map((event) => event.eventId);
}

/**
 * Transfer all events created by a user to the admin user
 * Note: If super admin doesn't exist, events will be orphaned (no CREATED relationship)
 */
async function transferUserEventsToAdmin(userId: string): Promise<void> {
  const adminUserId = await getOrCreateSuperAdminUser();
  const eventIds = await getUserCreatedEventIds(userId);

  // If super admin doesn't exist, we can't transfer events
  if (!adminUserId) {
    console.warn(
      `⚠️  Super admin user (${SUPER_ADMIN_EMAIL}) does not exist. Cannot transfer events from user ${userId}. Events will be orphaned.`,
    );
    // Still delete the CREATED relationships to clean up
    const neo4jSession = driver.session();
    try {
      for (const eventId of eventIds) {
        await neo4jSession.run(
          `
          MATCH (oldCreator:User {id: $userId})-[r:CREATED]->(e:Event {id: $eventId})
          DELETE r
          `,
          { eventId, userId },
        );
      }
    } finally {
      neo4jSession.close();
    }
    return;
  }

  for (const eventId of eventIds) {
    try {
      // Transfer event ownership to admin
      const adminUser: UserSearchItem = {
        id: adminUserId,
        username: SUPER_ADMIN_USERNAME,
        displayName: "Admin",
      };

      // Use updateEventCreator to transfer ownership
      // We need to bypass permission checks since this is an admin operation
      const neo4jSession = driver.session();
      try {
        // Delete old CREATED relationship
        await neo4jSession.run(
          `
          MATCH (oldCreator:User {id: $userId})-[r:CREATED]->(e:Event {id: $eventId})
          DELETE r
          `,
          { eventId, userId },
        );

        // Create new CREATED relationship with admin
        await neo4jSession.run(
          `
          MATCH (e:Event {id: $eventId})
          MATCH (admin:User {id: $adminUserId})
          MERGE (admin)-[:CREATED]->(e)
          `,
          { eventId, adminUserId },
        );
      } finally {
        neo4jSession.close();
      }

      // Update PostgreSQL Event record
      await prisma.event.updateMany({
        where: { eventId },
        data: { userId: adminUserId },
      });
    } catch (error) {
      console.error(`Failed to transfer event ${eventId} to admin:`, error);
      // Continue with other events even if one fails
    }
  }
}

/**
 * Delete a user account
 * Only the user themselves or Admin+ can delete users
 * Super admin cannot delete themselves
 */
export async function deleteUserAccount(
  targetUserId: string,
  deleteEvents: boolean,
  usernameConfirmation?: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Authorization check
    const isOwnAccount = session.user.id === targetUserId;
    const isAdmin = (session.user.auth ?? 0) >= AUTH_LEVELS.ADMIN;

    if (!isOwnAccount && !isAdmin) {
      return {
        success: false,
        error: "You do not have permission to delete this account",
      };
    }

    // Get target user to check if they're super admin
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { auth: true, email: true },
    });

    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    // Prevent super admin from deleting themselves (even if admin)
    if (targetUser.auth === AUTH_LEVELS.SUPER_ADMIN) {
      return {
        success: false,
        error: "Super admin accounts cannot be deleted",
      };
    }

    // For self-deletion, validate username confirmation
    if (isOwnAccount && usernameConfirmation) {
      const currentUser = await getUser(session.user.id);
      if (!currentUser) {
        return { success: false, error: "User not found" };
      }

      if (
        currentUser.username?.toLowerCase() !==
        usernameConfirmation.toLowerCase()
      ) {
        return {
          success: false,
          error: "Username confirmation does not match",
        };
      }
    }

    // Get all events created by the user
    const eventIds = await getUserCreatedEventIds(targetUserId);

    if (deleteEvents) {
      // Delete all events created by the user
      for (const eventId of eventIds) {
        let citySlug: string | null = null;
        try {
          const eventData = await getEvent(
            eventId,
            session.user.id,
            session.user.auth ?? 0,
          );
          citySlug = getCitySlug(
            eventData?.eventDetails.city as City | undefined,
          );

          // Delete event images from R2
          const pictures = await getEventImages(eventId);
          await Promise.all(
            pictures.map(async (url) => {
              return deleteFromR2(url);
            }),
          );

          // Delete event from Neo4j (cascades to sections, videos, images)
          await deleteEvent(eventId);

          // Delete PostgreSQL Event record
          await prisma.event.deleteMany({
            where: { eventId },
          });

          revalidateCalendarForSlugs([citySlug]);
        } catch (error) {
          console.error(`Failed to delete event ${eventId}:`, error);
          // Continue with other events even if one fails
        }
      }
      // Revalidate events list page after deleting all events
      revalidatePath("/events");
      // Revalidate TV page
      revalidatePath("/watch");
      revalidateTag("watch-sections", "");
    } else {
      // Transfer events to admin user
      await transferUserEventsToAdmin(targetUserId);
    }

    // Get user info for R2 cleanup
    const userForCleanup = await getUser(targetUserId);
    if (userForCleanup) {
      // Delete profile and avatar pictures from R2
      if (userForCleanup.image) {
        await deleteFromR2(userForCleanup.image);
      }
      if (userForCleanup.avatar) {
        await deleteFromR2(userForCleanup.avatar);
      }
    }

    // Delete UserCard projection
    await prisma.userCard.deleteMany({
      where: { userId: targetUserId },
    });

    // Delete user from Neo4j (removes all relationships)
    await deleteUser(targetUserId);

    // Delete user from PostgreSQL (cascade handles related records)
    await prisma.user.delete({
      where: { id: targetUserId },
    });

    revalidatePath("/profiles");

    // Note: If user deleted their own account, the client will handle sign out and redirect
    // We return success and let the client component handle the redirect

    return { success: true };
  } catch (error) {
    console.error("Failed to delete user account:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete account",
    };
  }
}

/**
 * Update user's opt-out of marketing preference
 */
export async function updateOptOutOfMarketing(optOut: boolean) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        optOutOfMarketing: optOut,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update opt-out of marketing:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update marketing preference",
    };
  }
}
