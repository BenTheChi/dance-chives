"use server";
import { auth } from "@/auth";
import {
  deleteFromR2,
  uploadWorkshopPosterToR2,
  uploadWorkshopGalleryToR2,
} from "../R2";
import {
  insertWorkshop,
  editWorkshop as editWorkshopQuery,
  getWorkshop as getWorkshopQuery,
  deleteWorkshop as deleteWorkshopQuery,
} from "@/db/queries/workshop";
import { Workshop, WorkshopDetails } from "@/types/workshop";
import { Image } from "@/types/image";
import { generateSlugId } from "@/lib/utils";
import {
  canCreateWorkshops,
  canUpdateWorkshop,
  canDeleteWorkshop,
} from "@/lib/utils/auth-utils";
import {
  getWorkshopCreator,
  getWorkshopTeamMembers,
  isWorkshopTeamMember,
} from "@/db/queries/workshop";
import { getEventTeamMembers } from "@/db/queries/team-member";

interface addWorkshopProps {
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
  gallery: {
    id: string;
    title: string;
    url: string;
    file: File | null;
  }[];
  subEvents?: {
    id: string;
    title: string;
    type: "competition" | "workshop" | "session";
    imageUrl?: string;
    date: string;
    city: string;
    cityId?: number;
    styles?: string[];
  }[];
}

interface response {
  error?: string;
  status: number;
  workshop: Workshop | null;
}

export async function addWorkshop(props: addWorkshopProps): Promise<response> {
  const session = await auth();

  if (!session) {
    console.error("No user session found");
    return {
      error: "No user session found",
      status: 401,
      workshop: null,
    };
  }

  // Check if user can create workshops
  if (!canCreateWorkshops(session.user.auth || 0)) {
    return {
      error: "You do not have permission to create workshops",
      status: 403,
      workshop: null,
    };
  }

  try {
    // Generate workshopId first (needed for R2 path generation)
    const workshopId = generateSlugId(props.workshopDetails.title);

    // Upload workshopDetails poster if exists
    if (props.workshopDetails.poster?.file) {
      const posterResult = await uploadWorkshopPosterToR2(
        props.workshopDetails.poster.file,
        workshopId
      );
      if (posterResult.success && posterResult.url && posterResult.id) {
        props.workshopDetails.poster.url = posterResult.url;
        props.workshopDetails.poster.id = posterResult.id;
      }
    }

    // Upload gallery photos if they have files
    const galleryFiles = props.gallery.filter((pic) => pic.file);
    if (galleryFiles.length > 0) {
      const galleryResults = await uploadWorkshopGalleryToR2(
        galleryFiles.map((pic) => pic.file!),
        workshopId
      );
      galleryResults.forEach((result, index) => {
        const originalPic = galleryFiles[index];
        const galleryIndex = props.gallery.findIndex(
          (p) => p.id === originalPic.id
        );
        if (galleryIndex !== -1 && result.success && result.url && result.id) {
          props.gallery[galleryIndex].url = result.url;
          props.gallery[galleryIndex].id = result.id;
        }
      });
    }
    const now = new Date();

    const workshop: Workshop = {
      id: workshopId,
      createdAt: now,
      updatedAt: now,
      eventDetails: {
        ...props.workshopDetails,
        creatorId: session.user.id,
        description: props.workshopDetails.description ?? "",
        schedule: props.workshopDetails.schedule ?? "",
        styles: props.workshopDetails.styles || [],
        poster: props.workshopDetails.poster
          ? {
              ...props.workshopDetails.poster,
              type: "poster" as const,
            }
          : null,
      },
      roles: (props.roles || []).map((role) => ({
        ...role,
        title: role.title as "ORGANIZER" | "TEACHER",
      })),
      videos: props.videos || [],
      gallery: (props.gallery || []).map((img) => ({
        ...img,
        type: "gallery" as const,
      })),
    };

    await insertWorkshop(workshop);

    // Create subevents (as relationships) if provided
    if (props.subEvents && props.subEvents.length > 0) {
      const { createSubEvents } = await import("@/db/queries/event");
      await createSubEvents(workshopId, props.subEvents);
    }

    const createdWorkshop = await getWorkshopQuery(workshopId);

    return {
      error: undefined,
      status: 200,
      workshop: createdWorkshop,
    };
  } catch (error) {
    console.error("Error creating workshop:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to create workshop",
      status: 500,
      workshop: null,
    };
  }
}

