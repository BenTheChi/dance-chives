"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/primsa";
import {
  getTaggingRequestApprovers,
  getTeamMemberRequestApprovers,
  getAuthLevelChangeRequestApprovers,
  canUserApproveRequest,
  createNotification,
  REQUEST_TYPES,
  RequestType,
} from "@/lib/utils/request-utils";
import {
  isTeamMember,
  addTeamMember,
  setVideoRoles,
  setSectionWinner,
  setSectionWinners,
  getSectionWinnerIds,
  applyTag, // Still needed for event roles (not part of this refactor)
  getUserTeamMemberships,
  eventExists,
  videoExistsInEvent,
  sectionExistsInEvent,
  isUserTaggedInVideo,
  isUserTaggedInVideoWithRole,
  isUserWinnerOfSection,
  getEventTitle,
  getVideoTitle,
  getEventCreator,
  isEventCreator,
  getEventTeamMembers,
} from "@/db/queries/team-member";
import driver from "@/db/driver";
import { getUser, getUserByUsername } from "@/db/queries/user";
import {
  isValidRole,
  AVAILABLE_ROLES,
  isValidVideoRole,
  isValidSectionRole,
  VIDEO_ROLE_DANCER,
  VIDEO_ROLE_WINNER,
  SECTION_ROLE_WINNER,
  fromNeo4jRoleFormat,
} from "@/lib/utils/roles";
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
    const eventTitle = await getEventTitle(eventId);
    const eventDisplayName = eventTitle || eventId;
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

    if (videoId) {
      const videoTitle = await getVideoTitle(videoId);
      const videoDisplayName = videoTitle || videoId;
      if (role === VIDEO_ROLE_WINNER) {
        // Check if there's a pending Dancer request
        const dancerRequest = await prisma.taggingRequest.findFirst({
          where: {
            eventId,
            senderId,
            targetUserId,
            videoId,
            role: VIDEO_ROLE_DANCER,
            status: "PENDING",
          },
        });
        if (dancerRequest) {
          notificationMessage = `${username} requesting tags for video ${videoDisplayName} as Winner and Dancer in event ${eventDisplayName}`;
        } else {
          notificationMessage = `${username} requesting tag for video ${videoDisplayName} with role ${role} in event ${eventDisplayName}`;
        }
      } else {
        notificationMessage = `${username} requesting tag for video ${videoDisplayName} with role ${role} in event ${eventDisplayName}${additionalContext}`;
      }
    } else if (sectionId) {
      notificationMessage = `${username} requesting tag for section with role ${role} in event ${eventDisplayName}`;
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

  // Validate video still exists if videoId is provided
  if (request.videoId) {
    const videoStillExists = await videoExistsInEvent(
      request.eventId,
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

  // Validate section still exists if sectionId is provided
  if (request.sectionId) {
    const sectionStillExists = await sectionExistsInEvent(
      request.eventId,
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
  let notificationMessage: string;
  if (request.videoId) {
    notificationMessage = `Your request to tag yourself in a video with role ${request.role} in event "${eventDisplayName}" has been approved`;
  } else if (request.sectionId) {
    notificationMessage = `Your request to tag yourself in a section with role ${request.role} in event "${eventDisplayName}" has been approved`;
  } else {
    notificationMessage = `Your request to tag yourself as ${request.role} in event "${eventDisplayName}" has been approved`;
  }

  await createNotification(
    request.senderId,
    "REQUEST_APPROVED",
    "Tagging Request Approved",
    notificationMessage,
    REQUEST_TYPES.TAGGING,
    requestId
  );

  // Apply the tag in Neo4j using declarative functions
  if (request.videoId && request.role) {
    // Get existing roles for this user in this video
    const existingRoles: string[] = [];
    for (const roleToCheck of [VIDEO_ROLE_DANCER, VIDEO_ROLE_WINNER]) {
      const hasRole = await isUserTaggedInVideoWithRole(
        request.eventId,
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
      request.eventId,
      request.videoId,
      request.targetUserId,
      rolesToSet
    );
  } else if (request.sectionId && request.role) {
    // Set section winner
    await setSectionWinner(
      request.eventId,
      request.sectionId,
      request.targetUserId
    );
  } else if (request.role) {
    // Event role - still use applyTag for event roles (not part of this refactor)
    // This would need to be handled separately if event roles also need refactoring
    throw new Error(
      "Event role tagging not yet refactored to use declarative approach"
    );
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

  const approvers = await getTeamMemberRequestApprovers(eventId);

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
  const canApproveTagging = await Promise.all(
    taggingRequests.map(async (req) => {
      const canApprove = await canUserApproveRequest(
        userId,
        REQUEST_TYPES.TAGGING,
        {
          eventId: req.eventId,
        }
      );

      // Fetch event, video, and section titles
      const eventTitle = await getEventTitle(req.eventId);
      const videoTitle = req.videoId ? await getVideoTitle(req.videoId) : null;

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

      return {
        request: {
          ...req,
          eventTitle: eventTitle || req.eventId,
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
      return {
        request: {
          ...req,
          eventTitle: eventTitle || req.eventId,
        },
        canApprove,
      };
    })
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
    tagging: canApproveTagging
      .filter((item) => item.canApprove)
      .map((item) => ({ ...item.request, type: "TAGGING" })),
    teamMember: canApproveTeamMember
      .filter((item) => item.canApprove)
      .map((item) => ({ ...item.request, type: "TEAM_MEMBER" })),
    authLevelChange: canApproveAuthLevel
      .filter((item) => item.canApprove)
      .map((item) => ({ ...item.request, type: "AUTH_LEVEL_CHANGE" })),
  };
}

export async function getOutgoingRequests() {
  const userId = await requireAuth();

  const [taggingRequests, teamMemberRequests, authLevelChangeRequests] =
    await Promise.all([
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

      return {
        ...req,
        type: "TAGGING",
        sectionTitle: sectionTitle || null,
        eventTitle: eventTitle || req.eventId,
        videoTitle: videoTitle || null,
        role: req.role ? fromNeo4jRoleFormat(req.role) || req.role : undefined,
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

  // Destructure to exclude id from being sent to client
  const { id, ...userWithoutId } = user || {};

  return {
    user: {
      ...userWithoutId,
      displayName: userProfile?.displayName || null, // Add displayName from Neo4j
      username: userProfile?.username || null, // Add username from Neo4j
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
      await applyTag(eventId, null, null, userId, role);
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

  // Validate video role
  if (!isValidVideoRole(role)) {
    throw new Error(`Invalid video role: ${role}`);
  }

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
  let rolesToTag = [role];
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
  const canTagDirectly =
    authLevel >= AUTH_LEVELS.MODERATOR || // Admins (3) and Super Admins (4) are included
    (await isTeamMember(eventId, userId)) ||
    (await isEventCreator(eventId, userId));

  if (canTagDirectly) {
    console.log("Applying tag in Neo4j");

    // User has permission - tag directly with specified role(s)
    try {
      // Get existing roles for this user in this video
      const existingRoles: string[] = [];
      for (const roleToCheck of [VIDEO_ROLE_DANCER, VIDEO_ROLE_WINNER]) {
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
      `Invalid section role: ${role}. Must be: ${SECTION_ROLE_WINNER}`
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
  const canTagDirectly =
    authLevel >= AUTH_LEVELS.MODERATOR || // Admins (3) and Super Admins (4) are included
    (await isTeamMember(eventId, userId)) ||
    (await isEventCreator(eventId, userId));

  if (canTagDirectly) {
    console.log("Applying section tag in Neo4j");

    // User has permission - tag directly with specified role
    // Get current winners and add this user to the list (don't remove existing winners)
    try {
      const currentWinnerIds = await getSectionWinnerIds(eventId, sectionId);
      // Check if user is already a winner
      if (!currentWinnerIds.includes(userId)) {
        const updatedWinnerIds = [...currentWinnerIds, userId];
        await setSectionWinners(eventId, sectionId, updatedWinnerIds);
        console.log("✅ [tagSelfInSection] Tag applied successfully");
      } else {
        console.log("✅ [tagSelfInSection] User is already a winner");
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

  if (canRemoveDirectly) {
    // User has permission - remove directly by setting winner to null
    try {
      await setSectionWinner(eventId, sectionId, null);
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
  sectionId: string,
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

  await setSectionWinner(eventId, sectionId, null);

  return { success: true };
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

  const whereClause: any = {
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
