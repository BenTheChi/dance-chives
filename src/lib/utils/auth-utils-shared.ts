/**
 * Client-safe auth utilities
 * These functions can be safely imported in both client and server components
 * They do NOT use the auth() function or any server-only dependencies
 */

import { Session } from "next-auth";
import { AUTH_LEVELS } from "./auth-constants";

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
 * Check if user has completed account verification (registration)
 */
export function isAccountVerified(session: Session | null): boolean {
  return !!session?.user?.accountVerified;
}

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
 * Permission checking functions based on the new auth structure
 */

// Event Permissions
export function canCreateEvents(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.CREATOR;
}

export function canUpdateAnyEvents(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.ADMIN;
}

export function canUpdateAnyEventsInCity(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.MODERATOR;
}

export function canDeleteAnyEvents(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.ADMIN;
}

export function canDeleteAnyEventsInCity(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.MODERATOR;
}

// User Management Permissions
export function canUpdateUserPermissions(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.ADMIN;
}

export function canBanAnyUsers(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.ADMIN;
}

export function canBanUsersInCity(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.MODERATOR;
}

export function canDeleteAnyUsers(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.ADMIN;
}

export function canTagUntagAnyUserAnywhere(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.ADMIN;
}

export function canTagUntagUsersInCity(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.MODERATOR;
}

export function canRequestTagging(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.BASE_USER;
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
  eventCreatorId: string;
  isTeamMember?: boolean;
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

  // Moderators can update any events
  if (canUpdateAnyEventsInCity(authLevel)) {
    return true;
  }

  // Creators can update their own events
  if (authLevel >= AUTH_LEVELS.CREATOR && context.eventCreatorId === userId) {
    return true;
  }

  // Team members can update events
  if (context.isTeamMember) {
    return true;
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

  // Moderators can delete any events
  if (canDeleteAnyEventsInCity(authLevel)) {
    return true;
  }

  // Creators can delete their own events
  if (authLevel >= AUTH_LEVELS.CREATOR && context.eventCreatorId === userId) {
    return true;
  }

  return false;
}
