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
  REQUEST_TYPES,
  RequestType,
} from "@/lib/utils/request-utils";
import { AUTH_LEVELS } from "@/lib/utils/auth-utils";
import {
  isTeamMember,
  addTeamMember,
  applyTag,
  getEventCityId,
  getUserTeamMemberships,
  eventExists,
  videoExistsInEvent,
  getEventTitle,
  getVideoTitle,
} from "@/db/queries/team-member";
import { isValidRole, AVAILABLE_ROLES } from "@/lib/utils/roles";

// ============================================================================
// Tagging Requests
// ============================================================================

export async function createTaggingRequest(
  eventId: string,
  videoId?: string,
  role?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Require either videoId or role, but not both
  if (!videoId && !role) {
    throw new Error("Either videoId or role must be provided");
  }

  if (videoId && role) {
    throw new Error("Cannot specify both videoId and role");
  }

  // Validate role if provided
  if (role && !isValidRole(role)) {
    throw new Error(
      `Invalid role: ${role}. Must be one of: ${AVAILABLE_ROLES.join(", ")}`
    );
  }

  const senderId = session.user.id;
  // Users can only tag themselves
  const targetUserId = senderId;

  // Validate event exists in Neo4j
  const eventExistsInNeo4j = await eventExists(eventId);
  if (!eventExistsInNeo4j) {
    throw new Error("Event not found");
  }

  // Validate video exists if provided
  if (videoId) {
    const videoExists = await videoExistsInEvent(eventId, videoId);
    if (!videoExists) {
      throw new Error("Video not found in this event");
    }
  }

  // Check if a pending request already exists
  const existingRequest = await prisma.taggingRequest.findFirst({
    where: {
      eventId,
      senderId,
      targetUserId,
      videoId: videoId || null,
      status: "PENDING",
    },
  });

  if (existingRequest) {
    throw new Error("A pending tagging request already exists");
  }

  // Create the request
  const request = await prisma.taggingRequest.create({
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

  // Get approvers and create notifications
  const eventCityId = await getEventCityId(eventId);
  const approvers = await getTaggingRequestApprovers(
    eventId,
    eventCityId || undefined
  );

  // Create notifications for approvers
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
    await createNotification(
      approverId,
      "INCOMING_REQUEST",
      "New Tagging Request",
      notificationMessage,
      REQUEST_TYPES.TAGGING,
      request.id
    );
  }

  return { success: true, request };
}

export async function approveTaggingRequest(
  requestId: string,
  message?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const approverId = session.user.id;

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

  // Check if already approved
  const existingApproval = await prisma.requestApproval.findFirst({
    where: {
      requestType: REQUEST_TYPES.TAGGING,
      requestId,
      approverId,
    },
  });

  if (existingApproval) {
    throw new Error("You have already responded to this request");
  }

  // Create approval record
  await prisma.requestApproval.create({
    data: {
      requestType: REQUEST_TYPES.TAGGING,
      requestId,
      approverId,
      approved: true,
      message,
    },
  });

  // Update request status to APPROVED
  await prisma.taggingRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED", updatedAt: new Date() },
  });

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
  await applyTag(
    request.eventId,
    request.videoId || null,
    request.targetUserId,
    request.role || undefined
  );

  return { success: true };
}

export async function denyTaggingRequest(requestId: string, message?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const approverId = session.user.id;

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

  const existingApproval = await prisma.requestApproval.findFirst({
    where: {
      requestType: REQUEST_TYPES.TAGGING,
      requestId,
      approverId,
    },
  });

  if (existingApproval) {
    throw new Error("You have already responded to this request");
  }

  await prisma.requestApproval.create({
    data: {
      requestType: REQUEST_TYPES.TAGGING,
      requestId,
      approverId,
      approved: false,
      message,
    },
  });

  await prisma.taggingRequest.update({
    where: { id: requestId },
    data: { status: "DENIED", updatedAt: new Date() },
  });

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
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const senderId = session.user.id;

  // Validate event exists in Neo4j
  const eventExistsInNeo4j = await eventExists(eventId);
  if (!eventExistsInNeo4j) {
    throw new Error("Event not found");
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
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const approverId = session.user.id;

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

  const existingApproval = await prisma.requestApproval.findFirst({
    where: {
      requestType: REQUEST_TYPES.TEAM_MEMBER,
      requestId,
      approverId,
    },
  });

  if (existingApproval) {
    throw new Error("You have already responded to this request");
  }

  await prisma.requestApproval.create({
    data: {
      requestType: REQUEST_TYPES.TEAM_MEMBER,
      requestId,
      approverId,
      approved: true,
      message,
    },
  });

  await prisma.teamMemberRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED", updatedAt: new Date() },
  });

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
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const approverId = session.user.id;

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

  const existingApproval = await prisma.requestApproval.findFirst({
    where: {
      requestType: REQUEST_TYPES.TEAM_MEMBER,
      requestId,
      approverId,
    },
  });

  if (existingApproval) {
    throw new Error("You have already responded to this request");
  }

  await prisma.requestApproval.create({
    data: {
      requestType: REQUEST_TYPES.TEAM_MEMBER,
      requestId,
      approverId,
      approved: false,
      message,
    },
  });

  await prisma.teamMemberRequest.update({
    where: { id: requestId },
    data: { status: "DENIED", updatedAt: new Date() },
  });

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

