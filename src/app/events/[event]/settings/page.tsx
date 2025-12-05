import { AppNavbar } from "@/components/AppNavbar";
import { getEvent } from "@/db/queries/event";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEventTeamMembers, isEventCreator } from "@/db/queries/team-member";
import { getUser } from "@/db/queries/user";
import EventSettingsForm from "@/components/forms/event-settings-form";

type PageProps = {
  params: Promise<{ event: string }>;
};

export default async function EventSettingsPage({ params }: PageProps) {
  const paramResult = await params;
  const { event: eventId } = paramResult;
  const session = await auth();

  // Check authentication
  if (!session?.user?.id) {
    redirect("/login");
  }

  const event = await getEvent(eventId);

  // Check if event exists
  if (!event) {
    notFound();
  }

  // Check if user is the event creator
  const isCreator = await isEventCreator(eventId, session.user.id);

  // Only event creators can access settings page (regardless of auth level)
  if (!isCreator) {
    redirect(`/events/${eventId}`);
  }

  // Fetch team members for form
  const teamMemberIds = await getEventTeamMembers(eventId);
  const teamMembersData = await Promise.all(
    teamMemberIds.map(async (id) => {
      const user = await getUser(id);
      if (!user) return null;
      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName || "",
      };
    })
  );
  const teamMembers = teamMembersData.filter(
    (member): member is NonNullable<typeof member> => member !== null
  );

  // Fetch creator data for form
  let creator = null;
  if (event.eventDetails.creatorId) {
    const creatorUser = await getUser(event.eventDetails.creatorId);
    if (creatorUser) {
      creator = {
        id: creatorUser.id,
        username: creatorUser.username,
        displayName: creatorUser.displayName || "",
      };
    }
  }

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col gap-4 p-6 md:px-4">
        <div className="container mx-auto px-4 sm:px-4 py-6 max-w-full overflow-x-hidden">
          <h1 className="text-3xl font-bold text-center mb-8">
            Event Settings
          </h1>
          <EventSettingsForm
            eventId={eventId}
            initialTeamMembers={teamMembers}
            initialCreator={creator}
          />
        </div>
      </div>
    </>
  );
}
