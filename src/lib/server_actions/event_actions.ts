"use server";
import { auth } from "@/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import sharp from "sharp";
import {
  deleteFromR2,
  uploadEventPosterToR2,
  uploadEventGalleryToR2,
  uploadSectionPosterToR2,
  uploadToR2,
} from "../R2";
import {
  insertEvent,
  editEvent as editEventQuery,
  getEvent as getEventQuery,
  toggleSaveCypher,
  getSavedEventIds as getSavedEventIdsQuery,
  getCityFromNeo4j,
  storeCityData,
} from "@/db/queries/event";
import { Event, EventDetails, Section, Video } from "@/types/event";
import { Image } from "@/types/image";
import { generateSlugId } from "@/lib/utils";
import { prisma } from "@/lib/primsa";
import driver from "@/db/driver";
import { canUpdateEvent } from "@/lib/utils/auth-utils";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import {
  setVideoRoles,
  setSectionWinners,
  setSectionJudges,
  isTeamMember,
  addTeamMember,
  isEventCreator,
} from "@/db/queries/team-member";
import { getUserByUsername } from "@/db/queries/user";
import { UserSearchItem } from "@/types/user";
import {
  VIDEO_ROLE_WINNER,
  VIDEO_ROLE_DANCER,
  fromNeo4jRoleFormat,
} from "@/lib/utils/roles";
import {
  createTagNotification,
  createNotification,
} from "@/lib/utils/request-utils";
import { getEventTitle, getVideoTitle } from "@/db/queries/team-member";
import { normalizeTime, isAllDayEvent } from "@/lib/utils/event-utils";
import { normalizeStyleNames } from "@/lib/utils/style-utils";
import {
  parseMmddyyyy,
  zonedDateTimeToUtc,
  zonedStartOfDayToUtc,
  localIsoDateInTimeZone,
} from "@/lib/utils/timezone-utils";
import { getPlaceDetails, getTimezone } from "@/lib/google-places";
import { City } from "@/types/city";
import {
  getCitySlug,
  revalidateCalendarForSlugs,
} from "@/lib/server_actions/calendar_revalidation";

const DEFAULT_POSTER_BG_COLOR = "#ffffff";

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
};

const buildPosterBuffers = async (
  file: File,
  bgColor: string | undefined,
): Promise<{ originalBuffer: Buffer; thumbnailBuffer: Buffer }> => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const bgRgb = hexToRgb(bgColor || DEFAULT_POSTER_BG_COLOR);
  const THUMBNAIL_SIZE = 500;

  const thumbnailBuffer = await sharp(buffer)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: "contain",
      background: bgRgb,
    })
    .toBuffer();

  return { originalBuffer: buffer, thumbnailBuffer };
};

// Unified form props interface - matches FormValues from event-form.tsx
interface addEventProps {
  eventDetails: {
    creatorId?: string;
    title: string;
    city: {
      id: string;
      name: string;
      countryCode: string;
      region: string;
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
    prize?: string;
    poster?: {
      id: string;
      title: string;
      url: string;
      file: File | null;
    } | null;
    originalPoster?: {
      id: string;
      title: string;
      url: string;
      file: File | null;
    } | null;
    bgColor?: string;
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
    website?: string;
    instagram?: string;
    youtube?: string;
    facebook?: string;
  };
  sections: {
    id: string;
    title: string;
    description?: string;
    sectionType: string;
    hasBrackets: boolean;
    styles?: string[];
    applyStylesToVideos?: boolean;
    bgColor?: string;
    videos: {
      id: string;
      title: string;
      src: string;
      type: "battle" | "freestyle" | "choreography" | "class" | "other";
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
        type: "battle" | "freestyle" | "choreography" | "class" | "other";
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
      const bgColor = props.eventDetails.bgColor || DEFAULT_POSTER_BG_COLOR;
      const file = props.eventDetails.poster.file;

      // Parse background color to RGB for sharp
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : { r: 255, g: 255, b: 255 }; // Default to white
      };

      const bgRgb = hexToRgb(bgColor);

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Detect image format
      const metadata = await sharp(buffer).metadata();
      const format = metadata.format;

      // Generate thumbnail (500x500px) with quality preservation
      const THUMBNAIL_SIZE = 500;
      let sharpInstance = sharp(buffer).resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: "contain",
        background: bgRgb,
        kernel: sharp.kernel.lanczos3, // High-quality resampling
      });

      // Apply format-specific quality settings
      if (format === "jpeg" || format === "jpg") {
        sharpInstance = sharpInstance.jpeg({ quality: 95, mozjpeg: true });
      } else if (format === "png") {
        sharpInstance = sharpInstance.png({
          compressionLevel: 6, // Balance between quality and file size
          palette: false, // Preserve full color depth
        });
      } else if (format === "webp") {
        sharpInstance = sharpInstance.webp({ quality: 95 });
      } else if (format === "avif") {
        sharpInstance = sharpInstance.avif({ quality: 95 });
      }
      // For other formats, use default settings

      const thumbnailBuffer = await sharpInstance.toBuffer();
      const originalBuffer = buffer;

      // Create File objects from buffers for upload
      const originalFile = new File(
        [new Uint8Array(originalBuffer)],
        file.name,
        {
          type: file.type,
        },
      );
      const thumbnailFile = new File(
        [new Uint8Array(thumbnailBuffer)],
        `thumbnail-${file.name}`,
        { type: file.type },
      );

      // Upload original poster
      const originalResult = await uploadToR2(
        originalFile,
        "event-poster",
        eventId,
      );

      // Upload thumbnail
      const thumbnailResult = await uploadToR2(
        thumbnailFile,
        "event-poster",
        eventId,
      );

