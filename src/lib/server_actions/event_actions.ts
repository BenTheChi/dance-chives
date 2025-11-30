"use server";
import { auth } from "@/auth";
import {
  deleteFromR2,
  uploadEventPosterToR2,
  uploadEventGalleryToR2,
  uploadSectionPosterToR2,
} from "../R2";
import {
  insertEvent,
  editEvent as editEventQuery,
  getEvent as getEventQuery,
} from "@/db/queries/event";
import { Event, EventDetails, Section, Video } from "@/types/event";
import { Image } from "@/types/image";
import { generateSlugId } from "@/lib/utils";
import { prisma } from "@/lib/primsa";
import { canUpdateEvent } from "@/lib/utils/auth-utils";
import {
  setVideoRoles,
  setSectionWinners,
  isTeamMember,
} from "@/db/queries/team-member";
import { getUserByUsername } from "@/db/queries/user";
import { UserSearchItem } from "@/types/user";
import { VIDEO_ROLE_WINNER, VIDEO_ROLE_DANCER } from "@/lib/utils/roles";
import { normalizeTime, isAllDayEvent } from "@/lib/utils/event-utils";

// Unified form props interface - matches FormValues from event-form.tsx
interface addEventProps {
  eventDetails: {
    creatorId?: string;
    title: string;
    city: {
      id: number;
      name: string;
      countryCode: string;
      region: string;
      population: number;
    };
    dates: {
      // Required: Array of dates for events (at least one)
      date: string;
      isAllDay?: boolean; // Form-only field, not stored in DB
      startTime?: string;
      endTime?: string;
    }[];
    description?: string;
    schedule?: string;
    location?: string;
    cost?: string;
    poster?: {
      id: string;
      title: string;
      url: string;
      file: File | null;
    } | null;
    eventType?:
      | "Battle"
      | "Competition"
      | "Class"
      | "Workshop"
      | "Session"
      | "Party"
      | "Festival"
      | "Performance"
      | "Other";
    styles?: string[];
  };
  sections: {
    id: string;
    title: string;
    description?: string;
    sectionType:
      | "Battle"
      | "Tournament"
      | "Competition"
      | "Performance"
      | "Showcase"
      | "Class"
      | "Session"
      | "Mixed"
      | "Other";
    hasBrackets: boolean;
    styles?: string[];
    applyStylesToVideos?: boolean;
    videos: {
      id: string;
      title: string;
      src: string;
      type: "battle" | "freestyle" | "choreography" | "class";
      styles?: string[];
      taggedWinners?: {
        id?: string;
        displayName: string;
        username: string;
      }[];
      taggedDancers?: {
        id?: string;
        displayName: string;
        username: string;
      }[];
      taggedChoreographers?: {
        id?: string;
        displayName: string;
        username: string;
      }[];
      taggedTeachers?: {
        id?: string;
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
        type: "battle" | "freestyle" | "choreography" | "class";
        styles?: string[];
        taggedWinners?: {
          id?: string;
          displayName: string;
          username: string;
        }[];
        taggedDancers?: {
          id?: string;
          displayName: string;
          username: string;
        }[];
        taggedChoreographers?: {
          id?: string;
          displayName: string;
          username: string;
        }[];
        taggedTeachers?: {
          id?: string;
          displayName: string;
          username: string;
        }[];
      }[];
    }[];
    winners?: {
      id?: string;
      displayName: string;
      username: string;
    }[];
    poster?: {
      id: string;
      title: string;
      url: string;
      file: File | null;
      type: "poster" | "gallery" | "profile";
    } | null;
  }[];
  roles?: {
    id: string;
    title: string;
    user: {
      id?: string;
      displayName: string;
      username: string;
    } | null;
  }[];
  gallery: {
    id: string;
    title: string;
    url: string;
    file: File | null;
    caption?: string;
  }[];
}

interface response {
  error?: string;
  status: number;
  event: Event | null;
}

