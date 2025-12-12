/**
 * Server-only auth utilities
 * These functions use the auth() function and can only be used in server components/actions
 */

import "server-only";

import { auth } from "@/auth";
import { AUTH_LEVELS } from "./auth-constants";

// Re-export all client-safe utilities for backward compatibility with server code
export * from "./auth-utils-shared";
// Re-import for use in this file
import { hasAuthLevel, isAccountVerified } from "./auth-utils-shared";

/**
 * Require a minimum auth level to proceed
 * Throws an error if user doesn't meet the requirement
 */
export async function requireAuthLevel(minLevel: number) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  if (!session.user.auth || session.user.auth < minLevel) {
    throw new Error(
      `Insufficient authorization level. Required: ${minLevel}, Current: ${
        session.user.auth || 0
      }`
    );
  }

  return session;
}

/**
 * Check if current user has minimum auth level
 */
export async function checkAuthLevel(minLevel: number): Promise<boolean> {
  try {
    const session = await auth();
    return hasAuthLevel(session, minLevel);
  } catch {
    return false;
  }
}

/**
 * Get current user's auth level
 */
export async function getCurrentAuthLevel(): Promise<number> {
  const session = await auth();
  return session?.user?.auth || 0;
}

/**
 * Check if current user has completed account verification
 */
export async function checkAccountVerified(): Promise<boolean> {
  try {
    const session = await auth();
    return isAccountVerified(session);
  } catch {
    return false;
  }
}

/**
 * Require account verification to proceed
 */
export async function requireAccountVerification() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  if (!isAccountVerified(session)) {
    throw new Error(
      "Account verification required. Please complete your registration."
    );
  }

  return session;
}

/**
 * Middleware helper for protecting routes
 */
export async function protectRoute(minLevel: number = AUTH_LEVELS.BASE_USER) {
  try {
    return await requireAuthLevel(minLevel);
  } catch (error) {
    throw new Error(
      `Access denied: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
