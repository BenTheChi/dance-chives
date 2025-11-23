import { AppNavbar } from "@/components/AppNavbar";
import EventFormWrapper from "@/components/EventFormWrapper";
import { getEvent } from "@/db/queries/event";
import { generateShortId } from "@/lib/utils";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";
import { FormValues } from "@/components/forms/event-form";
import { auth } from "@/auth";
import { canUpdateEvent } from "@/lib/utils/auth-utils";
import { notFound, redirect } from "next/navigation";
import { isTeamMember } from "@/db/queries/team-member";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ event: string }>;
}) {
  const { event } = await params;
  const session = await auth();

  // Check authentication
  if (!session?.user?.id) {
    redirect("/login");
  }

  const currEvent = await getEvent(event);

  // Check if event exists
  if (!currEvent) {
    notFound();
  }

  // Check if user is a team member
  const isEventTeamMember = await isTeamMember(event, session.user.id);

  // Check authorization - allow team members even without auth level
  const authLevel = session.user.auth ?? 0;
  const hasPermission = canUpdateEvent(
    authLevel,
    {
      eventId: event,
      eventCreatorId: currEvent.eventDetails.creatorId,
      isTeamMember: isEventTeamMember,
    },
    session.user.id
  );

  if (!hasPermission) {
    redirect(`/events/${event}`);
  }

  //Convert roles from Neo4j format (uppercase) to display format
  const formattedRoles = (currEvent.roles || []).map((role) => {
    return {
      ...role,
      title: fromNeo4jRoleFormat(role.title) || role.title,
      id: role.id + "-" + generateShortId(),
    };
  });

  //Add null values to picture objects
  const formattedPictures = (currEvent.gallery || []).map((picture) => {
    return {
      ...picture,
      file: null,
    };
  });

  //Add null values to eventDetails objects and normalize optional string fields
  const formattedEventDetails = {
    ...currEvent.eventDetails,
    description: currEvent.eventDetails.description ?? "",
    schedule: currEvent.eventDetails.schedule ?? "",
    address: currEvent.eventDetails.address ?? "",
    prize: currEvent.eventDetails.prize ?? "",
    entryCost: currEvent.eventDetails.entryCost ?? "",
    cost: currEvent.eventDetails.cost ?? "",
    poster: currEvent.eventDetails.poster
      ? {
          ...currEvent.eventDetails.poster,
          title: currEvent.eventDetails.poster.title || "",
          file: null,
        }
      : null,
  };

  //Convert event to FormValues
  // Note: Optional string fields are normalized to empty strings to avoid null values
  const eventFormValues = {
    eventDetails: formattedEventDetails,
    sections: currEvent.sections,
    roles: formattedRoles,
    videos: currEvent.videos || [],
    gallery: formattedPictures,
  } as FormValues;

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col gap-4 p-6 md:px-4">
        <EventFormWrapper initialData={eventFormValues} />
      </div>
    </>
  );
}

