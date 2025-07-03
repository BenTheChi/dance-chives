"use server";
import { auth } from "@/auth";
import { uploadToGCloudStorage } from "../GCloud";
import { insertEvent } from "@/db/queries/event";
import { NextResponse } from "next/server";
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
  event: object | null;
}

export async function addEvent(props: addEventProps): Promise<response> {
  // test skip below - for form // testing exclusively!
  return {
    status: 200,
    event: null,
  };
  const session = await auth();

  // //Do a check for auth level here
  if (!session) {
    console.error("No user session found");
    return {
      error: "No user session found",
      status: 401,
      event: null,
    };
  }

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
  const processedSections = props.sections.map((section) => {
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

  // TEMPORARILY COMMENTED OUT FOR TESTING - Get timezone for city
  // const response = await fetch(
  //   `http://geodb-free-service.wirefreethought.com/v1/geo/places/${props.eventDetails.city.id}`
  // );

  // if (!response.ok) {
  //   console.error("Failed to fetch city", response.statusText);
  //   return {
  //     error: "Failed to fetch city",
  //     status: 500,
  //     event: null,
  //   };
  // }

  // const timezoneData = await response.json();

  // console.log(timezoneData);

  // Prepare the final event object
  const eventToInsert = {
    id: generateSlugId(props.eventDetails.title),
    createdAt: new Date(),
    updatedAt: new Date(),
    eventDetails: {
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
      poster: props.eventDetails.poster,
      city: {
        ...props.eventDetails.city,
        // timezone: timezoneData.data.timezone, // TEMPORARILY COMMENTED OUT
        timezone: "America/Los_Angeles", // TEMPORARY DEFAULT
      },
    },
    sections: props.sections,
    roles: props.roles || [],
    subEvents: props.subEvents,
    gallery: props.gallery,
  };

  console.log(JSON.stringify(eventToInsert, null, 2));

  // TODO: Call insertEvent with eventToInsert
  const result = await insertEvent(eventToInsert);

  console.log(result);

  return {
    status: 200,
    event: result,
  };
}