export async function editWorkshop(
  workshopId: string,
  editedWorkshop: addWorkshopProps
): Promise<response> {
  console.log("🟢 [editWorkshop] Starting editWorkshop");
  const session = await auth();

  if (!session) {
    console.error("No user session found");
    return {
      error: "No user session found",
      status: 401,
      workshop: null,
    };
  }

  const response = await getWorkshopQuery(workshopId);

  if (!response) {
    return {
      error: "Failed to fetch workshop to edit",
      status: 500,
      workshop: null,
    };
  }

  const oldWorkshop = response as Workshop;

  // Check if user is workshop creator
  const workshopCreatorId = await getWorkshopCreator(workshopId);
  if (!workshopCreatorId) {
    return {
      error: "Workshop creator not found",
      status: 500,
      workshop: null,
    };
  }

  // Check if user is workshop team member
  const isTeamMember = await isWorkshopTeamMember(workshopId, session.user.id);

  // Note: Workshops are now separate Event:Workshop nodes, not associated with events
  // Team member check is handled by isWorkshopTeamMember above
  const isEventTeamMember = false;

  // Check authorization - allow team members even without auth level
  const authLevel = session.user.auth ?? 0;
  const hasPermission = canUpdateWorkshop(
    authLevel,
    {
      workshopId: workshopId,
      workshopCreatorId: workshopCreatorId,
      isTeamMember: isTeamMember,
      isEventTeamMember: isEventTeamMember,
    },
    session.user.id
  );

  if (!hasPermission) {
    return {
      error: "You do not have permission to edit this workshop",
      status: 403,
      workshop: null,
    };
  }

  try {
    // Delete old poster if new one is being uploaded
    if (
      editedWorkshop.workshopDetails.poster?.file &&
      oldWorkshop.eventDetails.poster?.url
    ) {
      await deleteFromR2(oldWorkshop.eventDetails.poster.url);
    }

    // Upload new poster if exists
    if (editedWorkshop.workshopDetails.poster?.file) {
      const posterResult = await uploadWorkshopPosterToR2(
        editedWorkshop.workshopDetails.poster.file,
        workshopId
      );
      if (posterResult.success && posterResult.url && posterResult.id) {
        editedWorkshop.workshopDetails.poster.url = posterResult.url;
        editedWorkshop.workshopDetails.poster.id = posterResult.id;
      }
    }

    // Handle gallery photos
    const oldGalleryUrls = oldWorkshop.gallery.map((pic) => pic.url);
    const newGalleryUrls = editedWorkshop.gallery.map((pic) => pic.url);
    const deletedGalleryUrls = oldGalleryUrls.filter(
      (url) => !newGalleryUrls.includes(url)
    );

    for (const url of deletedGalleryUrls) {
      await deleteFromR2(url);
    }

    // Upload new gallery photos
    const galleryFiles = editedWorkshop.gallery.filter((pic) => pic.file);
    if (galleryFiles.length > 0) {
      const galleryResults = await uploadWorkshopGalleryToR2(
        galleryFiles.map((pic) => pic.file!),
        workshopId
      );
      galleryResults.forEach((result, index) => {
        const originalPic = galleryFiles[index];
        const galleryIndex = editedWorkshop.gallery.findIndex(
          (p) => p.id === originalPic.id
        );
        if (galleryIndex !== -1 && result.success && result.url && result.id) {
          editedWorkshop.gallery[galleryIndex].url = result.url;
          editedWorkshop.gallery[galleryIndex].id = result.id;
        }
      });
    }

    const now = new Date();

    const workshop: Workshop = {
      id: workshopId,
      createdAt: oldWorkshop.createdAt,
      updatedAt: now,
      eventDetails: {
        ...editedWorkshop.workshopDetails,
        creatorId: workshopCreatorId,
        description: editedWorkshop.workshopDetails.description ?? "",
        schedule: editedWorkshop.workshopDetails.schedule ?? "",
        styles: editedWorkshop.workshopDetails.styles || [],
        poster: editedWorkshop.workshopDetails.poster
          ? {
              ...editedWorkshop.workshopDetails.poster,
              type: "poster" as const,
            }
          : null,
      },
      roles: (editedWorkshop.roles || []).map((role) => ({
        ...role,
        title: role.title as "ORGANIZER" | "TEACHER",
      })),
      videos: editedWorkshop.videos || [],
      gallery: (editedWorkshop.gallery || []).map((img) => ({
        ...img,
        type: "gallery" as const,
      })),
    };

    await editWorkshopQuery(workshopId, workshop);

    // Update subevents (as relationships) if provided
    if (editedWorkshop.subEvents !== undefined) {
      const { createSubEvents } = await import("@/db/queries/event");
      const driver = (await import("@/db/driver")).default;
      const session = driver.session();
      try {
        // Remove old subevent relationships
        await session.run(
          `MATCH (w:Event:Workshop {id: $workshopId})
           OPTIONAL MATCH (subEvent:Event)-[r:SUBEVENT_OF]->(w)
           DELETE r`,
          { workshopId }
        );
        // Create new subevent relationships
        if (editedWorkshop.subEvents && editedWorkshop.subEvents.length > 0) {
          await createSubEvents(workshopId, editedWorkshop.subEvents);
        }
      } finally {
        await session.close();
      }
    }

    const updatedWorkshop = await getWorkshopQuery(workshopId);

    return {
      error: undefined,
      status: 200,
      workshop: updatedWorkshop,
    };
  } catch (error) {
    console.error("Error editing workshop:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to update workshop",
      status: 500,
      workshop: null,
    };
  }
}

