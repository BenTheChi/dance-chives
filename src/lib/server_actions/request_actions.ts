"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/primsa";
import {
  getTaggingRequestApprovers,
  getTeamMemberRequestApprovers,
  getGlobalAccessRequestApprovers,
  getAuthLevelChangeRequestApprovers,
  canUserApproveRequest,
  createNotification,
  hasCityAccess,
  REQUEST_TYPES,
  RequestType,
} from "@/lib/utils/request-utils";
import {
  isTeamMember,
  addTeamMember,
  applyTag,
  removeTag,
  getEventCityId,
  getUserTeamMemberships,
  eventExists,
  videoExistsInEvent,
  isUserTaggedInVideo,
  getEventTitle,
  getVideoTitle,
  getCityName,
  getEventCreator,
  isEventCreator,
  getEventTeamMembers,
} from "@/db/queries/team-member";
import { getUser } from "@/db/queries/user";
import { isValidRole, AVAILABLE_ROLES } from "@/lib/utils/roles";
import { AUTH_LEVELS } from "@/lib/utils/auth-utils";

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
    case REQUEST_TYPES.GLOBAL_ACCESS:
      await prisma.globalAccessRequest.update({
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
    case REQUEST_TYPES.GLOBAL_ACCESS:
      request = await prisma.globalAccessRequest.findUnique({
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
  role?: string
) {
  console.log("🔵 [createTaggingRequest] Starting", { eventId, videoId, role });
  const senderId = await requireAuth();
  console.log("🔵 [createTaggingRequest] Authenticated user:", senderId);

  // Require either videoId or role, but not both
  if (!videoId && !role) {
    console.error("❌ [createTaggingRequest] Missing both videoId and role");
    throw new Error("Either videoId or role must be provided");
  }

  if (videoId && role) {
    console.error("❌ [createTaggingRequest] Both videoId and role provided");
    throw new Error("Cannot specify both videoId and role");
  }

  // Validate role if provided
  if (role && !isValidRole(role)) {
    console.error("❌ [createTaggingRequest] Invalid role:", role);
    throw new Error(
      `Invalid role: ${role}. Must be one of: ${AVAILABLE_ROLES.join(", ")}`
    );
  }

  // Users can only tag themselves
  const targetUserId = senderId;

  // Validate event exists in Neo4j
  console.log("🔵 [createTaggingRequest] Checking if event exists...");
  const eventExistsInNeo4j = await eventExists(eventId);
  if (!eventExistsInNeo4j) {
    console.error("❌ [createTaggingRequest] Event not found:", eventId);
    throw new Error("Event not found");
  }
  console.log("✅ [createTaggingRequest] Event exists");

  // Validate video exists if provided
  if (videoId) {
    console.log("🔵 [createTaggingRequest] Checking if video exists...");
    const videoExists = await videoExistsInEvent(eventId, videoId);
    if (!videoExists) {
      console.error("❌ [createTaggingRequest] Video not found:", videoId);
      throw new Error("Video not found in this event");
    }
    console.log("✅ [createTaggingRequest] Video exists");

    // Check if user is already tagged in the video
    console.log("🔵 [createTaggingRequest] Checking if user already tagged...");
    const alreadyTagged = await isUserTaggedInVideo(
      eventId,
      videoId,
      targetUserId
    );
    if (alreadyTagged) {
      console.error("❌ [createTaggingRequest] User already tagged");
      throw new Error("You are already tagged in this video");
    }
    console.log("✅ [createTaggingRequest] User not already tagged");
  }

  // Check if a pending request already exists
  console.log("🔵 [createTaggingRequest] Checking for existing requests...");
  const existingRequest = await prisma.taggingRequest.findFirst({
    where: {
      eventId,
      senderId,
      targetUserId,
      videoId: videoId || null,
      role: role || null,
      status: "PENDING",
    },
  });

  if (existingRequest) {
    console.error(
      "❌ [createTaggingRequest] Pending request already exists:",
      existingRequest.id
    );
    throw new Error("A pending tagging request already exists");
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

  // Get approvers and create notifications
  console.log("🔵 [createTaggingRequest] Getting event city ID...");
  let eventCityId;
  try {
    eventCityId = await getEventCityId(eventId);
    console.log("✅ [createTaggingRequest] Event city ID:", eventCityId);
  } catch (error) {
    console.error(
      "⚠️ [createTaggingRequest] Error getting city ID (continuing):",
      error
    );
    eventCityId = null;
  }

  console.log("🔵 [createTaggingRequest] Getting approvers...");
  let approvers: string[] = [];
  try {
    approvers = await getTaggingRequestApprovers(
      eventId,
      eventCityId || undefined
    );
    console.log("✅ [createTaggingRequest] Approvers found:", approvers.length);
  } catch (error) {
    console.error("❌ [createTaggingRequest] Error getting approvers:", error);
    // Don't fail the request creation if approvers can't be found
    approvers = [];
  }

  // Create notifications for approvers
  console.log("🔵 [createTaggingRequest] Creating notifications...");
  try {
    const eventTitle = await getEventTitle(eventId);
    const eventDisplayName = eventTitle || eventId;
    const username = request.sender.name || request.sender.email;

    let notificationMessage: string;
    if (videoId) {
      const videoTitle = await getVideoTitle(videoId);
      const videoDisplayName = videoTitle || videoId;
      notificationMessage = `${username} requesting tag for video ${videoDisplayName} in event ${eventDisplayName}`;
    } else {
      // role is guaranteed to exist here due to validation above
      notificationMessage = `${username} requesting tag for role ${role} in event ${eventDisplayName}`;
    }

    for (const approverId of approvers) {
      try {
        await createNotification(
          approverId,
          "INCOMING_REQUEST",
          "New Tagging Request",
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

  console.log("✅ [createTaggingRequest] Successfully completed");
  return { success: true, request };
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

  // Ensure request has either videoId or role (general tagging requests are not allowed)
  if (!request.videoId && !request.role) {
    throw new Error(
      "Invalid tagging request: must have either videoId or role"
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

  // Validate video still exists if videoId is provided
  if (request.videoId) {
    const videoStillExists = await videoExistsInEvent(
      request.eventId,
      request.videoId
    );
    if (!videoStillExists) {
      throw new Error("Video no longer exists in this event");
    }
  }

  // Check if user can approve
  const canApprove = await canUserApproveRequest(
    approverId,
    REQUEST_TYPES.TAGGING,
    {
      eventId: request.eventId,
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

  // Create notification for sender
  const eventTitle = await getEventTitle(request.eventId);
  const eventDisplayName = eventTitle || request.eventId;
  const notificationMessage = request.videoId
    ? `Your request to tag yourself in a video in event "${eventDisplayName}" has been approved`
    : `Your request to tag yourself as ${request.role} in event "${eventDisplayName}" has been approved`;

  await createNotification(
    request.senderId,
    "REQUEST_APPROVED",
    "Tagging Request Approved",
    notificationMessage,
    REQUEST_TYPES.TAGGING,
    requestId
  );

  // Apply the tag in Neo4j
  // For video requests, default to "Dancer" role if no role specified
  const roleToApply = request.videoId ? request.role || "Dancer" : request.role;

  await applyTag(
    request.eventId,
    request.videoId || null,
    request.targetUserId,
    roleToApply || undefined
  );

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

  // Ensure request has either videoId or role (general tagging requests are not allowed)
  if (!request.videoId && !request.role) {
    throw new Error(
      "Invalid tagging request: must have either videoId or role"
    );
  }

  if (request.status !== "PENDING") {
    throw new Error("Request is not pending");
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

  const eventTitle = await getEventTitle(request.eventId);
  const eventDisplayName = eventTitle || request.eventId;
  const notificationMessage = request.videoId
    ? `Your request to tag yourself in a video in event "${eventDisplayName}" has been denied`
    : `Your request to tag yourself as ${request.role} in event "${eventDisplayName}" has been denied`;

  await createNotification(
    request.senderId,
    "REQUEST_DENIED",
    "Tagging Request Denied",
    notificationMessage,
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

  const eventCityId = await getEventCityId(eventId);
  const approvers = await getTeamMemberRequestApprovers(
    eventId,
    eventCityId || undefined
  );

  for (const approverId of approvers) {
    await createNotification(
      approverId,
      "INCOMING_REQUEST",
      "New Team Member Request",
      `${
        request.sender.name || request.sender.email
      } wants to join as a team member`,
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

  await createNotification(
    request.senderId,
    "TEAM_MEMBER_ADDED",
    "Team Member Request Approved",
    `You have been added as a team member`,
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

  await createNotification(
    request.senderId,
    "REQUEST_DENIED",
    "Team Member Request Denied",
    `Your team member request has been denied`,
    REQUEST_TYPES.TEAM_MEMBER,
    requestId
  );

  return { success: true };
}

// ============================================================================
// Global Access Requests
// ============================================================================

export async function createGlobalAccessRequest(message: string) {
  const senderId = await requireAuth();

  if (!message || message.trim().length === 0) {
    throw new Error("Message is required for global access requests");
  }

  // Check if user is creator or moderator
  const user = await prisma.user.findUnique({
    where: { id: senderId },
    select: { auth: true },
  });

  if (!user?.auth || user.auth < AUTH_LEVELS.CREATOR) {
    throw new Error("Only creators and moderators can request global access");
  }

  // Check if user already has global access
  const hasGlobal = await prisma.user.findUnique({
    where: { id: senderId },
    select: { auth: true, allCityAccess: true },
  });

  if (hasGlobal?.auth && hasGlobal.auth >= AUTH_LEVELS.ADMIN) {
    throw new Error("Admins already have global access by default");
  }

  if (hasGlobal?.allCityAccess) {
    throw new Error("You already have global access");
  }

  // Check if a pending request already exists
  const existingRequest = await prisma.globalAccessRequest.findFirst({
    where: {
      senderId,
      status: "PENDING",
    },
  });

  if (existingRequest) {
    throw new Error("A pending global access request already exists");
  }

  const request = await prisma.globalAccessRequest.create({
    data: {
      senderId,
      message: message.trim(),
      status: "PENDING",
    },
    include: {
      sender: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const approvers = await getGlobalAccessRequestApprovers();

  for (const approverId of approvers) {
    await createNotification(
      approverId,
      "INCOMING_REQUEST",
      "New Global Access Request",
      `${
        request.sender.name || request.sender.email
      } is requesting global access`,
      REQUEST_TYPES.GLOBAL_ACCESS,
      request.id
    );
  }

  return { success: true, request };
}

export async function approveGlobalAccessRequest(
  requestId: string,
  message?: string
) {
  const approverId = await requireAuth();

  const request = await prisma.globalAccessRequest.findUnique({
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
    REQUEST_TYPES.GLOBAL_ACCESS
  );

  if (!canApprove) {
    throw new Error("You do not have permission to approve this request");
  }

  if (
    await hasUserResponded(REQUEST_TYPES.GLOBAL_ACCESS, requestId, approverId)
  ) {
    throw new Error("You have already responded to this request");
  }

  await createApprovalRecord(
    REQUEST_TYPES.GLOBAL_ACCESS,
    requestId,
    approverId,
    true,
    message
  );

  await updateRequestStatus(REQUEST_TYPES.GLOBAL_ACCESS, requestId, "APPROVED");

  // Grant global access
  await prisma.user.update({
    where: { id: request.senderId },
    data: { allCityAccess: true },
  });

  await createNotification(
    request.senderId,
    "GLOBAL_ACCESS_GRANTED",
    "Global Access Request Approved",
    `Your global access request has been approved`,
    REQUEST_TYPES.GLOBAL_ACCESS,
    requestId
  );

  return { success: true };
}

export async function denyGlobalAccessRequest(
  requestId: string,
  message?: string
) {
  const approverId = await requireAuth();

  const request = await prisma.globalAccessRequest.findUnique({
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
    REQUEST_TYPES.GLOBAL_ACCESS
  );

  if (!canApprove) {
    throw new Error("You do not have permission to deny this request");
  }

  if (
    await hasUserResponded(REQUEST_TYPES.GLOBAL_ACCESS, requestId, approverId)
  ) {
    throw new Error("You have already responded to this request");
  }

  await createApprovalRecord(
    REQUEST_TYPES.GLOBAL_ACCESS,
    requestId,
    approverId,
    false,
    message
  );

  await updateRequestStatus(REQUEST_TYPES.GLOBAL_ACCESS, requestId, "DENIED");

  await createNotification(
    request.senderId,
    "REQUEST_DENIED",
    "Global Access Request Denied",
    `Your global access request has been denied`,
    REQUEST_TYPES.GLOBAL_ACCESS,
    requestId
  );

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

  // Admins and SuperAdmins always have allCityAccess
  const shouldHaveAllCityAccess = request.requestedLevel >= AUTH_LEVELS.ADMIN;

  // Update user's authorization level
  await prisma.user.update({
    where: { id: request.targetUserId },
    data: {
      auth: request.requestedLevel,
      allCityAccess: shouldHaveAllCityAccess,
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

export async function cancelGlobalAccessRequest(requestId: string) {
  const userId = await requireAuth();
  await cancelRequest(REQUEST_TYPES.GLOBAL_ACCESS, requestId, userId);
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

  const globalAccessRequests = await prisma.globalAccessRequest.findMany({
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

  // Filter requests user can approve and enrich with event/video info
  // Also filter by city access level - users should only see requests for cities they have access to
  const canApproveTagging = await Promise.all(
    taggingRequests.map(async (req) => {
      const eventCityId = await getEventCityId(req.eventId);
      // Convert to string if needed (Neo4j may return number)
      const cityIdString = eventCityId ? String(eventCityId) : undefined;
      const canApprove = await canUserApproveRequest(
        userId,
        REQUEST_TYPES.TAGGING,
        {
          eventId: req.eventId,
          eventCityId: cityIdString,
        }
      );

      // Check city access - user must have access to the event's city
      // Exception: event creators and team members can see requests for their events regardless of city access
      let hasAccess = false;

      // Check if user is specifically a creator or team member (not just an admin who can approve)
      const creatorId = await getEventCreator(req.eventId);
      const teamMembers = await getEventTeamMembers(req.eventId);
      const isCreatorOrTeamMember =
        creatorId === userId || teamMembers.includes(userId);

      if (isCreatorOrTeamMember) {
        // Event creators and team members have implicit access to their events
        hasAccess = true;
      } else if (cityIdString) {
        // For others, check city access
        hasAccess = await hasCityAccess(userId, cityIdString);
      } else {
        // If no city ID, only show to admins (who have allCityAccess)
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { auth: true },
        });
        hasAccess = user?.auth && user.auth >= AUTH_LEVELS.ADMIN ? true : false;
      }

      // Fetch event and video titles
      const eventTitle = await getEventTitle(req.eventId);
      const videoTitle = req.videoId ? await getVideoTitle(req.videoId) : null;

      return {
        request: {
          ...req,
          eventTitle: eventTitle || req.eventId,
          videoTitle: videoTitle || null,
        },
        canApprove,
        hasCityAccess: hasAccess,
      };
    })
  );

  const canApproveTeamMember = await Promise.all(
    teamMemberRequests.map(async (req) => {
      const eventCityId = await getEventCityId(req.eventId);
      // Convert to string if needed (Neo4j may return number)
      const cityIdString = eventCityId ? String(eventCityId) : undefined;
      const canApprove = await canUserApproveRequest(
        userId,
        REQUEST_TYPES.TEAM_MEMBER,
        { eventId: req.eventId, eventCityId: cityIdString }
      );

      // Check city access - user must have access to the event's city
      // Exception: event creators and team members can see requests for their events regardless of city access
      let hasAccess = false;

      // Check if user is specifically a creator or team member (not just an admin who can approve)
      const creatorId = await getEventCreator(req.eventId);
      const teamMembers = await getEventTeamMembers(req.eventId);
      const isCreatorOrTeamMember =
        creatorId === userId || teamMembers.includes(userId);

      if (isCreatorOrTeamMember) {
        // Event creators and team members have implicit access to their events
        hasAccess = true;
      } else if (cityIdString) {
        // For others, check city access
        hasAccess = await hasCityAccess(userId, cityIdString);
      } else {
        // If no city ID, only show to admins (who have allCityAccess)
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { auth: true },
        });
        hasAccess = user?.auth && user.auth >= AUTH_LEVELS.ADMIN ? true : false;
      }

      const eventTitle = await getEventTitle(req.eventId);
      return {
        request: {
          ...req,
          eventTitle: eventTitle || req.eventId,
        },
        canApprove,
        hasCityAccess: hasAccess,
      };
    })
  );

  const canApproveGlobalAccess = await Promise.all(
    globalAccessRequests.map(async (req) => ({
      request: req,
      canApprove: await canUserApproveRequest(
        userId,
        REQUEST_TYPES.GLOBAL_ACCESS
      ),
    }))
  );

  const canApproveAuthLevel = await Promise.all(
    authLevelChangeRequests.map(async (req) => ({
      request: req,
      canApprove: await canUserApproveRequest(
        userId,
        REQUEST_TYPES.AUTH_LEVEL_CHANGE
      ),
    }))
  );

  return {
    // Filter by both canApprove AND city access for event-based requests
    tagging: canApproveTagging
      .filter((item) => item.canApprove && item.hasCityAccess)
      .map((item) => ({ ...item.request, type: "TAGGING" })),
    teamMember: canApproveTeamMember
      .filter((item) => item.canApprove && item.hasCityAccess)
      .map((item) => ({ ...item.request, type: "TEAM_MEMBER" })),
    // Global access and auth level change requests are admin-only (they have allCityAccess by default)
    globalAccess: canApproveGlobalAccess
      .filter((item) => item.canApprove)
      .map((item) => ({ ...item.request, type: "GLOBAL_ACCESS" })),
    authLevelChange: canApproveAuthLevel
      .filter((item) => item.canApprove)
      .map((item) => ({ ...item.request, type: "AUTH_LEVEL_CHANGE" })),
  };
}

export async function getOutgoingRequests() {
  const userId = await requireAuth();

  const [
    taggingRequests,
    teamMemberRequests,
    globalAccessRequests,
    authLevelChangeRequests,
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
    prisma.globalAccessRequest.findMany({
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
  ]);

  // Enrich tagging requests with event and video titles
  const enrichedTaggingRequests = await Promise.all(
    taggingRequests.map(async (req) => {
      const eventTitle = await getEventTitle(req.eventId);
      const videoTitle = req.videoId ? await getVideoTitle(req.videoId) : null;
      return {
        ...req,
        type: "TAGGING",
        eventTitle: eventTitle || req.eventId,
        videoTitle: videoTitle || null,
      };
    })
  );

  // Enrich team member requests with event titles
  const enrichedTeamMemberRequests = await Promise.all(
    teamMemberRequests.map(async (req) => {
      const eventTitle = await getEventTitle(req.eventId);
      return {
        ...req,
        type: "TEAM_MEMBER",
        eventTitle: eventTitle || req.eventId,
      };
    })
  );

  return {
    tagging: enrichedTaggingRequests,
    teamMember: enrichedTeamMemberRequests,
    globalAccess: globalAccessRequests.map((req) => ({
      ...req,
      type: "GLOBAL_ACCESS",
    })),
    authLevelChange: authLevelChangeRequests.map((req) => ({
      ...req,
      type: "AUTH_LEVEL_CHANGE",
    })),
  };
}

// ============================================================================
// Notifications
// ============================================================================

export async function getNotifications(limit: number = 50) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return notifications;
}

export async function markNotificationAsRead(notificationId: string) {
  const userId = await requireAuth();

  await prisma.notification.update({
    where: {
      id: notificationId,
      userId, // Ensure user owns the notification
    },
    data: { read: true },
  });

  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const userId = await requireAuth();

  await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: { read: true },
  });

  return { success: true };
}

export async function getUnreadNotificationCount() {
  const session = await auth();
  if (!session?.user?.id) {
    return 0;
  }

  const count = await prisma.notification.count({
    where: {
      userId: session.user.id,
      read: false,
    },
  });

  return count;
}

// ============================================================================
// Dashboard Data
// ============================================================================

export async function getDashboardData() {
  const userId = await requireAuth();

  const [
    incomingRequests,
    outgoingRequests,
    notifications,
    userEventsRaw,
    teamMemberships,
    user,
    userProfile,
  ] = await Promise.all([
    getIncomingRequests(),
    getOutgoingRequests(),
    getNotifications(10),
    prisma.event.findMany({
      where: { userId, creator: true },
      take: 10,
    }),
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
        allCityAccess: true,
        city: {
          select: { id: true, cityId: true },
        },
      },
    }),
    getUser(userId).catch(() => null), // Get displayName from Neo4j
  ]);

  // Fetch event titles and creation dates from Neo4j for user events
  const userEvents = await Promise.all(
    userEventsRaw.map(async (event) => {
      const eventData = await getEventTitle(event.eventId, true);
      return {
        ...event,
        eventTitle: eventData.title || "Untitled Event",
        createdAt: eventData.createdAt,
      };
    })
  );

  // Fetch city name from Neo4j if city exists
  // Note: City is required at application level (enforced by seed data and user creation)
  let cityName: string | null = null;
  if (user?.city) {
    cityName = await getCityName(user.city.cityId);
  } else {
    // Log warning if user doesn't have a city (should not happen in production)
    console.warn(
      `User ${userId} does not have a city assigned. This should be handled during user creation.`
    );
  }

  // Destructure to exclude id from being sent to client
  const { id, ...userWithoutId } = user || {};

  return {
    user: {
      ...userWithoutId,
      displayName: userProfile?.displayName || null, // Add displayName from Neo4j
      username: userProfile?.username || null, // Add username from Neo4j
      city: user?.city
        ? {
            ...user.city,
            name: cityName || user.city.cityId, // Fallback to cityId if name not found
          }
        : null,
    },
    incomingRequests,
    outgoingRequests,
    notifications,
    userEvents,
    teamMemberships,
  };
}

/**
 * Tag self with a role in an event
 * If user has permission (admin, super admin, moderator, event creator, or team member), tags directly
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

  // Check if user has permission to tag directly
  const authLevel = session?.user?.auth || 0;
  const canTagDirectly =
    authLevel >= AUTH_LEVELS.MODERATOR || // Admins (3) and Super Admins (4) are included
    (await isTeamMember(eventId, userId)) ||
    (await isEventCreator(eventId, userId));

  if (canTagDirectly) {
    // User has permission - tag directly
    try {
      await applyTag(eventId, null, userId, role);
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
      const result = await createTaggingRequest(eventId, undefined, role);
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
 */
export async function tagSelfInVideo(
  eventId: string,
  videoId: string
): Promise<{ success: true; directTag: boolean }> {
  const userId = await requireAuth();
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

  // Check if user is already tagged
  const alreadyTagged = await isUserTaggedInVideo(eventId, videoId, userId);
  if (alreadyTagged) {
    throw new Error("You are already tagged in this video");
  }

  // Check if user has permission to tag directly
  const authLevel = session?.user?.auth || 0;
  const canTagDirectly =
    authLevel >= AUTH_LEVELS.MODERATOR || // Admins (3) and Super Admins (4) are included
    (await isTeamMember(eventId, userId)) ||
    (await isEventCreator(eventId, userId));

  if (canTagDirectly) {
    console.log("Applying tag in Neo4j");

    // User has permission - tag directly with "Dancer" role
    try {
      const result = await applyTag(eventId, videoId, userId, "Dancer");
      console.log("✅ [tagSelfInVideo] Tag applied successfully:", result);
      return { success: true, directTag: true };
    } catch (error) {
      console.error("Error tagging self in video:", error);
      throw error;
    }
  } else {
    // User doesn't have permission - create a tagging request
    console.log(
      "🔵 [tagSelfInVideo] User doesn't have permission, creating request..."
    );
    try {
      const result = await createTaggingRequest(eventId, videoId);
      console.log(
        "✅ [tagSelfInVideo] Request created successfully:",
        result.request.id
      );
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
    // User has permission - remove directly
    try {
      await removeTag(eventId, videoId, userId);
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
 * Get pending tagging request for a user in a video
 * Returns the request if one exists, null otherwise
 */
export async function getPendingTagRequest(
  eventId: string,
  videoId: string,
  userId: string
): Promise<{
  id: string;
  status: string;
  createdAt: Date;
} | null> {
  const request = await prisma.taggingRequest.findFirst({
    where: {
      eventId,
      videoId,
      senderId: userId,
      targetUserId: userId,
      status: "PENDING",
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });

  return request;
}
