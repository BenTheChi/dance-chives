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
  toggleSaveCypher,
  getSavedEventIds as getSavedEventIdsQuery,
} from "@/db/queries/event";
import { Event, EventDetails, Section, Video } from "@/types/event";
import { Image } from "@/types/image";
import { generateSlugId } from "@/lib/utils";
import { prisma } from "@/lib/primsa";
import driver from "@/db/driver";
import { canUpdateEvent } from "@/lib/utils/auth-utils";
import {
  setVideoRoles,
  setSectionWinners,
  isTeamMember,
  addTeamMember,
} from "@/db/queries/team-member";
import { getUserByUsername } from "@/db/queries/user";
import { UserSearchItem } from "@/types/user";
import {
  VIDEO_ROLE_WINNER,
  VIDEO_ROLE_DANCER,
  fromNeo4jRoleFormat,
} from "@/lib/utils/roles";
import { normalizeTime, isAllDayEvent } from "@/lib/utils/event-utils";
import { normalizeStyleNames } from "@/lib/utils/style-utils";
import {
  parseMmddyyyy,
  zonedDateTimeToUtc,
  zonedStartOfDayToUtc,
  localIsoDateInTimeZone,
} from "@/lib/utils/timezone-utils";

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
  teamMembers?: {
    id?: string;
    displayName: string;
    username: string;
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

    // Normalize timezone format (GeoDB may return underscores instead of slashes)
    const rawTimezone = timezoneData.data?.timezone || "";
    const normalizedTimezone = rawTimezone.replace(/__/g, "/");

    // Normalize dates: if isAllDay is true, set times to empty strings
    // Remove isAllDay field before storing (it's form-only)
    const normalizedDates = props.eventDetails.dates
      .map((dateEntry) => {
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
      })
      // Sort dates chronologically so they're always in order
      .sort((a, b) => {
        const parseDate = (dateStr: string): Date => {
          // Handle ISO format (YYYY-MM-DD)
          if (dateStr.includes("-")) {
            return new Date(dateStr);
          }
          // Handle MM/DD/YYYY format
          const [month, day, year] = dateStr.split("/").map(Number);
          return new Date(year, month - 1, day);
        };
        return parseDate(a.date).getTime() - parseDate(b.date).getTime();
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
        timezone: normalizedTimezone,
      },
    };

    // Process team members - get user IDs for each team member
    const processedTeamMembers: Array<{
      id: string;
      username: string;
      displayName: string;
    }> = [];
    if (props.teamMembers && props.teamMembers.length > 0) {
      for (const member of props.teamMembers) {
        let userId = member.id;
        if (!userId && member.username) {
          const user = await getUserByUsername(member.username);
          if (user) {
            userId = user.id;
          }
        }
        if (userId) {
          processedTeamMembers.push({
            id: userId,
            username: member.username,
            displayName: member.displayName || "",
          });
        }
      }
    }

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

    // Call insertEvent with the properly structured Event object and team members
    const result = await insertEvent(event, processedTeamMembers);

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

    // Upsert Postgres read models for fast cards/dates queries
    await upsertEventReadModels({
      eventId: event.id,
      eventDetails,
      sections: processedSections,
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

    // Normalize timezone format (GeoDB may return underscores instead of slashes)
    let timezone = (oldEvent.eventDetails.city.timezone || "").replace(
      /__/g,
      "/"
    );

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
      const rawTimezone = responseData.data?.timezone || "";
      timezone = rawTimezone.replace(/__/g, "/");
    }

    // Normalize dates: if isAllDay is true, set times to empty strings
    // Remove isAllDay field before storing (it's form-only)
    const normalizedDates = editedEvent.eventDetails.dates
      .map((dateEntry) => {
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
      })
      // Sort dates chronologically so they're always in order
      .sort((a, b) => {
        const parseDate = (dateStr: string): Date => {
          // Handle ISO format (YYYY-MM-DD)
          if (dateStr.includes("-")) {
            return new Date(dateStr);
          }
          // Handle MM/DD/YYYY format
          const [month, day, year] = dateStr.split("/").map(Number);
          return new Date(year, month - 1, day);
        };
        return parseDate(a.date).getTime() - parseDate(b.date).getTime();
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

    // Process team members - get user IDs for each team member
    const processedTeamMembers: Array<{
      id: string;
      username: string;
      displayName: string;
    }> = [];
    if (editedEvent.teamMembers && editedEvent.teamMembers.length > 0) {
      for (const member of editedEvent.teamMembers) {
        let userId = member.id;
        if (!userId && member.username) {
          const user = await getUserByUsername(member.username);
          if (user) {
            userId = user.id;
          }
        }
        if (userId) {
          processedTeamMembers.push({
            id: userId,
            username: member.username,
            displayName: member.displayName || "",
          });
        }
      }
    }

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

    // Call editEventQuery with the properly structured Event object and team members
    const result = await editEventQuery(event, processedTeamMembers);

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

      // Upsert Postgres read models for fast cards/dates queries
      await upsertEventReadModels({
        eventId,
        eventDetails,
        sections: processedSections,
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

function aggregateEventStylesForCard(
  eventDetails: EventDetails,
  sections: Section[]
): string[] {
  const styles = new Set<string>();

  if (eventDetails.styles && eventDetails.styles.length > 0) {
    normalizeStyleNames(eventDetails.styles).forEach((s) => styles.add(s));
  }

  for (const section of sections) {
    if (
      section.applyStylesToVideos &&
      section.styles &&
      section.styles.length
    ) {
      normalizeStyleNames(section.styles).forEach((s) => styles.add(s));
      continue;
    }

    for (const video of section.videos || []) {
      if (video.styles && video.styles.length) {
        normalizeStyleNames(video.styles).forEach((s) => styles.add(s));
      }
    }

    for (const bracket of section.brackets || []) {
      for (const video of bracket.videos || []) {
        if (video.styles && video.styles.length) {
          normalizeStyleNames(video.styles).forEach((s) => styles.add(s));
        }
      }
    }
  }

  return Array.from(styles);
}

function buildSectionCardRow(input: { eventId: string; section: Section }) {
  const { eventId, section } = input;

  const directVideoCount = section.videos?.length || 0;
  const bracketVideoCount = (section.brackets || []).reduce(
    (sum, b) => sum + (b.videos?.length || 0),
    0
  );

  // Match existing UI semantics: either section.styles when applyStylesToVideos,
  // otherwise aggregate from videos.
  let displayStyles: string[] = [];
  if (
    section.applyStylesToVideos &&
    section.styles &&
    section.styles.length > 0
  ) {
    displayStyles = normalizeStyleNames(section.styles);
  } else {
    const s = new Set<string>();
    for (const v of section.videos || []) {
      if (v.styles && v.styles.length) {
        normalizeStyleNames(v.styles).forEach((x) => s.add(x));
      }
    }
    for (const b of section.brackets || []) {
      for (const v of b.videos || []) {
        if (v.styles && v.styles.length) {
          normalizeStyleNames(v.styles).forEach((x) => s.add(x));
        }
      }
    }
    displayStyles = Array.from(s);
  }

  return {
    sectionId: section.id,
    eventId,
    title: section.title,
    sectionType: section.sectionType,
    posterUrl: section.poster?.url ?? null,
    styles: displayStyles,
    totalVideoCount: directVideoCount + bracketVideoCount,
  };
}

async function upsertEventReadModels(input: {
  eventId: string;
  eventDetails: EventDetails;
  sections: Section[];
}): Promise<void> {
  const { eventId, eventDetails, sections } = input;

  // Normalize timezone format (fix double underscores from GeoDB API)
  const rawTimezone = eventDetails.city.timezone || "";
  const eventTimezone = rawTimezone.replace(/__/g, "/") || null;
  const displayDateLocal = eventDetails.dates?.[0]?.date || null;
  const additionalDatesCount = Math.max(
    0,
    (eventDetails.dates?.length || 0) - 1
  );

  const styles = aggregateEventStylesForCard(eventDetails, sections);

  await prisma.eventCard.upsert({
    where: { eventId },
    update: {
      title: eventDetails.title,
      eventType: eventDetails.eventType,
      cityId: eventDetails.city?.id ?? null,
      cityName: eventDetails.city?.name ?? null,
      region: eventDetails.city?.region ?? null,
      countryCode: eventDetails.city?.countryCode ?? null,
      eventTimezone,
      posterUrl: eventDetails.poster?.url ?? null,
      styles,
      displayDateLocal,
      additionalDatesCount,
    },
    create: {
      eventId,
      title: eventDetails.title,
      eventType: eventDetails.eventType,
      cityId: eventDetails.city?.id ?? null,
      cityName: eventDetails.city?.name ?? null,
      region: eventDetails.city?.region ?? null,
      countryCode: eventDetails.city?.countryCode ?? null,
      eventTimezone,
      posterUrl: eventDetails.poster?.url ?? null,
      styles,
      displayDateLocal,
      additionalDatesCount,
    },
  });

  // Rebuild event_dates
  await prisma.eventDate.deleteMany({ where: { eventId } });

  if (eventDetails.dates && eventDetails.dates.length > 0 && eventTimezone) {
    // Filter out entries with missing or invalid date strings
    const validDates = eventDetails.dates.filter((d) => {
      if (!d.date || typeof d.date !== "string" || d.date.trim() === "") {
        return false;
      }
      // Validate date format is MM/DD/YYYY
      try {
        parseMmddyyyy(d.date);
        return true;
      } catch {
        console.warn(`Skipping invalid date format: "${d.date}"`);
        return false;
      }
    });
    const dateRows = validDates.map((d) => {
      const isAllDay =
        !d.startTime || !d.endTime || d.startTime === "" || d.endTime === "";
      if (isAllDay) {
        const startUtc = zonedStartOfDayToUtc({
          dateMmddyyyy: d.date,
          timeZone: eventTimezone,
        });
        const localIso = localIsoDateInTimeZone({
          utc: startUtc,
          timeZone: eventTimezone,
        });
        return {
          eventId,
          kind: "allDay" as const,
          startUtc,
          endUtc: null,
          // Store the calendar date in the event timezone, not server local time.
          localDate: new Date(`${localIso}T00:00:00.000Z`),
        };
      }

      return {
        eventId,
        kind: "timed" as const,
        startUtc: zonedDateTimeToUtc({
          dateMmddyyyy: d.date,
          timeHHmm: d.startTime!,
          timeZone: eventTimezone,
        }),
        endUtc: zonedDateTimeToUtc({
          dateMmddyyyy: d.date,
          timeHHmm: d.endTime!,
          timeZone: eventTimezone,
        }),
        localDate: null,
      };
    });

    await prisma.eventDate.createMany({ data: dateRows });
  }

  // Rebuild section_cards
  await prisma.sectionCard.deleteMany({ where: { eventId } });
  if (sections && sections.length > 0) {
    const sectionRows = sections.map((s) =>
      buildSectionCardRow({ eventId, section: s })
    );
    await prisma.sectionCard.createMany({ data: sectionRows });
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

export async function toggleSaveEvent(
  eventId: string
): Promise<
  { status: number; saved: boolean } | { status: number; error: string }
> {
  const session = await auth();

  if (!session) {
    console.error("No user session found");
    return {
      error: "No user session found",
      status: 401,
    };
  }

  if (!session.user?.id) {
    console.error("No user ID in session");
    return {
      error: "No user ID in session",
      status: 401,
    };
  }

  try {
    const result = await toggleSaveCypher(session.user.id, eventId);
    return {
      status: 200,
      saved: result.saved,
    };
  } catch (error) {
    console.error("Error toggling save event:", error);
    return {
      error: "Failed to toggle save event",
      status: 500,
    };
  }
}

export async function getSavedEventIds(): Promise<
  { status: number; eventIds: string[] } | { status: number; error: string }
> {
  const session = await auth();

  if (!session) {
    // Return empty array for unauthenticated users
    return {
      status: 200,
      eventIds: [],
    };
  }

  if (!session.user?.id) {
    return {
      status: 200,
      eventIds: [],
    };
  }

  try {
    const eventIds = await getSavedEventIdsQuery(session.user.id);
    return {
      status: 200,
      eventIds,
    };
  } catch (error) {
    console.error("Error fetching saved event IDs:", error);
    return {
      error: "Failed to fetch saved event IDs",
      status: 500,
    };
  }
}

export async function updateEventTeamMembers(
  eventId: string,
  teamMembers: UserSearchItem[]
): Promise<{ status: number; error?: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Unauthorized",
      status: 401,
    };
  }

  try {
    // Check if event exists and user has permission
    const event = await getEventQuery(eventId);
    if (!event) {
      return {
        error: "Event not found",
        status: 404,
      };
    }

    const authLevel = session.user.auth ?? 0;
    const isEventTeamMember = await isTeamMember(eventId, session.user.id);
    const hasPermission = canUpdateEvent(
      authLevel,
      {
        eventId,
        eventCreatorId: event.eventDetails.creatorId,
        isTeamMember: isEventTeamMember,
      },
      session.user.id
    );

    if (!hasPermission) {
      return {
        error: "You do not have permission to update team members",
        status: 403,
      };
    }

    // Process team members - get user IDs for each team member
    const processedTeamMembers: Array<{
      id: string;
      username: string;
      displayName: string;
    }> = [];
    if (teamMembers && teamMembers.length > 0) {
      for (const member of teamMembers) {
        let userId = member.id;
        if (!userId && member.username) {
          const user = await getUserByUsername(member.username);
          if (user) {
            userId = user.id;
          }
        }
        if (userId) {
          processedTeamMembers.push({
            id: userId,
            username: member.username,
            displayName: member.displayName || "",
          });
        }
      }
    }

    // Update team members using editEventQuery with empty event data
    // We'll create a minimal event object just to update team members
    // Convert roles from Neo4j format (uppercase) to title case format
    // This is necessary because editEventQuery validates roles and expects title case
    const convertedRoles =
      event.roles?.map((role) => ({
        ...role,
        title: fromNeo4jRoleFormat(role.title) || role.title,
      })) || [];

    const minimalEvent: Event = {
      id: eventId,
      createdAt: event.createdAt,
      updatedAt: new Date(),
      eventDetails: event.eventDetails,
      roles: convertedRoles,
      sections: event.sections || [],
      gallery: event.gallery || [],
    };

    await editEventQuery(minimalEvent, processedTeamMembers);

    return {
      status: 200,
    };
  } catch (error) {
    console.error("Error updating team members:", error);
    return {
      error: "Failed to update team members",
      status: 500,
    };
  }
}

export async function updateEventCreator(
  eventId: string,
  newCreator: UserSearchItem | null,
  addOldCreatorAsTeamMember: boolean = false
): Promise<{ status: number; error?: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Unauthorized",
      status: 401,
    };
  }

  try {
    // Check if event exists and user has permission
    const event = await getEventQuery(eventId);
    if (!event) {
      return {
        error: "Event not found",
        status: 404,
      };
    }

    const authLevel = session.user.auth ?? 0;
    const isEventTeamMember = await isTeamMember(eventId, session.user.id);
    const hasPermission = canUpdateEvent(
      authLevel,
      {
        eventId,
        eventCreatorId: event.eventDetails.creatorId,
        isTeamMember: isEventTeamMember,
      },
      session.user.id
    );

    if (!hasPermission) {
      return {
        error: "You do not have permission to update the creator",
        status: 403,
      };
    }

    if (!newCreator) {
      return {
        error: "New creator is required",
        status: 400,
      };
    }

    // Get new creator user ID
    let newCreatorId = newCreator.id;
    if (!newCreatorId && newCreator.username) {
      const user = await getUserByUsername(newCreator.username);
      if (!user) {
        return {
          error: "New creator user not found",
          status: 404,
        };
      }
      newCreatorId = user.id;
    }

    if (!newCreatorId) {
      return {
        error: "New creator ID is required",
        status: 400,
      };
    }

    const oldCreatorId = event.eventDetails.creatorId;

    // If ownership is changing
    if (oldCreatorId && oldCreatorId !== newCreatorId) {
      // Add old creator as team member if requested
      // Note: This will be handled by updateEventTeamMembers if the old creator
      // is included in the team members list, but we add it here as a safety measure
      if (addOldCreatorAsTeamMember) {
        await addTeamMember(eventId, oldCreatorId);
      }

      // Update creator relationship in Neo4j
      const neo4jSession = driver.session();
      try {
        // Delete old CREATED relationship
        await neo4jSession.run(
          `
          MATCH (oldCreator:User)-[r:CREATED]->(e:Event {id: $eventId})
          DELETE r
          `,
          { eventId }
        );

        // Create new CREATED relationship
        await neo4jSession.run(
          `
          MATCH (e:Event {id: $eventId})
          MATCH (newCreator:User {id: $newCreatorId})
          MERGE (newCreator)-[:CREATED]->(e)
          `,
          { eventId, newCreatorId }
        );
      } finally {
        await neo4jSession.close();
      }

      // Update event details with new creator ID using editEventQuery
      // This ensures the creatorId is updated in the event node
      // We preserve existing team members by getting them from the database
      const updatedEventDetails: EventDetails = {
        ...event.eventDetails,
        creatorId: newCreatorId,
      };

      // Convert roles from Neo4j format (uppercase) to title case format
      // This is necessary because editEventQuery validates roles and expects title case
      const convertedRoles =
        event.roles?.map((role) => ({
          ...role,
          title: fromNeo4jRoleFormat(role.title) || role.title,
        })) || [];

      const minimalEvent: Event = {
        id: eventId,
        createdAt: event.createdAt,
        updatedAt: new Date(),
        eventDetails: updatedEventDetails,
        roles: convertedRoles,
        sections: event.sections || [],
        gallery: event.gallery || [],
      };

      // Get current team members to preserve them (including old creator if we just added them)
      const { getEventTeamMembers } = await import("@/db/queries/team-member");
      const teamMemberIds = await getEventTeamMembers(eventId);
      const { getUser } = await import("@/db/queries/user");
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
      const processedTeamMembers = teamMembersData.filter(
        (member): member is NonNullable<typeof member> => member !== null
      );

      // Update event with new creator ID, preserving current team members
      // The team members will be updated separately by updateEventTeamMembers
      await editEventQuery(minimalEvent, processedTeamMembers);
    }

    // Update corresponding PostgreSQL Event record
    await prisma.event.upsert({
      where: { eventId: eventId },
      update: {
        userId: newCreatorId,
        creator: true,
      },
      create: {
        eventId: eventId,
        userId: newCreatorId,
        creator: true,
      },
    });

    return {
      status: 200,
    };
  } catch (error) {
    console.error("Error updating creator:", error);
    return {
      error: "Failed to update creator",
      status: 500,
    };
  }
}
