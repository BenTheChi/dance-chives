import { NextRequest, NextResponse } from "next/server";
import {
  deleteSession,
  getSessionPictures,
  getSession as getSessionQuery,
  searchSessions,
  searchAccessibleSessions,
  getSessionCreator,
} from "@/db/queries/session";
import { auth } from "@/auth";
import { deleteFromGCloudStorage } from "@/lib/GCloud";
import { canDeleteSession } from "@/lib/utils/auth-utils";
import { isSessionTeamMember } from "@/db/queries/team-member";
import { AUTH_LEVELS } from "@/lib/utils/auth-utils";

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { message: "Session ID is required" },
      { status: 400 }
    );
  }

  try {
    // Check authorization - get session to check creator ID
    const sessionData = await getSessionQuery(id);
    if (!sessionData) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this session
    if (!session.user.auth) {
      return NextResponse.json(
        { message: "User authorization level not found" },
        { status: 403 }
      );
    }

    const sessionCreatorId = await getSessionCreator(id);
    if (!sessionCreatorId) {
      return NextResponse.json(
        { message: "Session creator not found" },
        { status: 500 }
      );
    }

    const isTeamMember = await isSessionTeamMember(id, session.user.id);

    const hasPermission = canDeleteSession(
      session.user.auth,
      {
        sessionId: id,
        sessionCreatorId: sessionCreatorId,
        isTeamMember: isTeamMember,
      },
      session.user.id
    );

    if (!hasPermission) {
      return NextResponse.json(
        { message: "You do not have permission to delete this session" },
        { status: 403 }
      );
    }

    // First delete all the pictures associated with the session
    const pictures = await getSessionPictures(id);

    await Promise.all(
      pictures.map(async (url) => {
        return deleteFromGCloudStorage(url);
      })
    );

    const result = await deleteSession(id);

    if (!result) {
      return NextResponse.json(
        { message: "Failed to delete session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Session deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to delete session" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const keyword = request.nextUrl.searchParams.get("keyword");
  const accessible = request.nextUrl.searchParams.get("accessible") === "true";

  try {
    if (accessible) {
      if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      const authLevel = session.user.auth || 0;
      const results = await searchAccessibleSessions(
        session.user.id,
        authLevel,
        keyword || undefined
      );

      return NextResponse.json({ data: results });
    } else {
      const results = await searchSessions(keyword || undefined);
      return NextResponse.json({ data: results });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to search sessions" },
      { status: 500 }
    );
  }
}