      if (
        originalResult.success &&
        originalResult.url &&
        thumbnailResult.success &&
        thumbnailResult.url
      ) {
        // Store thumbnail URL in poster (for display)
        props.eventDetails.poster = {
          ...props.eventDetails.poster,
          id: thumbnailResult.id || props.eventDetails.poster.id,
          url: thumbnailResult.url,
          file: null,
        };
        // Store original URL in originalPoster
        props.eventDetails.originalPoster = {
          id: originalResult.id || crypto.randomUUID(),
          title: props.eventDetails.poster.title || "Poster original",
          url: originalResult.url,
          file: null,
        };
      }
    }

    // Upload gallery files
    const galleryFiles = props.gallery.filter((item) => item.file);
    if (galleryFiles.length > 0) {
      const galleryResults = await uploadEventGalleryToR2(
        galleryFiles.map((item) => item.file!),
        eventId,
      );
      galleryResults.forEach((result, index) => {
        const originalItem = galleryFiles[index];
        const galleryIndex = props.gallery.findIndex(
          (g) => g.id === originalItem.id,
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
        const { thumbnailBuffer } = await buildPosterBuffers(
          section.poster.file,
          section.bgColor,
        );
        const thumbnailFile = new File(
          [new Uint8Array(thumbnailBuffer)],
          `thumbnail-${section.poster.file.name}`,
          { type: section.poster.file.type },
        );

        const posterResult = await uploadSectionPosterToR2(
          thumbnailFile,
          eventId,
          section.id,
        );
        if (posterResult.success) {
          section.poster = {
            ...section.poster,
            id: posterResult.id!,
            url: posterResult.url!,
            file: null,
            type: "poster" as const,
          };
          section.bgColor = section.bgColor || DEFAULT_POSTER_BG_COLOR;
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
          sectionType: section.sectionType as Section["sectionType"],
          description: section.description ?? "",
          hasBrackets: true,
          brackets: section.brackets,
          videos: [],
          poster,
          bgColor: section.bgColor || DEFAULT_POSTER_BG_COLOR,
        };
      } else {
        return {
          ...sectionWithoutBrackets,
          sectionType: section.sectionType as Section["sectionType"],
          description: section.description ?? "",
          hasBrackets: false,
          brackets: [],
          videos: section.videos,
          poster,
          bgColor: section.bgColor || DEFAULT_POSTER_BG_COLOR,
        };
      }
    });

    // Get timezone for city - check Neo4j first to avoid API calls
    let normalizedTimezone = "";
    const existingCity = await getCityFromNeo4j(props.eventDetails.city.id);

    if (
      existingCity?.timezone &&
      existingCity?.latitude &&
      existingCity?.longitude
    ) {
      // Use stored data - NO API CALLS
      normalizedTimezone = existingCity.timezone;
    } else if (existingCity?.latitude && existingCity?.longitude) {
      // Only fetch timezone - 1 API CALL
      try {
        const timezoneResult = await getTimezone(
          existingCity.latitude!,
          existingCity.longitude!,
        );
        normalizedTimezone = timezoneResult.timeZoneId;
        // Update city in Neo4j with timezone
        await storeCityData({
          ...existingCity,
          timezone: normalizedTimezone,
        });
      } catch (error) {
        console.error("Failed to fetch timezone", error);
        return {
          error: "Failed to fetch timezone",
          status: 500,
          event: null,
        };
      }
    } else {
      // Fetch place details + timezone - 2 API CALLS (only for new cities)
      // Only attempt if city.id looks like a valid Google place_id
      // Google place_ids are typically long alphanumeric strings
      const cityId = props.eventDetails.city.id;
      const looksLikePlaceId =
        cityId && cityId.length > 10 && /^[A-Za-z0-9_-]+$/.test(cityId);

      if (!looksLikePlaceId && existingCity) {
        // City exists in Neo4j but missing coordinates - use existing data
        // This shouldn't happen normally, but handle gracefully
        console.warn(
          `City ${cityId} exists in Neo4j but missing coordinates. Using form data.`,
        );
        normalizedTimezone = existingCity.timezone || "UTC";
      } else if (looksLikePlaceId) {
        try {
          const placeDetails = await getPlaceDetails(cityId);
          const timezoneResult = await getTimezone(
            placeDetails.geometry.location.lat,
            placeDetails.geometry.location.lng,
          );
          normalizedTimezone = timezoneResult.timeZoneId;

          // Extract city data from place details
          const region =
            placeDetails.address_components.find((ac) =>
              ac.types.includes("administrative_area_level_1"),
            )?.short_name || "";
          const countryCode =
            placeDetails.address_components.find((ac) =>
              ac.types.includes("country"),
            )?.short_name || "";

          // Store in Neo4j for future use
          const cityData: City = {
            id: placeDetails.place_id,
            name: placeDetails.name || placeDetails.formatted_address,
            region,
            countryCode,
            latitude: placeDetails.geometry.location.lat,
            longitude: placeDetails.geometry.location.lng,
            timezone: normalizedTimezone,
          };
          await storeCityData(cityData);
        } catch (error) {
          console.error("Failed to fetch city details", error);
          // If we have existing city data, use it as fallback
          if (existingCity) {
            console.warn("Falling back to existing city data from Neo4j");
            normalizedTimezone = existingCity.timezone || "UTC";
          } else {
            return {
              error: `Failed to fetch city details: ${error instanceof Error ? error.message : "Unknown error"}`,
              status: 500,
              event: null,
            };
          }
        }
      } else {
        // Invalid city ID format - use form data as fallback
        console.warn(`Invalid city ID format: ${cityId}. Using form data.`);
        normalizedTimezone = existingCity?.timezone || "UTC";
      }
    }

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
      prize: props.eventDetails.prize,
      dates: normalizedDates,
      schedule: props.eventDetails.schedule ?? "",
      poster: props.eventDetails.poster as Image | null,
      originalPoster: props.eventDetails.originalPoster as Image | null,
      eventType: props.eventDetails.eventType || "Other",
      styles: props.eventDetails.styles,
      status: "visible", // Default status to visible
      website: props.eventDetails.website,
      instagram: props.eventDetails.instagram,
      youtube: props.eventDetails.youtube,
      facebook: props.eventDetails.facebook,
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

    // Create notifications for all newly tagged users
    const eventTitle = await getEventTitle(event.id);
    if (!eventTitle) {
      console.warn(`⚠️ [addEvent] Could not fetch event title for ${event.id}`);
    }

    // Helper to get userId from UserSearchItem
    const getUserIdFromUser = async (user: UserSearchItem): Promise<string> => {
      if (user.id) return user.id;
      if (!user.username) {
        throw new Error("User must have id or username");
      }
      const userRecord = await getUserByUsername(user.username);
      if (!userRecord?.id) {
        throw new Error(`User not found: ${user.username}`);
      }
      return userRecord.id;
    };

    // Notify event-level roles
    if (props.roles && props.roles.length > 0) {
      for (const role of props.roles) {
        if (role.user) {
          try {
            const userId = await getUserIdFromUser(role.user);
            await createTagNotification(userId, {
              eventId: event.id,
              eventTitle: eventTitle || event.id,
              role: role.title,
            });
          } catch (notifError) {
            console.error(
              `❌ [addEvent] Error creating notification for role ${role.title}:`,
              notifError,
            );
          }
        }
      }
    }

    // Notify video tags
    for (const section of processedSections) {
      // Section videos
      for (const video of section.videos || []) {
        const allTaggedUsers = [
          ...(video.taggedDancers || []),
          ...(video.taggedWinners || []),
          ...(video.taggedChoreographers || []),
          ...(video.taggedTeachers || []),
        ];

        const videoTitle = await getVideoTitle(video.id);

        for (const user of allTaggedUsers) {
          try {
            const userId = await getUserIdFromUser(user);
            const roles: string[] = [];
            if (
              video.taggedDancers?.some((u) => u.username === user.username)
            ) {
              roles.push(VIDEO_ROLE_DANCER);
            }
            if (
              video.taggedWinners?.some((u) => u.username === user.username)
            ) {
              roles.push(VIDEO_ROLE_WINNER);
            }
            if (
              video.taggedChoreographers?.some(
                (u) => u.username === user.username,
              )
            ) {
              roles.push("CHOREOGRAPHER");
            }
            if (
              video.taggedTeachers?.some((u) => u.username === user.username)
            ) {
              roles.push("TEACHER");
            }

            // Create notification for each role
            for (const role of roles) {
              await createTagNotification(userId, {
                eventId: event.id,
                eventTitle: eventTitle || event.id,
                sectionId: section.id,
                sectionTitle: section.title,
                videoId: video.id,
                videoTitle: videoTitle || video.id,
                role: fromNeo4jRoleFormat(role) || role,
              });
            }
          } catch (notifError) {
            console.error(
              `❌ [addEvent] Error creating notification for video tag:`,
              notifError,
            );
          }
        }
      }

      // Bracket videos
      for (const bracket of section.brackets || []) {
        for (const video of bracket.videos || []) {
          const allTaggedUsers = [
            ...(video.taggedDancers || []),
            ...(video.taggedWinners || []),
            ...(video.taggedChoreographers || []),
            ...(video.taggedTeachers || []),
          ];

          const videoTitle = await getVideoTitle(video.id);

          for (const user of allTaggedUsers) {
            try {
              const userId = await getUserIdFromUser(user);
              const roles: string[] = [];
              if (
                video.taggedDancers?.some((u) => u.username === user.username)
              ) {
                roles.push(VIDEO_ROLE_DANCER);
              }
              if (
                video.taggedWinners?.some((u) => u.username === user.username)
              ) {
                roles.push(VIDEO_ROLE_WINNER);
              }
              if (
                video.taggedChoreographers?.some(
                  (u) => u.username === user.username,
                )
              ) {
                roles.push("CHOREOGRAPHER");
              }
              if (
                video.taggedTeachers?.some((u) => u.username === user.username)
              ) {
                roles.push("TEACHER");
              }

              // Create notification for each role
              for (const role of roles) {
                await createTagNotification(userId, {
                  eventId: event.id,
                  eventTitle: eventTitle || event.id,
                  sectionId: section.id,
                  sectionTitle: section.title,
                  videoId: video.id,
                  videoTitle: videoTitle || video.id,
                  role: fromNeo4jRoleFormat(role) || role,
                });
              }
            } catch (notifError) {
              console.error(
                `❌ [addEvent] Error creating notification for bracket video tag:`,
                notifError,
              );
            }
          }
        }
      }

      // Section winners
      if (section.winners && section.winners.length > 0) {
        for (const winner of section.winners) {
          try {
            const userId = await getUserIdFromUser(winner);
            await createTagNotification(userId, {
              eventId: event.id,
              eventTitle: eventTitle || event.id,
              sectionId: section.id,
              sectionTitle: section.title,
              role: "Winner",
            });
          } catch (notifError) {
            console.error(
              `❌ [addEvent] Error creating notification for section winner:`,
              notifError,
            );
          }
        }
      }

      // Section judges
      if (section.judges && section.judges.length > 0) {
        for (const judge of section.judges) {
          try {
            const userId = await getUserIdFromUser(judge);
            await createTagNotification(userId, {
              eventId: event.id,
              eventTitle: eventTitle || event.id,
              sectionId: section.id,
              sectionTitle: section.title,
              role: "Judge",
            });
          } catch (notifError) {
            console.error(
              `❌ [addEvent] Error creating notification for section judge:`,
              notifError,
            );
          }
        }
      }
    }

    // Revalidate events list page to show new event
    revalidatePath("/events");
    // Also revalidate the individual event page
    revalidatePath(`/events/${result.id}`);
    // Revalidate TV page
    revalidatePath("/watch");
    revalidateTag("watch-sections", "");
    // Revalidate cached style filter lists
    revalidateTag("event-styles", "");

    const newCitySlug = getCitySlug(props.eventDetails.city as City);
    revalidateCalendarForSlugs([newCitySlug]);

    // Revalidate profiles for all users with roles
    if (props.roles && props.roles.length > 0) {
      for (const role of props.roles) {
        if (role.user) {
          try {
            const userId = await getUserIdFromUser(role.user);
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { username: true },
            });
            if (user?.username) {
              revalidatePath(`/profiles/${user.username}`);
            }
          } catch (error) {
            console.error(`Failed to revalidate profile for role user:`, error);
          }
        }
      }
    }

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
  editedEvent: addEventProps,
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

  // Get old event with authorization check
  const oldEvent = await getEventQuery(
    eventId,
    session.user.id,
    session.user.auth ?? 0,
  );

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
    session.user.id,
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
    if (
      oldEvent.eventDetails.originalPoster &&
      !editedEvent.eventDetails.originalPoster
    ) {
      await deleteFromR2(oldEvent.eventDetails.originalPoster.url);
    }

    // Upload new poster if exists. Delete old poster if it exists.
    if (editedEvent.eventDetails.poster?.file) {
      // Delete old poster if it exists and is being replaced
      if (oldEvent.eventDetails.poster) {
        await deleteFromR2(oldEvent.eventDetails.poster.url);
      }
      if (oldEvent.eventDetails.originalPoster) {
        await deleteFromR2(oldEvent.eventDetails.originalPoster.url);
      }

      const bgColor =
        editedEvent.eventDetails.bgColor || DEFAULT_POSTER_BG_COLOR;
      const file = editedEvent.eventDetails.poster.file;

      // Parse background color to RGB for sharp
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : { r: 255, g: 255, b: 255 }; // Default to white
      };

      const bgRgb = hexToRgb(bgColor);

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Detect image format
      const metadata = await sharp(buffer).metadata();
      const format = metadata.format;

      // Generate thumbnail (500x500px) with quality preservation
      const THUMBNAIL_SIZE = 500;
      let sharpInstance = sharp(buffer).resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: "contain",
        background: bgRgb,
        kernel: sharp.kernel.lanczos3, // High-quality resampling
      });

      // Apply format-specific quality settings
      if (format === "jpeg" || format === "jpg") {
        sharpInstance = sharpInstance.jpeg({ quality: 95, mozjpeg: true });
      } else if (format === "png") {
        sharpInstance = sharpInstance.png({
          compressionLevel: 6, // Balance between quality and file size
          palette: false, // Preserve full color depth
        });
      } else if (format === "webp") {
        sharpInstance = sharpInstance.webp({ quality: 95 });
      } else if (format === "avif") {
        sharpInstance = sharpInstance.avif({ quality: 95 });
      }
      // For other formats, use default settings

      const thumbnailBuffer = await sharpInstance.toBuffer();
      const originalBuffer = buffer;

      // Create File objects from buffers for upload
      const originalFile = new File(
        [new Uint8Array(originalBuffer)],
        file.name,
        {
          type: file.type,
        },
      );
      const thumbnailFile = new File(
        [new Uint8Array(thumbnailBuffer)],
        `thumbnail-${file.name}`,
        { type: file.type },
      );

      // Upload original poster
      const originalResult = await uploadToR2(
        originalFile,
        "event-poster",
        eventId,
      );

      // Upload thumbnail
      const thumbnailResult = await uploadToR2(
        thumbnailFile,
        "event-poster",
        eventId,
      );

      if (
        originalResult.success &&
        originalResult.url &&
        thumbnailResult.success &&
        thumbnailResult.url
      ) {
        // Store thumbnail URL in poster (for display)
        editedEvent.eventDetails.poster = {
          ...editedEvent.eventDetails.poster,
          id: thumbnailResult.id || editedEvent.eventDetails.poster.id,
          url: thumbnailResult.url,
          file: null,
        };
        // Store original URL in originalPoster
        editedEvent.eventDetails.originalPoster = {
          id: originalResult.id || crypto.randomUUID(),
          title: editedEvent.eventDetails.poster.title || "Poster original",
          url: originalResult.url,
          file: null,
        };
      }
    }

    // Upload gallery files
    const galleryFiles = editedEvent.gallery.filter((item) => item.file);
    if (galleryFiles.length > 0) {
      const galleryResults = await uploadEventGalleryToR2(
        galleryFiles.map((item) => item.file!),
        eventId,
      );
      galleryResults.forEach((result, index) => {
        const originalItem = galleryFiles[index];
        const galleryIndex = editedEvent.gallery.findIndex(
          (g) => g.id === originalItem.id,
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
          (s) => s.id === oldSection.id,
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

        const { thumbnailBuffer } = await buildPosterBuffers(
          section.poster.file,
          section.bgColor,
        );
        const thumbnailFile = new File(
          [new Uint8Array(thumbnailBuffer)],
          `thumbnail-${section.poster.file.name}`,
          { type: section.poster.file.type },
        );

        const posterResult = await uploadSectionPosterToR2(
          thumbnailFile,
          eventId,
          section.id,
        );
        if (posterResult.success) {
          section.poster = {
            ...section.poster,
            id: posterResult.id!,
            url: posterResult.url!,
            file: null,
            type: "poster" as const,
          };
          section.bgColor = section.bgColor || DEFAULT_POSTER_BG_COLOR;
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
          sectionType: section.sectionType as Section["sectionType"],
          description: section.description ?? "",
          hasBrackets: true,
          brackets: section.brackets,
          videos: [],
          poster,
          bgColor: section.bgColor || DEFAULT_POSTER_BG_COLOR,
        };
      } else {
        return {
          ...sectionWithoutBrackets,
          sectionType: section.sectionType as Section["sectionType"],
          description: section.description ?? "",
          hasBrackets: false,
          brackets: [],
          videos: section.videos,
          poster,
          bgColor: section.bgColor || DEFAULT_POSTER_BG_COLOR,
        };
      }
    });

    // Get timezone for city - check Neo4j first to avoid API calls
    let timezone = oldEvent.eventDetails.city.timezone || "";

    // Only make API calls if city changed AND new city data is missing
    if (editedEvent.eventDetails.city.id !== oldEvent.eventDetails.city.id) {
      const existingCity = await getCityFromNeo4j(
        editedEvent.eventDetails.city.id,
      );

      if (
        existingCity?.timezone &&
        existingCity?.latitude &&
        existingCity?.longitude
      ) {
        // Use stored data - NO API CALLS
        timezone = existingCity.timezone;
      } else if (existingCity?.latitude && existingCity?.longitude) {
        // Only fetch timezone - 1 API CALL
        try {
          const timezoneResult = await getTimezone(
            existingCity.latitude!,
            existingCity.longitude!,
          );
          timezone = timezoneResult.timeZoneId;
          // Update city in Neo4j with timezone
          await storeCityData({
            ...existingCity,
            timezone,
          });
        } catch (error) {
          console.error("Failed to fetch timezone", error);
          return {
            error: "Failed to fetch timezone",
            status: 500,
            event: null,
          };
        }
      } else {
        // Fetch place details + timezone - 2 API CALLS (only for new cities)
        try {
          const placeDetails = await getPlaceDetails(
            editedEvent.eventDetails.city.id,
          );
          const timezoneResult = await getTimezone(
            placeDetails.geometry.location.lat,
            placeDetails.geometry.location.lng,
          );
          timezone = timezoneResult.timeZoneId;

          // Extract city data from place details
          const region =
            placeDetails.address_components.find((ac) =>
              ac.types.includes("administrative_area_level_1"),
            )?.short_name || "";
          const countryCode =
            placeDetails.address_components.find((ac) =>
              ac.types.includes("country"),
            )?.short_name || "";

          // Store in Neo4j for future use
          const cityData: City = {
            id: placeDetails.place_id,
            name: placeDetails.name || placeDetails.formatted_address,
            region,
            countryCode,
            latitude: placeDetails.geometry.location.lat,
            longitude: placeDetails.geometry.location.lng,
            timezone,
          };
          await storeCityData(cityData);
        } catch (error) {
          console.error("Failed to fetch city details", error);
          return {
            error: "Failed to fetch city details",
            status: 500,
            event: null,
          };
        }
      }
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
    // Preserve status from old event (status is managed separately in Event Settings)
    const eventDetails: EventDetails = {
      creatorId: oldEvent.eventDetails.creatorId,
      title: editedEvent.eventDetails.title,
      description: editedEvent.eventDetails.description ?? "",
      location: editedEvent.eventDetails.location,
      cost: editedEvent.eventDetails.cost,
      prize: editedEvent.eventDetails.prize,
      // Derive startDate from first date in dates array for database compatibility
      dates: normalizedDates,
      schedule: editedEvent.eventDetails.schedule ?? "",
      poster: editedEvent.eventDetails.poster as Image | null,
      originalPoster: editedEvent.eventDetails.originalPoster as Image | null,
      eventType: editedEvent.eventDetails.eventType || "Other",
      styles: editedEvent.eventDetails.styles,
      status: oldEvent.eventDetails.status || "visible", // Preserve existing status
      website: editedEvent.eventDetails.website,
      instagram: editedEvent.eventDetails.instagram,
      youtube: editedEvent.eventDetails.youtube,
      facebook: editedEvent.eventDetails.facebook,
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

    if (result) {
      // Helper function to get userId from UserSearchItem
      const getUserId = async (user: UserSearchItem): Promise<string> => {
        if (user.id) {
          return user.id;
        }
        if (!user.username) {
          throw new Error(
            `User must have either id or username. Got: ${JSON.stringify(user)}`,
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
            (s) => s.id === newSection.id,
          );

          // Process section videos
          for (const newVideo of newSection.videos || []) {
            const oldVideo = oldSection?.videos.find(
              (v) => v.id === newVideo.id,
            );
            await processVideoTagDiffs(
              newVideo,
              oldVideo,
              eventId,
              newSection.id,
              newSection.title,
              getUserId,
            );
          }

          // Process bracket videos
          for (const newBracket of newSection.brackets || []) {
            const oldBracket = oldSection?.brackets.find(
              (b) => b.id === newBracket.id,
            );

            for (const newVideo of newBracket.videos || []) {
              const oldVideo = oldBracket?.videos.find(
                (v) => v.id === newVideo.id,
              );
              await processVideoTagDiffs(
                newVideo,
                oldVideo,
                eventId,
                newSection.id,
                newSection.title,
                getUserId,
              );
            }
          }

          // Process section winners
          const oldWinners = oldSection?.winners || [];
          const newWinners = newSection.winners || [];

          const oldWinnerUsernames = new Set(
            oldWinners.map((w) => w.username).filter(Boolean),
          );
          const newWinnerUsernames = new Set(
            newWinners.map((w) => w.username).filter(Boolean),
          );

          const winnersChanged =
            oldWinnerUsernames.size !== newWinnerUsernames.size ||
            [...oldWinnerUsernames].some(
              (username) => !newWinnerUsernames.has(username),
            ) ||
            [...newWinnerUsernames].some(
              (username) => !oldWinnerUsernames.has(username),
            );

          if (winnersChanged) {
            try {
              if (newWinners.length > 0) {
                const winnerUserIds = await Promise.all(
                  newWinners.map((winner) => getUserId(winner)),
                );
                console.log(
                  `🟢 [editEvent] Setting ${winnerUserIds.length} winners for section ${newSection.id}`,
                );
                await setSectionWinners(eventId, newSection.id, winnerUserIds);

                // Create notifications for newly tagged winners
                const eventTitle = await getEventTitle(eventId);
                const newlyTaggedWinners = newWinners.filter(
                  (w) => !oldWinnerUsernames.has(w.username),
                );
                for (const winner of newlyTaggedWinners) {
                  try {
                    const userId = await getUserId(winner);
                    await createTagNotification(userId, {
                      eventId,
                      eventTitle: eventTitle || eventId,
                      sectionId: newSection.id,
                      sectionTitle: newSection.title,
                      role: "Winner",
                    });
                  } catch (notifError) {
                    console.error(
                      `❌ [editEvent] Error creating notification for winner ${winner.username}:`,
                      notifError,
                    );
                  }
                }
              } else {
                console.log(
                  `🟢 [editEvent] Removing all winners from section ${newSection.id}`,
                );
                await setSectionWinners(eventId, newSection.id, []);
              }
            } catch (winnerError) {
              console.error(
                `❌ [editEvent] Error setting section winners:`,
                winnerError,
              );
            }
          }

          // Process section judges
          const oldJudges = oldSection?.judges || [];
          const newJudges = newSection.judges || [];

          const oldJudgeUsernames = new Set(
            oldJudges.map((j) => j.username).filter(Boolean),
          );
          const newJudgeUsernames = new Set(
            newJudges.map((j) => j.username).filter(Boolean),
          );

          const judgesChanged =
            oldJudgeUsernames.size !== newJudgeUsernames.size ||
            [...oldJudgeUsernames].some(
              (username) => !newJudgeUsernames.has(username),
            ) ||
            [...newJudgeUsernames].some(
              (username) => !oldJudgeUsernames.has(username),
            );

          if (judgesChanged) {
            try {
              if (newJudges.length > 0) {
                const judgeUserIds = await Promise.all(
                  newJudges.map((judge) => getUserId(judge)),
                );
                console.log(
                  `🟢 [editEvent] Setting ${judgeUserIds.length} judges for section ${newSection.id}`,
                );
                await setSectionJudges(eventId, newSection.id, judgeUserIds);

                // Create notifications for newly tagged judges
                const eventTitle = await getEventTitle(eventId);
                const newlyTaggedJudges = newJudges.filter(
                  (j) => !oldJudgeUsernames.has(j.username),
                );
                for (const judge of newlyTaggedJudges) {
                  try {
                    const userId = await getUserId(judge);
                    await createTagNotification(userId, {
                      eventId,
                      eventTitle: eventTitle || eventId,
                      sectionId: newSection.id,
                      sectionTitle: newSection.title,
                      role: "Judge",
                    });
                  } catch (notifError) {
                    console.error(
                      `❌ [editEvent] Error creating notification for judge ${judge.username}:`,
                      notifError,
                    );
                  }
                }
              } else {
                console.log(
                  `🟢 [editEvent] Removing all judges from section ${newSection.id}`,
                );
                await setSectionJudges(eventId, newSection.id, []);
              }
            } catch (judgeError) {
              console.error(
                `❌ [editEvent] Error setting section judges:`,
                judgeError,
              );
            }
          }
        }
      } catch (tagError) {
        console.error("❌ [editEvent] Error processing tag diffs:", tagError);
        throw new Error(
          `Failed to process tag changes: ${
            tagError instanceof Error ? tagError.message : String(tagError)
          }`,
        );
      }
      console.log("✅ [editEvent] Tag diff processing completed");

      // Process event-level role changes and create notifications
      const oldRoles = oldEvent.roles || [];
      const newRoles = editedEvent.roles || [];
      const oldRoleUserIds = new Set(
        oldRoles.map((r) => r.user?.id || r.user?.username).filter(Boolean),
      );
      const newRoleUserIds = new Set(
        newRoles.map((r) => r.user?.id || r.user?.username).filter(Boolean),
      );

      // Find newly added roles
      const newlyTaggedRoles = newRoles.filter(
        (role) =>
          role.user &&
          !oldRoleUserIds.has(role.user.id || role.user.username || ""),
      );

      if (newlyTaggedRoles.length > 0) {
        const eventTitle = await getEventTitle(eventId);
        for (const role of newlyTaggedRoles) {
          if (role.user) {
            try {
              const userId = await getUserId(role.user);
              await createTagNotification(userId, {
                eventId,
                eventTitle: eventTitle || eventId,
                role: role.title,
              });
            } catch (notifError) {
              console.error(
                `❌ [editEvent] Error creating notification for role ${role.title}:`,
                notifError,
              );
            }
          }
        }
      }

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

      // Revalidate events list page to show updated event
      revalidatePath("/events");
      // Also revalidate the individual event page
      revalidatePath(`/events/${eventId}`);
      // Revalidate TV page
      revalidatePath("/watch");
      revalidateTag("watch-sections", "");
      // Revalidate cached style filter lists
      revalidateTag("event-styles", "");

      // Revalidate profiles for all users involved in role changes
      const allAffectedUserIds = new Set([
        ...oldRoleUserIds,
        ...newRoleUserIds,
      ]);
      for (const userIdOrUsername of allAffectedUserIds) {
        if (userIdOrUsername) {
          try {
            const user =
              (await prisma.user.findUnique({
                where: { id: userIdOrUsername as string },
                select: { username: true },
              })) ||
              (await prisma.user.findUnique({
                where: { username: userIdOrUsername as string },
                select: { username: true },
              }));

            if (user?.username) {
              revalidatePath(`/profiles/${user.username}`);
            }
          } catch (error) {
            console.error(
              `Failed to revalidate profile for user ${userIdOrUsername}:`,
              error,
            );
          }
        }
      }

      const sectionIds = Array.from(
        new Set(
          processedSections
            .map((section) => section.id)
            .filter((id): id is string => !!id),
        ),
      );
      for (const sectionId of sectionIds) {
        revalidatePath(`/events/${eventId}/sections/${sectionId}`);
      }

      const oldCitySlug = getCitySlug(
        oldEvent.eventDetails.city as City | undefined,
      );
      const newCitySlug = getCitySlug(
        editedEvent.eventDetails.city as City | undefined,
      );
      revalidateCalendarForSlugs([oldCitySlug, newCitySlug]);

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
  sections: Section[],
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
    0,
  );
  const parsedDate = section.date ? parseMmddyyyy(section.date) : null;

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
    date: parsedDate,
    startTime: section.startTime || null,
    endTime: section.endTime || null,
  };
}

async function upsertEventReadModels(input: {
  eventId: string;
  eventDetails: EventDetails;
  sections: Section[];
}): Promise<void> {
  const { eventId, eventDetails, sections } = input;

  // Normalize timezone format (handle any legacy double underscores)
  const rawTimezone = eventDetails.city.timezone || "";
  const eventTimezone = rawTimezone.replace(/__/g, "/") || null;
  const displayDateLocal = eventDetails.dates?.[0]?.date || null;
  const additionalDatesCount = Math.max(
    0,
    (eventDetails.dates?.length || 0) - 1,
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
      ig: eventDetails.instagram?.trim() || null,
      styles,
      displayDateLocal,
      additionalDatesCount,
      status: eventDetails.status || "visible",
    } as any, // Type assertion until Prisma client is regenerated
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
      ig: eventDetails.instagram?.trim() || null,
      styles,
      displayDateLocal,
      additionalDatesCount,
      status: eventDetails.status || "visible",
    } as any, // Type assertion until Prisma client is regenerated
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
      buildSectionCardRow({ eventId, section: s }),
    );
    await prisma.sectionCard.createMany({ data: sectionRows });
  }
}

