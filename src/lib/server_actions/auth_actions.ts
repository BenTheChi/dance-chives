"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { signupUser } from "@/db/queries/user";
import { auth } from "@/auth";
import { prisma } from "@/lib/primsa";

export async function signInWithGoogle() {
  const { error } = await signIn("google");

  if (error) {
    console.error(error);
    return;
  }

  redirect("/dashboard");
}

export async function signOutAccount() {
  await signOut();
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
    !formData.get("date")
  ) {
    console.error("Missing required fields");
    return;
  }

  const userResult = await signupUser(session.user.id, {
    displayName: formData.get("displayName") as string,
    username: formData.get("username") as string,
    date: formData.get("date") as string,
    auth: formData.get("auth") as string,
  });

  console.log(userResult);

  redirect("/dashboard");
}

/**
 * Update user's auth level in PostgreSQL
 */
export async function updateUserAuthLevel(userId: string, authLevel: number) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { auth: authLevel },
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
 * Validate and consume an auth code to upgrade user level
 */
export async function useAuthCode(code: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Find the auth code
    const authCode = await prisma.authCodes.findFirst({
      where: {
        code: code,
        expires: { gt: new Date() },
        uses: { gt: 0 },
      },
    });

    if (!authCode) {
      return { success: false, error: "Invalid or expired auth code" };
    }

    // Update user's auth level
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { auth: authCode.level },
    });

    // Decrement the code usage
    await prisma.authCodes.update({
      where: { id: authCode.id },
      data: { uses: authCode.uses - 1 },
    });

    return {
      success: true,
      user: updatedUser,
      newAuthLevel: authCode.level,
    };
  } catch (error) {
    console.error("Failed to use auth code:", error);
    return { success: false, error: "Failed to apply auth code" };
  }
}

/**
 * Create a new auth code (admin function)
 */
export async function createAuthCode(
  level: number,
  uses: number,
  expiresInDays: number
) {
  const session = await auth();

  // You might want to check if current user is admin
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const code =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const expires = new Date();
    expires.setDate(expires.getDate() + expiresInDays);

    const authCode = await prisma.authCodes.create({
      data: {
        code,
        level,
        uses,
        expires,
      },
    });

    return { success: true, authCode };
  } catch (error) {
    console.error("Failed to create auth code:", error);
    return { success: false, error: "Failed to create auth code" };
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
