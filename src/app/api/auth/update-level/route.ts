import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateUserAuthLevel } from "@/lib/server_actions/auth_actions";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, authLevel } = await request.json();

    if (!userId || authLevel === undefined) {
      return NextResponse.json(
        { error: "userId and authLevel are required" },
        { status: 400 }
      );
    }

    // Add admin check here if needed
    // if (session.user.auth < ADMIN_LEVEL) {
    //   return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    // }

    const result = await updateUserAuthLevel(userId, authLevel);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Auth level update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
