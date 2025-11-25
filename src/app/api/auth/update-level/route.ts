import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/utils/api-auth";
import { AUTH_LEVELS } from "@/lib/utils/auth-utils";
import { updateUserAuthLevel } from "@/lib/server_actions/auth_actions";

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    { minAuthLevel: AUTH_LEVELS.ADMIN },
    async (request) => {
      try {
        const { userId, authLevel } = await request.json();

        if (!userId || authLevel === undefined) {
          return NextResponse.json(
            { error: "userId and authLevel are required" },
            { status: 400 }
          );
        }

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
  );
}
