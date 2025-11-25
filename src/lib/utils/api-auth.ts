import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAccountVerified } from "./auth-utils";
import type { Session } from "next-auth";

/**
 * Options for API route authentication and authorization
 */
export interface ApiAuthOptions {
  /**
   * Require user to be authenticated (default: true)
   */
  requireAuth?: boolean;
  /**
   * Require user to have completed account verification (default: false)
   */
  requireVerification?: boolean;
  /**
   * Minimum auth level required (optional)
   */
  minAuthLevel?: number;
}

/**
 * Type for a verified session (guaranteed to have user.id)
 */
export type VerifiedSession = Session & {
  user: NonNullable<Session["user"]> & {
    id: string;
  };
};

/**
 * Handler function that receives the request and verified session
 */
export type ApiAuthHandler = (
  request: NextRequest,
  session: VerifiedSession
) => Promise<NextResponse> | NextResponse;

/**
 * Wrapper function for API route handlers that handles authentication,
 * authorization level checks, and account verification.
 *
 * @param request - The Next.js request object
 * @param options - Authentication and authorization options
 * @param handler - Function that receives request and verified session, returns NextResponse
 * @returns NextResponse with appropriate status codes on failure, or handler result on success
 *
 * @example
 * ```tsx
 * export async function POST(request: NextRequest) {
 *   return withApiAuth(
 *     request,
 *     { minAuthLevel: AUTH_LEVELS.ADMIN },
 *     async (request, session) => {
 *       // session is guaranteed to exist and have required auth level
 *       return NextResponse.json({ success: true });
 *     }
 *   );
 * }
 * ```
 */
export async function withApiAuth(
  request: NextRequest,
  options: ApiAuthOptions = {},
  handler: ApiAuthHandler
): Promise<NextResponse> {
  const {
    requireAuth = true,
    requireVerification = false,
    minAuthLevel,
  } = options;

  const session = await auth();

  // Check authentication
  if (requireAuth && !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check account verification
  if (requireVerification && !isAccountVerified(session)) {
    return NextResponse.json(
      { error: "Account verification required" },
      { status: 403 }
    );
  }

  // Check auth level
  if (minAuthLevel !== undefined) {
    const userAuthLevel = session?.user?.auth ?? 0;
    if (userAuthLevel < minAuthLevel) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }
  }

  // At this point, session is guaranteed to exist and pass all checks
  const verifiedSession = session as VerifiedSession;

  return handler(request, verifiedSession);
}
