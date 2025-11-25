import { ReactNode } from "react";
import { withPageAuth, type PageAuthOptions } from "@/lib/utils/page-auth";

/**
 * Props for ProtectedClientPage component
 */
export interface ProtectedClientPageProps extends PageAuthOptions {
  /**
   * The client component children to render if auth checks pass
   */
  children: ReactNode;
}

/**
 * Server component wrapper that protects client component pages with
 * server-side authentication, authorization, and account verification checks.
 *
 * This provides server-side protection for client component pages, which is
 * more secure than client-side checks alone.
 *
 * @param props - Component props including auth options and children
 * @returns The children if auth checks pass, or redirects if they fail
 *
 * @example
 * ```tsx
 * // In a client component page
 * "use client";
 * export default function DashboardPage() {
 *   return (
 *     <ProtectedClientPage requireVerification={true}>
 *       <div>Protected content</div>
 *     </ProtectedClientPage>
 *   );
 * }
 * ```
 */
export async function ProtectedClientPage({
  children,
  ...authOptions
}: ProtectedClientPageProps): Promise<ReactNode> {
  return withPageAuth(authOptions, async () => {
    return children;
  });
}

