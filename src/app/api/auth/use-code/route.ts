import { NextRequest, NextResponse } from "next/server";
import { useAuthCode } from "@/lib/server_actions/auth_actions";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Auth code is required" },
        { status: 400 }
      );
    }

    const result = await useAuthCode(code);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Auth code usage error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
