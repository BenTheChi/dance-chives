"use server";
import { auth } from "@/auth";
import {
  deleteFromR2,
  uploadEventPosterToR2,
  uploadEventGalleryToR2,
  // Removed uploadSubEventPosterToR2 - subevents are now relationships, not separate nodes
  // Removed uploadWorkshopPosterToR2 and uploadWorkshopGalleryToR2 - workshops are now separate Event:Workshop nodes
} from "../R2";
import {
  insertCompetition,
  EditCompetition as editCompetitionQuery,
  getCompetition as getCompetitionQuery,
} from "@/db/queries/competition";
import {
  BaseEventDetails,
  CompetitionDetails,
  Competition,
  Section,
} from "@/types/event";
import { Image } from "@/types/image";
import { generateSlugId } from "@/lib/utils";
import { prisma } from "@/lib/primsa";
import { canUpdateCompetition } from "@/lib/utils/auth-utils";
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

interface addCompetitionProps {
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
      type: "battle" | "freestyle" | "choreography" | "class";
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
      taggedChoreographers?: {
        id?: string; // Optional - server can look up by username if not provided
        displayName: string;
        username: string;
      }[];
      taggedTeachers?: {
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
        type: "battle" | "freestyle" | "choreography" | "class";
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
        taggedChoreographers?: {
          id?: string; // Optional - server can look up by username if not provided
          displayName: string;
          username: string;
        }[];
        taggedTeachers?: {
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
    type: "competition" | "workshop" | "session";
    imageUrl?: string;
    date: string;
    city: string;
    cityId?: number;
    styles?: string[];
  }[];
  gallery: {
    id: string;
    title: string;
    url: string;
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
    gallery: {
      id: string;
      title: string;
      url: string;
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
  event: Competition | null;
}

export async function addCompetition(props: addCompetitionProps): Promise<response> {
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

    // Subevents are now relationships - no poster upload needed

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

    // Workshops are now separate Event:Workshop nodes, not nested in Competition
    // Workshop handling removed - they have their own actions

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

    // Create the CompetitionDetails object
    const eventDetails: CompetitionDetails = {
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
      poster: props.eventDetails.poster as Image | null,
      city: {
        ...props.eventDetails.city,
        timezone: timezoneData.data.timezone,
      },
    };

    // Workshops are now separate Event:Workshop nodes, not nested in Competition
    // Workshop processing removed - they have their own actions

    // Create the Competition object that matches the insertCompetition query structure
    // Note: subEvents are now relationships, so we pass just the IDs
    // Workshops are now separate Event:Workshop nodes, not nested in Competition
    const competition: Competition = {
      id: eventId,
      createdAt: new Date(),
      updatedAt: new Date(),
      eventDetails: eventDetails,
      roles: props.roles || [],
      sections: processedSections,
      subEvents: props.subEvents.map((se) => ({ id: se.id } as any)), // Only IDs needed for relationships
      gallery: props.gallery as Image[],
    };

    // Call insertCompetition with the properly structured Competition object
    const result = await insertCompetition(competition);

    // Create corresponding PostgreSQL Event record to link Neo4j competition to user
    // Using upsert to handle cases where record might already exist
    await prisma.event.upsert({
      where: { eventId: competition.id },
      update: {
        userId: session.user.id,
        creator: true,
      },
      create: {
        eventId: competition.id, // Neo4j competition ID
        userId: session.user.id,
        creator: true,
      },
    });

    return {
      status: 200,
      event: result,
    };
  } catch (error) {
    console.error("Error creating competition:", error);
    return {
      error: "Failed to create competition",
      status: 500,
      event: null,
    };
  }
}

export async function editCompetition(
  competitionId: string,
  editedCompetition: addCompetitionProps
): Promise<response> {
  console.log("🟢 [editCompetition] Starting editCompetition");
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

  const response = await getCompetition(competitionId);

  if (response.error || !response.event) {
    return {
      error: "Failed to fetch competition to edit",
      status: 500,
      event: null,
    };
  }

  const oldCompetition = response.event as Competition;

  // Check if user is a team member
  const isCompetitionTeamMember = await isTeamMember(competitionId, session.user.id);

  // Check authorization - allow team members even without auth level
  const authLevel = session.user.auth ?? 0;
  const hasPermission = canUpdateCompetition(
    authLevel,
    {
      eventId: competitionId,
      eventCreatorId: oldCompetition.eventDetails.creatorId,
      isTeamMember: isCompetitionTeamMember,
    },
    session.user.id
  );

  if (!hasPermission) {
    return {
      error: "You do not have permission to edit this competition",
      status: 403,
      event: null,
    };
  }

  try {
    //Delete pictures that have a file and a url
    if (oldCompetition.eventDetails.poster && !editedCompetition.eventDetails.poster) {
      await deleteFromR2(oldCompetition.eventDetails.poster.url);
    }

    // Upload competitionDetails poster if exists.  Delete old poster if it exists.
    if (editedCompetition.eventDetails.poster?.file) {
      if (oldCompetition.eventDetails.poster) {
        await deleteFromR2(oldCompetition.eventDetails.poster.url);
      }

      const posterResult = await uploadEventPosterToR2(
        editedCompetition.eventDetails.poster.file,
        competitionId
      );
      if (posterResult.success) {
        editedCompetition.eventDetails.poster = {
          ...editedCompetition.eventDetails.poster,
          id: posterResult.id!,
          url: posterResult.url!,
          file: null,
        };
      }
    } else if (
      !editedCompetition.eventDetails.poster &&
      oldCompetition.eventDetails.poster
    ) {
      await deleteFromR2(oldCompetition.eventDetails.poster.url);
    }

    // Subevents are now relationships - no poster upload/delete needed

    // Upload gallery files
    const galleryFiles = editedCompetition.gallery.filter((item) => item.file);
    if (galleryFiles.length > 0) {
      const galleryResults = await uploadEventGalleryToR2(
        galleryFiles.map((item) => item.file!),
        competitionId
      );
      galleryResults.forEach((result, index) => {
        const originalItem = galleryFiles[index];
        const galleryIndex = editedCompetition.gallery.findIndex(
          (g) => g.id === originalItem.id
        );
        if (galleryIndex !== -1 && result.success && result.url && result.id) {
          editedCompetition.gallery[galleryIndex].id = result.id;
          editedCompetition.gallery[galleryIndex].url = result.url;
          editedCompetition.gallery[galleryIndex].file = null;
        }
      });
    }

    // Delete gallery items that don't exist in editedCompetition
    for (const item of oldCompetition.gallery) {
      if (!editedCompetition.gallery.find((g) => g.id === item.id)) {
        await deleteFromR2(item.url);
      }
    }

    // Workshops are now separate Event:Workshop nodes, not nested in Competition
    // Workshop handling removed - they have their own actions

    // Process sections to handle brackets/videos based on hasBrackets
    const processedSections: Section[] = editedCompetition.sections.map((section) => {
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

    let timezone = oldCompetition.eventDetails.city.timezone;

    if (editedCompetition.eventDetails.city.id !== oldCompetition.eventDetails.city.id) {
      // Get timezone for city
      const response = await fetch(
        `http://geodb-free-service.wirefreethought.com/v1/geo/places/${editedCompetition.eventDetails.city.id}`
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

    // Create the CompetitionDetails object
    const eventDetails: CompetitionDetails = {
      creatorId: oldCompetition.eventDetails.creatorId,
      title: editedCompetition.eventDetails.title,
      description: editedCompetition.eventDetails.description ?? "",
      address: editedCompetition.eventDetails.address,
      prize: editedCompetition.eventDetails.prize,
      entryCost: editedCompetition.eventDetails.entryCost,
      startDate: editedCompetition.eventDetails.startDate,
      startTime: editedCompetition.eventDetails.startTime,
      endTime: editedCompetition.eventDetails.endTime,
      schedule: editedCompetition.eventDetails.schedule ?? "",
      poster: editedCompetition.eventDetails.poster as Image | null,
      city: {
        ...editedCompetition.eventDetails.city,
        timezone: timezone,
      },
    };

    // Workshops are now separate Event:Workshop nodes, not nested in Competition
    // Workshop processing removed - they have their own actions

    // Create the Competition object that matches the EditCompetition query structure
    const competition: Competition = {
      id: competitionId,
      createdAt: new Date(), // This will be preserved by the database
      updatedAt: new Date(),
      eventDetails: eventDetails,
      roles: editedCompetition.roles || [],
      sections: processedSections,
      subEvents: editedCompetition.subEvents.map((se) => ({ id: se.id } as any)), // Only IDs needed for relationships
      gallery: editedCompetition.gallery as Image[],
    };

    // Call EditCompetition with the properly structured Competition object
    const result = await editCompetitionQuery(competition);

    console.log("🟢 [editCompetition] EditCompetition result:", result);

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
        console.log("🟢 [editCompetition] Starting tag diff processing...");
        // Process video tag diffs (both section videos and bracket videos)
        for (const newSection of processedSections) {
          const oldSection = oldCompetition.sections.find(
            (s) => s.id === newSection.id
          );

          // Process section videos
          for (const newVideo of newSection.videos || []) {
            const oldVideo = oldSection?.videos.find(
              (v) => v.id === newVideo.id
            );
            const oldVideoAny = oldVideo as any;
            const newVideoAny = newVideo as any;
            const oldTaggedWinners = oldVideoAny?.taggedWinners || [];
            const oldTaggedDancers = oldVideoAny?.taggedDancers || [];
            const oldTaggedChoreographers =
              oldVideoAny?.taggedChoreographers || [];
            const oldTaggedTeachers = oldVideoAny?.taggedTeachers || [];
            const newTaggedWinners = newVideoAny?.taggedWinners || [];
            const newTaggedDancers = newVideoAny?.taggedDancers || [];
            const newTaggedChoreographers =
              newVideoAny?.taggedChoreographers || [];
            const newTaggedTeachers = newVideoAny?.taggedTeachers || [];

            // Combine old and new users to get all usernames
            const allOldUsers = new Set(
              [
                ...oldTaggedWinners.map((u: any) => u.username),
                ...oldTaggedDancers.map((u: any) => u.username),
                ...oldTaggedChoreographers.map((u: any) => u.username),
                ...oldTaggedTeachers.map((u: any) => u.username),
              ].filter(Boolean)
            );
            const allNewUsers = new Set(
              [
                ...newTaggedWinners.map((u: any) => u.username),
                ...newTaggedDancers.map((u: any) => u.username),
                ...newTaggedChoreographers.map((u: any) => u.username),
                ...newTaggedTeachers.map((u: any) => u.username),
              ].filter(Boolean)
            );

            // Process all users in the new set
            for (const username of allNewUsers) {
              const winner = newTaggedWinners.find(
                (u: any) => u.username === username
              );
              const dancer = newTaggedDancers.find(
                (u: any) => u.username === username
              );
              const choreographer = newTaggedChoreographers.find(
                (u: any) => u.username === username
              );
              const teacher = newTaggedTeachers.find(
                (u: any) => u.username === username
              );
              const user = winner || dancer || choreographer || teacher;

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

              // If user is in choreographers list, add CHOREOGRAPHER role
              if (choreographer) {
                roles.push("CHOREOGRAPHER");
              }

              // If user is in teachers list, add TEACHER role
              if (teacher) {
                roles.push("TEACHER");
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
                  oldTaggedWinners.find((u: any) => u.username === username) ||
                  oldTaggedDancers.find((u: any) => u.username === username) ||
                  oldTaggedChoreographers.find(
                    (u: any) => u.username === username
                  ) ||
                  oldTaggedTeachers.find((u: any) => u.username === username);
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
              const oldVideoAny = oldVideo as any;
              const newVideoAny = newVideo as any;
              const oldTaggedWinners = oldVideoAny?.taggedWinners || [];
              const oldTaggedDancers = oldVideoAny?.taggedDancers || [];
              const oldTaggedChoreographers =
                oldVideoAny?.taggedChoreographers || [];
              const oldTaggedTeachers = oldVideoAny?.taggedTeachers || [];
              const newTaggedWinners = newVideoAny?.taggedWinners || [];
              const newTaggedDancers = newVideoAny?.taggedDancers || [];
              const newTaggedChoreographers =
                newVideoAny?.taggedChoreographers || [];
              const newTaggedTeachers = newVideoAny?.taggedTeachers || [];

              // Combine old and new users to get all usernames
              const allOldUsers = new Set(
                [
                  ...oldTaggedWinners.map((u: any) => u.username),
                  ...oldTaggedDancers.map((u: any) => u.username),
                  ...oldTaggedChoreographers.map((u: any) => u.username),
                  ...oldTaggedTeachers.map((u: any) => u.username),
                ].filter(Boolean)
              );
              const allNewUsers = new Set(
                [
                  ...newTaggedWinners.map((u: any) => u.username),
                  ...newTaggedDancers.map((u: any) => u.username),
                  ...newTaggedChoreographers.map((u: any) => u.username),
                  ...newTaggedTeachers.map((u: any) => u.username),
                ].filter(Boolean)
              );

              // Process all users in the new set
              for (const username of allNewUsers) {
                const winner = newTaggedWinners.find(
                  (u: any) => u.username === username
                );
                const dancer = newTaggedDancers.find(
                  (u: any) => u.username === username
                );
                const choreographer = newTaggedChoreographers.find(
                  (u: any) => u.username === username
                );
                const teacher = newTaggedTeachers.find(
                  (u: any) => u.username === username
                );
                const user = winner || dancer || choreographer || teacher;

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

                // If user is in choreographers list, add CHOREOGRAPHER role
                if (choreographer) {
                  roles.push("CHOREOGRAPHER");
                }

                // If user is in teachers list, add TEACHER role
                if (teacher) {
                  roles.push("TEACHER");
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
                    oldTaggedWinners.find(
                      (u: any) => u.username === username
                    ) ||
                    oldTaggedDancers.find(
                      (u: any) => u.username === username
                    ) ||
                    oldTaggedChoreographers.find(
                      (u: any) => u.username === username
                    ) ||
                    oldTaggedTeachers.find((u: any) => u.username === username);
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
      // Use the original creator ID from oldCompetition to preserve creator information
      const creatorId = oldCompetition.eventDetails.creatorId || session.user.id;

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

export async function getCompetition(competitionId: string): Promise<response> {
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
    const competitionData = await getCompetitionQuery(competitionId);

    if (!competitionData) {
      return {
        error: "Competition not found",
        status: 404,
        event: null,
      };
    }

    return {
      status: 200,
      event: competitionData,
    };
  } catch (error) {
    console.error("Error fetching competition:", error);
    return {
      error: "Failed to fetch event",
      status: 500,
      event: null,
    };
  }
}
