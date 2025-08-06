"use server";
import { auth } from "@/auth";
import { deleteFromGCloudStorage, uploadToGCloudStorage } from "../GCloud";
import {
  insertEvent,
  EditEvent as editEventQuery,
  getEvent as getEventQuery,
} from "@/db/queries/event";
import { Event, EventDetails, Section, SubEvent, Picture } from "@/types/event";
import { generateSlugId } from "@/lib/utils";

interface addEventProps {
  eventDetails: {
    creatorId: string;
    title: string;
    city: {
      id: number;
      name: string;
      countryCode: string;
      region: string;
      population: number;
    };
    startDate: string;
    description?: string;
    schedule?: string;
    address?: string;
    startTime?: string;
    endTime?: string;
    prize?: string;
    entryCost?: string;
    poster?: {
      id: string;
      title: string;
      url: string;
      type: string;
      file: File | null;
    } | null;
  };
  sections: {
    id: string;
    title: string;
    description?: string;
    hasBrackets: boolean;
    videos: {
      id: string;
      title: string;
      src: string;
      taggedUsers?: {
        id: string;
        displayName: string;
        username: string;
      }[];
    }[];
    brackets: {
      id: string;
      title: string;
      videos: {
        id: string;
        title: string;
        src: string;
        taggedUsers?: {
          id: string;
          displayName: string;
          username: string;
        }[];
      }[];
    }[];
  }[];
  roles?: {
    id: string;
    title: string;
    user: {
      id: string;
      displayName: string;
      username: string;
    } | null;
  }[];
  subEvents: {
    id: string;
    title: string;
    description?: string;
    schedule?: string;
    startDate: string;
    address?: string;
    startTime?: string;
    endTime?: string;
    poster?: {
      id: string;
      title: string;
      url: string;
      type: string;
      file: File | null;
    } | null;
  }[];
  gallery: {
    id: string;
    title: string;
    url: string;
    type: string;
    file: File | null;
  }[];
}

interface response {
  error?: string;
  status: number;
  event: Event | null;
}

export async function addEvent(props: addEventProps): Promise<response> {
  const session = await auth();

  // Check for auth level here
  if (!session) {
    console.error("No user session found");
    return {
      error: "No user session found",
      status: 401,
      event: null,
    };
  }

  try {
    // Upload eventDetails poster if exists
    if (props.eventDetails.poster?.file) {
      const posterResults = await uploadToGCloudStorage([
        props.eventDetails.poster.file,
      ]);
      if (posterResults[0].success) {
        props.eventDetails.poster = {
          ...props.eventDetails.poster,
          id: posterResults[0].id!,
          url: posterResults[0].url!,
          file: null,
        };
      }
    }

    // Upload subEvent posters
    for (const subEvent of props.subEvents) {
      if (subEvent.poster?.file) {
        const posterResults = await uploadToGCloudStorage([
          subEvent.poster.file,
        ]);
        if (posterResults[0].success) {
          subEvent.poster = {
            ...subEvent.poster,
            id: posterResults[0].id!,
            url: posterResults[0].url!,
            file: null,
          };
        }
      }
    }

    // Upload gallery files
    for (const item of props.gallery) {
      if (item.file) {
        const galleryResults = await uploadToGCloudStorage([item.file]);
        if (galleryResults[0].success) {
          item.id = galleryResults[0].id!;
          item.url = galleryResults[0].url!;
          item.file = null;
        }
      }
    }

    // Process sections to handle brackets/videos based on hasBrackets
    const processedSections: Section[] = props.sections.map((section) => {
      const { hasBrackets, ...sectionWithoutBrackets } = section;

      if (hasBrackets) {
        return {
          ...sectionWithoutBrackets,
          hasBrackets: true,
          brackets: section.brackets,
          videos: [],
        };
      } else {
        return {
          ...sectionWithoutBrackets,
          hasBrackets: false,
          brackets: [],
          videos: section.videos,
        };
      }
    });

    // Get timezone for city
    const response = await fetch(
      `http://geodb-free-service.wirefreethought.com/v1/geo/places/${props.eventDetails.city.id}`
    );

    if (!response.ok) {
      console.error("Failed to fetch city", response.statusText);
      return {
        error: "Failed to fetch city",
        status: 500,
        event: null,
      };
    }

    const timezoneData = await response.json();

    // Create the EventDetails object
    const eventDetails: EventDetails = {
      creatorId: session.user.id,
      title: props.eventDetails.title,
      description: props.eventDetails.description,
      address: props.eventDetails.address,
      prize: props.eventDetails.prize,
      entryCost: props.eventDetails.entryCost,
      startDate: props.eventDetails.startDate,
      startTime: props.eventDetails.startTime,
      endTime: props.eventDetails.endTime,
      schedule: props.eventDetails.schedule,
      poster: props.eventDetails.poster as Picture | null,
      city: {
        ...props.eventDetails.city,
        timezone: timezoneData.data.timezone,
      },
    };

    // Create the Event object that matches the insertEvent query structure
    const event: Event = {
      id: generateSlugId(props.eventDetails.title),
      createdAt: new Date(),
      updatedAt: new Date(),
      eventDetails: eventDetails,
      roles: props.roles || [],
      sections: processedSections,
      subEvents: props.subEvents as SubEvent[],
      gallery: props.gallery as Picture[],
    };

    // Call insertEvent with the properly structured Event object
    const result = await insertEvent(event);

    return {
      status: 200,
      event: result,
    };
  } catch (error) {
    console.error("Error creating event:", error);
    return {
      error: "Failed to create event",
      status: 500,
      event: null,
    };
  }
}

