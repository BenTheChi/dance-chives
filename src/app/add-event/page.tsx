import { AppNavbar } from "@/components/AppNavbar";
import EventFormWrapper from "@/components/EventFormWrapper";
import { withPageAuth } from "@/lib/utils/page-auth";
import { AUTH_LEVELS } from "@/lib/utils/auth-utils";

export default async function AddEventPage() {
  return withPageAuth({ minAuthLevel: AUTH_LEVELS.CREATOR }, async () => {
    return (
      <>
        <AppNavbar />
        <div className="flex flex-col gap-4 p-6 md:px-4">
          <EventFormWrapper />
        </div>
      </>
    );
  });
}
