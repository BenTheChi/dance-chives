import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAccountVerified } from "./auth-utils";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

/**
 * Options for page authentication and authorization
 */
export interface PageAuthOptions {
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
  /**
   * Custom redirect URLs (optional)
   */
  redirectTo?: {
    login?: string;
    verification?: string;
    insufficientPermissions?: string;
  };
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
 * Handler function that receives a verified session
 */
export type PageAuthHandler<T = ReactNode> = (
  session: VerifiedSession
) => Promise<T> | T;

/**
 * Helper function to wait for session to be fully loaded with retries
 * This prevents premature redirects when session is still being established after login
 */
async function getSessionWithRetry(
  maxRetries: number = 3,
  retryDelay: number = 500
): Promise<Session | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const session = await auth();

    // If session exists and has user.id, it's fully loaded
    if (session?.user?.id) {
      return session;
    }

    // If this is not the last attempt, wait before retrying
    if (attempt < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // Return the last session attempt (may be null or incomplete)
  return await auth();
}

/**
 * Wrapper function for server component pages that handles authentication,
 * authorization level checks, and account verification.
 *
 * @param options - Authentication and authorization options
 * @param handler - Function that receives verified session and returns page content
 * @returns The result of the handler function
 *
 * @example
 * ```tsx
 * export default async function MyPage() {
 *   return withPageAuth(
 *     { minAuthLevel: AUTH_LEVELS.CREATOR },
 *     async (session) => {
 *       // session is guaranteed to exist and have required auth level
 *       return <div>Protected content</div>;
 *     }
 *   );
 * }
 * ```
 */
export async function withPageAuth<T = ReactNode>(
  options: PageAuthOptions = {},
  handler: PageAuthHandler<T>
): Promise<T> {
  const {
    requireAuth = true,
    requireVerification = false,
    minAuthLevel,
    redirectTo = {},
  } = options;

  const {
    login: loginRedirect = "/login",
    verification: verificationRedirect = "/signup",
    insufficientPermissions: insufficientPermissionsRedirect = "/dashboard",
  } = redirectTo;

  // Get session with retries to ensure it's fully loaded
  const session = await getSessionWithRetry();

  // Check authentication
  if (requireAuth && !session?.user?.id) {
    redirect(loginRedirect);
  }

  // Check account verification
  if (requireVerification && !isAccountVerified(session)) {
    redirect(verificationRedirect);
  }

  // Check auth level
  if (minAuthLevel !== undefined) {
    const userAuthLevel = session?.user?.auth ?? 0;
    if (userAuthLevel < minAuthLevel) {
      redirect(insufficientPermissionsRedirect);
    }
  }

  // At this point, session is guaranteed to exist and pass all checks
  // TypeScript will narrow the type, but we need to assert it for the handler
  const verifiedSession = session as VerifiedSession;

  return handler(verifiedSession);
}
