import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/primsa";

/**
 * GET: Fetch all pending tagging requests for an event for the authenticated user
 * Query params:
 *   - eventId: required, the event ID
 *   - sectionId: optional, the section ID (for section-level requests)
 *   - videoId: optional, the video ID (for video-level requests)
 *   - roles: optional, comma-separated list of roles to filter by
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const sectionId = searchParams.get("sectionId");
    const videoId = searchParams.get("videoId");
    const rolesParam = searchParams.get("roles");

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      );
    }

    const whereClause: any = {
      eventId,
      senderId: session.user.id,
      targetUserId: session.user.id,
      status: "PENDING",
    };

    // For event-level requests, videoId and sectionId should be null
    // For section-level requests, sectionId should be set
    // For video-level requests, videoId should be set
    if (sectionId) {
      whereClause.sectionId = sectionId;
      whereClause.videoId = null;
    } else if (videoId) {
      whereClause.videoId = videoId;
      whereClause.sectionId = null;
    } else {
      whereClause.videoId = null;
      whereClause.sectionId = null;
    }

    // If roles are provided, filter by them
    if (rolesParam) {
      const roles = rolesParam
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
      if (roles.length > 0) {
        whereClause.role = { in: roles };
      }
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

    // Convert to an object for JSON serialization (Map doesn't serialize well)
    const requestMap: Record<
      string,
      { id: string; status: string; createdAt: string }
    > = {};
    requests.forEach((request) => {
      if (request.role) {
        requestMap[request.role] = {
          id: request.id,
          status: request.status,
          createdAt: request.createdAt.toISOString(),
        };
      }
    });

    return NextResponse.json({ data: requestMap });
  } catch (error) {
    console.error("Error fetching pending tagging requests:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch pending requests",
      },
      { status: 500 }
    );
  }
}
