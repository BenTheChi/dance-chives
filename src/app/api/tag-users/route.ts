import { NextRequest, NextResponse } from "next/server";
import {
  tagUsersWithRole,
  tagUsersInVideo,
  tagUsersInSection,
} from "@/lib/server_actions/request_actions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, videoId, sectionId, role, userIds } = body || {};

    if (!eventId || !role || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "eventId, role, and userIds are required" },
        { status: 400 }
      );
    }

    let result;
    if (videoId) {
      result = await tagUsersInVideo(eventId, videoId, userIds, role);
    } else if (sectionId) {
      result = await tagUsersInSection(eventId, sectionId, userIds, role);
    } else {
      result = await tagUsersWithRole(eventId, userIds, role);
    }

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error("Error tagging users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to tag users" },
      { status: 500 }
    );
  }
}


