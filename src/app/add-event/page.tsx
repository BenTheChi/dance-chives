import EventFormWrapper from "@/components/EventFormWrapper";
import { withPageAuth } from "@/lib/utils/page-auth";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";

export default async function AddEventPage() {
  return withPageAuth({ minAuthLevel: AUTH_LEVELS.CREATOR }, async () => {
    return (
      <>
        <div className="flex flex-col gap-4 w-full overflow-x-hidden">
          <EventFormWrapper />
        </div>
      </>
    );
  });
}
