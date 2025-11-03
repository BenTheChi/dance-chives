import { prisma } from "@/lib/primsa";
import { AUTH_LEVELS } from "./auth-utils";
import {
  getEventTeamMembers,
  getEventCreator,
  getEventCityId,
} from "@/db/queries/team-member";

export const REQUEST_TYPES = {
  TAGGING: "TAGGING",
  TEAM_MEMBER: "TEAM_MEMBER",
  GLOBAL_ACCESS: "GLOBAL_ACCESS",
  AUTH_LEVEL_CHANGE: "AUTH_LEVEL_CHANGE",
} as const;

export type RequestType = (typeof REQUEST_TYPES)[keyof typeof REQUEST_TYPES];

/**
 * Get users who can approve tagging requests for an event
 * Returns: event creator, team members, city moderators, admins
 */
export async function getTaggingRequestApprovers(
  eventId: string,
  eventCityId?: string
): Promise<string[]> {
  const approverIds: Set<string> = new Set();

  // Get event creator from Neo4j
  const creatorId = await getEventCreator(eventId);
  if (creatorId) {
    approverIds.add(creatorId);
  }

  // Get team members for this event from Neo4j
  const teamMembers = await getEventTeamMembers(eventId);
  teamMembers.forEach((userId) => approverIds.add(userId));

  // Get city ID from Neo4j if not provided
  if (!eventCityId) {
    eventCityId = await getEventCityId(eventId) || undefined;
  }

  // Get city moderators (auth level 2+) for the event's city
  if (eventCityId) {
    const cityModerators = await prisma.user.findMany({
      where: {
        cities: {
          some: {
            cityId: eventCityId,
          },
        },
        auth: {
          gte: AUTH_LEVELS.MODERATOR,
        },
      },
      select: { id: true },
    });

    cityModerators.forEach((user) => approverIds.add(user.id));
  }

  // Get all admins (auth level 3+)
  const admins = await prisma.user.findMany({
    where: {
      auth: {
        gte: AUTH_LEVELS.ADMIN,
      },
    },
    select: { id: true },
  });

  admins.forEach((user) => approverIds.add(user.id));

  return Array.from(approverIds);
}

/**
 * Get users who can approve team member requests for an event
 * Returns: event creator, existing team members, city moderators, admins
 */
export async function getTeamMemberRequestApprovers(
  eventId: string,
  eventCityId?: string
): Promise<string[]> {
  return getTaggingRequestApprovers(eventId, eventCityId); // Same approvers
}

/**
 * Get users who can approve global access requests
 * Returns: admins and super admins only
 */
export async function getGlobalAccessRequestApprovers(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: {
      auth: {
        gte: AUTH_LEVELS.ADMIN,
      },
    },
    select: { id: true },
  });

  return admins.map((user) => user.id);
}

/**
 * Get users who can approve authorization level change requests
 * Returns: admins and super admins only
 */
export async function getAuthLevelChangeRequestApprovers(): Promise<string[]> {
  return getGlobalAccessRequestApprovers(); // Same approvers
}

/**
 * Check if a user can approve a specific request type
 */
export async function canUserApproveRequest(
  userId: string,
  requestType: RequestType,
  context?: {
    eventId?: string;
    eventCityId?: string;
  }
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { auth: true },
  });

  if (!user?.auth) return false;

  const authLevel = user.auth;

  switch (requestType) {
    case REQUEST_TYPES.TAGGING:
    case REQUEST_TYPES.TEAM_MEMBER:
      if (authLevel >= AUTH_LEVELS.ADMIN) return true;
      if (authLevel >= AUTH_LEVELS.MODERATOR && context?.eventCityId) {
        // Check if user is a moderator for this city
        const cityAssignment = await prisma.city.findFirst({
          where: {
            userId,
            cityId: context.eventCityId,
          },
        });
        if (cityAssignment) return true;
      }
      // Check if user is event creator or team member (from Neo4j)
      if (context?.eventId) {
        const creatorId = await getEventCreator(context.eventId);
        if (creatorId === userId) return true;

        const teamMembers = await getEventTeamMembers(context.eventId);
        if (teamMembers.includes(userId)) return true;
      }
      return false;

    case REQUEST_TYPES.GLOBAL_ACCESS:
    case REQUEST_TYPES.AUTH_LEVEL_CHANGE:
      return authLevel >= AUTH_LEVELS.ADMIN;

    default:
      return false;
  }
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedRequestType?: string,
  relatedRequestId?: string
) {
  return await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      relatedRequestType,
      relatedRequestId,
    },
  });
}

/**
 * Check if user has global access (admins/super admins have it by default)
 */
export async function hasGlobalAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { auth: true, allCityAccess: true },
  });

  if (!user) return false;

  // Admins and super admins have global access by default
  if (user.auth && user.auth >= AUTH_LEVELS.ADMIN) {
    return true;
  }

  // For creators and moderators, check allCityAccess flag
  return user.allCityAccess === true;
}
