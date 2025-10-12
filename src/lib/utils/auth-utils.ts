import { auth } from "@/auth";
import { Session } from "next-auth";

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
 * Check if a session has a minimum auth level
 */
export function hasAuthLevel(
  session: Session | null,
  minLevel: number
): boolean {
  return !!(session?.user?.auth && session.user.auth >= minLevel);
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
 * Auth level constants for easier management
 */
export const AUTH_LEVELS = {
  BASE_USER: 0,
  REGIONAL_CREATOR: 1,
  GLOBAL_CREATOR: 2,
  REGIONAL_MODERATOR: 3,
  GLOBAL_MODERATOR: 4,
  ADMIN: 5,
  SUPER_ADMIN: 6,
} as const;

/**
 * Helper function to get auth level name
 */
export function getAuthLevelName(level: number): string {
  const levelNames = Object.entries(AUTH_LEVELS).find(
    ([, value]) => value === level
  );
  return levelNames ? levelNames[0] : `Level ${level}`;
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

/**
 * Permission checking functions based on the new auth structure
 */

// Event Permissions
export function canCreateEventsInAnyCity(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.GLOBAL_CREATOR;
}

export function canCreateEventsInRestrictedCities(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.REGIONAL_CREATOR;
}

export function canUpdateAnyEvents(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.ADMIN;
}

export function canUpdateAnyEventsInAnyCity(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.GLOBAL_MODERATOR;
}

export function canUpdateAnyEventsInRestrictedCities(
  authLevel: number
): boolean {
  return authLevel >= AUTH_LEVELS.REGIONAL_MODERATOR;
}

export function canDeleteAnyEvents(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.ADMIN;
}

export function canDeleteAnyEventsInAnyCity(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.GLOBAL_MODERATOR;
}

export function canDeleteAnyEventsInRestrictedCities(
  authLevel: number
): boolean {
  return authLevel >= AUTH_LEVELS.REGIONAL_MODERATOR;
}

// User Management Permissions
export function canUpdateUserPermissions(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.ADMIN;
}

export function canBanAnyUsers(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.ADMIN;
}

export function canBanUsersInAnyCity(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.GLOBAL_MODERATOR;
}

export function canBanUsersInRestrictedCities(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.REGIONAL_MODERATOR;
}

export function canDeleteAnyUsers(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.ADMIN;
}

export function canTagUntagAnyUserAnywhere(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.ADMIN;
}

export function canTagUntagUsersInAnyCity(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.GLOBAL_MODERATOR;
}

export function canTagUntagUsersInRestrictedCities(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.REGIONAL_MODERATOR;
}

export function canReadReports(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.ADMIN;
}

// Super Admin Protection
export function cannotBeDeletedOrBanned(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.SUPER_ADMIN;
}

// Event-specific permissions
export interface EventPermissionContext {
  eventId: string;
  eventCityId?: string;
  eventCreatorId: string;
  userCities?: string[];
}

export function canUpdateEvent(
  authLevel: number,
  context: EventPermissionContext,
  userId: string
): boolean {
  // Admins can update any events
  if (canUpdateAnyEvents(authLevel)) {
    return true;
  }

  // Global moderators can update any events in any city
  if (canUpdateAnyEventsInAnyCity(authLevel)) {
    return true;
  }

  // Regional moderators can update any events in their restricted cities
  if (
    canUpdateAnyEventsInRestrictedCities(authLevel) &&
    context.eventCityId &&
    context.userCities?.includes(context.eventCityId)
  ) {
    return true;
  }

  // Creators can update their own events
  if (
    authLevel >= AUTH_LEVELS.REGIONAL_CREATOR &&
    context.eventCreatorId === userId
  ) {
    // Global creators can update own events in any city
    if (authLevel >= AUTH_LEVELS.GLOBAL_CREATOR) {
      return true;
    }
    // Regional creators can update own events in restricted cities
    if (
      context.eventCityId &&
      context.userCities?.includes(context.eventCityId)
    ) {
      return true;
    }
  }

  return false;
}

export function canDeleteEvent(
  authLevel: number,
  context: EventPermissionContext,
  userId: string
): boolean {
  // Admins can delete any events
  if (canDeleteAnyEvents(authLevel)) {
    return true;
  }

  // Global moderators can delete any events in any city
  if (canDeleteAnyEventsInAnyCity(authLevel)) {
    return true;
  }

  // Regional moderators can delete any events in their restricted cities
  if (
    canDeleteAnyEventsInRestrictedCities(authLevel) &&
    context.eventCityId &&
    context.userCities?.includes(context.eventCityId)
  ) {
    return true;
  }

  // Creators can delete their own events
  if (
    authLevel >= AUTH_LEVELS.REGIONAL_CREATOR &&
    context.eventCreatorId === userId
  ) {
    // Global creators can delete own events in any city
    if (authLevel >= AUTH_LEVELS.GLOBAL_CREATOR) {
      return true;
    }
    // Regional creators can delete own events in restricted cities
    if (
      context.eventCityId &&
      context.userCities?.includes(context.eventCityId)
    ) {
      return true;
    }
  }

  return false;
}
