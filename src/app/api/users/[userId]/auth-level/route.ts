import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/primsa";
import { AUTH_LEVELS } from "@/lib/utils/auth-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = resolvedParams.userId;

    // Users can check their own auth level, or Admins/SuperAdmins can check any user's level
    const userAuthLevel = session.user.auth || 0;
    const isOwnProfile = session.user.id === userId;
    const isAdmin = userAuthLevel >= AUTH_LEVELS.ADMIN;

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json(
        {
          error:
            "Insufficient permissions. You can only check your own authorization level.",
        },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        auth: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      authLevel: user.auth ?? 0,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Error fetching user auth level:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