export async function createGlobalAccessRequest() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const senderId = session.user.id;

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
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const approverId = session.user.id;

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

  const existingApproval = await prisma.requestApproval.findFirst({
    where: {
      requestType: REQUEST_TYPES.GLOBAL_ACCESS,
      requestId,
      approverId,
    },
  });

  if (existingApproval) {
    throw new Error("You have already responded to this request");
  }

  await prisma.requestApproval.create({
    data: {
      requestType: REQUEST_TYPES.GLOBAL_ACCESS,
      requestId,
      approverId,
      approved: true,
      message,
    },
  });

  await prisma.globalAccessRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED", updatedAt: new Date() },
  });

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
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const approverId = session.user.id;

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

  const existingApproval = await prisma.requestApproval.findFirst({
    where: {
      requestType: REQUEST_TYPES.GLOBAL_ACCESS,
      requestId,
      approverId,
    },
  });

  if (existingApproval) {
    throw new Error("You have already responded to this request");
  }

  await prisma.requestApproval.create({
    data: {
      requestType: REQUEST_TYPES.GLOBAL_ACCESS,
      requestId,
      approverId,
      approved: false,
      message,
    },
  });

  await prisma.globalAccessRequest.update({
    where: { id: requestId },
    data: { status: "DENIED", updatedAt: new Date() },
  });

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
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const senderId = session.user.id;

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
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const approverId = session.user.id;

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

  const existingApproval = await prisma.requestApproval.findFirst({
    where: {
      requestType: REQUEST_TYPES.AUTH_LEVEL_CHANGE,
      requestId,
      approverId,
    },
  });

  if (existingApproval) {
    throw new Error("You have already responded to this request");
  }

  await prisma.requestApproval.create({
    data: {
      requestType: REQUEST_TYPES.AUTH_LEVEL_CHANGE,
      requestId,
      approverId,
      approved: true,
      message,
    },
  });

  await prisma.authLevelChangeRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED", updatedAt: new Date() },
  });

  // Update user's authorization level
  await prisma.user.update({
    where: { id: request.targetUserId },
    data: { auth: request.requestedLevel },
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
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const approverId = session.user.id;

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

  const existingApproval = await prisma.requestApproval.findFirst({
    where: {
      requestType: REQUEST_TYPES.AUTH_LEVEL_CHANGE,
      requestId,
      approverId,
    },
  });

  if (existingApproval) {
    throw new Error("You have already responded to this request");
  }

  await prisma.requestApproval.create({
    data: {
      requestType: REQUEST_TYPES.AUTH_LEVEL_CHANGE,
      requestId,
      approverId,
      approved: false,
      message,
    },
  });

  await prisma.authLevelChangeRequest.update({
    where: { id: requestId },
    data: { status: "DENIED", updatedAt: new Date() },
  });

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
// Fetch Requests
// ============================================================================

export async function getIncomingRequests() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const userId = session.user.id;

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
      };
    })
  );

  const canApproveTeamMember = await Promise.all(
    teamMemberRequests.map(async (req) => {
      const eventCityId = await getEventCityId(req.eventId);
      // Convert to string if needed (Neo4j may return number)
      const cityIdString = eventCityId ? String(eventCityId) : undefined;
      const eventTitle = await getEventTitle(req.eventId);
      return {
        request: {
          ...req,
          eventTitle: eventTitle || req.eventId,
        },
        canApprove: await canUserApproveRequest(
          userId,
          REQUEST_TYPES.TEAM_MEMBER,
          { eventId: req.eventId, eventCityId: cityIdString }
        ),
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
    tagging: canApproveTagging
      .filter((item) => item.canApprove)
      .map((item) => ({ ...item.request, type: "TAGGING" })),
    teamMember: canApproveTeamMember
      .filter((item) => item.canApprove)
      .map((item) => ({ ...item.request, type: "TEAM_MEMBER" })),
    globalAccess: canApproveGlobalAccess
      .filter((item) => item.canApprove)
      .map((item) => ({ ...item.request, type: "GLOBAL_ACCESS" })),
    authLevelChange: canApproveAuthLevel
      .filter((item) => item.canApprove)
      .map((item) => ({ ...item.request, type: "AUTH_LEVEL_CHANGE" })),
  };
}

export async function getOutgoingRequests() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const userId = session.user.id;

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
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  await prisma.notification.update({
    where: {
      id: notificationId,
      userId: session.user.id, // Ensure user owns the notification
    },
    data: { read: true },
  });

  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
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
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const userId = session.user.id;

  const [
    incomingRequests,
    outgoingRequests,
    notifications,
    userEvents,
    teamMemberships,
    user,
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
      },
    }),
  ]);

  return {
    user,
    incomingRequests,
    outgoingRequests,
    notifications,
    userEvents,
    teamMemberships,
  };
}
