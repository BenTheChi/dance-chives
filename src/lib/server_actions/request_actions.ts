"use server";

import { auth } from "@/auth";
import type { Session } from "next-auth";
import { prisma } from "@/lib/primsa";
import {
  getTaggingRequestApprovers,
  getTeamMemberRequestApprovers,
  getOwnershipRequestApprovers,
  getAuthLevelChangeRequestApprovers,
  canUserApproveRequest,
  createNotification,
  createTagNotification,
  REQUEST_TYPES,
  RequestType,
} from "@/lib/utils/request-utils";
import {
  isTeamMember,
  addTeamMember,
  setVideoRoles,
  setSectionWinner,
  setSectionWinners,
  setSectionJudges,
  getSectionWinnerIds,
  getSectionJudgeIds,
  setEventRoles, // Still needed for event roles (not part of this refactor)
  getUserTeamMemberships,
  eventExists,
  videoExistsInEvent,
  sectionExistsInEvent,
  isUserTaggedInVideo,
  isUserTaggedInVideoWithRole,
  isUserWinnerOfSection,
  isUserJudgeOfSection,
  getVideoType,
  getEventTitle,
  getEventType,
  getVideoTitle,
  getEventCreator,
  isEventCreator,
  removeTag,
} from "@/db/queries/team-member";
import driver from "@/db/driver";
import {
  getUser,
  getUserByUsername,
  getUserWithStyles,
} from "@/db/queries/user";
import {
  isValidRole,
  AVAILABLE_ROLES,
  isValidVideoRole,
  isValidSectionRole,
  VIDEO_ROLE_DANCER,
  VIDEO_ROLE_WINNER,
  SECTION_ROLE_WINNER,
  SECTION_ROLE_JUDGE,
  fromNeo4jRoleFormat,
} from "@/lib/utils/roles";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { Prisma } from "@prisma/client";
import { TEventCard } from "@/types/event";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validates user authentication and returns session user ID
 * Throws error if not authenticated
 */
