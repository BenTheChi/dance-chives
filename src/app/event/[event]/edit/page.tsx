import { AppNavbar } from "@/components/AppNavbar";
import EventFormWrapper from "@/components/EventFormWrapper";
import { getEvent } from "@/db/queries/event";
import { generateShortId } from "@/lib/utils";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ event: string }>;
}) {
  const { event } = await params;
  const currEvent = await getEvent(event);

  //Convert roles from uppercase to capitalized first letter
  const formattedRoles = currEvent.roles.map((role) => {
    const ModifiedTitle =
      role.title != "DJ" && role.title != "MC"
        ? role.title.charAt(0).toUpperCase() + role.title.slice(1).toLowerCase()
        : role.title;

    return {
      ...role,
      title: ModifiedTitle,
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
  const eventFormValues = {
    eventDetails: formattedEventDetails,
    sections: currEvent.sections,
    roles: formattedRoles,
    subEvents: formattedSubEvents,
    gallery: formattedPictures,
  };

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col gap-4 p-6 md:px-4">
        <EventFormWrapper initialData={eventFormValues} />
      </div>
    </>
  );
}
