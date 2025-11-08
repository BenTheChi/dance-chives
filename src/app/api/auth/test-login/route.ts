import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/primsa";

/**
 * Test login endpoint - DEVELOPMENT ONLY
 * Allows logging in as any test user without OAuth
 * This simply validates the user exists and returns their info
 * The actual sign-in happens via NextAuth's credentials provider
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Test login only available in development" },
      { status: 403 }
    );
  }

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        auth: true,
        accountVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return user info so the client can call signIn
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        auth: user.auth,
        accountVerified: user.accountVerified,
      },
    });
  } catch (error) {
    console.error("Test login error:", error);
    return NextResponse.json(
      { error: "Failed to validate test user" },
      { status: 500 }
    );
  }
}
