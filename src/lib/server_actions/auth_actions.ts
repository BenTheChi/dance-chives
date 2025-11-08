"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { signupUser, getUser } from "@/db/queries/user";
import { auth } from "@/auth";
import { prisma } from "@/lib/primsa";
import crypto from "crypto";
import { AUTH_LEVELS } from "@/lib/utils/auth-utils";

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

    // Use admin defaults if this is an admin user, otherwise use form data
    const profileData = adminUser
      ? {
          displayName: adminUser.defaultData.displayName,
          username: adminUser.defaultData.username,
          city: adminUser.defaultData.city,
          date: adminUser.defaultData.date,
        }
      : {
          displayName: formData.get("displayName") as string,
          username: formData.get("username") as string,
          city: formData.get("city") as string,
          date: formData.get("date") as string,
        };

    // Update user in Neo4j with profile information
    const userResult = await signupUser(session.user.id, profileData);

    // Determine auth level
    const authLevel = adminUser ? adminUser.authLevel : AUTH_LEVELS.BASE_USER; // Base user level

    // Admins and SuperAdmins always have allCityAccess
    const shouldHaveAllCityAccess = authLevel >= AUTH_LEVELS.ADMIN;

    // Mark account as verified in PostgreSQL (user completed registration)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        accountVerified: new Date(),
        name: profileData.displayName || session.user.name,
        auth: authLevel,
        allCityAccess: shouldHaveAllCityAccess,
      },
    });

    // If user is creator or moderator, add their profile city to their cities
    if (
      authLevel >= AUTH_LEVELS.CREATOR &&
      authLevel < AUTH_LEVELS.ADMIN &&
      profileData.city
    ) {
      // Check if city already exists for this user
      const existingCity = await prisma.city.findFirst({
        where: {
          userId: session.user.id,
          cityId: profileData.city,
        },
      });

      // If not, add it
      if (!existingCity) {
        await prisma.city.create({
          data: {
            userId: session.user.id,
            cityId: profileData.city,
          },
        });
        console.log(
          `✅ Added profile city ${profileData.city} to user's cities`
        );
      }
    }

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
 * Automatically sets allCityAccess to true for Admins and SuperAdmins
 */
export async function updateUserAuthLevel(userId: string, authLevel: number) {
  try {
    // Admins and SuperAdmins always have allCityAccess
    const shouldHaveAllCityAccess = authLevel >= AUTH_LEVELS.ADMIN;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        auth: authLevel,
        allCityAccess: shouldHaveAllCityAccess,
      },
      select: {
        id: true,
        email: true,
        name: true,
        auth: true,
        allCityAccess: true,
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

    // Admins and SuperAdmins always have allCityAccess
    const shouldHaveAllCityAccess = invitation.authLevel >= AUTH_LEVELS.ADMIN;

    // Update user's auth level and mark invitation as used
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          auth: invitation.authLevel,
          allCityAccess: shouldHaveAllCityAccess,
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

    // If user is now a creator or moderator, add their profile city to their cities
    if (
      invitation.authLevel >= AUTH_LEVELS.CREATOR &&
      invitation.authLevel < AUTH_LEVELS.ADMIN
    ) {
      try {
        // Get user's profile city from Neo4j
        const userProfile = await getUser(session.user.id);
        const profileCity = userProfile?.city as string | undefined;

        if (profileCity) {
          // Check if city already exists for this user
          const existingCity = await prisma.city.findFirst({
            where: {
              userId: session.user.id,
              cityId: profileCity,
            },
          });

          // If not, add it
          if (!existingCity) {
            await prisma.city.create({
              data: {
                userId: session.user.id,
                cityId: profileCity,
              },
            });
            console.log(
              `✅ Added profile city ${profileCity} to user's cities after invitation acceptance`
            );
          }
        }
      } catch (error) {
        console.error("Failed to add profile city:", error);
        // Don't fail the invitation acceptance if city addition fails
      }
    }

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
