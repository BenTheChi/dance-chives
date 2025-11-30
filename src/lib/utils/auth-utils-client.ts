import { Session } from "next-auth";
import { AUTH_LEVELS } from "./auth-constants";

/**
 * Check if a session has a minimum auth level
 * Client-safe: works with Session objects, doesn't call auth()
 */
export function hasAuthLevel(
  session: Session | null,
  minLevel: number
): boolean {
  return !!(session?.user?.auth && session.user.auth >= minLevel);
}

/**
 * Check if user has completed account verification (registration)
 * Client-safe: works with Session objects, doesn't call auth()
 */
export function isAccountVerified(session: Session | null): boolean {
  return !!session?.user?.accountVerified;
}

/**
 * Helper function to get auth level name
 * Client-safe: pure function
 */
export function getAuthLevelName(level: number): string {
  const levelNames = Object.entries(AUTH_LEVELS).find(
    ([, value]) => value === level
  );
  return levelNames ? levelNames[0] : `Level ${level}`;
}

/**
 * Permission checking functions based on the new auth structure
 * Client-safe: pure functions that work with auth levels
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

export function canUpdateCompetition(
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

// Generic alias for unified event system
export const canUpdateEvent = canUpdateCompetition;

export function canDeleteCompetition(
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

// Generic alias for unified event system
export const canDeleteEvent = canDeleteCompetition;

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

// Session Permissions
export interface SessionPermissionContext {
  sessionId: string;
  sessionCreatorId: string;
  isTeamMember?: boolean;
}

export function canUpdateSession(
  authLevel: number,
  context: SessionPermissionContext,
  userId: string
): boolean {
  // Admins can update any sessions
  if (canUpdateAnyEvents(authLevel)) {
    return true;
  }

  // Moderators can update any sessions
  if (canUpdateAnyEventsInCity(authLevel)) {
    return true;
  }

  // Creators can update their own sessions
  if (
    authLevel >= AUTH_LEVELS.CREATOR &&
    context.sessionCreatorId === userId
  ) {
    return true;
  }

  // Session team members can update
  if (context.isTeamMember) {
    return true;
  }

  return false;
}

export function canDeleteSession(
  authLevel: number,
  context: SessionPermissionContext,
  userId: string
): boolean {
  // Admins can delete any sessions
  if (canDeleteAnyEvents(authLevel)) {
    return true;
  }

  // Moderators can delete any sessions
  if (canDeleteAnyEventsInCity(authLevel)) {
    return true;
  }

  // Creators can delete their own sessions
  if (
    authLevel >= AUTH_LEVELS.CREATOR &&
    context.sessionCreatorId === userId
  ) {
    return true;
  }

  return false;
}

