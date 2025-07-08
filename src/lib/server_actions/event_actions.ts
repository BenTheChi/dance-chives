"use server";
import { auth } from "@/auth";
import { uploadToGCloudStorage } from "../GCloud";
import { insertEvent, EditEvent as editEventQuery, getEvent as getEventQuery } from "@/db/queries/event";
import { Event, EventDetails, Section, Role, SubEvent, Picture } from "@/types/event";
import { generateShortId } from "@/lib/utils";
import { NextResponse } from "next/server";

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
    hasBrackets?: boolean;
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
  event: object | null;
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
        const posterResults = await uploadToGCloudStorage([subEvent.poster.file]);
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
          brackets: section.brackets,
          videos: [],
        };
      } else {
        return {
          ...sectionWithoutBrackets,
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
      id: generateShortId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      eventDetails: eventDetails,
      roles: props.roles || [],
      sections: processedSections,
      subEvents: props.subEvents as SubEvent[],
      gallery: props.gallery as Picture[],
    };

    console.log("Event to insert:", JSON.stringify(event, null, 2));

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

export async function editEvent(eventId: string, props: addEventProps): Promise<response> {
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
        const posterResults = await uploadToGCloudStorage([subEvent.poster.file]);
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
          brackets: section.brackets,
          videos: [],
        };
      } else {
        return {
          ...sectionWithoutBrackets,
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

    // Create the Event object that matches the EditEvent query structure
    const event: Event = {
      id: eventId,
      createdAt: new Date(), // This will be preserved by the database
      updatedAt: new Date(),
      eventDetails: eventDetails,
      roles: props.roles || [],
      sections: processedSections,
      subEvents: props.subEvents as SubEvent[],
      gallery: props.gallery as Picture[],
    };

    console.log("Event to update:", JSON.stringify(event, null, 2));

    // Call EditEvent with the properly structured Event object
    const result = await editEventQuery(event);

    return {
      status: 200,
      event: result,
    };
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
