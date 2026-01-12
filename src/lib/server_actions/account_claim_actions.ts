"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/primsa";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { executeAccountMerge } from "./auth_actions";
import { normalizeInstagramHandle } from "@/lib/utils/instagram";
import { getUserWithStyles } from "@/db/queries/user";
import { revalidatePath } from "next/cache";

const REQUEST_TYPE = "ACCOUNT_CLAIM";

async function requireAuthId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

async function getUserAuthLevel(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { auth: true },
  });
  return user?.auth ?? 0;
}

async function getUsernameById(userId: string): Promise<string | null> {
  const user = await getUserWithStyles(userId);
  return user?.username ?? null;
}

async function revalidateProfileForUser(userId: string) {
  const username = await getUsernameById(userId);
  if (username) {
    revalidatePath(`/profiles/${username}`);
  }
}

export async function getUserPendingAccountClaimRequest(userId?: string) {
  const senderId = userId || (await requireAuthId());
  const request = await prisma.accountClaimRequest.findFirst({
    where: { senderId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  return request;
}

export async function getPendingAccountClaimRequestCount(username: string) {
  return prisma.accountClaimRequest.count({
    where: {
      sender: {
        username,
      },
      status: "PENDING",
    },
  });
}

export async function getPendingAccountClaimRequestByUsername(
  username: string
) {
  const request = await prisma.accountClaimRequest.findFirst({
    where: {
      sender: {
        username,
      },
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
  });
  return request;
}

export async function createAccountClaimRequest(
  targetUserId: string,
  instagramHandle: string,
  tagCount: number,
  wipeRelationships: boolean = false
) {
  const senderId = await requireAuthId();
  const normalizedHandle = normalizeInstagramHandle(instagramHandle);

  // Prevent duplicate pending requests for same handle
  const existing = await prisma.accountClaimRequest.findFirst({
    where: {
      senderId,
      instagramHandle: normalizedHandle,
      status: "PENDING",
    },
  });
  if (existing) {
    return { success: true, request: existing, isExisting: true };
  }

  const request = await prisma.accountClaimRequest.create({
    data: {
      senderId,
      targetUserId,
      instagramHandle: normalizedHandle,
      tagCount,
      wipeRelationships,
    },
  });

  await revalidateProfileForUser(targetUserId);

  return { success: true, request, isExisting: false };
}

export async function cancelAccountClaimRequest(requestId: string) {
  const senderId = await requireAuthId();
  const request = await prisma.accountClaimRequest.findUnique({
    where: { id: requestId },
  });
  if (!request || request.senderId !== senderId) {
    throw new Error("Request not found or unauthorized");
  }
  if (request.status !== "PENDING") {
    throw new Error("Only pending requests can be cancelled");
  }
  await prisma.accountClaimRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED", updatedAt: new Date() },
  });
  await revalidateProfileForUser(request.targetUserId);
  return { success: true };
}

export async function approveAccountClaimRequest(
  requestId: string,
  message?: string
) {
  const approverId = await requireAuthId();
  const authLevel = await getUserAuthLevel(approverId);
  if (authLevel < AUTH_LEVELS.ADMIN) {
    throw new Error("You do not have permission to approve this request");
  }

  const request = await prisma.accountClaimRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) throw new Error("Request not found");
  if (request.status !== "PENDING") throw new Error("Request is not pending");

  // Update request status and create approval record BEFORE the merge,
  // because executeAccountMerge deletes the sender which cascades and deletes this request
  await prisma.accountClaimRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED", updatedAt: new Date() },
  });

  await prisma.requestApproval.create({
    data: {
      requestType: REQUEST_TYPE,
      requestId,
      approverId,
      approved: true,
      message,
    },
  });

  // Execute the merge (this deletes the sender user and the request via cascade)
  await executeAccountMerge({
    sourceUserId: request.senderId,
    targetUserId: request.targetUserId,
    wipeRelationships: request.wipeRelationships,
    targetInstagram: request.instagramHandle,
  });

  await revalidateProfileForUser(request.targetUserId);
  revalidatePath("/profiles");

  // Notify the target user (who now has the sender's auth credentials after merge)
  await prisma.notification.create({
    data: {
      userId: request.targetUserId,
      type: "REQUEST_APPROVED",
      title: "Account Claim Approved",
      message:
        "Your account claim request was approved and your accounts have been merged.",
      relatedRequestType: REQUEST_TYPE,
      relatedRequestId: requestId,
    },
  });

  return { success: true };
}

export async function denyAccountClaimRequest(
  requestId: string,
  message?: string
) {
  const approverId = await requireAuthId();
  const authLevel = await getUserAuthLevel(approverId);
  if (authLevel < AUTH_LEVELS.ADMIN) {
    throw new Error("You do not have permission to deny this request");
  }

  const request = await prisma.accountClaimRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) throw new Error("Request not found");
  if (request.status !== "PENDING") throw new Error("Request is not pending");

  await prisma.accountClaimRequest.update({
    where: { id: requestId },
    data: { status: "DENIED", updatedAt: new Date() },
  });

  await prisma.requestApproval.create({
    data: {
      requestType: REQUEST_TYPE,
      requestId,
      approverId,
      approved: false,
      message,
    },
  });

  await revalidateProfileForUser(request.targetUserId);

  await prisma.notification.create({
    data: {
      userId: request.senderId,
      type: "REQUEST_DENIED",
      title: "Account Claim Denied",
      message:
        "Your account claim request was denied. You may submit a new request after reviewing your details.",
      relatedRequestType: REQUEST_TYPE,
      relatedRequestId: requestId,
    },
  });

  return { success: true };
}