// Helper function to process video tag diffs
async function processVideoTagDiffs(
  newVideo: Video,
  oldVideo: Video | undefined,
  eventId: string,
  sectionId: string | undefined,
  sectionTitle: string | undefined,
  getUserId: (user: UserSearchItem) => Promise<string>,
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
    ].filter(Boolean),
  );
  const allNewUsers = new Set(
    [
      ...newTaggedWinners.map((u: UserSearchItem) => u.username),
      ...newTaggedDancers.map((u: UserSearchItem) => u.username),
      ...newTaggedChoreographers.map((u: UserSearchItem) => u.username),
      ...newTaggedTeachers.map((u: UserSearchItem) => u.username),
    ].filter(Boolean),
  );

  // Get event and video titles for notifications
  const [eventTitle, videoTitle] = await Promise.all([
    getEventTitle(eventId),
    getVideoTitle(newVideo.id),
  ]);

  // Process all users in the new set
  for (const username of allNewUsers) {
    const winner = newTaggedWinners.find(
      (u: UserSearchItem) => u.username === username,
    );
    const dancer = newTaggedDancers.find(
      (u: UserSearchItem) => u.username === username,
    );
    const choreographer = newTaggedChoreographers.find(
      (u: UserSearchItem) => u.username === username,
    );
    const teacher = newTaggedTeachers.find(
      (u: UserSearchItem) => u.username === username,
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

      // Create notification for newly tagged users
      if (!allOldUsers.has(username)) {
        // User is newly tagged - create notification for each role
        for (const role of roles) {
          try {
            await createTagNotification(userId, {
              eventId,
              eventTitle: eventTitle || eventId,
              sectionId: sectionId,
              sectionTitle: sectionTitle || undefined,
              videoId: newVideo.id,
              videoTitle: videoTitle || newVideo.id,
              role: fromNeo4jRoleFormat(role) || role,
            });
          } catch (notifError) {
            console.error(
              `❌ [editEvent] Error creating notification for user ${username}:`,
              notifError,
            );
            // Continue with other notifications even if one fails
          }
        }
      }
    } catch (userTagError) {
      console.error(
        `❌ [editEvent] Error setting roles for user ${username} in video ${newVideo.id}:`,
        userTagError,
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
          (u: UserSearchItem) => u.username === username,
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
    const eventData = await getEventQuery(
      eventId,
      session.user.id,
      session.user.auth ?? 0,
    );

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
  eventId: string,
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
    // Get user's auth level
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { auth: true },
    });
    const authLevel = user?.auth ?? 0;

    const eventIds = await getSavedEventIdsQuery(session.user.id, authLevel);
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

/**
 * Get auth-dependent data for an event page
 * Used by client components to determine permissions and user state
 */
export async function getEventAuthData(eventId: string): Promise<{
  status: number;
  data?: {
    isSaved: boolean;
    isCreator: boolean;
    isTeamMember: boolean;
    canEdit: boolean;
    canTagDirectly: boolean;
    currentUserRoles: string[];
    isModeratorOrAdmin: boolean;
  };
  error?: string;
}> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      status: 200,
      data: {
        isSaved: false,
        isCreator: false,
        isTeamMember: false,
        canEdit: false,
        canTagDirectly: false,
        currentUserRoles: [],
        isModeratorOrAdmin: false,
      },
    };
  }

  try {
    const userId = session.user.id;
    const authLevel = session.user.auth ?? 0;

    // Get event to check creator and get roles
    const event = await getEventQuery(eventId, userId, authLevel);
    if (!event) {
      return {
        status: 404,
        error: "Event not found",
      };
    }

    // Check if user is creator
    const isCreator = await isEventCreator(eventId, userId);

    // Check if user is team member
    const isEventTeamMember = await isTeamMember(eventId, userId);

    // Check if user can edit
    const canEdit = canUpdateEvent(
      authLevel,
      {
        eventId: event.id,
        eventCreatorId: event.eventDetails.creatorId,
        isTeamMember: isEventTeamMember,
      },
      userId,
    );

    // Check if user can tag directly
    const canTagDirectly =
      authLevel >= AUTH_LEVELS.MODERATOR || isEventTeamMember || isCreator;

    // Check if user is moderator or admin
    const isModeratorOrAdmin = authLevel >= AUTH_LEVELS.MODERATOR;

    // Get current user's roles for this event
    const currentUserRoles = event.roles
      .filter(
        (role) => role.user?.id === userId && role.title !== "TEAM_MEMBER",
      )
      .map((role) => fromNeo4jRoleFormat(role.title))
      .filter((role): role is string => role !== null);

    // Check if event is saved
    const { isEventSavedByUser } = await import("@/db/queries/event");
    const isSaved = await isEventSavedByUser(userId, eventId);

    return {
      status: 200,
      data: {
        isSaved,
        isCreator,
        isTeamMember: isEventTeamMember,
        canEdit,
        canTagDirectly,
        currentUserRoles,
        isModeratorOrAdmin,
      },
    };
  } catch (error) {
    console.error("Error fetching event auth data:", error);
    return {
      status: 500,
      error: "Failed to fetch event auth data",
    };
  }
}

