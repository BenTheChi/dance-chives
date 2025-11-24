import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/primsa";
import {
  createTaggingRequest,
  tagSelfWithRole,
  tagSelfInVideo,
} from "@/lib/server_actions/request_actions";
import driver from "@/db/driver";
import type { Session, Record } from "neo4j-driver";

interface TaggedUser {
  displayName: string | null;
  username: string | null;
  role: string | null;
  userId?: string | null;
}

interface VideoTaggedUser {
  videoId: string;
  videoTitle: string | null;
  eventId: string | null;
  sectionId: string | null;
  bracketId: string | null;
  taggedUsers: TaggedUser[];
}

/**
 * GET: Check tagging requests in database
 * POST: Test creating a tagging request
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get all tagging requests
    const allRequests = await prisma.taggingRequest.findMany({
      include: {
        sender: {
          select: { id: true, name: true, email: true, auth: true },
        },
        targetUser: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group by status
    const byStatus = {
      PENDING: allRequests.filter((r) => r.status === "PENDING"),
      APPROVED: allRequests.filter((r) => r.status === "APPROVED"),
      DENIED: allRequests.filter((r) => r.status === "DENIED"),
      CANCELLED: allRequests.filter((r) => r.status === "CANCELLED"),
    };

    // Get all tagged users in videos from Neo4j
    const neo4jSession: Session = driver.session();
    let videoTaggedUsers: VideoTaggedUser[] = [];
    try {
      // Query all videos with their tagged users and roles
      // First get all videos and their context (event, section, bracket)
      const videoTagsResult = await neo4jSession.run(
        `
        MATCH (v:Video)
        OPTIONAL MATCH (v)-[:IN]->(s:Section)-[:IN]->(e:Event)
        OPTIONAL MATCH (v)-[:IN]->(b:Bracket)-[:IN]->(s2:Section)-[:IN]->(e2:Event)
        WITH v, 
             COALESCE(e.id, e2.id) as eventId,
             COALESCE(s.id, s2.id) as sectionId,
             b.id as bracketId
        OPTIONAL MATCH (v)<-[r:IN]-(u:User)
        RETURN v.id as videoId,
               v.title as videoTitle,
               eventId,
               sectionId,
               bracketId,
               collect({
                 displayName: u.displayName,
                 username: u.username,
                 role: r.role
               }) as taggedUsers
        ORDER BY eventId, sectionId, videoId
        `
      );

      videoTaggedUsers = videoTagsResult.records.map((record: Record) => ({
        videoId: record.get("videoId"),
        videoTitle: record.get("videoTitle"),
        eventId: record.get("eventId"),
        sectionId: record.get("sectionId"),
        bracketId: record.get("bracketId"),
        taggedUsers: (record.get("taggedUsers") || []).filter(
          (tu: TaggedUser) => tu.userId !== null
        ),
      }));
    } catch (error) {
      console.error("Error fetching video tagged users from Neo4j:", error);
    } finally {
      await neo4jSession.close();
    }

    return NextResponse.json({
      success: true,
      total: allRequests.length,
      byStatus: {
        PENDING: byStatus.PENDING.length,
        APPROVED: byStatus.APPROVED.length,
        DENIED: byStatus.DENIED.length,
        CANCELLED: byStatus.CANCELLED.length,
      },
      recentPending: byStatus.PENDING.slice(0, 10).map((req) => ({
        id: req.id,
        eventId: req.eventId,
        videoId: req.videoId,
        role: req.role,
        sender: {
          name: req.sender.name,
          email: req.sender.email,
          auth: req.sender.auth,
        },
        targetUser: {
          name: req.targetUser.name,
          email: req.targetUser.email,
        },
        status: req.status,
        createdAt: req.createdAt,
      })),
      allRequests: allRequests.map((req) => ({
        id: req.id,
        eventId: req.eventId,
        videoId: req.videoId,
        role: req.role,
        senderId: req.senderId,
        targetUserId: req.targetUserId,
        status: req.status,
        createdAt: req.createdAt,
      })),
      videoTaggedUsers: {
        total: videoTaggedUsers.length,
        totalTaggedUsers: videoTaggedUsers.reduce(
          (sum, v) => sum + (v.taggedUsers?.length || 0),
          0
        ),
        videos: videoTaggedUsers,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/test/tagging-request:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, videoId, role, action } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      );
    }

    let result;
    if (action === "tagSelfWithRole") {
      if (!role) {
        return NextResponse.json(
          { error: "role is required for tagSelfWithRole" },
          { status: 400 }
        );
      }
      result = await tagSelfWithRole(eventId, role);
    } else if (action === "tagSelfInVideo") {
      if (!videoId) {
        return NextResponse.json(
          { error: "videoId is required for tagSelfInVideo" },
          { status: 400 }
        );
      }
      // Role is required - default to "Dancer" if not provided
      const videoRole = role || "Dancer";
      result = await tagSelfInVideo(eventId, videoId, videoRole);
    } else if (action === "createTaggingRequest") {
      result = await createTaggingRequest(eventId, videoId, undefined, role);
    } else {
      return NextResponse.json(
        {
          error:
            "Invalid action. Use: tagSelfWithRole, tagSelfInVideo, or createTaggingRequest",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error in POST /api/test/tagging-request:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
