import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/utils/api-auth";
import { prisma } from "@/lib/primsa";

const CACHE_CONTROL = "max-age=30";

type NotificationRecord = NonNullable<
  Awaited<ReturnType<typeof prisma.notification.findFirst>>
>;

export async function GET(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  return withApiAuth(
    request,
    { requireAuth: true },
    async (_request, session) => {
      try {
        const notification = await prisma.notification.findFirst({
          where: {
            id: params.notificationId,
            userId: session.user.id,
          },
        });

        if (!notification) {
          return NextResponse.json(
            { error: "Notification not found" },
            { status: 404 }
          );
        }

        const url = await computeNotificationUrl(notification);

        return NextResponse.json(
          { url },
          {
            headers: { "Cache-Control": CACHE_CONTROL },
          }
        );
      } catch (error) {
        console.error("Error fetching notification URL:", error);
        return NextResponse.json(
          { error: "Failed to fetch notification URL" },
          { status: 500 }
        );
      }
    }
  );
}

async function computeNotificationUrl(
  notification: NotificationRecord
): Promise<string | null> {
  if (
    notification.type === "INCOMING_REQUEST" &&
    notification.relatedRequestId
  ) {
    if (
      notification.relatedRequestType === "TAGGING" ||
      notification.relatedRequestType === "TEAM_MEMBER" ||
      notification.relatedRequestType === "OWNERSHIP" ||
      notification.relatedRequestType === "AUTH_LEVEL_CHANGE"
    ) {
      return "/dashboard#requests";
    }
  }

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

    if (request.videoId && request.sectionId) {
      return `/events/${request.eventId}/sections/${request.sectionId}?video=${request.videoId}`;
    }

    if (request.sectionId) {
      return `/events/${request.eventId}/sections/${request.sectionId}`;
    }

    return `/events/${request.eventId}`;
  }

  if (notification.type === "TAGGED") {
    const parts = notification.message.split("|");
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
        }

        if (sectionId) {
          return `/events/${eventId}/sections/${sectionId}`;
        }

        return `/events/${eventId}`;
      }
    }
  }

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

  if (notification.type === "OWNERSHIP_TRANSFERRED") {
    const parts = notification.message.split("|");
    if (parts.length > 1) {
      for (const part of parts.slice(1)) {
        if (part.startsWith("eventId:")) {
          const eventId = part.replace("eventId:", "");
          return `/events/${eventId}`;
        }
      }
    }
  }

  if (
    (notification.type === "OWNERSHIP_REQUESTED" ||
      notification.type === "OWNERSHIP_REQUEST_APPROVED" ||
      notification.type === "OWNERSHIP_REQUEST_DENIED") &&
    notification.relatedRequestId
  ) {
    const request = await prisma.ownershipRequest.findUnique({
      where: { id: notification.relatedRequestId },
      select: { eventId: true },
    });

    if (request?.eventId) {
      return `/events/${request.eventId}`;
    }

    const parts = notification.message.split("|");
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