export async function updateEventTeamMembers(
  eventId: string,
  teamMembers: UserSearchItem[],
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
    const authLevel = session.user.auth ?? 0;
    const event = await getEventQuery(eventId, session.user.id, authLevel);
    if (!event) {
      return {
        error: "Event not found",
        status: 404,
      };
    }
    const isEventTeamMember = await isTeamMember(eventId, session.user.id);
    const hasPermission = canUpdateEvent(
      authLevel,
      {
        eventId,
        eventCreatorId: event.eventDetails.creatorId,
        isTeamMember: isEventTeamMember,
      },
      session.user.id,
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

    // Revalidate events list page and individual event page
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    // Revalidate cached style filter lists
    revalidateTag("event-styles", "");

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
  addOldCreatorAsTeamMember: boolean = false,
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
    const authLevel = session.user.auth ?? 0;
    const event = await getEventQuery(eventId, session.user.id, authLevel);
    if (!event) {
      return {
        error: "Event not found",
        status: 404,
      };
    }
    const isEventTeamMember = await isTeamMember(eventId, session.user.id);
    const hasPermission = canUpdateEvent(
      authLevel,
      {
        eventId,
        eventCreatorId: event.eventDetails.creatorId,
        isTeamMember: isEventTeamMember,
      },
      session.user.id,
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
          { eventId },
        );

        // Create new CREATED relationship
        await neo4jSession.run(
          `
          MATCH (e:Event {id: $eventId})
          MATCH (newCreator:User {id: $newCreatorId})
          MERGE (newCreator)-[:CREATED]->(e)
          `,
          { eventId, newCreatorId },
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
        }),
      );
      const processedTeamMembers = teamMembersData.filter(
        (member): member is NonNullable<typeof member> => member !== null,
      );

      // Update event with new creator ID, preserving current team members
      // The team members will be updated separately by updateEventTeamMembers
      await editEventQuery(minimalEvent, processedTeamMembers);

      // Create notification for new owner
      try {
        const eventTitle = await getEventTitle(eventId);
        const eventDisplayName = eventTitle || eventId;
        await createNotification(
          newCreatorId,
          "OWNERSHIP_TRANSFERRED",
          "New Event Ownership",
          `Ownership of ${eventDisplayName} has been transferred to you|eventId:${eventId}`,
          undefined,
          undefined,
        );
      } catch (notifError) {
        console.error(
          "❌ [updateEventCreator] Error creating ownership notification:",
          notifError,
        );
        // Don't fail the ownership transfer if notification fails
      }
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

    // Revalidate events list page and individual event page
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    // Revalidate TV page
    revalidatePath("/watch");
    revalidateTag("watch-sections", "");
    // Revalidate cached style filter lists
    revalidateTag("event-styles", "");

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

