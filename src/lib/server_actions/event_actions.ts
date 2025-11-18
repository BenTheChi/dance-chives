"use server";
import { auth } from "@/auth";
import {
  deleteFromR2,
  uploadEventPosterToR2,
  uploadEventGalleryToR2,
  uploadSubEventPosterToR2,
  uploadWorkshopPosterToR2,
} from "../R2";
import {
  insertEvent,
  EditEvent as editEventQuery,
  getEvent as getEventQuery,
} from "@/db/queries/event";
import { Event, EventDetails, Section, SubEvent, Picture } from "@/types/event";
import { generateSlugId } from "@/lib/utils";
import { prisma } from "@/lib/primsa";
import { canUpdateEvent } from "@/lib/utils/auth-utils";
import {
  setVideoRoles,
  setSectionWinner,
  setSectionWinners,
  isTeamMember,
} from "@/db/queries/team-member";
import { getUserByUsername } from "@/db/queries/user";
import { UserSearchItem } from "@/types/user";
import {
  VIDEO_ROLE_WINNER,
  VIDEO_ROLE_DANCER,
  SECTION_ROLE_WINNER,
} from "@/lib/utils/roles";

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
    styles?: string[];
    applyStylesToVideos?: boolean;
    videos: {
      id: string;
      title: string;
      src: string;
      styles?: string[];
      taggedWinners?: {
        id?: string; // Optional - server can look up by username if not provided
        displayName: string;
        username: string;
      }[];
      taggedDancers?: {
        id?: string; // Optional - server can look up by username if not provided
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
        styles?: string[];
        taggedUsers?: {
          id?: string; // Optional - server can look up by username if not provided
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
      id?: string; // Optional - server can look up by username if not provided
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
  workshops?: {
    id: string;
    workshopDetails: {
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
      cost?: string;
      poster?: {
        id: string;
        title: string;
        url: string;
        type: string;
        file: File | null;
      } | null;
      styles?: string[];
    };
    roles?: {
      id: string;
      title: string;
      user: {
        id?: string;
        displayName: string;
        username: string;
      } | null;
    }[];
    videos: {
      id: string;
      title: string;
      src: string;
      styles?: string[];
      taggedDancers?: {
        id?: string;
        displayName: string;
        username: string;
      }[];
    }[];
    gallery: {
      id: string;
      title: string;
      url: string;
      type: string;
      file: File | null;
    }[];
    associatedEventId?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
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

    // Upload subEvent posters
    for (const subEvent of props.subEvents) {
      if (subEvent.poster?.file) {
        const posterResult = await uploadSubEventPosterToR2(
          subEvent.poster.file,
          eventId,
          subEvent.id
        );
        if (posterResult.success) {
          subEvent.poster = {
            ...subEvent.poster,
            id: posterResult.id!,
            url: posterResult.url!,
            file: null,
          };
        }
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

    // Process sections to handle brackets/videos based on hasBrackets
    const processedSections: Section[] = props.sections.map((section) => {
      const { hasBrackets, ...sectionWithoutBrackets } = section;

      if (hasBrackets) {
        return {
          ...sectionWithoutBrackets,
          description: section.description ?? "",
          hasBrackets: true,
          brackets: section.brackets,
          videos: [],
        };
      } else {
        return {
          ...sectionWithoutBrackets,
          description: section.description ?? "",
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
      description: props.eventDetails.description ?? "",
      address: props.eventDetails.address,
      prize: props.eventDetails.prize,
      entryCost: props.eventDetails.entryCost,
      startDate: props.eventDetails.startDate,
      startTime: props.eventDetails.startTime,
      endTime: props.eventDetails.endTime,
      schedule: props.eventDetails.schedule ?? "",
      poster: props.eventDetails.poster as Picture | null,
      city: {
        ...props.eventDetails.city,
        timezone: timezoneData.data.timezone,
      },
    };

    // Create the Event object that matches the insertEvent query structure
    const event: Event = {
      id: eventId,
      createdAt: new Date(),
      updatedAt: new Date(),
      eventDetails: eventDetails,
      roles: props.roles || [],
      sections: processedSections,
      subEvents: props.subEvents as SubEvent[],
      workshops: [],
      gallery: props.gallery as Picture[],
    };

    // Call insertEvent with the properly structured Event object
    const result = await insertEvent(event);

    // Create corresponding PostgreSQL Event record to link Neo4j event to user
    // Using upsert to handle cases where record might already exist
    await prisma.event.upsert({
      where: { eventId: event.id },
      update: {
        userId: session.user.id,
        creator: true,
      },
      create: {
        eventId: event.id, // Neo4j event ID
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
    //Delete pictures that have a file and a url
    if (oldEvent.eventDetails.poster && !editedEvent.eventDetails.poster) {
      await deleteFromR2(oldEvent.eventDetails.poster.url);
    }

    // Upload eventDetails poster if exists.  Delete old poster if it exists.
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

    // Upload subEvent posters
    for (const subEvent of editedEvent.subEvents) {
      if (!subEvent.poster) {
        // Delete old poster if it exists
        const oldSubEvent = oldEvent.subEvents.find(
          (s) => s.id === subEvent.id
        );
        if (oldSubEvent && oldSubEvent.poster) {
          await deleteFromR2(oldSubEvent.poster.url);
        }
      }

      if (subEvent.poster?.file) {
        // Delete old poster if it exists
        const oldSubEvent = oldEvent.subEvents.find(
          (s) => s.id === subEvent.id
        );
        if (oldSubEvent && oldSubEvent.poster) {
          await deleteFromR2(oldSubEvent.poster.url);
        }

        const posterResult = await uploadSubEventPosterToR2(
          subEvent.poster.file,
          eventId,
          subEvent.id
        );
        if (posterResult.success) {
          subEvent.poster = {
            ...subEvent.poster,
            id: posterResult.id!,
            url: posterResult.url!,
            file: null,
          };
        }
      }
    }

    // Delete subEvent posters where the entire subEvent has been deleted
    for (const subEvent of oldEvent.subEvents) {
      if (!editedEvent.subEvents.find((s) => s.id === subEvent.id)) {
        if (subEvent.poster) {
          await deleteFromR2(subEvent.poster.url);
        }
      }
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

    // Upload workshop posters
    if (editedEvent.workshops) {
      for (const workshop of editedEvent.workshops) {
        const oldWorkshop = oldEvent.workshops?.find(
          (w) => w.id === workshop.id
        );

        if (!workshop.workshopDetails.poster) {
          // Delete old poster if it exists
          if (oldWorkshop?.workshopDetails.poster) {
            await deleteFromR2(oldWorkshop.workshopDetails.poster.url);
          }
        }

        if (workshop.workshopDetails.poster?.file) {
          // Delete old poster if it exists
          if (oldWorkshop?.workshopDetails.poster) {
            await deleteFromR2(oldWorkshop.workshopDetails.poster.url);
          }

          const posterResult = await uploadWorkshopPosterToR2(
            workshop.workshopDetails.poster.file,
            workshop.id
          );
          if (posterResult.success) {
            workshop.workshopDetails.poster = {
              ...workshop.workshopDetails.poster,
              id: posterResult.id!,
              url: posterResult.url!,
              file: null,
            };
          }
        }
      }
    }

    // Delete workshop posters where the entire workshop has been deleted
    if (oldEvent.workshops) {
      for (const workshop of oldEvent.workshops) {
        if (
          !editedEvent.workshops?.find((w) => w.id === workshop.id) &&
          workshop.workshopDetails.poster
        ) {
          await deleteFromR2(workshop.workshopDetails.poster.url);
        }
      }
    }

    // Process sections to handle brackets/videos based on hasBrackets
    const processedSections: Section[] = editedEvent.sections.map((section) => {
      const { hasBrackets, ...sectionWithoutBrackets } = section;

      if (hasBrackets) {
        return {
          ...sectionWithoutBrackets,
          description: section.description ?? "",
          hasBrackets: true,
          brackets: section.brackets,
          videos: [],
        };
      } else {
        return {
          ...sectionWithoutBrackets,
          description: section.description ?? "",
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
      creatorId: oldEvent.eventDetails.creatorId,
      title: editedEvent.eventDetails.title,
      description: editedEvent.eventDetails.description ?? "",
      address: editedEvent.eventDetails.address,
      prize: editedEvent.eventDetails.prize,
      entryCost: editedEvent.eventDetails.entryCost,
      startDate: editedEvent.eventDetails.startDate,
      startTime: editedEvent.eventDetails.startTime,
      endTime: editedEvent.eventDetails.endTime,
      schedule: editedEvent.eventDetails.schedule ?? "",
      poster: editedEvent.eventDetails.poster as Picture | null,
      city: {
        ...editedEvent.eventDetails.city,
        timezone: timezone,
      },
    };

    // Process workshops to ensure they have required fields
    const processedWorkshops = (editedEvent.workshops || []).map(
      (workshop) => ({
        ...workshop,
        createdAt: workshop.createdAt
          ? new Date(workshop.createdAt)
          : new Date(),
        updatedAt: new Date(),
        workshopDetails: {
          ...workshop.workshopDetails,
          creatorId: workshop.workshopDetails.creatorId || session.user.id,
        },
        roles: (workshop.roles || []).map((role) => ({
          ...role,
          title: role.title as "ORGANIZER" | "TEACHER",
        })),
      })
    );

    // Create the Event object that matches the EditEvent query structure
    const event: Event = {
      id: eventId,
      createdAt: new Date(), // This will be preserved by the database
      updatedAt: new Date(),
      eventDetails: eventDetails,
      roles: editedEvent.roles || [],
      sections: processedSections,
      subEvents: editedEvent.subEvents as SubEvent[],
      workshops: processedWorkshops,
      gallery: editedEvent.gallery as Picture[],
    };

    // Call EditEvent with the properly structured Event object
    const result = await editEventQuery(event);

    console.log("🟢 [editEvent] EditEvent result:", result);

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
        // Process video tag diffs (both section videos and bracket videos)
        for (const newSection of processedSections) {
          const oldSection = oldEvent.sections.find(
            (s) => s.id === newSection.id
          );

          // Process section videos
          for (const newVideo of newSection.videos || []) {
            const oldVideo = oldSection?.videos.find(
              (v) => v.id === newVideo.id
            );
            const oldTaggedWinners = oldVideo?.taggedWinners || [];
            const oldTaggedDancers = oldVideo?.taggedDancers || [];
            const newTaggedWinners = newVideo.taggedWinners || [];
            const newTaggedDancers = newVideo.taggedDancers || [];

            // Combine old and new users to get all usernames
            const allOldUsers = new Set(
              [
                ...oldTaggedWinners.map((u) => u.username),
                ...oldTaggedDancers.map((u) => u.username),
              ].filter(Boolean)
            );
            const allNewUsers = new Set(
              [
                ...newTaggedWinners.map((u) => u.username),
                ...newTaggedDancers.map((u) => u.username),
              ].filter(Boolean)
            );

            // Process all users in the new set
            for (const username of allNewUsers) {
              const winner = newTaggedWinners.find(
                (u) => u.username === username
              );
              const dancer = newTaggedDancers.find(
                (u) => u.username === username
              );
              const user = winner || dancer;

              if (!user) continue;

              const userId = await getUserId(user);
              const roles: string[] = [];

              // If user is in dancers list, add DANCER role
              if (dancer) {
                roles.push(VIDEO_ROLE_DANCER);
              }

              // If user is in winners list, add WINNER role
              if (winner) {
                roles.push(VIDEO_ROLE_WINNER);
              }

              try {
                console.log(
                  `🟢 [editEvent] Setting roles for user ${username} in video ${newVideo.id}:`,
                  roles
                );
                await setVideoRoles(eventId, newVideo.id, userId, roles);
                console.log(
                  `✅ [editEvent] Successfully set roles for user ${username}`
                );
              } catch (userTagError) {
                console.error(
                  `❌ [editEvent] Error setting roles for user ${username} in video ${newVideo.id}:`,
                  userTagError
                );
                // Continue with other users even if one fails
              }
            }

            // Find users to remove completely (in old but not in new)
            for (const username of allOldUsers) {
              if (!allNewUsers.has(username)) {
                const oldUser =
                  oldTaggedWinners.find((u) => u.username === username) ||
                  oldTaggedDancers.find((u) => u.username === username);
                if (oldUser) {
                  const userId = await getUserId(oldUser);
                  console.log(
                    `🟢 [editEvent] Removing all roles for user ${username} in video ${newVideo.id}`
                  );
                  // Remove all roles by setting empty array
                  await setVideoRoles(eventId, newVideo.id, userId, []);
                }
              }
            }
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
              const oldTaggedWinners = oldVideo?.taggedWinners || [];
              const oldTaggedDancers = oldVideo?.taggedDancers || [];
              const newTaggedWinners = newVideo.taggedWinners || [];
              const newTaggedDancers = newVideo.taggedDancers || [];

              // Combine old and new users to get all usernames
              const allOldUsers = new Set(
                [
                  ...oldTaggedWinners.map((u) => u.username),
                  ...oldTaggedDancers.map((u) => u.username),
                ].filter(Boolean)
              );
              const allNewUsers = new Set(
                [
                  ...newTaggedWinners.map((u) => u.username),
                  ...newTaggedDancers.map((u) => u.username),
                ].filter(Boolean)
              );

              // Process all users in the new set
              for (const username of allNewUsers) {
                const winner = newTaggedWinners.find(
                  (u) => u.username === username
                );
                const dancer = newTaggedDancers.find(
                  (u) => u.username === username
                );
                const user = winner || dancer;

                if (!user) continue;

                const userId = await getUserId(user);
                const roles: string[] = [];

                // If user is in dancers list, add DANCER role
                if (dancer) {
                  roles.push(VIDEO_ROLE_DANCER);
                }

                // If user is in winners list, add WINNER role
                if (winner) {
                  roles.push(VIDEO_ROLE_WINNER);
                }

                try {
                  console.log(
                    `🟢 [editEvent] Setting roles for user ${username} in bracket video ${newVideo.id}:`,
                    roles
                  );
                  await setVideoRoles(eventId, newVideo.id, userId, roles);
                  console.log(
                    `✅ [editEvent] Successfully set roles for user ${username} in bracket video`
                  );
                } catch (userTagError) {
                  console.error(
                    `❌ [editEvent] Error setting roles for user ${username} in bracket video ${newVideo.id}:`,
                    userTagError
                  );
                  // Continue with other users even if one fails
                }
              }

              // Find users to remove completely (in old but not in new)
              for (const username of allOldUsers) {
                if (!allNewUsers.has(username)) {
                  const oldUser =
                    oldTaggedWinners.find((u) => u.username === username) ||
                    oldTaggedDancers.find((u) => u.username === username);
                  if (oldUser) {
                    const userId = await getUserId(oldUser);
                    console.log(
                      `🟢 [editEvent] Removing all roles for user ${username} in bracket video ${newVideo.id}`
                    );
                    // Remove all roles by setting empty array
                    await setVideoRoles(eventId, newVideo.id, userId, []);
                  }
                }
              }
            }
          }

          // Process section winners - compare old vs new and only update differences
          const oldWinners = oldSection?.winners || [];
          const newWinners = newSection.winners || [];

          // Get sets of usernames for comparison
          const oldWinnerUsernames = new Set(
            oldWinners.map((w) => w.username).filter(Boolean)
          );
          const newWinnerUsernames = new Set(
            newWinners.map((w) => w.username).filter(Boolean)
          );

          // Check if winners have changed
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
                // Convert all winners to user IDs
                const winnerUserIds = await Promise.all(
                  newWinners.map((winner) => getUserId(winner))
                );
                console.log(
                  `🟢 [editEvent] Setting ${winnerUserIds.length} winners for section ${newSection.id} (was ${oldWinners.length})`
                );
                await setSectionWinners(eventId, newSection.id, winnerUserIds);
                console.log(
                  `✅ [editEvent] Successfully set ${winnerUserIds.length} section winners`
                );
              } else {
                // No winners - remove all winners from section
                console.log(
                  `🟢 [editEvent] Removing all winners from section ${newSection.id} (was ${oldWinners.length})`
                );
                await setSectionWinners(eventId, newSection.id, []);
                console.log(
                  `✅ [editEvent] Successfully removed all section winners`
                );
              }
            } catch (winnerError) {
              console.error(
                `❌ [editEvent] Error setting section winners:`,
                winnerError
              );
            }
          } else {
            console.log(
              `🟢 [editEvent] Section winners unchanged for section ${newSection.id}, skipping update`
            );
          }
        }
      } catch (tagError) {
        console.error("❌ [editEvent] Error processing tag diffs:", tagError);
        // Re-throw the error so the user knows something went wrong
        throw new Error(
          `Failed to process tag changes: ${
            tagError instanceof Error ? tagError.message : String(tagError)
          }`
        );
      }
      console.log("✅ [editEvent] Tag diff processing completed");

      // Update corresponding PostgreSQL Event record to keep it in sync with Neo4j
      // Use the original creator ID from oldEvent to preserve creator information
      const creatorId = oldEvent.eventDetails.creatorId || session.user.id;

      await prisma.event.upsert({
        where: { eventId: eventId },
        update: {
          userId: creatorId,
          creator: true,
        },
        create: {
          eventId: eventId, // Neo4j event ID
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
