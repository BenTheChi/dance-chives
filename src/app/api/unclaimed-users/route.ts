import { NextRequest, NextResponse } from "next/server";
import { createUnclaimedUser } from "@/lib/server_actions/auth_actions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const displayName = body?.displayName;
    const instagram = body?.instagram;

    const result = await createUnclaimedUser(displayName, instagram);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to create account" },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true, user: result.user });
  } catch (error) {
    console.error("Error creating unclaimed user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create account" },
      { status: 500 }
    );
  }
}


