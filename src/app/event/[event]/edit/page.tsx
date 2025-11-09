import { AppNavbar } from "@/components/AppNavbar";
import EventFormWrapper from "@/components/EventFormWrapper";
import { getEvent } from "@/db/queries/event";
import { generateShortId } from "@/lib/utils";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";
import { FormValues } from "@/components/forms/event-form";
import { auth } from "@/auth";
import { canUpdateEvent } from "@/lib/utils/auth-utils";
import { notFound, redirect } from "next/navigation";

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

  // Check authorization
  if (!session.user.auth) {
    redirect(`/event/${event}`);
  }

  const hasPermission = canUpdateEvent(
    session.user.auth,
    {
      eventId: event,
      eventCreatorId: currEvent.eventDetails.creatorId,
    },
    session.user.id
  );

  if (!hasPermission) {
    redirect(`/event/${event}`);
  }

  //Convert roles from Neo4j format (uppercase) to display format
  const formattedRoles = currEvent.roles.map((role) => {
    return {
      ...role,
      title: fromNeo4jRoleFormat(role.title) || role.title,
      id: role.id + "-" + generateShortId(),
    };
  });

  //Add null values to picture objects
  const formattedPictures = currEvent.gallery.map((picture) => {
    return {
      ...picture,
      file: null,
    };
  });

  //Add null values to subEvent objects
  const formattedSubEvents = currEvent.subEvents.map((subEvent) => {
    return {
      ...subEvent,
      poster: subEvent.poster
        ? {
            ...subEvent.poster,
            title: subEvent.poster.title || "",
            file: null,
          }
        : null,
    };
  });

  //Add null values to eventDetails objects
  const formattedEventDetails = {
    ...currEvent.eventDetails,
    poster: currEvent.eventDetails.poster
      ? {
          ...currEvent.eventDetails.poster,
          title: currEvent.eventDetails.poster.title || "",
          file: null,
        }
      : null,
  };

  //Convert event to FormValues
  // Note: Zod's preprocess will convert undefined/null to "" for description/schedule fields
  const eventFormValues = {
    eventDetails: formattedEventDetails,
    sections: currEvent.sections,
    roles: formattedRoles,
    subEvents: formattedSubEvents,
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