export async function updateEventStatus(
  eventId: string,
  status: "hidden" | "visible",
): Promise<{ status: number } | { status: number; error: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Unauthorized",
      status: 401,
    };
  }

  try {
    // Check if user is the event creator
    const { isEventCreator } = await import("@/db/queries/team-member");
    const isCreator = await isEventCreator(eventId, session.user.id);

    if (!isCreator) {
      return {
        error: "Only event creators can update event status",
        status: 403,
      };
    }

    const event = await getEventQuery(
      eventId,
      session.user.id,
      session.user.auth ?? 0,
    );
    if (!event) {
      return {
        error: "Event not found",
        status: 404,
      };
    }

    // Update status in Neo4j
    const neo4jSession = driver.session();
    try {
      await neo4jSession.run(
        `
        MATCH (e:Event {id: $eventId})
        SET e.status = $status, e.updatedAt = $updatedAt
        `,
        {
          eventId,
          status,
          updatedAt: new Date().toISOString(),
        },
      );
    } finally {
      await neo4jSession.close();
    }

    // Update status in PostgreSQL EventCard
    await prisma.eventCard.update({
      where: { eventId },
      data: { status } as any, // Type assertion until Prisma client is regenerated
    });

    // Revalidate events list page (event visibility changed)
    revalidatePath("/events");
    // Also revalidate the individual event page
    revalidatePath(`/events/${eventId}`);
    // Revalidate TV page
    revalidatePath("/watch");
    revalidateTag("watch-sections", "");
    // Revalidate cached style filter lists
    revalidateTag("event-styles", "");
    const citySlug = getCitySlug(event.eventDetails.city as City | undefined);
    revalidateCalendarForSlugs([citySlug]);

    return {
      status: 200,
    };
  } catch (error) {
    console.error("Error updating event status:", error);
    return {
      error: "Failed to update event status",
      status: 500,
    };
  }
}