export async function deleteWorkshop(workshopId: string): Promise<response> {
  const session = await auth();

  if (!session) {
    return {
      error: "No user session found",
      status: 401,
      workshop: null,
    };
  }

  const workshop = await getWorkshopQuery(workshopId);

  if (!workshop) {
    return {
      error: "Workshop not found",
      status: 404,
      workshop: null,
    };
  }

  // Check authorization
  if (!session.user.auth) {
    return {
      error: "User authorization level not found",
      status: 403,
      workshop: null,
    };
  }

  const workshopCreatorId = await getWorkshopCreator(workshopId);
  if (!workshopCreatorId) {
    return {
      error: "Workshop creator not found",
      status: 500,
      workshop: null,
    };
  }

  const hasPermission = canDeleteWorkshop(
    session.user.auth,
    {
      workshopId: workshopId,
      workshopCreatorId: workshopCreatorId,
    },
    session.user.id
  );

  if (!hasPermission) {
    return {
      error: "You do not have permission to delete this workshop",
      status: 403,
      workshop: null,
    };
  }

  try {
    // Delete poster and gallery from storage
    const urlsToDelete: string[] = [];
    if (workshop.eventDetails.poster?.url) {
      urlsToDelete.push(workshop.eventDetails.poster.url);
    }
    workshop.gallery.forEach((pic) => {
      if (pic.url) {
        urlsToDelete.push(pic.url);
      }
    });

    for (const url of urlsToDelete) {
      await deleteFromR2(url);
    }

    await deleteWorkshopQuery(workshopId);

    return {
      error: undefined,
      status: 200,
      workshop: null,
    };
  } catch (error) {
    console.error("Error deleting workshop:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete workshop",
      status: 500,
      workshop: null,
    };
  }
}
