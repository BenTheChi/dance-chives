import { AppNavbar } from "@/components/AppNavbar";
import EventFormWrapper from "@/components/EventFormWrapper";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AUTH_LEVELS } from "@/lib/utils/auth-utils";

export default async function AddEventPage() {
  const session = await auth();

  // Check authentication
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Check authorization - only creators and above can create events
  const authLevel = session.user.auth ?? 0;
  if (authLevel < AUTH_LEVELS.CREATOR) {
    redirect("/dashboard");
  }

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col gap-4 p-6 md:px-4">
        <EventFormWrapper />
      </div>
    </>
  );
}

