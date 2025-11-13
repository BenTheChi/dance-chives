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
 * Check if user has completed account verification (registration)
 */
export function isAccountVerified(session: Session | null): boolean {
  return !!session?.user?.accountVerified;
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
 * Auth level constants for easier management
 */
export const AUTH_LEVELS = {
  BASE_USER: 0,
  CREATOR: 1,
  MODERATOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
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

// Workshop Permissions
export function canCreateWorkshops(authLevel: number): boolean {
  return authLevel >= AUTH_LEVELS.CREATOR;
}

export interface WorkshopPermissionContext {
  workshopId: string;
  workshopCreatorId: string;
  isTeamMember?: boolean;
  isEventTeamMember?: boolean; // If workshop is associated with event, check event team members
}

export function canUpdateWorkshop(
  authLevel: number,
  context: WorkshopPermissionContext,
  userId: string
): boolean {
  // Admins can update any workshops
  if (canUpdateAnyEvents(authLevel)) {
    return true;
  }

  // Moderators can update any workshops
  if (canUpdateAnyEventsInCity(authLevel)) {
    return true;
  }

  // Creators can update their own workshops
  if (
    authLevel >= AUTH_LEVELS.CREATOR &&
    context.workshopCreatorId === userId
  ) {
    return true;
  }

  // Workshop team members can update
  if (context.isTeamMember) {
    return true;
  }

  // Event team members can update if workshop is associated with event
  if (context.isEventTeamMember) {
    return true;
  }

  return false;
}

export function canDeleteWorkshop(
  authLevel: number,
  context: WorkshopPermissionContext,
  userId: string
): boolean {
  // Admins can delete any workshops
  if (canDeleteAnyEvents(authLevel)) {
    return true;
  }

  // Moderators can delete any workshops
  if (canDeleteAnyEventsInCity(authLevel)) {
    return true;
  }

  // Creators can delete their own workshops
  if (
    authLevel >= AUTH_LEVELS.CREATOR &&
    context.workshopCreatorId === userId
  ) {
    return true;
  }

  return false;
}
