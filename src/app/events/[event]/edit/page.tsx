import { AppNavbar } from "@/components/AppNavbar";
import EventFormWrapper from "@/components/EventFormWrapper";
import { getEvent } from "@/db/queries/event";
import { generateShortId } from "@/lib/utils";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";
import type { FormValues } from "@/components/forms/event-form";
import { auth } from "@/auth";
import { canUpdateEvent } from "@/lib/utils/auth-utils";
import { notFound, redirect } from "next/navigation";
import { isTeamMember, isEventCreator } from "@/db/queries/team-member";
import { isAllDayEvent } from "@/lib/utils/event-utils";

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

  // Check if user is the event creator
  const isCreator = await isEventCreator(event, session.user.id);

  // Check if user is a team member
  const isEventTeamMember = await isTeamMember(event, session.user.id);

  // Check authorization - allow creators regardless of auth level, and team members
  const authLevel = session.user.auth ?? 0;
  const hasPermission =
    isCreator ||
    canUpdateEvent(
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
      type: "gallery" as const,
    };
  });

  // Format dates to include isAllDay field (derived from times)
  const formattedDates = (currEvent.eventDetails.dates || []).map(
    (dateEntry) => ({
      ...dateEntry,
      isAllDay: isAllDayEvent(dateEntry.startTime, dateEntry.endTime),
    })
  );

  //Add null values to eventDetails objects and normalize optional string fields
  const formattedEventDetails = {
    ...currEvent.eventDetails,
    dates: formattedDates,
    description: currEvent.eventDetails.description ?? "",
    schedule: currEvent.eventDetails.schedule ?? "",
    location: currEvent.eventDetails.location ?? "",
    cost: currEvent.eventDetails.cost ?? "",
    prize: currEvent.eventDetails.prize ?? "",
    poster: currEvent.eventDetails.poster
      ? {
          ...currEvent.eventDetails.poster,
          title: currEvent.eventDetails.poster.title || "",
          file: null,
        }
      : null,
  };

  // Format sections to ensure poster file field is null
  const formattedSections = (currEvent.sections || []).map((section) => ({
    ...section,
    description: section.description ?? "",
    poster: section.poster
      ? {
          ...section.poster,
          title: section.poster.title || "",
          file: null,
        }
      : null,
  }));

  //Convert event to FormValues
  // Note: Optional string fields are normalized to empty strings to avoid null values
  const eventFormValues = {
    eventDetails: formattedEventDetails,
    sections: formattedSections,
    roles: formattedRoles,
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