async function requireAuth(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

/**
 * Generic helper to check if user has already responded to a request
 */
async function hasUserResponded(
  requestType: RequestType,
  requestId: string,
  approverId: string
): Promise<boolean> {
  const existingApproval = await prisma.requestApproval.findFirst({
    where: {
      requestType,
      requestId,
      approverId,
    },
  });
  return !!existingApproval;
}

/**
 * Generic helper to create a request approval record
 */
async function createApprovalRecord(
  requestType: RequestType,
  requestId: string,
  approverId: string,
  approved: boolean,
  message?: string
): Promise<void> {
  await prisma.requestApproval.create({
    data: {
      requestType,
      requestId,
      approverId,
      approved,
      message,
    },
  });
}

/**
 * Generic helper to update request status
 */
async function updateRequestStatus(
  requestType: RequestType,
  requestId: string,
  status: "APPROVED" | "DENIED" | "CANCELLED"
): Promise<void> {
  const updateData = { status, updatedAt: new Date() };

  switch (requestType) {
    case REQUEST_TYPES.TAGGING:
      await prisma.taggingRequest.update({
        where: { id: requestId },
        data: updateData,
      });
      break;
    case REQUEST_TYPES.TEAM_MEMBER:
      await prisma.teamMemberRequest.update({
        where: { id: requestId },
        data: updateData,
      });
      break;
    case REQUEST_TYPES.OWNERSHIP:
      await prisma.ownershipRequest.update({
        where: { id: requestId },
        data: updateData,
      });
      break;
    case REQUEST_TYPES.AUTH_LEVEL_CHANGE:
      await prisma.authLevelChangeRequest.update({
        where: { id: requestId },
        data: updateData,
      });
      break;
    case REQUEST_TYPES.ACCOUNT_CLAIM:
      await prisma.accountClaimRequest.update({
        where: { id: requestId },
        data: updateData,
      });
      break;
  }
}

/**
 * Enriches Postgres user data (id, name, email) with Neo4j user profile data
 * (displayName, username, avatar, image, city, styles)
 */
async function enrichUserData(user: {
  id?: string;
  name?: string | null;
  email: string;
}): Promise<{
  id?: string;
  name?: string | null;
  email: string;
  displayName?: string | null;
  username?: string | null;
  avatar?: string | null;
  image?: string | null;
  city?: string | null;
  styles?: string[];
}> {
  if (!user.id) {
    return user;
  }

  try {
    const neo4jUser = await getUserWithStyles(user.id);
    if (!neo4jUser) {
      return user;
    }

    return {
      ...user,
      displayName: neo4jUser.displayName || null,
      username: neo4jUser.username || null,
      avatar: neo4jUser.avatar || null,
      image: neo4jUser.image || null,
      city:
        neo4jUser.city && typeof neo4jUser.city === "object"
          ? neo4jUser.city.name || null
          : typeof neo4jUser.city === "string"
          ? neo4jUser.city
          : null,
      styles: neo4jUser.styles || [],
    };
  } catch (error) {
    console.error(`Failed to enrich user data for ${user.id}:`, error);
    return user;
  }
}

/**
 * Generic helper to cancel a request
 * Validates ownership and status before canceling
 */
async function cancelRequest(
  requestType: RequestType,
  requestId: string,
  userId: string
): Promise<void> {
  let request: { senderId: string; status: string } | null = null;

  // Fetch request based on type
  switch (requestType) {
    case REQUEST_TYPES.TAGGING:
      request = await prisma.taggingRequest.findUnique({
        where: { id: requestId },
        select: { senderId: true, status: true },
      });
      break;
    case REQUEST_TYPES.TEAM_MEMBER:
      request = await prisma.teamMemberRequest.findUnique({
        where: { id: requestId },
        select: { senderId: true, status: true },
      });
      break;
    case REQUEST_TYPES.OWNERSHIP:
      request = await prisma.ownershipRequest.findUnique({
        where: { id: requestId },
        select: { senderId: true, status: true },
      });
      break;
    case REQUEST_TYPES.AUTH_LEVEL_CHANGE:
      request = await prisma.authLevelChangeRequest.findUnique({
        where: { id: requestId },
        select: { senderId: true, status: true },
      });
      break;
  }

  if (!request) {
    throw new Error("Request not found");
  }

  // Only the sender can cancel their own request
  if (request.senderId !== userId) {
    throw new Error("You can only cancel your own requests");
  }

  if (request.status !== "PENDING") {
    throw new Error("Only pending requests can be cancelled");
  }

  await updateRequestStatus(requestType, requestId, "CANCELLED");
}

// ============================================================================
// Tagging Requests
// ============================================================================

export async function createTaggingRequest(
  eventId: string,
  videoId?: string,
  sectionId?: string,
  role?: string
) {
  console.log("🔵 [createTaggingRequest] Starting", {
    eventId,
    videoId,
    sectionId,
    role,
  });
  const senderId = await requireAuth();
  console.log("🔵 [createTaggingRequest] Authenticated user:", senderId);

  // Validate parameter combinations:
  // - videoId + role: video tagging with role (e.g., "Dancer", "Winner")
  // - sectionId + role: section tagging with role (e.g., "Winner")
  // - role only: event role tagging (e.g., "Organizer", "DJ")
  // Invalid: videoId + sectionId, videoId without role, sectionId without role
  if (videoId && sectionId) {
    throw new Error("Cannot provide both videoId and sectionId");
  }
  if (videoId && !role) {
    throw new Error("Role is required when videoId is provided");
  }
  if (sectionId && !role) {
    throw new Error("Role is required when sectionId is provided");
  }
  if (!videoId && !sectionId && !role) {
    throw new Error(
      "At least one of videoId, sectionId, or role must be provided"
    );
  }

  // Users can only tag themselves
  const targetUserId = senderId;

  // Validate event exists in Neo4j and get event type
  console.log("🔵 [createTaggingRequest] Checking if event exists...");
  const eventExistsInNeo4j = await eventExists(eventId);
  if (!eventExistsInNeo4j) {
    console.error("❌ [createTaggingRequest] Event not found:", eventId);
    throw new Error("Event not found");
  }
  console.log("✅ [createTaggingRequest] Event exists");

  // Fetch event type and title for better notification messages
  const [eventType, eventTitle] = await Promise.all([
    getEventType(eventId),
    getEventTitle(eventId),
  ]);
  const eventDisplayName = eventType
    ? `${eventType} - ${eventTitle || eventId}`
    : eventTitle || eventId;

  // Validate video exists if provided
  if (videoId) {
    console.log("🔵 [createTaggingRequest] Checking if video exists...");
    const videoExists = await videoExistsInEvent(eventId, videoId);
    if (!videoExists) {
      console.error("❌ [createTaggingRequest] Video not found:", videoId);
      throw new Error("Video not found in this event");
    }
    console.log("✅ [createTaggingRequest] Video exists");

    // Role is required for video tags
    if (!role) {
      console.error("❌ [createTaggingRequest] Role required for video tags");
      throw new Error("Role is required for video tags");
    }

    // Validate video role
    if (!isValidVideoRole(role)) {
      console.error("❌ [createTaggingRequest] Invalid video role:", role);
      throw new Error(`Invalid video role: ${role}`);
    }

    // Check if user already has this specific role in the video
    console.log(
      "🔵 [createTaggingRequest] Checking if user already has this role..."
    );
    const alreadyHasRole = await isUserTaggedInVideoWithRole(
      eventId,
      videoId,
      targetUserId,
      role
    );
    if (alreadyHasRole) {
      console.error("❌ [createTaggingRequest] User already has this role");
      throw new Error(`You are already tagged as ${role} in this video`);
    }
    console.log("✅ [createTaggingRequest] User does not have this role yet");
  }

  // Validate section exists if provided
  if (sectionId) {
    console.log("🔵 [createTaggingRequest] Checking if section exists...");
    const sectionExists = await sectionExistsInEvent(eventId, sectionId);
    if (!sectionExists) {
      console.error("❌ [createTaggingRequest] Section not found:", sectionId);
      throw new Error("Section not found in this event");
    }
    console.log("✅ [createTaggingRequest] Section exists");

    // Role is required for section tags
    if (!role) {
      console.error("❌ [createTaggingRequest] Role required for section tags");
      throw new Error("Role is required for section tags");
    }

    // Validate section role
    if (!isValidSectionRole(role)) {
      console.error("❌ [createTaggingRequest] Invalid section role:", role);
      throw new Error(
        `Invalid section role: ${role}. Must be: ${SECTION_ROLE_WINNER}`
      );
    }
  }

  // Validate role if provided for event-level tagging
  if (role && !videoId && !sectionId) {
    if (!isValidRole(role)) {
      console.error("❌ [createTaggingRequest] Invalid role:", role);
      throw new Error(
        `Invalid role: ${role}. Must be one of: ${AVAILABLE_ROLES.join(", ")}`
      );
    }
  }

  // Check if a pending request already exists for this specific combination
  // Note: We check for the exact role to allow multiple requests with different roles
  console.log("🔵 [createTaggingRequest] Checking for existing requests...");
  const existingRequest = await prisma.taggingRequest.findFirst({
    where: {
      eventId,
      senderId,
      targetUserId,
      videoId: videoId || null,
      sectionId: sectionId || null,
      role: role || null, // Check for the specific role
      status: "PENDING",
    },
  });

  if (existingRequest) {
    console.log(
      "⚠️ [createTaggingRequest] Pending request already exists for this role:",
      existingRequest.id
    );
    // Return the existing request without creating notifications
    // This prevents duplicate requests and notifications
    return { success: true, request: existingRequest, isExisting: true };
  }
  console.log("✅ [createTaggingRequest] No existing request found");

  // Create the request
  console.log("🔵 [createTaggingRequest] Creating request in database...");
  let request;
  try {
    request = await prisma.taggingRequest.create({
      data: {
        eventId,
        videoId,
        sectionId,
        senderId,
        targetUserId,
        role,
        status: "PENDING",
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
        targetUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    console.log("✅ [createTaggingRequest] Request created:", request.id);
  } catch (error) {
    console.error("❌ [createTaggingRequest] Failed to create request:", error);
    throw error;
  }

  // Get approvers and create notifications (only for new requests, not existing ones)
  console.log("🔵 [createTaggingRequest] Getting approvers...");
  let approvers: string[] = [];
  try {
    approvers = await getTaggingRequestApprovers(eventId);
    console.log("✅ [createTaggingRequest] Approvers found:", approvers.length);
  } catch (error) {
    console.error("❌ [createTaggingRequest] Error getting approvers:", error);
    // Don't fail the request creation if approvers can't be found
    approvers = [];
  }

  // Create notifications for approvers
  console.log("🔵 [createTaggingRequest] Creating notifications...");
  try {
    const username = request.sender.name || request.sender.email;

    let notificationMessage: string;
    // Check if this is part of a Winner+Dancer request set
    const isPartOfWinnerRequest = videoId && role === VIDEO_ROLE_DANCER;
    let additionalContext = "";
    if (isPartOfWinnerRequest) {
      // Check if there's a pending Winner request for the same video
      const winnerRequest = await prisma.taggingRequest.findFirst({
        where: {
          eventId,
          senderId,
          targetUserId,
          videoId,
          role: VIDEO_ROLE_WINNER,
          status: "PENDING",
        },
      });
      if (winnerRequest) {
        additionalContext = " (also requesting Winner tag)";
      }
    }

    let resourceName = eventDisplayName;
    if (videoId) {
      const videoTitle = await getVideoTitle(videoId);
      resourceName = videoTitle || videoId;
    } else if (sectionId) {
      const session = driver.session();
      try {
        const result = await session.run(
          `MATCH (s:Section {id: $sectionId}) RETURN s.title as title LIMIT 1`,
          { sectionId }
        );
        if (result.records.length > 0) {
          resourceName = result.records[0].get("title") || sectionId;
        }
      } finally {
        await session.close();
      }
    }

    const roleName = role ? fromNeo4jRoleFormat(role) || role : "";
    notificationMessage = `Request for "${roleName}" for ${resourceName}`;

    for (const approverId of approvers) {
      try {
        await createNotification(
          approverId,
          "INCOMING_REQUEST",
          "New Request",
          notificationMessage,
          REQUEST_TYPES.TAGGING,
          request.id
        );
        console.log(
          "✅ [createTaggingRequest] Notification created for:",
          approverId
        );
      } catch (error) {
        console.error(
          `⚠️ [createTaggingRequest] Failed to create notification for ${approverId}:`,
          error
        );
        // Continue with other approvers even if one fails
      }
    }
    console.log("✅ [createTaggingRequest] Notifications completed");
  } catch (error) {
    console.error(
      "⚠️ [createTaggingRequest] Error creating notifications (request still created):",
      error
    );
    // Don't fail the request creation if notifications fail
  }

  // Note: We don't automatically create a Dancer request here when creating a Winner request
  // because tagSelfInVideo already handles creating both requests when needed.
  // This prevents duplicate request creation.

  console.log("✅ [createTaggingRequest] Successfully completed");
  return { success: true, request, isExisting: false };
}

export async function approveTaggingRequest(
  requestId: string,
  message?: string
) {
  const approverId = await requireAuth();

  // Get the request
  const request = await prisma.taggingRequest.findUnique({
    where: { id: requestId },
    include: {
      sender: true,
      targetUser: true,
    },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  // All requests now use eventId (sessions are now events)
  if (!request.eventId) {
    throw new Error("Invalid tagging request: eventId is required");
  }

  // Validate parameter combinations:
  // - videoId + role: video tagging with role (e.g., "Dancer", "Winner")
  // - sectionId + role: section tagging with role (e.g., "Winner")
  // - role only: event role tagging (e.g., "Organizer", "DJ")
  // Invalid: videoId + sectionId, videoId without role, sectionId without role
  if (request.videoId && request.sectionId) {
    throw new Error(
      "Invalid tagging request: cannot have both videoId and sectionId"
    );
  }
  if (request.videoId && !request.role) {
    throw new Error(
      "Invalid tagging request: role is required when videoId is provided"
    );
  }
  if (request.sectionId && !request.role) {
    throw new Error(
      "Invalid tagging request: role is required when sectionId is provided"
    );
  }
  if (!request.videoId && !request.sectionId && !request.role) {
    throw new Error(
      "Invalid tagging request: at least one of videoId, sectionId, or role must be provided"
    );
  }

  if (request.status !== "PENDING") {
    throw new Error("Request is not pending");
  }

  // Validate event still exists in Neo4j before approving
  const eventStillExists = await eventExists(request.eventId);
  if (!eventStillExists) {
    throw new Error("Event no longer exists");
  }

  // Validate video still exists if videoId is provided (all requests now use eventId)
  if (request.videoId) {
    const videoStillExists = await videoExistsInEvent(
      request.eventId!,
      request.videoId
    );
    if (!videoStillExists) {
      throw new Error("Video no longer exists in this event");
    }
    // Role is required for video tags
    if (!request.role) {
      throw new Error("Role is required for video tags");
    }
  }

  // Validate section still exists if sectionId is provided (all requests now use eventId)
  if (request.sectionId) {
    const sectionStillExists = await sectionExistsInEvent(
      request.eventId!,
      request.sectionId
    );
    if (!sectionStillExists) {
      throw new Error("Section no longer exists in this event");
    }
    // Role is required for section tags
    if (!request.role) {
      throw new Error("Role is required for section tags");
    }
  }

  // Check if user can approve (all requests now use eventId)
  const canApprove = await canUserApproveRequest(
    approverId,
    REQUEST_TYPES.TAGGING,
    {
      eventId: request.eventId!,
    }
  );

  if (!canApprove) {
    throw new Error("You do not have permission to approve this request");
  }

  // Check if user has already responded
  if (await hasUserResponded(REQUEST_TYPES.TAGGING, requestId, approverId)) {
    throw new Error("You have already responded to this request");
  }

  // Create approval record
  await createApprovalRecord(
    REQUEST_TYPES.TAGGING,
    requestId,
    approverId,
    true,
    message
  );

  // Update request status to APPROVED
  await updateRequestStatus(REQUEST_TYPES.TAGGING, requestId, "APPROVED");

  // Create notification for sender (all requests now use eventId)
  const eventTitle = await getEventTitle(request.eventId!);
  const eventDisplayName = eventTitle || request.eventId!;
  let resourceName = eventDisplayName;
  if (request.videoId) {
    const videoTitle = await getVideoTitle(request.videoId);
    resourceName = videoTitle || request.videoId;
  } else if (request.sectionId) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (s:Section {id: $sectionId}) RETURN s.title as title LIMIT 1`,
        { sectionId: request.sectionId }
      );
      if (result.records.length > 0) {
        resourceName = result.records[0].get("title") || request.sectionId;
      }
    } finally {
      await session.close();
    }
  }

  const roleName = request.role
    ? fromNeo4jRoleFormat(request.role) || request.role
    : "";

  await createNotification(
    request.senderId,
    "REQUEST_APPROVED",
    "Request Approved",
    `Approved for "${roleName}" for ${resourceName}`,
    REQUEST_TYPES.TAGGING,
    requestId
  );

  // Apply the tag in Neo4j using declarative functions (all requests now use eventId)
  if (request.videoId && request.role) {
    // Get existing roles for this user in this video
    const existingRoles: string[] = [];
    for (const roleToCheck of [VIDEO_ROLE_DANCER, VIDEO_ROLE_WINNER]) {
      const hasRole = await isUserTaggedInVideoWithRole(
        request.eventId!,
        request.videoId,
        request.targetUserId,
        roleToCheck
      );
      if (hasRole) {
        existingRoles.push(roleToCheck);
      }
    }

    // Combine existing roles with new role to set
    const rolesToSet = Array.from(new Set([...existingRoles, request.role]));
    await setVideoRoles(
      request.eventId!,
      request.videoId,
      request.targetUserId,
      rolesToSet
    );
  } else if (request.sectionId && request.role) {
    // Set section winner
    await setSectionWinner(
      request.eventId!,
      request.sectionId,
      request.targetUserId
    );
  } else if (request.role) {
    // Event role
    await setEventRoles(request.eventId!, request.targetUserId, request.role);
  }

  return { success: true };
}

export async function denyTaggingRequest(requestId: string, message?: string) {
  const approverId = await requireAuth();

  const request = await prisma.taggingRequest.findUnique({
    where: { id: requestId },
    include: {
      sender: true,
      targetUser: true,
    },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  // All requests now use eventId (sessions are now events)
  if (!request.eventId) {
    throw new Error("Invalid tagging request: eventId is required");
  }

  // Validate parameter combinations (same as approveTaggingRequest)
  if (request.videoId && request.sectionId) {
    throw new Error(
      "Invalid tagging request: cannot have both videoId and sectionId"
    );
  }
  if (request.videoId && !request.role) {
    throw new Error(
      "Invalid tagging request: role is required when videoId is provided"
    );
  }
  if (request.sectionId && !request.role) {
    throw new Error(
      "Invalid tagging request: role is required when sectionId is provided"
    );
  }
  if (!request.videoId && !request.sectionId && !request.role) {
    throw new Error(
      "Invalid tagging request: at least one of videoId, sectionId, or role must be provided"
    );
  }

  if (request.status !== "PENDING") {
    throw new Error("Request is not pending");
  }

  // Check if user can approve/deny (all requests now use eventId)
  if (!request.eventId) {
    throw new Error("Invalid tagging request: eventId is required");
  }

  const canApprove = await canUserApproveRequest(
    approverId,
    REQUEST_TYPES.TAGGING,
    {
      eventId: request.eventId,
    }
  );

  if (!canApprove) {
    throw new Error("You do not have permission to deny this request");
  }

  if (await hasUserResponded(REQUEST_TYPES.TAGGING, requestId, approverId)) {
    throw new Error("You have already responded to this request");
  }

  await createApprovalRecord(
    REQUEST_TYPES.TAGGING,
    requestId,
    approverId,
    false,
    message
  );

  await updateRequestStatus(REQUEST_TYPES.TAGGING, requestId, "DENIED");

  const eventTitle = await getEventTitle(request.eventId!);
  const eventDisplayName = eventTitle || request.eventId!;
  let resourceName = eventDisplayName;
  if (request.videoId) {
    const videoTitle = await getVideoTitle(request.videoId);
    resourceName = videoTitle || request.videoId;
  } else if (request.sectionId) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (s:Section {id: $sectionId}) RETURN s.title as title LIMIT 1`,
        { sectionId: request.sectionId }
      );
      if (result.records.length > 0) {
        resourceName = result.records[0].get("title") || request.sectionId;
      }
    } finally {
      await session.close();
    }
  }

  const roleName = request.role
    ? fromNeo4jRoleFormat(request.role) || request.role
    : "";

  await createNotification(
    request.senderId,
    "REQUEST_DENIED",
    "Request Denied",
    `Denied for "${roleName}" for ${resourceName}`,
    REQUEST_TYPES.TAGGING,
    requestId
  );

  return { success: true };
}

// ============================================================================
// Team Member Requests
// ============================================================================

export async function createTeamMemberRequest(eventId: string) {
  const senderId = await requireAuth();

  // Validate event exists in Neo4j
  const eventExistsInNeo4j = await eventExists(eventId);
  if (!eventExistsInNeo4j) {
    throw new Error("Event not found");
  }

  // Check if user is already the creator (creators cannot request team membership)
  const creatorId = await getEventCreator(eventId);
  if (creatorId === senderId) {
    throw new Error(
      "You are the event creator and cannot request team membership"
    );
  }

  // Check if already a team member (from Neo4j)
  const alreadyMember = await isTeamMember(eventId, senderId);
  if (alreadyMember) {
    throw new Error("You are already a team member of this event");
  }

  // Check if a pending request already exists
  const existingRequest = await prisma.teamMemberRequest.findFirst({
    where: {
      eventId,
      senderId,
      status: "PENDING",
    },
  });

  if (existingRequest) {
    throw new Error("A pending team member request already exists");
  }

  const request = await prisma.teamMemberRequest.create({
    data: {
      eventId,
      senderId,
      status: "PENDING",
    },
    include: {
      sender: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const approvers = await getTeamMemberRequestApprovers(eventId);

  const eventTitle = await getEventTitle(eventId);
  const eventDisplayName = eventTitle || eventId;

  for (const approverId of approvers) {
    await createNotification(
      approverId,
      "INCOMING_REQUEST",
      "New Team Member Request",
      `${
        request.sender.name || request.sender.email
      } wants to join as a team member for ${eventDisplayName}|eventId:${eventId}`,
      REQUEST_TYPES.TEAM_MEMBER,
      request.id
    );
  }

  return { success: true, request };
}

export async function approveTeamMemberRequest(
  requestId: string,
  message?: string
) {
  const approverId = await requireAuth();

  const request = await prisma.teamMemberRequest.findUnique({
    where: { id: requestId },
    include: {
      sender: true,
    },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error("Request is not pending");
  }

  // Validate event still exists in Neo4j before approving
  const eventStillExists = await eventExists(request.eventId);
  if (!eventStillExists) {
    throw new Error("Event no longer exists");
  }

  const canApprove = await canUserApproveRequest(
    approverId,
    REQUEST_TYPES.TEAM_MEMBER,
    {
      eventId: request.eventId,
    }
  );

  if (!canApprove) {
    throw new Error("You do not have permission to approve this request");
  }

  if (
    await hasUserResponded(REQUEST_TYPES.TEAM_MEMBER, requestId, approverId)
  ) {
    throw new Error("You have already responded to this request");
  }

  await createApprovalRecord(
    REQUEST_TYPES.TEAM_MEMBER,
    requestId,
    approverId,
    true,
    message
  );

  await updateRequestStatus(REQUEST_TYPES.TEAM_MEMBER, requestId, "APPROVED");

  // Add user as team member in Neo4j (grants edit access)
  await addTeamMember(request.eventId, request.senderId);

  const eventTitle = await getEventTitle(request.eventId);
  const eventDisplayName = eventTitle || request.eventId;

  await createNotification(
    request.senderId,
    "TEAM_MEMBER_ADDED",
    "Team Member Request Approved",
    `You have been added as a team member for ${eventDisplayName}|eventId:${request.eventId}`,
    REQUEST_TYPES.TEAM_MEMBER,
    requestId
  );

  return { success: true };
}

export async function denyTeamMemberRequest(
  requestId: string,
  message?: string
) {
  const approverId = await requireAuth();

  const request = await prisma.teamMemberRequest.findUnique({
    where: { id: requestId },
    include: {
      sender: true,
    },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error("Request is not pending");
  }

  const canApprove = await canUserApproveRequest(
    approverId,
    REQUEST_TYPES.TEAM_MEMBER,
    {
      eventId: request.eventId,
    }
  );

  if (!canApprove) {
    throw new Error("You do not have permission to deny this request");
  }

  if (
    await hasUserResponded(REQUEST_TYPES.TEAM_MEMBER, requestId, approverId)
  ) {
    throw new Error("You have already responded to this request");
  }

  await createApprovalRecord(
    REQUEST_TYPES.TEAM_MEMBER,
    requestId,
    approverId,
    false,
    message
  );

  await updateRequestStatus(REQUEST_TYPES.TEAM_MEMBER, requestId, "DENIED");

  const eventTitle = await getEventTitle(request.eventId);
  const eventDisplayName = eventTitle || request.eventId;

  await createNotification(
    request.senderId,
    "REQUEST_DENIED",
    "Team Member Request Denied",
    `Your team member request for ${eventDisplayName} has been denied|eventId:${request.eventId}`,
    REQUEST_TYPES.TEAM_MEMBER,
    requestId
  );

  return { success: true };
}

// ============================================================================
// Ownership Requests
// ============================================================================

export async function createOwnershipRequest(eventId: string) {
  const senderId = await requireAuth();

  // Validate event exists in Neo4j
  const eventExistsInNeo4j = await eventExists(eventId);
  if (!eventExistsInNeo4j) {
    throw new Error("Event not found");
  }

  // Check if user is already the creator (creators cannot request ownership)
  const creatorId = await getEventCreator(eventId);
  if (creatorId === senderId) {
    throw new Error("You are already the event owner");
  }

  // Check if a pending request already exists
  const existingRequest = await prisma.ownershipRequest.findFirst({
    where: {
      eventId,
      senderId,
      status: "PENDING",
    },
  });

  if (existingRequest) {
    throw new Error("A pending ownership request already exists");
  }

  const request = await prisma.ownershipRequest.create({
    data: {
      eventId,
      senderId,
      status: "PENDING",
    },
    include: {
      sender: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const approvers = await getOwnershipRequestApprovers(eventId);

  const eventTitle = await getEventTitle(eventId);
  const eventDisplayName = eventTitle || eventId;

  for (const approverId of approvers) {
    await createNotification(
      approverId,
      "OWNERSHIP_REQUESTED",
      "New Ownership Request",
      `${
        request.sender.name || request.sender.email
      } requested ownership of ${eventDisplayName}|eventId:${eventId}`,
      REQUEST_TYPES.OWNERSHIP,
      request.id
    );
  }

  return { success: true, request };
}

export async function hasPendingOwnershipRequest(eventId: string) {
  const senderId = await requireAuth();

  const existingRequest = await prisma.ownershipRequest.findFirst({
    where: {
      eventId,
      senderId,
      status: "PENDING",
    },
  });

  return !!existingRequest;
}

export async function hasPendingTeamMemberRequest(eventId: string) {
  const senderId = await requireAuth();

  const existingRequest = await prisma.teamMemberRequest.findFirst({
    where: {
      eventId,
      senderId,
      status: "PENDING",
    },
  });

  return !!existingRequest;
}

export async function approveOwnershipRequest(
  requestId: string,
  addOldCreatorAsTeamMember: boolean = false
) {
  const approverId = await requireAuth();

  const request = await prisma.ownershipRequest.findUnique({
    where: { id: requestId },
    include: {
      sender: true,
    },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error("Request is not pending");
  }

  // Validate event still exists in Neo4j before approving
  const eventStillExists = await eventExists(request.eventId);
  if (!eventStillExists) {
    throw new Error("Event no longer exists");
  }

  const canApprove = await canUserApproveRequest(
    approverId,
    REQUEST_TYPES.OWNERSHIP,
    {
      eventId: request.eventId,
    }
  );

  if (!canApprove) {
    throw new Error("You do not have permission to approve this request");
  }

  if (await hasUserResponded(REQUEST_TYPES.OWNERSHIP, requestId, approverId)) {
    throw new Error("You have already responded to this request");
  }

  // Get current creator
  const currentCreatorId = await getEventCreator(request.eventId);
  if (!currentCreatorId) {
    throw new Error("Event creator not found");
  }

  // Get sender user data for transfer
  const senderUser = await getUser(request.senderId);
  if (!senderUser) {
    throw new Error("Request sender not found");
  }

  const newCreator: { id: string; username: string; displayName: string } = {
    id: senderUser.id,
    username: senderUser.username,
    displayName: senderUser.displayName || senderUser.username,
  };

  // Transfer ownership using updateEventCreator
  const { updateEventCreator } = await import(
    "@/lib/server_actions/event_actions"
  );
  const transferResult = await updateEventCreator(
    request.eventId,
    newCreator,
    addOldCreatorAsTeamMember
  );

  if (transferResult.error) {
    throw new Error(transferResult.error);
  }

  await createApprovalRecord(
    REQUEST_TYPES.OWNERSHIP,
    requestId,
    approverId,
    true
  );

  await updateRequestStatus(REQUEST_TYPES.OWNERSHIP, requestId, "APPROVED");

  const eventTitle = await getEventTitle(request.eventId);
  const eventDisplayName = eventTitle || request.eventId;

  await createNotification(
    request.senderId,
    "OWNERSHIP_REQUEST_APPROVED",
    "Ownership Request Approved",
    `Your ownership request for ${eventDisplayName} has been approved|eventId:${request.eventId}`,
    REQUEST_TYPES.OWNERSHIP,
    requestId
  );

  return { success: true };
}

export async function denyOwnershipRequest(
  requestId: string,
  message?: string
) {
  const approverId = await requireAuth();

  const request = await prisma.ownershipRequest.findUnique({
    where: { id: requestId },
    include: {
      sender: true,
    },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error("Request is not pending");
  }

  const canApprove = await canUserApproveRequest(
    approverId,
    REQUEST_TYPES.OWNERSHIP,
    {
      eventId: request.eventId,
    }
  );

  if (!canApprove) {
    throw new Error("You do not have permission to deny this request");
  }

  if (await hasUserResponded(REQUEST_TYPES.OWNERSHIP, requestId, approverId)) {
    throw new Error("You have already responded to this request");
  }

  await createApprovalRecord(
    REQUEST_TYPES.OWNERSHIP,
    requestId,
    approverId,
    false,
    message
  );

  await updateRequestStatus(REQUEST_TYPES.OWNERSHIP, requestId, "DENIED");

  const eventTitle = await getEventTitle(request.eventId);
  const eventDisplayName = eventTitle || request.eventId;

  await createNotification(
    request.senderId,
    "OWNERSHIP_REQUEST_DENIED",
    "Ownership Request Denied",
    `Your ownership request for ${eventDisplayName} has been denied|eventId:${request.eventId}`,
    REQUEST_TYPES.OWNERSHIP,
    requestId
  );

  return { success: true };
}

export async function cancelOwnershipRequest(requestId: string) {
  const userId = await requireAuth();
  await cancelRequest(REQUEST_TYPES.OWNERSHIP, requestId, userId);

  return { success: true };
}

// ============================================================================
// Authorization Level Change Requests
// ============================================================================

export async function createAuthLevelChangeRequest(
  targetUserId: string,
  requestedLevel: number,
  message: string
) {
  const senderId = await requireAuth();

  if (!message || message.trim().length === 0) {
    throw new Error(
      "Message is required for authorization level change requests"
    );
  }

  // Validate requested level
  if (requestedLevel < 0 || requestedLevel > AUTH_LEVELS.SUPER_ADMIN) {
    throw new Error("Invalid authorization level");
  }

  // Get target user
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, auth: true },
  });

  if (!targetUser) {
    throw new Error("Target user not found");
  }

  const currentLevel = targetUser.auth ?? 0;

  if (currentLevel === requestedLevel) {
    throw new Error("Target user already has this authorization level");
  }

  // Check if a pending request already exists
  const existingRequest = await prisma.authLevelChangeRequest.findFirst({
    where: {
      targetUserId,
      senderId,
      status: "PENDING",
    },
  });

  if (existingRequest) {
    throw new Error(
      "A pending authorization level change request already exists"
    );
  }

  const request = await prisma.authLevelChangeRequest.create({
    data: {
      senderId,
      targetUserId,
      requestedLevel,
      currentLevel,
      message,
      status: "PENDING",
    },
    include: {
      sender: {
        select: { id: true, name: true, email: true },
      },
      targetUser: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const approvers = await getAuthLevelChangeRequestApprovers();

  for (const approverId of approvers) {
    await createNotification(
      approverId,
      "INCOMING_REQUEST",
      "New Authorization Level Change Request",
      `${request.sender.name || request.sender.email} wants to change ${
        request.targetUser.name || request.targetUser.email
      }'s authorization level from ${currentLevel} to ${requestedLevel}`,
      REQUEST_TYPES.AUTH_LEVEL_CHANGE,
      request.id
    );
  }

  return { success: true, request };
}

export async function approveAuthLevelChangeRequest(
  requestId: string,
  message?: string
) {
  const approverId = await requireAuth();

  const request = await prisma.authLevelChangeRequest.findUnique({
    where: { id: requestId },
    include: {
      sender: true,
      targetUser: true,
    },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error("Request is not pending");
  }

  const canApprove = await canUserApproveRequest(
    approverId,
    REQUEST_TYPES.AUTH_LEVEL_CHANGE
  );

  if (!canApprove) {
    throw new Error("You do not have permission to approve this request");
  }

  if (
    await hasUserResponded(
      REQUEST_TYPES.AUTH_LEVEL_CHANGE,
      requestId,
      approverId
    )
  ) {
    throw new Error("You have already responded to this request");
  }

  await createApprovalRecord(
    REQUEST_TYPES.AUTH_LEVEL_CHANGE,
    requestId,
    approverId,
    true,
    message
  );

  await updateRequestStatus(
    REQUEST_TYPES.AUTH_LEVEL_CHANGE,
    requestId,
    "APPROVED"
  );

  // Update user's authorization level
  await prisma.user.update({
    where: { id: request.targetUserId },
    data: {
      auth: request.requestedLevel,
    },
  });

  // Notify sender and target user
  await createNotification(
    request.senderId,
    "REQUEST_APPROVED",
    "Authorization Level Change Approved",
    `Authorization level change request for ${
      request.targetUser.name || request.targetUser.email
    } has been approved`,
    REQUEST_TYPES.AUTH_LEVEL_CHANGE,
    requestId
  );

  await createNotification(
    request.targetUserId,
    "AUTH_LEVEL_CHANGED",
    "Your Authorization Level Changed",
    `Your authorization level has been changed to ${request.requestedLevel}`,
    REQUEST_TYPES.AUTH_LEVEL_CHANGE,
    requestId
  );

  return { success: true };
}

export async function denyAuthLevelChangeRequest(
  requestId: string,
  message?: string
) {
  const approverId = await requireAuth();

  const request = await prisma.authLevelChangeRequest.findUnique({
    where: { id: requestId },
    include: {
      sender: true,
      targetUser: true,
    },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error("Request is not pending");
  }

  const canApprove = await canUserApproveRequest(
    approverId,
    REQUEST_TYPES.AUTH_LEVEL_CHANGE
  );

  if (!canApprove) {
    throw new Error("You do not have permission to deny this request");
  }

  if (
    await hasUserResponded(
      REQUEST_TYPES.AUTH_LEVEL_CHANGE,
      requestId,
      approverId
    )
  ) {
    throw new Error("You have already responded to this request");
  }

  await createApprovalRecord(
    REQUEST_TYPES.AUTH_LEVEL_CHANGE,
    requestId,
    approverId,
    false,
    message
  );

  await updateRequestStatus(
    REQUEST_TYPES.AUTH_LEVEL_CHANGE,
    requestId,
    "DENIED"
  );

  await createNotification(
    request.senderId,
    "REQUEST_DENIED",
    "Authorization Level Change Denied",
    `Authorization level change request has been denied`,
    REQUEST_TYPES.AUTH_LEVEL_CHANGE,
    requestId
  );

  return { success: true };
}

// ============================================================================
// Cancel Requests
// ============================================================================

export async function cancelTaggingRequest(requestId: string) {
  const userId = await requireAuth();
  await cancelRequest(REQUEST_TYPES.TAGGING, requestId, userId);
  return { success: true };
}

export async function cancelTeamMemberRequest(requestId: string) {
  const userId = await requireAuth();
  await cancelRequest(REQUEST_TYPES.TEAM_MEMBER, requestId, userId);
  return { success: true };
}

export async function cancelAuthLevelChangeRequest(requestId: string) {
  const userId = await requireAuth();
  await cancelRequest(REQUEST_TYPES.AUTH_LEVEL_CHANGE, requestId, userId);
  return { success: true };
}

// ============================================================================
// Fetch Requests
// ============================================================================

export async function getIncomingRequests() {
  const userId = await requireAuth();

  // Get all requests where user can approve
  const taggingRequests = await prisma.taggingRequest.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      sender: {
        select: { id: true, name: true, email: true },
      },
      targetUser: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const teamMemberRequests = await prisma.teamMemberRequest.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      sender: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const ownershipRequests = await prisma.ownershipRequest.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      sender: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const authLevelChangeRequests = await prisma.authLevelChangeRequest.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      sender: {
        select: { id: true, name: true, email: true },
      },
      targetUser: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const accountClaimRequests = await prisma.accountClaimRequest.findMany({
    where: { status: "PENDING" },
    include: {
      sender: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Filter requests user can approve and enrich with event/video info (all requests now use eventId)
  const canApproveTagging = await Promise.all(
    taggingRequests
      .filter((req) => req.eventId) // Only process requests with eventId
      .map(async (req) => {
        const canApprove = await canUserApproveRequest(
          userId,
          REQUEST_TYPES.TAGGING,
          {
            eventId: req.eventId!,
          }
        );

        // Fetch event title and type
        const [eventTitle, eventType] = await Promise.all([
          getEventTitle(req.eventId!),
          getEventType(req.eventId!),
        ]);
        const videoTitle = req.videoId
          ? await getVideoTitle(req.videoId)
          : null;

        // Fetch section title from Neo4j if sectionId exists
        let sectionTitle: string | null = null;
        if (req.sectionId) {
          const session = driver.session();
          try {
            const result = await session.run(
              `
              MATCH (s:Section {id: $sectionId})
              RETURN s.title as title
              LIMIT 1
              `,
              { sectionId: req.sectionId }
            );
            if (result.records.length > 0) {
              sectionTitle = result.records[0].get("title");
            }
          } finally {
            await session.close();
          }
        }

        // Enrich sender and targetUser with Neo4j data
        const [enrichedSender, enrichedTargetUser] = await Promise.all([
          req.sender ? enrichUserData(req.sender) : null,
          req.targetUser ? enrichUserData(req.targetUser) : null,
        ]);

        return {
          request: {
            ...req,
            sender: enrichedSender || req.sender,
            targetUser: enrichedTargetUser || req.targetUser,
            eventTitle: eventTitle || req.eventId || null,
            eventType: eventType || null,
            videoTitle: videoTitle || null,
            sectionTitle: sectionTitle || null,
            role: req.role
              ? fromNeo4jRoleFormat(req.role) || req.role
              : undefined,
          },
          canApprove,
        };
      })
  );

  const canApproveTeamMember = await Promise.all(
    teamMemberRequests.map(async (req) => {
      const canApprove = await canUserApproveRequest(
        userId,
        REQUEST_TYPES.TEAM_MEMBER,
        { eventId: req.eventId }
      );

      const eventTitle = await getEventTitle(req.eventId);

      // Enrich sender with Neo4j data
      const enrichedSender = req.sender
        ? await enrichUserData(req.sender)
        : null;

      return {
        request: {
          ...req,
          sender: enrichedSender || req.sender,
          eventTitle: eventTitle || req.eventId,
        },
        canApprove,
      };
    })
  );

  const canApproveOwnership = await Promise.all(
    ownershipRequests.map(async (req) => {
      const canApprove = await canUserApproveRequest(
        userId,
        REQUEST_TYPES.OWNERSHIP,
        { eventId: req.eventId }
      );

      const eventTitle = await getEventTitle(req.eventId);

      // Enrich sender with Neo4j data
      const enrichedSender = req.sender
        ? await enrichUserData(req.sender)
        : null;

      return {
        request: {
          ...req,
          sender: enrichedSender || req.sender,
          eventTitle: eventTitle || req.eventId,
        },
        canApprove,
      };
    })
  );

  const canApproveAuthLevel = await Promise.all(
    authLevelChangeRequests.map(async (req) => {
      // Enrich sender and targetUser with Neo4j data
      const [enrichedSender, enrichedTargetUser] = await Promise.all([
        req.sender ? enrichUserData(req.sender) : null,
        req.targetUser ? enrichUserData(req.targetUser) : null,
      ]);

      return {
        request: {
          ...req,
          sender: enrichedSender || req.sender,
          targetUser: enrichedTargetUser || req.targetUser,
        },
        canApprove: await canUserApproveRequest(
          userId,
          REQUEST_TYPES.AUTH_LEVEL_CHANGE
        ),
      };
    })
  );

  const canApproveAccountClaim = await Promise.all(
    accountClaimRequests.map(async (req) => {
      const enrichedSender = req.sender
        ? await enrichUserData(req.sender)
        : null;

      return {
        request: {
          ...req,
          sender: enrichedSender || req.sender,
        },
        canApprove: await canUserApproveRequest(
          userId,
          REQUEST_TYPES.ACCOUNT_CLAIM
        ),
      };
    })
  );

  return {
    tagging: canApproveTagging
      .filter((item) => item.canApprove)
      .map((item) => ({ ...item.request, type: "TAGGING" })),
    teamMember: canApproveTeamMember
      .filter((item) => item.canApprove)
      .map((item) => ({ ...item.request, type: "TEAM_MEMBER" })),
    ownership: canApproveOwnership
      .filter((item) => item.canApprove)
      .map((item) => ({ ...item.request, type: "OWNERSHIP" })),
    authLevelChange: canApproveAuthLevel
      .filter((item) => item.canApprove)
      .map((item) => ({ ...item.request, type: "AUTH_LEVEL_CHANGE" })),
    accountClaim: canApproveAccountClaim
      .filter((item) => item.canApprove)
      .map((item) => ({ ...item.request, type: "ACCOUNT_CLAIM" })),
  };
}

export async function getOutgoingRequests() {
  const userId = await requireAuth();

  const [
    taggingRequests,
    teamMemberRequests,
    ownershipRequests,
    authLevelChangeRequests,
    accountClaimRequests,
  ] = await Promise.all([
    prisma.taggingRequest.findMany({
      where: { senderId: userId },
      include: {
        targetUser: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.teamMemberRequest.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.ownershipRequest.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.authLevelChangeRequest.findMany({
      where: { senderId: userId },
      include: {
        targetUser: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.accountClaimRequest.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Enrich tagging requests with event and video titles (all requests now use eventId)
  const enrichedTaggingRequests = await Promise.all(
    taggingRequests
      .filter((req) => req.eventId) // Only process requests with eventId
      .map(async (req) => {
        // Fetch event title and type
        const [eventTitle, eventType] = await Promise.all([
          getEventTitle(req.eventId!),
          getEventType(req.eventId!),
        ]);
        const videoTitle = req.videoId
          ? await getVideoTitle(req.videoId)
          : null;

        // Fetch section title from Neo4j if sectionId exists
        let sectionTitle: string | null = null;
        if (req.sectionId) {
          const session = driver.session();
          try {
            const result = await session.run(
              `
              MATCH (s:Section {id: $sectionId})
              RETURN s.title as title
              LIMIT 1
              `,
              { sectionId: req.sectionId }
            );
            if (result.records.length > 0) {
              sectionTitle = result.records[0].get("title");
            }
          } finally {
            await session.close();
          }
        }

        // Enrich targetUser with Neo4j data
        const enrichedTargetUser = req.targetUser
          ? await enrichUserData(req.targetUser)
          : null;

        return {
          ...req,
          targetUser: enrichedTargetUser || req.targetUser,
          type: "TAGGING",
          sectionTitle: sectionTitle || null,
          eventTitle: eventTitle || req.eventId || null,
          eventType: eventType || null,
          videoTitle: videoTitle || null,
          role: req.role
            ? fromNeo4jRoleFormat(req.role) || req.role
            : undefined,
        };
      })
  );

  // Enrich team member requests with event titles and types
  const enrichedTeamMemberRequests = await Promise.all(
    teamMemberRequests.map(async (req) => {
      const [eventTitle, eventType] = await Promise.all([
        getEventTitle(req.eventId),
        getEventType(req.eventId),
      ]);
      return {
        ...req,
        type: "TEAM_MEMBER",
        eventTitle: eventTitle || req.eventId,
        eventType: eventType || null,
      };
    })
  );

  // Enrich ownership requests with event titles and types
  const enrichedOwnershipRequests = await Promise.all(
    ownershipRequests.map(async (req) => {
      const [eventTitle, eventType] = await Promise.all([
        getEventTitle(req.eventId),
        getEventType(req.eventId),
      ]);
      return {
        ...req,
        type: "OWNERSHIP",
        eventTitle: eventTitle || req.eventId,
        eventType: eventType || null,
      };
    })
  );

  // Enrich auth level change requests with user data
  const enrichedAuthLevelChangeRequests = await Promise.all(
    authLevelChangeRequests.map(async (req) => {
      // Enrich targetUser with Neo4j data
      const enrichedTargetUser = req.targetUser
        ? await enrichUserData(req.targetUser)
        : null;

      return {
        ...req,
        targetUser: enrichedTargetUser || req.targetUser,
        type: "AUTH_LEVEL_CHANGE",
      };
    })
  );

  const enrichedAccountClaimRequests = accountClaimRequests.map((req) => ({
    ...req,
    type: "ACCOUNT_CLAIM",
  }));

  return {
    tagging: enrichedTaggingRequests,
    teamMember: enrichedTeamMemberRequests,
    ownership: enrichedOwnershipRequests,
    authLevelChange: enrichedAuthLevelChangeRequests,
    accountClaim: enrichedAccountClaimRequests,
  };
}

// ============================================================================
// Notifications
// ============================================================================

export async function getNotifications(limit: number = 50, isOld?: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const where: { userId: string; isOld?: boolean } = {
    userId: session.user.id,
  };

  if (isOld !== undefined) {
    where.isOld = isOld;
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return notifications;
}

export async function markNotificationAsOld(notificationId: string) {
  const userId = await requireAuth();

  await prisma.notification.update({
    where: {
      id: notificationId,
      userId, // Ensure user owns the notification
    },
    data: { isOld: true },
  });

  return { success: true };
}

export async function markAllNotificationsAsOld() {
  const userId = await requireAuth();

  await prisma.notification.updateMany({
    where: {
      userId,
      isOld: false,
    },
    data: { isOld: true },
  });

  return { success: true };
}

export async function getNewNotificationCount() {
  const session = await auth();
  if (!session?.user?.id) {
    return 0;
  }

  const count = await prisma.notification.count({
    where: {
      userId: session.user.id,
      isOld: false,
    },
  });

  return count;
}

/**
 * Get navigation URL for a notification based on its type and related request
 */
export async function getNotificationUrl(
  notificationId: string
): Promise<string | null> {
  const userId = await requireAuth();

  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    return null;
  }

  // For incoming requests, go to dashboard with anchor
  if (
    notification.type === "INCOMING_REQUEST" &&
    notification.relatedRequestId
  ) {
    if (notification.relatedRequestType === "TAGGING") {
      return "/dashboard#requests";
    } else if (notification.relatedRequestType === "TEAM_MEMBER") {
      return "/dashboard#requests";
    } else if (notification.relatedRequestType === "OWNERSHIP") {
      return "/dashboard#requests";
    } else if (notification.relatedRequestType === "AUTH_LEVEL_CHANGE") {
      return "/dashboard#requests";
    }
  }

  // For approved/denied requests, navigate to the event/section/video
  if (
    (notification.type === "REQUEST_APPROVED" ||
      notification.type === "REQUEST_DENIED") &&
    notification.relatedRequestId &&
    notification.relatedRequestType === "TAGGING"
  ) {
    const request = await prisma.taggingRequest.findUnique({
      where: { id: notification.relatedRequestId },
      select: {
        eventId: true,
        videoId: true,
        sectionId: true,
      },
    });

    if (!request || !request.eventId) {
      return null;
    }

    // Build URL based on what level the tag is at
    if (request.videoId && request.sectionId) {
      return `/events/${request.eventId}/sections/${request.sectionId}?video=${request.videoId}`;
    } else if (request.sectionId) {
      return `/events/${request.eventId}/sections/${request.sectionId}`;
    } else {
      return `/events/${request.eventId}`;
    }
  }

  // For TAGGED notifications, parse navigation info from message
  if (notification.type === "TAGGED") {
    const message = notification.message;
    const parts = message.split("|");
    if (parts.length > 1) {
      const navParts = parts.slice(1);
      let eventId: string | null = null;
      let sectionId: string | null = null;
      let videoId: string | null = null;

      for (const part of navParts) {
        if (part.startsWith("eventId:")) {
          eventId = part.replace("eventId:", "");
        } else if (part.startsWith("sectionId:")) {
          sectionId = part.replace("sectionId:", "");
        } else if (part.startsWith("videoId:")) {
          videoId = part.replace("videoId:", "");
        }
      }

      if (eventId) {
        if (videoId && sectionId) {
          return `/events/${eventId}/sections/${sectionId}?video=${videoId}`;
        } else if (sectionId) {
          return `/events/${eventId}/sections/${sectionId}`;
        } else {
          return `/events/${eventId}`;
        }
      }
    }
  }

  // For team member requests, go to event
  if (
    (notification.type === "REQUEST_APPROVED" ||
      notification.type === "REQUEST_DENIED") &&
    notification.relatedRequestId &&
    notification.relatedRequestType === "TEAM_MEMBER"
  ) {
    const request = await prisma.teamMemberRequest.findUnique({
      where: { id: notification.relatedRequestId },
      select: { eventId: true },
    });

    if (request?.eventId) {
      return `/events/${request.eventId}`;
    }
  }

  // For OWNERSHIP_TRANSFERRED notifications, parse eventId from message
  if (notification.type === "OWNERSHIP_TRANSFERRED") {
    const message = notification.message;
    const parts = message.split("|");
    if (parts.length > 1) {
      for (const part of parts.slice(1)) {
        if (part.startsWith("eventId:")) {
          const eventId = part.replace("eventId:", "");
          return `/events/${eventId}`;
        }
      }
    }
  }

  // For ownership request notifications, parse eventId from message
  if (
    (notification.type === "OWNERSHIP_REQUESTED" ||
      notification.type === "OWNERSHIP_REQUEST_APPROVED" ||
      notification.type === "OWNERSHIP_REQUEST_DENIED") &&
    notification.relatedRequestId
  ) {
    // Try to get eventId from request
    const request = await prisma.ownershipRequest.findUnique({
      where: { id: notification.relatedRequestId },
      select: { eventId: true },
    });

    if (request?.eventId) {
      return `/events/${request.eventId}`;
    }

    // Fallback: parse from message
    const message = notification.message;
    const parts = message.split("|");
    if (parts.length > 1) {
      for (const part of parts.slice(1)) {
        if (part.startsWith("eventId:")) {
          const eventId = part.replace("eventId:", "");
          return `/events/${eventId}`;
        }
      }
    }
  }

  return null;
}

// ============================================================================
// Dashboard Data
// ============================================================================

export async function getDashboardData() {
  const userId = await requireAuth();

  const [
    incomingRequests,
    outgoingRequests,
    userEvents,
    teamMemberships,
    user,
    userProfile,
  ] = await Promise.all([
    getIncomingRequests(),
    getOutgoingRequests(),
    (async () => {
      const { getUserCreatedEventCards } = await import("@/db/queries/event");
      return await getUserCreatedEventCards(userId);
    })(),
    getUserTeamMemberships(userId).then((memberships) =>
      memberships.slice(0, 10).map((m) => ({
        eventId: m.eventId,
        eventTitle: m.eventTitle,
        createdAt: new Date(), // Neo4j doesn't track creation time, using current date
      }))
    ),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        auth: true,
      },
    }),
    getUser(userId).catch(() => null), // Get displayName from Neo4j
  ]);

  // Get hidden events for moderators/admins
  let hiddenEvents: TEventCard[] = [];
  const authLevel = user?.auth ?? 0;
  if (authLevel >= AUTH_LEVELS.MODERATOR) {
    const { getHiddenEvents } = await import("@/db/queries/event");
    hiddenEvents = await getHiddenEvents();
  }

  // Destructure to exclude id from being sent to client
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _, ...userWithoutId } = user || {};

  return {
    user: {
      ...userWithoutId,
      displayName: userProfile?.displayName || null, // Add displayName from Neo4j
      username: userProfile?.username || null, // Add username from Neo4j
      image: userProfile?.image || null, // Add image from Neo4j
    },
    incomingRequests,
    outgoingRequests,
    userEvents,
    teamMemberships,
    hiddenEvents,
  };
}

export async function getSavedEventsForUser(): Promise<TEventCard[]> {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  try {
    const { getSavedEventsForUser: getSavedEventsForUserQuery } = await import(
      "@/db/queries/event"
    );
    // Get user's auth level
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { auth: true },
    });
    const authLevel = user?.auth ?? 0;
    return await getSavedEventsForUserQuery(session.user.id, authLevel);
  } catch (error) {
    console.error("Error fetching saved events:", error);
    return [];
  }
}

/**
 * Tag self with a role in an event
 * If user has permission (admin, super admin, moderator, event creator), tags directly
 * Otherwise, creates a tagging request
 */
export async function tagSelfWithRole(eventId: string, role: string) {
  const userId = await requireAuth();
  const session = await auth();

  // Validate role
  if (!isValidRole(role)) {
    throw new Error(
      `Invalid role: ${role}. Must be one of: ${AVAILABLE_ROLES.join(", ")}`
    );
  }

  // Validate event exists
  const eventExistsInNeo4j = await eventExists(eventId);
  if (!eventExistsInNeo4j) {
    throw new Error("Event not found");
  }

  // Regular role handling (non-Team Member roles)
  // Verified users can tag directly
  const authLevel = session?.user?.auth || 0;
  const isVerified = !!session?.user?.accountVerified;
  const canTagDirectly =
    isVerified ||
    authLevel >= AUTH_LEVELS.MODERATOR || // Admins (3) and Super Admins (4) are included
    (await isTeamMember(eventId, userId)) ||
    (await isEventCreator(eventId, userId));

  if (canTagDirectly) {
    // User has permission - tag directly
    try {
      await setEventRoles(eventId, userId, role);
      return { success: true, directTag: true };
    } catch (error) {
      console.error("Error tagging self with role:", error);
      throw error;
    }
  } else {
    // User doesn't have permission - create a tagging request
    console.log(
      "🔵 [tagSelfWithRole] User doesn't have permission, creating request..."
    );
    try {
      const result = await createTaggingRequest(
        eventId,
        undefined,
        undefined,
        role
      );
      console.log(
        "✅ [tagSelfWithRole] Request created successfully:",
        result.request.id
      );
      return { success: true, directTag: false, request: result.request };
    } catch (error) {
      console.error(
        "❌ [tagSelfWithRole] Error creating tagging request:",
        error
      );
      throw error;
    }
  }
}

/**
 * Tag self in a video
 * If user has permission (admin, super admin, moderator, event creator, or team member), tags directly
 * Otherwise, creates a tagging request
 * Role is required
 */
export async function tagSelfInVideo(
  eventId: string,
  videoId: string,
  role: string
): Promise<{ success: true; directTag: boolean; existingRequests?: string[] }> {
  const userId = await requireAuth();
  const session = await auth();

  // Validate role is provided
  if (!role) {
    throw new Error("Role is required for video tags");
  }

  // Validate video role - allow Choreographer and Teacher in addition to standard video roles
  const roleUpper = role.toUpperCase();
  const isValid =
    isValidVideoRole(role) ||
    roleUpper === "CHOREOGRAPHER" ||
    roleUpper === "TEACHER";
  if (!isValid) {
    throw new Error(`Invalid video role: ${role}`);
  }

  // Validate event exists
  const eventExistsInNeo4j = await eventExists(eventId);
  if (!eventExistsInNeo4j) {
    throw new Error("Event not found");
  }

  // Dancer tags are supported for all videos
  // Winner tags are supported for battle and other videos
  if (role === VIDEO_ROLE_WINNER) {
    const videoType = await getVideoType(videoId);
    if (videoType !== "battle" && videoType !== "other") {
      throw new Error(
        "Winner tags are only supported for battle and other videos"
      );
    }
  }

  // Validate video exists
  const videoExists = await videoExistsInEvent(eventId, videoId);
  if (!videoExists) {
    throw new Error("Video not found in this event");
  }

  // Check if user already has this specific role in the video
  const alreadyHasRole = await isUserTaggedInVideoWithRole(
    eventId,
    videoId,
    userId,
    role
  );
  if (alreadyHasRole) {
    throw new Error(`You are already tagged as ${role} in this video`);
  }

  // If tagging as Winner, check if user is already tagged as Dancer
  // If not, we'll also tag them as Dancer
  const rolesToTag = [role];
  if (role === VIDEO_ROLE_WINNER) {
    const isDancer = await isUserTaggedInVideoWithRole(
      eventId,
      videoId,
      userId,
      VIDEO_ROLE_DANCER
    );
    if (!isDancer) {
      rolesToTag.push(VIDEO_ROLE_DANCER);
      console.log(
        "🔵 [tagSelfInVideo] User not tagged as Dancer, will also tag as Dancer"
      );
    }
  }

  // Check if user has permission to tag directly
  const authLevel = session?.user?.auth || 0;
  const isVerified = !!session?.user?.accountVerified;
  const canTagDirectly =
    isVerified ||
    authLevel >= AUTH_LEVELS.MODERATOR || // Admins (3) and Super Admins (4) are included
    (await isTeamMember(eventId, userId)) ||
    (await isEventCreator(eventId, userId));

  if (canTagDirectly) {
    console.log("Applying tag in Neo4j");

    // User has permission - tag directly with specified role(s)
    try {
      // Get existing roles for this user in this video
      const existingRoles: string[] = [];
      for (const roleToCheck of [
        VIDEO_ROLE_DANCER,
        VIDEO_ROLE_WINNER,
        "Choreographer",
        "Teacher",
      ]) {
        const hasRole = await isUserTaggedInVideoWithRole(
          eventId,
          videoId,
          userId,
          roleToCheck
        );
        if (hasRole) {
          existingRoles.push(roleToCheck);
        }
      }

      // Combine existing roles with new roles to set
      const allRoles = Array.from(new Set([...existingRoles, ...rolesToTag]));
      await setVideoRoles(eventId, videoId, userId, allRoles);
      console.log("✅ [tagSelfInVideo] Tag(s) applied successfully");
      return { success: true, directTag: true };
    } catch (error) {
      console.error("Error tagging self in video:", error);
      throw error;
    }
  } else {
    // User doesn't have permission - create tagging request(s)
    console.log(
      "🔵 [tagSelfInVideo] User doesn't have permission, creating request(s)..."
    );
    try {
      // Create requests for all roles (Winner and Dancer if needed)
      const requests = [];
      const existingRequests: string[] = [];
      for (const roleToTag of rolesToTag) {
        try {
          const result = await createTaggingRequest(
            eventId,
            videoId,
            undefined,
            roleToTag
          );
          // Only add to requests if it's a new request (not an existing one)
          // Existing requests are returned but shouldn't be counted as "newly created"
          if (!result.isExisting) {
            requests.push(result);
          } else {
            existingRequests.push(roleToTag);
            console.log(
              `⚠️ [tagSelfInVideo] Request for ${roleToTag} already exists, not counting as new`
            );
          }
        } catch (error) {
          // For any other errors, re-throw
          throw error;
        }
      }

      if (requests.length === 0) {
        // All requests already exist - return success with existing requests info
        // This allows the UI to show a notification instead of throwing an error
        return { success: true, directTag: false, existingRequests };
      }

      const requestIds = requests
        .map((r) => r?.request?.id)
        .filter((id): id is string => id !== undefined);
      console.log(
        "✅ [tagSelfInVideo] Request(s) created successfully:",
        requestIds
      );

      // If multiple requests were created (Winner + Dancer), update notifications
      // to indicate both requests were sent
      if (requests.length > 1 && role === VIDEO_ROLE_WINNER) {
        const eventTitle = await getEventTitle(eventId);
        const eventDisplayName = eventTitle || eventId;
        const videoTitle = await getVideoTitle(videoId);
        const videoDisplayName = videoTitle || videoId;
        const username = session?.user?.name || session?.user?.email || "User";

        // Update notifications for approvers to indicate both requests
        const approvers = await getTaggingRequestApprovers(eventId);
        for (const approverId of approvers) {
          try {
            // Create an additional combined notification
            await createNotification(
              approverId,
              "INCOMING_REQUEST",
              "New Tagging Requests",
              `${username} requesting tags for video ${videoDisplayName} as Winner and Dancer in event ${eventDisplayName}`,
              REQUEST_TYPES.TAGGING,
              requestIds[0] // Use first request ID for the notification
            );
          } catch (error) {
            console.error(
              `⚠️ [tagSelfInVideo] Failed to create combined notification:`,
              error
            );
          }
        }
      }

      return { success: true, directTag: false };
    } catch (error) {
      console.error(
        "❌ [tagSelfInVideo] Error creating tagging request:",
        error
      );
      throw error;
    }
  }
}

/**
 * Tag self in a section
 * If user has permission (admin, super admin, moderator, event creator, or team member), tags directly
 * Otherwise, creates a tagging request
 * Role is required (must be "Winner" for now)
 */
export async function tagSelfInSection(
  eventId: string,
  sectionId: string,
  role: string
): Promise<{ success: true; directTag: boolean }> {
  const userId = await requireAuth();
  const session = await auth();

  // Validate role is provided
  if (!role) {
    throw new Error("Role is required for section tags");
  }

  // Validate section role
  if (!isValidSectionRole(role)) {
    throw new Error(
      `Invalid section role: ${role}. Must be: ${SECTION_ROLE_WINNER} or ${SECTION_ROLE_JUDGE}`
    );
  }

  // Validate event exists
  const eventExistsInNeo4j = await eventExists(eventId);
  if (!eventExistsInNeo4j) {
    throw new Error("Event not found");
  }

  // Validate section exists
  const sectionExists = await sectionExistsInEvent(eventId, sectionId);
  if (!sectionExists) {
    throw new Error("Section not found in this event");
  }

  // Check if user has permission to tag directly
  const authLevel = session?.user?.auth || 0;
  const isVerified = !!session?.user?.accountVerified;
  const canTagDirectly =
    isVerified ||
    authLevel >= AUTH_LEVELS.MODERATOR || // Admins (3) and Super Admins (4) are included
    (await isTeamMember(eventId, userId)) ||
    (await isEventCreator(eventId, userId));

  if (canTagDirectly) {
    console.log("Applying section tag in Neo4j");

    // User has permission - tag directly with specified role
    try {
      if (role === SECTION_ROLE_WINNER) {
        // Get current winners and add this user to the list (don't remove existing winners)
        const currentWinnerIds = await getSectionWinnerIds(eventId, sectionId);
        // Check if user is already a winner
        if (!currentWinnerIds.includes(userId)) {
          const updatedWinnerIds = [...currentWinnerIds, userId];
          await setSectionWinners(eventId, sectionId, updatedWinnerIds);
          console.log("✅ [tagSelfInSection] Winner tag applied successfully");
        } else {
          console.log("✅ [tagSelfInSection] User is already a winner");
        }
      } else if (role === SECTION_ROLE_JUDGE) {
        // Get current judges and add this user to the list (don't remove existing judges)
        const currentJudgeIds = await getSectionJudgeIds(eventId, sectionId);
        // Check if user is already a judge
        if (!currentJudgeIds.includes(userId)) {
          const updatedJudgeIds = [...currentJudgeIds, userId];
          await setSectionJudges(eventId, sectionId, updatedJudgeIds);
          console.log("✅ [tagSelfInSection] Judge tag applied successfully");
        } else {
          console.log("✅ [tagSelfInSection] User is already a judge");
        }
      }
      return { success: true, directTag: true };
    } catch (error) {
      console.error("Error tagging self in section:", error);
      throw error;
    }
  } else {
    // User doesn't have permission - create a tagging request
    console.log(
      "🔵 [tagSelfInSection] User doesn't have permission, creating request..."
    );
    try {
      const result = await createTaggingRequest(
        eventId,
        undefined,
        sectionId,
        role
      );
      console.log(
        "✅ [tagSelfInSection] Request created successfully:",
        result.request.id
      );
      return { success: true, directTag: false };
    } catch (error) {
      console.error(
        "❌ [tagSelfInSection] Error creating tagging request:",
        error
      );
      throw error;
    }
  }
}

/**
 * Remove tag from video
 * Users can remove their own tags directly
 * Privileged users can remove any tags
 */
export async function removeTagFromVideo(
  eventId: string,
  videoId: string,
  userId: string
): Promise<{ success: true; directRemove: boolean }> {
  const currentUserId = await requireAuth();
  const session = await auth();

  // Validate event exists
  const eventExistsInNeo4j = await eventExists(eventId);
  if (!eventExistsInNeo4j) {
    throw new Error("Event not found");
  }

  // Validate video exists
  const videoExists = await videoExistsInEvent(eventId, videoId);
  if (!videoExists) {
    throw new Error("Video not found in this event");
  }

  // Check if user is tagged
  const isTagged = await isUserTaggedInVideo(eventId, videoId, userId);
  if (!isTagged) {
    throw new Error("User is not tagged in this video");
  }

  // Check permissions: users can remove their own tags, privileged users can remove any
  const authLevel = session?.user?.auth || 0;
  const canRemoveDirectly =
    currentUserId === userId || // User removing their own tag
    authLevel >= AUTH_LEVELS.MODERATOR || // Admins (3) and Super Admins (4) are included
    (await isTeamMember(eventId, currentUserId)) ||
    (await isEventCreator(eventId, currentUserId));

  if (canRemoveDirectly) {
    // User has permission - remove directly by setting empty roles
    try {
      await setVideoRoles(eventId, videoId, userId, []);
      return { success: true, directRemove: true };
    } catch (error) {
      console.error("Error removing tag from video:", error);
      throw error;
    }
  } else {
    // User trying to remove someone else's tag without permission
    throw new Error("You do not have permission to remove this tag");
  }
}

/**
 * Remove tag from section
 * Users can remove their own tags directly
 * Privileged users can remove any tags
 */
export async function removeTagFromSection(
  eventId: string,
  sectionId: string,
  userId: string
): Promise<{ success: true; directRemove: boolean }> {
  const currentUserId = await requireAuth();
  const session = await auth();

  // Validate event exists
  const eventExistsInNeo4j = await eventExists(eventId);
  if (!eventExistsInNeo4j) {
    throw new Error("Event not found");
  }

  // Validate section exists
  const sectionExists = await sectionExistsInEvent(eventId, sectionId);
  if (!sectionExists) {
    throw new Error("Section not found in this event");
  }

  // Check permissions: users can remove their own tags, privileged users can remove any
  const authLevel = session?.user?.auth || 0;
  const canRemoveDirectly =
    currentUserId === userId || // User removing their own tag
    authLevel >= AUTH_LEVELS.MODERATOR || // Admins (3) and Super Admins (4) are included
    (await isTeamMember(eventId, currentUserId)) ||
    (await isEventCreator(eventId, currentUserId));

  // Check if user is a winner
  const isWinner = await isUserWinnerOfSection(eventId, sectionId, userId);
  if (!isWinner) {
    throw new Error("User is not a winner of this section");
  }

  if (canRemoveDirectly) {
    // User has permission - get current winners, remove the specified one, and update
    try {
      const currentWinnerIds = await getSectionWinnerIds(eventId, sectionId);
      const updatedWinnerIds = currentWinnerIds.filter((id) => id !== userId);
      await setSectionWinners(eventId, sectionId, updatedWinnerIds);
      return { success: true, directRemove: true };
    } catch (error) {
      console.error("Error removing tag from section:", error);
      throw error;
    }
  } else {
    // User trying to remove someone else's tag without permission
    throw new Error("You do not have permission to remove this tag");
  }
}

/**
 * Remove judge tag from section
 * Users can remove their own tags directly
 * Privileged users can remove any tags
 */
export async function removeJudgeFromSection(
  eventId: string,
  sectionId: string,
  userId: string
): Promise<{ success: true; directRemove: boolean }> {
  const currentUserId = await requireAuth();
  const session = await auth();

  // Validate event exists
  const eventExistsInNeo4j = await eventExists(eventId);
  if (!eventExistsInNeo4j) {
    throw new Error("Event not found");
  }

  // Validate section exists
  const sectionExists = await sectionExistsInEvent(eventId, sectionId);
  if (!sectionExists) {
    throw new Error("Section not found in this event");
  }

  // Check if user is a judge
  const isJudge = await isUserJudgeOfSection(eventId, sectionId, userId);
  if (!isJudge) {
    throw new Error("User is not a judge of this section");
  }

  // Check permissions: users can remove their own tags, privileged users can remove any
  const authLevel = session?.user?.auth || 0;
  const canRemoveDirectly =
    currentUserId === userId || // User removing their own tag
    authLevel >= AUTH_LEVELS.MODERATOR || // Admins (3) and Super Admins (4) are included
    (await isTeamMember(eventId, currentUserId)) ||
    (await isEventCreator(eventId, currentUserId));

  if (canRemoveDirectly) {
    // User has permission - get current judges, remove the specified one, and update
    try {
      const currentJudgeIds = await getSectionJudgeIds(eventId, sectionId);
      const updatedJudgeIds = currentJudgeIds.filter((id) => id !== userId);
      await setSectionJudges(eventId, sectionId, updatedJudgeIds);
      return { success: true, directRemove: true };
    } catch (error) {
      console.error("Error removing judge from section:", error);
      throw error;
    }
  } else {
    // User trying to remove someone else's tag without permission
    throw new Error("You do not have permission to remove this tag");
  }
}

/**
 * Check if a user is a winner of a section
 * Server action wrapper for client components
 */
export async function checkUserWinnerOfSection(
  eventId: string,
  sectionId: string,
  userId: string
): Promise<boolean> {
  return await isUserWinnerOfSection(eventId, sectionId, userId);
}

/**
 * Check if a user is a judge of a section
 * Server action wrapper for client components
 */
export async function checkUserJudgeOfSection(
  eventId: string,
  sectionId: string,
  userId: string
): Promise<boolean> {
  return await isUserJudgeOfSection(eventId, sectionId, userId);
}

/**
 * Remove role from event
 * Users can remove their own roles directly
 * Privileged users can remove any roles
 */
export async function removeRoleFromEvent(
  eventId: string,
  userId: string,
  role: string
): Promise<{ success: true; directRemove: boolean }> {
  const currentUserId = await requireAuth();
  const session = await auth();

  // Validate event exists
  const eventExistsInNeo4j = await eventExists(eventId);
  if (!eventExistsInNeo4j) {
    throw new Error("Event not found");
  }

  // Validate role
  if (!isValidRole(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  // Check permissions: users can remove their own roles, privileged users can remove any
  const authLevel = session?.user?.auth || 0;
  const canRemoveDirectly =
    currentUserId === userId || // User removing their own role
    authLevel >= AUTH_LEVELS.MODERATOR || // Admins (3) and Super Admins (4) are included
    (await isTeamMember(eventId, currentUserId)) ||
    (await isEventCreator(eventId, currentUserId));

  if (canRemoveDirectly) {
    // User has permission - remove role directly
    try {
      await removeTag(eventId, null, null, userId, role);
      return { success: true, directRemove: true };
    } catch (error) {
      console.error("Error removing role from event:", error);
      throw error;
    }
  } else {
    // User trying to remove someone else's role without permission
    throw new Error("You do not have permission to remove this role");
  }
}

/**
 * Mark a user as winner of a video (for event editors)
 * Requires event editor permissions
 * Accepts either userId or username - if userId is not provided, looks up by username
 */
export async function markUserAsVideoWinner(
  eventId: string,
  videoId: string,
  userIdOrUsername: string,
  username?: string
): Promise<{ success: true }> {
  const editorId = await requireAuth();
  const session = await auth();

  // Check if user has permission to edit event
  const authLevel = session?.user?.auth || 0;
  const canEdit =
    authLevel >= AUTH_LEVELS.MODERATOR ||
    (await isTeamMember(eventId, editorId)) ||
    (await isEventCreator(eventId, editorId));

  if (!canEdit) {
    throw new Error(
      "You do not have permission to mark winners for this event"
    );
  }

  // Validate event and video exist
  const eventExistsInNeo4j = await eventExists(eventId);
  if (!eventExistsInNeo4j) {
    throw new Error("Event not found");
  }

  const videoExists = await videoExistsInEvent(eventId, videoId);
  if (!videoExists) {
    throw new Error("Video not found in this event");
  }

  // Winner tags are supported for battle and other videos
  const videoType = await getVideoType(videoId);
  if (videoType !== "battle" && videoType !== "other") {
    throw new Error(
      "Winner tags are only supported for battle and other videos"
    );
  }

  // Get userId - if username is provided, look up user by username
  // Otherwise, use userIdOrUsername as the userId (backward compatibility)
  let userId: string;
  if (username) {
    const user = await getUserByUsername(username);
    if (!user || !user.id) {
      throw new Error(`User not found with username: ${username}`);
    }
    userId = user.id;
  } else if (userIdOrUsername) {
    // Use provided userId (backward compatibility)
    userId = userIdOrUsername;
  } else {
    throw new Error("Either userId or username must be provided");
  }

  // Get existing roles for this user in this video
  const existingRoles: string[] = [];
  const isDancer = await isUserTaggedInVideoWithRole(
    eventId,
    videoId,
    userId,
    VIDEO_ROLE_DANCER
  );
  if (isDancer) {
    existingRoles.push(VIDEO_ROLE_DANCER);
  }

  // Set roles: DANCER and WINNER (setVideoRoles ensures DANCER is present if WINNER is specified)
  const rolesToSet = Array.from(
    new Set([...existingRoles, VIDEO_ROLE_DANCER, VIDEO_ROLE_WINNER])
  );
  await setVideoRoles(eventId, videoId, userId, rolesToSet);

  return { success: true };
}

/**
 * Mark a user as winner of a section (for event editors)
 * Requires event editor permissions
 * Accepts either userId or username - if userId is not provided, looks up by username
 */
export async function markUserAsSectionWinner(
  eventId: string,
  sectionId: string,
  userIdOrUsername: string,
  username?: string
): Promise<{ success: true }> {
  const editorId = await requireAuth();
  const session = await auth();

  // Check if user has permission to edit event
  const authLevel = session?.user?.auth || 0;
  const canEdit =
    authLevel >= AUTH_LEVELS.MODERATOR ||
    (await isTeamMember(eventId, editorId)) ||
    (await isEventCreator(eventId, editorId));

  if (!canEdit) {
    throw new Error(
      "You do not have permission to mark winners for this event"
    );
  }

  // Validate event and section exist
  const eventExistsInNeo4j = await eventExists(eventId);
  if (!eventExistsInNeo4j) {
    throw new Error("Event not found");
  }

  const sectionExists = await sectionExistsInEvent(eventId, sectionId);
  if (!sectionExists) {
    throw new Error("Section not found in this event");
  }

  // Get userId - if username is provided, look up user by username
  // Otherwise, use userIdOrUsername as the userId (backward compatibility)
  let userId: string;
  if (username) {
    const user = await getUserByUsername(username);
    if (!user || !user.id) {
      throw new Error(`User not found with username: ${username}`);
    }
    userId = user.id;
  } else if (userIdOrUsername) {
    // Use provided userId (backward compatibility)
    userId = userIdOrUsername;
  } else {
    throw new Error("Either userId or username must be provided");
  }

  // Get current winners and add this user to the list (don't remove existing winners)
  const currentWinnerIds = await getSectionWinnerIds(eventId, sectionId);
  if (!currentWinnerIds.includes(userId)) {
    const updatedWinnerIds = [...currentWinnerIds, userId];
    await setSectionWinners(eventId, sectionId, updatedWinnerIds);
  }

  return { success: true };
}

/**
 * Remove winner tag from a video (for event editors)
 * Requires event editor permissions
 */
export async function removeVideoWinnerTag(
  eventId: string,
  videoId: string,
  userId: string
): Promise<{ success: true }> {
  const editorId = await requireAuth();
  const session = await auth();

  // Check if user has permission to edit event
  const authLevel = session?.user?.auth || 0;
  const canEdit =
    authLevel >= AUTH_LEVELS.MODERATOR ||
    (await isTeamMember(eventId, editorId)) ||
    (await isEventCreator(eventId, editorId));

  if (!canEdit) {
    throw new Error(
      "You do not have permission to remove winner tags for this event"
    );
  }

  // Get existing roles and remove WINNER, keep DANCER
  const existingRoles: string[] = [];
  const isDancer = await isUserTaggedInVideoWithRole(
    eventId,
    videoId,
    userId,
    VIDEO_ROLE_DANCER
  );
  if (isDancer) {
    existingRoles.push(VIDEO_ROLE_DANCER);
  }
  // Don't add WINNER - we're removing it
  await setVideoRoles(eventId, videoId, userId, existingRoles);

  return { success: true };
}

/**
 * Remove winner tag from a section (for event editors)
 * Requires event editor permissions
 */
export async function removeSectionWinnerTag(
  eventId: string,
  sectionId: string
): Promise<{ success: true }> {
  const editorId = await requireAuth();
  const session = await auth();

  // Check if user has permission to edit event
  const authLevel = session?.user?.auth || 0;
  const canEdit =
    authLevel >= AUTH_LEVELS.MODERATOR ||
    (await isTeamMember(eventId, editorId)) ||
    (await isEventCreator(eventId, editorId));

  if (!canEdit) {
    throw new Error(
      "You do not have permission to remove winner tags for this event"
    );
  }

  await setSectionWinner(eventId, sectionId, null);

  return { success: true };
}

// ============================================================================
// Multi-user tagging helpers (verified users can tag anyone)
// ============================================================================

function ensureVerified(session: Session | null) {
  if (!session?.user?.accountVerified) {
    throw new Error("Only verified users can tag");
  }
}

async function isUserClaimed(userId: string): Promise<boolean> {
  const user = await getUser(userId).catch(() => null);
  if (!user) {
    return false;
  }
  return user.claimed !== false;
}

export async function tagUsersWithRole(
  eventId: string,
  userIds: string[],
  role: string
): Promise<{
  success: boolean;
  tagged: string[];
  failed: Array<{ userId: string; error: string }>;
}> {
  const session = await auth();
  ensureVerified(session);
  if (!isValidRole(role)) {
    throw new Error(
      `Invalid role: ${role}. Must be one of: ${AVAILABLE_ROLES.join(", ")}`
    );
  }
  const eventExistsInNeo4j = await eventExists(eventId);
  if (!eventExistsInNeo4j) {
    throw new Error("Event not found");
  }
  const eventTitle = (await getEventTitle(eventId)) || eventId;

  const uniqueUserIds = Array.from(new Set(userIds || []));
  const tagged: string[] = [];
  const failed: Array<{ userId: string; error: string }> = [];

  for (const uid of uniqueUserIds) {
    try {
      await setEventRoles(eventId, uid, role);
      const shouldNotify = await isUserClaimed(uid);
      if (shouldNotify) {
        await createTagNotification(uid, {
          eventId,
          eventTitle,
          role,
        });
      }
      tagged.push(uid);
    } catch (error) {
      failed.push({
        userId: uid,
        error: error instanceof Error ? error.message : "Failed to tag user",
      });
    }
  }

  return { success: failed.length === 0, tagged, failed };
}

export async function tagUsersInVideo(
  eventId: string,
  videoId: string,
  userIds: string[],
  role: string
): Promise<{
  success: boolean;
  tagged: string[];
  failed: Array<{ userId: string; error: string }>;
}> {
  const session = await auth();
  ensureVerified(session);
  if (!role) {
    throw new Error("Role is required for video tags");
  }
  const roleUpper = role.toUpperCase();
  const isValid =
    isValidVideoRole(role) ||
    roleUpper === "CHOREOGRAPHER" ||
    roleUpper === "TEACHER";
  if (!isValid) {
    throw new Error(`Invalid video role: ${role}`);
  }

  const eventExistsInNeo4j = await eventExists(eventId);
  if (!eventExistsInNeo4j) {
    throw new Error("Event not found");
  }
  const videoExists = await videoExistsInEvent(eventId, videoId);
  if (!videoExists) {
    throw new Error("Video not found in this event");
  }
  if (role === VIDEO_ROLE_WINNER) {
    const videoType = await getVideoType(videoId);
    if (videoType !== "battle" && videoType !== "other") {
      throw new Error(
        "Winner tags are only supported for battle and other videos"
      );
    }
  }
  const eventTitle = (await getEventTitle(eventId)) || eventId;
  const videoTitle = (await getVideoTitle(videoId)) || videoId;

  const uniqueUserIds = Array.from(new Set(userIds || []));
  const tagged: string[] = [];
  const failed: Array<{ userId: string; error: string }> = [];

  for (const uid of uniqueUserIds) {
    try {
      const rolesToTag = [role];
      if (role === VIDEO_ROLE_WINNER) {
        const isDancer = await isUserTaggedInVideoWithRole(
          eventId,
          videoId,
          uid,
          VIDEO_ROLE_DANCER
        );
        if (!isDancer) {
          rolesToTag.push(VIDEO_ROLE_DANCER);
        }
      }

      const existingRoles: string[] = [];
      for (const roleToCheck of [
        VIDEO_ROLE_DANCER,
        VIDEO_ROLE_WINNER,
        "Choreographer",
        "Teacher",
      ]) {
        const hasRole = await isUserTaggedInVideoWithRole(
          eventId,
          videoId,
          uid,
          roleToCheck
        );
        if (hasRole) existingRoles.push(roleToCheck);
      }

      const allRoles = Array.from(new Set([...existingRoles, ...rolesToTag]));
      await setVideoRoles(eventId, videoId, uid, allRoles);

      const shouldNotify = await isUserClaimed(uid);
      if (shouldNotify) {
        await createTagNotification(uid, {
          eventId,
          eventTitle,
          videoId,
          videoTitle,
          role: fromNeo4jRoleFormat(role) || role,
        });
      }
      tagged.push(uid);
    } catch (error) {
      failed.push({
        userId: uid,
        error: error instanceof Error ? error.message : "Failed to tag user",
      });
    }
  }

  return { success: failed.length === 0, tagged, failed };
}

export async function tagUsersInSection(
  eventId: string,
  sectionId: string,
  userIds: string[],
  role: string
): Promise<{
  success: boolean;
  tagged: string[];
  failed: Array<{ userId: string; error: string }>;
}> {
  const session = await auth();
  ensureVerified(session);
  if (!role) {
    throw new Error("Role is required for section tags");
  }
  if (!isValidSectionRole(role)) {
    throw new Error(
      `Invalid section role: ${role}. Must be: ${SECTION_ROLE_WINNER} or ${SECTION_ROLE_JUDGE}`
    );
  }
  const eventExistsInNeo4j = await eventExists(eventId);
  if (!eventExistsInNeo4j) {
    throw new Error("Event not found");
  }
  const sectionExists = await sectionExistsInEvent(eventId, sectionId);
  if (!sectionExists) {
    throw new Error("Section not found in this event");
  }
  const eventTitle = (await getEventTitle(eventId)) || eventId;

  const uniqueUserIds = Array.from(new Set(userIds || []));
  const tagged: string[] = [];
  const failed: Array<{ userId: string; error: string }> = [];

  for (const uid of uniqueUserIds) {
    try {
      if (role === SECTION_ROLE_WINNER) {
        const currentWinnerIds = await getSectionWinnerIds(eventId, sectionId);
        if (!currentWinnerIds.includes(uid)) {
          await setSectionWinners(eventId, sectionId, [
            ...currentWinnerIds,
            uid,
          ]);
        }
      } else if (role === SECTION_ROLE_JUDGE) {
        const currentJudgeIds = await getSectionJudgeIds(eventId, sectionId);
        if (!currentJudgeIds.includes(uid)) {
          await setSectionJudges(eventId, sectionId, [...currentJudgeIds, uid]);
        }
      }

      const shouldNotify = await isUserClaimed(uid);
      if (shouldNotify) {
        await createTagNotification(uid, {
          eventId,
          eventTitle,
          sectionId,
          role: fromNeo4jRoleFormat(role) || role,
        });
      }
      tagged.push(uid);
    } catch (error) {
      failed.push({
        userId: uid,
        error: error instanceof Error ? error.message : "Failed to tag user",
      });
    }
  }

  return { success: failed.length === 0, tagged, failed };
}

/**
 * Get pending tagging request for a user in a video
 * Returns the request if one exists, null otherwise
 */
export async function getPendingTagRequest(
  eventId: string,
  videoId?: string,
  userId?: string,
  sectionId?: string,
  role?: string
): Promise<{
  id: string;
  status: string;
  createdAt: Date;
} | null> {
  // If userId is not provided, use the authenticated user
  const targetUserId = userId || (await requireAuth());

  const whereClause: Prisma.TaggingRequestWhereInput = {
    eventId,
    senderId: targetUserId,
    targetUserId: targetUserId,
    status: "PENDING",
  };

  // Add videoId, sectionId, and role to the where clause if provided
  if (videoId !== undefined) {
    whereClause.videoId = videoId || null;
  }
  if (sectionId !== undefined) {
    whereClause.sectionId = sectionId || null;
  }
  if (role !== undefined) {
    whereClause.role = role || null;
  }

  const request = await prisma.taggingRequest.findFirst({
    where: whereClause,
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });

  return request;
}

/**
 * Get all pending tagging requests for an event for a user
 * Returns a map of role -> request for all pending requests
 * This is more efficient than calling getPendingTagRequest for each role individually
 */
export async function getAllPendingTagRequestsForEvent(
  eventId: string,
  userId?: string,
  roles?: string[]
): Promise<Map<string, { id: string; status: string; createdAt: Date }>> {
  const targetUserId = userId || (await requireAuth());

  const whereClause: Prisma.TaggingRequestWhereInput = {
    eventId,
    senderId: targetUserId,
    targetUserId: targetUserId,
    status: "PENDING",
    videoId: null,
    sectionId: null,
  };

  // If roles are provided, filter by them
  if (roles && roles.length > 0) {
    whereClause.role = { in: roles };
  }

  const requests = await prisma.taggingRequest.findMany({
    where: whereClause,
    select: {
      id: true,
      status: true,
      createdAt: true,
      role: true,
    },
  });

  // Convert to a Map for easy lookup
  const requestMap = new Map<
    string,
    { id: string; status: string; createdAt: Date }
  >();
  requests.forEach((request) => {
    if (request.role) {
      requestMap.set(request.role, {
        id: request.id,
        status: request.status,
        createdAt: request.createdAt,
      });
    }
  });

  return requestMap;
}