export async function editEvent(
  eventId: string,
  editedEvent: addEventProps
): Promise<response> {
  const session = await auth();

  // Check for auth level here
  if (!session) {
    console.error("No user session found");
    return {
      error: "No user session found",
      status: 401,
      event: null,
    };
  }

  const response = await getEvent(eventId);

  if (response.error || !response.event) {
    return {
      error: "Failed to fetch event to edit",
      status: 500,
      event: null,
    };
  }

  const oldEvent = response.event as Event;

  try {
    //Delete pictures that have a file and a url
    if (oldEvent.eventDetails.poster && !editedEvent.eventDetails.poster) {
      await deleteFromGCloudStorage(oldEvent.eventDetails.poster.url);
    }

    // Upload eventDetails poster if exists.  Delete old poster if it exists.
    if (editedEvent.eventDetails.poster?.file) {
      if (oldEvent.eventDetails.poster) {
        await deleteFromGCloudStorage(oldEvent.eventDetails.poster.url);
      }

      const posterResults = await uploadToGCloudStorage([
        editedEvent.eventDetails.poster.file,
      ]);
      if (posterResults[0].success) {
        editedEvent.eventDetails.poster = {
          ...editedEvent.eventDetails.poster,
          id: posterResults[0].id!,
          url: posterResults[0].url!,
          file: null,
        };
      }
    } else if (
      !editedEvent.eventDetails.poster &&
      oldEvent.eventDetails.poster
    ) {
      await deleteFromGCloudStorage(oldEvent.eventDetails.poster.url);
    }

    // Upload subEvent posters
    for (const subEvent of editedEvent.subEvents) {
      if (!subEvent.poster) {
        // Delete old poster if it exists
        const oldSubEvent = oldEvent.subEvents.find(
          (s) => s.id === subEvent.id
        );
        if (oldSubEvent && oldSubEvent.poster) {
          await deleteFromGCloudStorage(oldSubEvent.poster.url);
        }
      }

      if (subEvent.poster?.file) {
        // Delete old poster if it exists
        const oldSubEvent = oldEvent.subEvents.find(
          (s) => s.id === subEvent.id
        );
        if (oldSubEvent && oldSubEvent.poster) {
          await deleteFromGCloudStorage(oldSubEvent.poster.url);
        }

        const posterResults = await uploadToGCloudStorage([
          subEvent.poster.file,
        ]);
        if (posterResults[0].success) {
          subEvent.poster = {
            ...subEvent.poster,
            id: posterResults[0].id!,
            url: posterResults[0].url!,
            file: null,
          };
        }
      }
    }

    // Delete subEvent posters where the entire subEvent has been deleted
    for (const subEvent of oldEvent.subEvents) {
      if (!editedEvent.subEvents.find((s) => s.id === subEvent.id)) {
        if (subEvent.poster) {
          await deleteFromGCloudStorage(subEvent.poster.url);
        }
      }
    }

    // Upload gallery files
    for (const item of editedEvent.gallery) {
      if (item.file) {
        const galleryResults = await uploadToGCloudStorage([item.file]);
        if (galleryResults[0].success) {
          item.id = galleryResults[0].id!;
          item.url = galleryResults[0].url!;
          item.file = null;
        }
      }
    }

    // Delete gallery items that don't exist in editedEvent
    for (const item of oldEvent.gallery) {
      if (!editedEvent.gallery.find((g) => g.id === item.id)) {
        await deleteFromGCloudStorage(item.url);
      }
    }

    // Process sections to handle brackets/videos based on hasBrackets
    const processedSections: Section[] = editedEvent.sections.map((section) => {
      const { hasBrackets, ...sectionWithoutBrackets } = section;

      if (hasBrackets) {
        return {
          ...sectionWithoutBrackets,
          hasBrackets: true,
          brackets: section.brackets,
          videos: [],
        };
      } else {
        return {
          ...sectionWithoutBrackets,
          hasBrackets: false,
          brackets: [],
          videos: section.videos,
        };
      }
    });

    let timezone = oldEvent.eventDetails.city.timezone;

    if (editedEvent.eventDetails.city.id !== oldEvent.eventDetails.city.id) {
      // Get timezone for city
      const response = await fetch(
        `http://geodb-free-service.wirefreethought.com/v1/geo/places/${editedEvent.eventDetails.city.id}`
      );

      if (!response.ok) {
        console.error("Failed to fetch city", response.statusText);
        return {
          error: "Failed to fetch city",
          status: 500,
          event: null,
        };
      }

      const responseData = await response.json();
      timezone = responseData.data.timezone;
    }

    // Create the EventDetails object
    const eventDetails: EventDetails = {
      creatorId: session.user.id,
      title: editedEvent.eventDetails.title,
      description: editedEvent.eventDetails.description,
      address: editedEvent.eventDetails.address,
      prize: editedEvent.eventDetails.prize,
      entryCost: editedEvent.eventDetails.entryCost,
      startDate: editedEvent.eventDetails.startDate,
      startTime: editedEvent.eventDetails.startTime,
      endTime: editedEvent.eventDetails.endTime,
      schedule: editedEvent.eventDetails.schedule,
      poster: editedEvent.eventDetails.poster as Picture | null,
      city: {
        ...editedEvent.eventDetails.city,
        timezone: timezone,
      },
    };

    // Create the Event object that matches the EditEvent query structure
    const event: Event = {
      id: eventId,
      createdAt: new Date(), // This will be preserved by the database
      updatedAt: new Date(),
      eventDetails: eventDetails,
      roles: editedEvent.roles || [],
      sections: processedSections,
      subEvents: editedEvent.subEvents as SubEvent[],
      gallery: editedEvent.gallery as Picture[],
    };

    // Call EditEvent with the properly structured Event object
    const result = await editEventQuery(event);

    if (result) {
      return {
        status: 200,
        event: null,
      };
    } else {
      return {
        error: "Failed to update event",
        status: 500,
        event: null,
      };
    }
  } catch (error) {
    console.error("Error updating event:", error);
    return {
      error: "Failed to update event",
      status: 500,
      event: null,
    };
  }
}

export async function getEvent(eventId: string): Promise<response> {
  const session = await auth();

  // Check for auth level here
  if (!session) {
    console.error("No user session found");
    return {
      error: "No user session found",
      status: 401,
      event: null,
    };
  }

  try {
    const eventData = await getEventQuery(eventId);

    if (!eventData) {
      return {
        error: "Event not found",
        status: 404,
        event: null,
      };
    }

    return {
      status: 200,
      event: eventData,
    };
  } catch (error) {
    console.error("Error fetching event:", error);
    return {
      error: "Failed to fetch event",
      status: 500,
      event: null,
    };
  }
}