export async function addEvent(props: addEventProps): Promise<response> {
  const session = await auth();

  if (!session) {
    console.error("No user session found");
    return {
      error: "No user session found",
      status: 401,
      event: null,
    };
  }

  try {
    // Generate eventId first (needed for R2 path generation)
    const eventId = generateSlugId(props.eventDetails.title);

    // Upload eventDetails poster if exists
    if (props.eventDetails.poster?.file) {
      const posterResult = await uploadEventPosterToR2(
        props.eventDetails.poster.file,
        eventId
      );
      if (posterResult.success) {
        props.eventDetails.poster = {
          ...props.eventDetails.poster,
          id: posterResult.id!,
          url: posterResult.url!,
          file: null,
        };
      }
    }

    // Upload gallery files
    const galleryFiles = props.gallery.filter((item) => item.file);
    if (galleryFiles.length > 0) {
      const galleryResults = await uploadEventGalleryToR2(
        galleryFiles.map((item) => item.file!),
        eventId
      );
      galleryResults.forEach((result, index) => {
        const originalItem = galleryFiles[index];
        const galleryIndex = props.gallery.findIndex(
          (g) => g.id === originalItem.id
        );
        if (galleryIndex !== -1 && result.success && result.url && result.id) {
          props.gallery[galleryIndex].id = result.id;
          props.gallery[galleryIndex].url = result.url;
          props.gallery[galleryIndex].file = null;
        }
      });
    }

    // Upload section posters
    for (const section of props.sections) {
      if (section.poster?.file) {
        const posterResult = await uploadSectionPosterToR2(
          section.poster.file,
          eventId,
          section.id
        );
        if (posterResult.success) {
          section.poster = {
            ...section.poster,
            id: posterResult.id!,
            url: posterResult.url!,
            file: null,
            type: "poster" as const,
          };
        }
      }
    }

    // Process sections to handle brackets/videos based on hasBrackets
    const processedSections: Section[] = props.sections.map((section) => {
      const { hasBrackets, ...sectionWithoutBrackets } = section;
      const poster = section.poster
        ? {
            ...section.poster,
            type: (section.poster.type || "poster") as "poster",
          }
        : null;

      if (hasBrackets) {
        return {
          ...sectionWithoutBrackets,
          description: section.description ?? "",
          hasBrackets: true,
          brackets: section.brackets,
          videos: [],
          poster,
        };
      } else {
        return {
          ...sectionWithoutBrackets,
          description: section.description ?? "",
          hasBrackets: false,
          brackets: [],
          videos: section.videos,
          poster,
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

    // Normalize dates: if isAllDay is true, set times to empty strings
    // Remove isAllDay field before storing (it's form-only)
    const normalizedDates = props.eventDetails.dates.map((dateEntry) => {
      const isAllDay =
        dateEntry.isAllDay ??
        isAllDayEvent(dateEntry.startTime, dateEntry.endTime);
      const normalizedStartTime = isAllDay
        ? ""
        : normalizeTime(dateEntry.startTime);
      const normalizedEndTime = isAllDay
        ? ""
        : normalizeTime(dateEntry.endTime);

      return {
        date: dateEntry.date,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime,
      };
    });

    // Create the EventDetails object
    // Ensure eventType is always set (default to "Other" if not provided)
    const eventDetails: EventDetails = {
      creatorId: session.user.id,
      title: props.eventDetails.title,
      description: props.eventDetails.description ?? "",
      location: props.eventDetails.location ?? "",
      cost: props.eventDetails.cost,
      dates: normalizedDates,
      schedule: props.eventDetails.schedule ?? "",
      poster: props.eventDetails.poster as Image | null,
      eventType: props.eventDetails.eventType || "Other",
      styles: props.eventDetails.styles,
      city: {
        ...props.eventDetails.city,
        timezone: timezoneData.data.timezone,
      },
    };

    // Create the Event object
    const event: Event = {
      id: eventId,
      createdAt: new Date(),
      updatedAt: new Date(),
      eventDetails: eventDetails,
      roles: props.roles || [],
      sections: processedSections,
      gallery: props.gallery as Image[],
    };

    // Call insertEvent with the properly structured Event object
    const result = await insertEvent(event);

    // Create corresponding PostgreSQL Event record to link Neo4j event to user
    await prisma.event.upsert({
      where: { eventId: event.id },
      update: {
        userId: session.user.id,
        creator: true,
      },
      create: {
        eventId: event.id,
        userId: session.user.id,
        creator: true,
      },
    });

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
  console.log("🟢 [editEvent] Starting editEvent");
  const session = await auth();

  if (!session) {
    console.error("No user session found");
    return {
      error: "No user session found",
      status: 401,
      event: null,
    };
  }

  const oldEvent = await getEventQuery(eventId);

  if (!oldEvent) {
    return {
      error: "Failed to fetch event to edit",
      status: 500,
      event: null,
    };
  }

  // Check if user is a team member
  const isEventTeamMember = await isTeamMember(eventId, session.user.id);

  // Check authorization - allow team members even without auth level
  const authLevel = session.user.auth ?? 0;
  const hasPermission = canUpdateEvent(
    authLevel,
    {
      eventId: eventId,
      eventCreatorId: oldEvent.eventDetails.creatorId,
      isTeamMember: isEventTeamMember,
    },
    session.user.id
  );

  if (!hasPermission) {
    return {
      error: "You do not have permission to edit this event",
      status: 403,
      event: null,
    };
  }

  try {
    // Delete poster if it was removed
    if (oldEvent.eventDetails.poster && !editedEvent.eventDetails.poster) {
      await deleteFromR2(oldEvent.eventDetails.poster.url);
    }

    // Upload new poster if exists. Delete old poster if it exists.
    if (editedEvent.eventDetails.poster?.file) {
      if (oldEvent.eventDetails.poster) {
        await deleteFromR2(oldEvent.eventDetails.poster.url);
      }

      const posterResult = await uploadEventPosterToR2(
        editedEvent.eventDetails.poster.file,
        eventId
      );
      if (posterResult.success) {
        editedEvent.eventDetails.poster = {
          ...editedEvent.eventDetails.poster,
          id: posterResult.id!,
          url: posterResult.url!,
          file: null,
        };
      }
    } else if (
      !editedEvent.eventDetails.poster &&
      oldEvent.eventDetails.poster
    ) {
      await deleteFromR2(oldEvent.eventDetails.poster.url);
    }

    // Upload gallery files
    const galleryFiles = editedEvent.gallery.filter((item) => item.file);
    if (galleryFiles.length > 0) {
      const galleryResults = await uploadEventGalleryToR2(
        galleryFiles.map((item) => item.file!),
        eventId
      );
      galleryResults.forEach((result, index) => {
        const originalItem = galleryFiles[index];
        const galleryIndex = editedEvent.gallery.findIndex(
          (g) => g.id === originalItem.id
        );
        if (galleryIndex !== -1 && result.success && result.url && result.id) {
          editedEvent.gallery[galleryIndex].id = result.id;
          editedEvent.gallery[galleryIndex].url = result.url;
          editedEvent.gallery[galleryIndex].file = null;
        }
      });
    }

    // Delete gallery items that don't exist in editedEvent
    for (const item of oldEvent.gallery) {
      if (!editedEvent.gallery.find((g) => g.id === item.id)) {
        await deleteFromR2(item.url);
      }
    }

    // Handle section posters - delete old posters that were removed or replaced
    const oldSectionMap = new Map(oldEvent.sections.map((s) => [s.id, s]));
    for (const oldSection of oldEvent.sections) {
      if (oldSection.poster) {
        const newSection = editedEvent.sections.find(
          (s) => s.id === oldSection.id
        );
        // Delete poster if section was removed, or poster was removed, or poster was replaced
        if (
          !newSection ||
          !newSection.poster ||
          (newSection.poster.id !== oldSection.poster.id &&
            !newSection.poster.file)
        ) {
          await deleteFromR2(oldSection.poster.url);
        }
      }
    }

    // Upload new section posters
    for (const section of editedEvent.sections) {
      if (section.poster?.file) {
        // Delete old poster if it exists and is being replaced
        const oldSection = oldSectionMap.get(section.id);
        if (oldSection?.poster) {
          await deleteFromR2(oldSection.poster.url);
        }

        const posterResult = await uploadSectionPosterToR2(
          section.poster.file,
          eventId,
          section.id
        );
        if (posterResult.success) {
          section.poster = {
            ...section.poster,
            id: posterResult.id!,
            url: posterResult.url!,
            file: null,
            type: "poster" as const,
          };
        }
      }
    }

    // Process sections to handle brackets/videos based on hasBrackets
    const processedSections: Section[] = editedEvent.sections.map((section) => {
      const { hasBrackets, ...sectionWithoutBrackets } = section;
      const poster = section.poster
        ? {
            ...section.poster,
            type: (section.poster.type || "poster") as "poster",
          }
        : null;

      if (hasBrackets) {
        return {
          ...sectionWithoutBrackets,
          description: section.description ?? "",
          hasBrackets: true,
          brackets: section.brackets,
          videos: [],
          poster,
        };
      } else {
        return {
          ...sectionWithoutBrackets,
          description: section.description ?? "",
          hasBrackets: false,
          brackets: [],
          videos: section.videos,
          poster,
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

    // Normalize dates: if isAllDay is true, set times to empty strings
    // Remove isAllDay field before storing (it's form-only)
    const normalizedDates = editedEvent.eventDetails.dates.map((dateEntry) => {
      const isAllDay =
        dateEntry.isAllDay ??
        isAllDayEvent(dateEntry.startTime, dateEntry.endTime);
      const normalizedStartTime = isAllDay
        ? ""
        : normalizeTime(dateEntry.startTime);
      const normalizedEndTime = isAllDay
        ? ""
        : normalizeTime(dateEntry.endTime);

      return {
        date: dateEntry.date,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime,
      };
    });

    // Create the EventDetails object
    // Ensure eventType is always set (default to "Other" if not provided)
    const eventDetails: EventDetails = {
      creatorId: oldEvent.eventDetails.creatorId,
      title: editedEvent.eventDetails.title,
      description: editedEvent.eventDetails.description ?? "",
      location: editedEvent.eventDetails.location,
      cost: editedEvent.eventDetails.cost,
      // Derive startDate from first date in dates array for database compatibility
      dates: normalizedDates,
      schedule: editedEvent.eventDetails.schedule ?? "",
      poster: editedEvent.eventDetails.poster as Image | null,
      eventType: editedEvent.eventDetails.eventType || "Other",
      styles: editedEvent.eventDetails.styles,
      city: {
        ...editedEvent.eventDetails.city,
        timezone: timezone,
      },
    };

    // Create the Event object
    const event: Event = {
      id: eventId,
      createdAt: new Date(), // This will be preserved by the database
      updatedAt: new Date(),
      eventDetails: eventDetails,
      roles: editedEvent.roles || [],
      sections: processedSections,
      gallery: editedEvent.gallery as Image[],
    };

    // Call editEventQuery with the properly structured Event object
    const result = await editEventQuery(event);

    console.log("🟢 [editEvent] editEventQuery result:", result);

    if (result) {
      // Helper function to get userId from UserSearchItem
      const getUserId = async (user: UserSearchItem): Promise<string> => {
        if (user.id) {
          return user.id;
        }
        if (!user.username) {
          throw new Error(
            `User must have either id or username. Got: ${JSON.stringify(user)}`
          );
        }
        const userRecord = await getUserByUsername(user.username);
        if (!userRecord || !userRecord.id) {
          throw new Error(`User not found with username: ${user.username}`);
        }
        return userRecord.id;
      };

      // Process tag diffs for videos and sections
      try {
        console.log("🟢 [editEvent] Starting tag diff processing...");

        // Process section videos and bracket videos
        for (const newSection of processedSections) {
          const oldSection = oldEvent.sections.find(
            (s) => s.id === newSection.id
          );

          // Process section videos
          for (const newVideo of newSection.videos || []) {
            const oldVideo = oldSection?.videos.find(
              (v) => v.id === newVideo.id
            );
            await processVideoTagDiffs(newVideo, oldVideo, eventId, getUserId);
          }

          // Process bracket videos
          for (const newBracket of newSection.brackets || []) {
            const oldBracket = oldSection?.brackets.find(
              (b) => b.id === newBracket.id
            );

            for (const newVideo of newBracket.videos || []) {
              const oldVideo = oldBracket?.videos.find(
                (v) => v.id === newVideo.id
              );
              await processVideoTagDiffs(
                newVideo,
                oldVideo,
                eventId,
                getUserId
              );
            }
          }

          // Process section winners
          const oldWinners = oldSection?.winners || [];
          const newWinners = newSection.winners || [];

          const oldWinnerUsernames = new Set(
            oldWinners.map((w) => w.username).filter(Boolean)
          );
          const newWinnerUsernames = new Set(
            newWinners.map((w) => w.username).filter(Boolean)
          );

          const winnersChanged =
            oldWinnerUsernames.size !== newWinnerUsernames.size ||
            [...oldWinnerUsernames].some(
              (username) => !newWinnerUsernames.has(username)
            ) ||
            [...newWinnerUsernames].some(
              (username) => !oldWinnerUsernames.has(username)
            );

          if (winnersChanged) {
            try {
              if (newWinners.length > 0) {
                const winnerUserIds = await Promise.all(
                  newWinners.map((winner) => getUserId(winner))
                );
                console.log(
                  `🟢 [editEvent] Setting ${winnerUserIds.length} winners for section ${newSection.id}`
                );
                await setSectionWinners(eventId, newSection.id, winnerUserIds);
              } else {
                console.log(
                  `🟢 [editEvent] Removing all winners from section ${newSection.id}`
                );
                await setSectionWinners(eventId, newSection.id, []);
              }
            } catch (winnerError) {
              console.error(
                `❌ [editEvent] Error setting section winners:`,
                winnerError
              );
            }
          }
        }
      } catch (tagError) {
        console.error("❌ [editEvent] Error processing tag diffs:", tagError);
        throw new Error(
          `Failed to process tag changes: ${
            tagError instanceof Error ? tagError.message : String(tagError)
          }`
        );
      }
      console.log("✅ [editEvent] Tag diff processing completed");

      // Update corresponding PostgreSQL Event record
      const creatorId = oldEvent.eventDetails.creatorId || session.user.id;

      await prisma.event.upsert({
        where: { eventId: eventId },
        update: {
          userId: creatorId,
          creator: true,
        },
        create: {
          eventId: eventId,
          userId: creatorId,
          creator: true,
        },
      });

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

// Helper function to process video tag diffs
async function processVideoTagDiffs(
  newVideo: Video,
  oldVideo: Video | undefined,
  eventId: string,
  getUserId: (user: UserSearchItem) => Promise<string>
): Promise<void> {
  const oldTaggedWinners = oldVideo?.taggedWinners || [];
  const oldTaggedDancers = oldVideo?.taggedDancers || [];
  const oldTaggedChoreographers = oldVideo?.taggedChoreographers || [];
  const oldTaggedTeachers = oldVideo?.taggedTeachers || [];
  const newTaggedWinners = newVideo.taggedWinners || [];
  const newTaggedDancers = newVideo.taggedDancers || [];
  const newTaggedChoreographers = newVideo.taggedChoreographers || [];
  const newTaggedTeachers = newVideo.taggedTeachers || [];

  const allOldUsers = new Set(
    [
      ...oldTaggedWinners.map((u: UserSearchItem) => u.username),
      ...oldTaggedDancers.map((u: UserSearchItem) => u.username),
      ...oldTaggedChoreographers.map((u: UserSearchItem) => u.username),
      ...oldTaggedTeachers.map((u: UserSearchItem) => u.username),
    ].filter(Boolean)
  );
  const allNewUsers = new Set(
    [
      ...newTaggedWinners.map((u: UserSearchItem) => u.username),
      ...newTaggedDancers.map((u: UserSearchItem) => u.username),
      ...newTaggedChoreographers.map((u: UserSearchItem) => u.username),
      ...newTaggedTeachers.map((u: UserSearchItem) => u.username),
    ].filter(Boolean)
  );

  // Process all users in the new set
  for (const username of allNewUsers) {
    const winner = newTaggedWinners.find(
      (u: UserSearchItem) => u.username === username
    );
    const dancer = newTaggedDancers.find(
      (u: UserSearchItem) => u.username === username
    );
    const choreographer = newTaggedChoreographers.find(
      (u: UserSearchItem) => u.username === username
    );
    const teacher = newTaggedTeachers.find(
      (u: UserSearchItem) => u.username === username
    );
    const user = winner || dancer || choreographer || teacher;

    if (!user) continue;

    const userId = await getUserId(user);
    const roles: string[] = [];

    if (dancer) roles.push(VIDEO_ROLE_DANCER);
    if (winner) roles.push(VIDEO_ROLE_WINNER);
    if (choreographer) roles.push("CHOREOGRAPHER");
    if (teacher) roles.push("TEACHER");

    try {
      await setVideoRoles(eventId, newVideo.id, userId, roles);
    } catch (userTagError) {
      console.error(
        `❌ [editEvent] Error setting roles for user ${username} in video ${newVideo.id}:`,
        userTagError
      );
    }
  }

  // Remove users that are no longer tagged
  for (const username of allOldUsers) {
    if (!allNewUsers.has(username)) {
      const oldUser =
        oldTaggedWinners.find((u: UserSearchItem) => u.username === username) ||
        oldTaggedDancers.find((u: UserSearchItem) => u.username === username) ||
        oldTaggedChoreographers.find(
          (u: UserSearchItem) => u.username === username
        ) ||
        oldTaggedTeachers.find((u: UserSearchItem) => u.username === username);
      if (oldUser) {
        const userId = await getUserId(oldUser);
        await setVideoRoles(eventId, newVideo.id, userId, []);
      }
    }
  }
}

export async function getEvent(eventId: string): Promise<response> {
  const session = await auth();

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
