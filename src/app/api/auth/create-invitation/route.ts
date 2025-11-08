import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createInvitation } from "@/lib/server_actions/auth_actions";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, authLevel, expiresInDays } = await request.json();

    if (!email || authLevel === undefined) {
      return NextResponse.json(
        {
          error: "email and authLevel are required",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Add admin check here if needed
    // if (session.user.auth < ADMIN_LEVEL) {
    //   return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    // }

    const result = await createInvitation(email, authLevel, expiresInDays);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Invitation creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
