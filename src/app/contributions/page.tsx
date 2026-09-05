import { withPageAuth } from "@/lib/utils/page-auth";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { listContributions } from "@/lib/server_actions/contribution_actions";
import { ContributionsClient } from "./contributions-client";

/**
 * Moderation view for member corrections.
 *
 * Corrections apply immediately and without approval, so this page is the
 * counterpart that makes that safe: every correction is listed with the value
 * it replaced, and any of them can be put back in one click.
 */
export default async function ContributionsPage() {
  return withPageAuth(
    { minAuthLevel: AUTH_LEVELS.MODERATOR },
    async () => {
      const result = await listContributions({ take: 100 });

      return (
        <ContributionsClient
          initialContributions={
            result.status === 200 ? result.contributions : []
          }
        />
      );
    },
  );
}
