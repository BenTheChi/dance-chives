import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPendingInvitations } from "@/lib/server_actions/auth_actions";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Add admin check here if needed
    // if (session.user.auth < ADMIN_LEVEL) {
    //   return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    // }

    const result = await getPendingInvitations();

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Get invitations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
