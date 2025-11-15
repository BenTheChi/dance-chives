"use server";
import { auth } from "@/auth";
import { deleteFromGCloudStorage, uploadToGCloudStorage } from "../GCloud";
import {
  insertWorkshop,
  editWorkshop as editWorkshopQuery,
  getWorkshop as getWorkshopQuery,
  deleteWorkshop as deleteWorkshopQuery,
} from "@/db/queries/workshop";
import { Workshop, WorkshopDetails, Picture } from "@/types/workshop";
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
  }[];
  gallery: {
    id: string;
    title: string;
    url: string;
    type: string;
    file: File | null;
  }[];
  associatedEventId?: string | null;
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
    // Upload workshopDetails poster if exists
    if (props.workshopDetails.poster?.file) {
      const posterResults = await uploadToGCloudStorage([
        props.workshopDetails.poster.file,
      ]);
      if (
        posterResults.length > 0 &&
        posterResults[0].url &&
        posterResults[0].id
      ) {
        props.workshopDetails.poster.url = posterResults[0].url;
        props.workshopDetails.poster.id = posterResults[0].id;
      }
    }

    // Upload gallery photos if they have files
    const galleryFiles = props.gallery.filter((pic) => pic.file);
    if (galleryFiles.length > 0) {
      const galleryResults = await uploadToGCloudStorage(
        galleryFiles.map((pic) => pic.file!)
      );
      galleryResults.forEach((result, index) => {
        const originalPic = galleryFiles[index];
        const galleryIndex = props.gallery.findIndex(
          (p) => p.id === originalPic.id
        );
        if (galleryIndex !== -1 && result.url && result.id) {
          props.gallery[galleryIndex].url = result.url;
          props.gallery[galleryIndex].id = result.id;
        }
      });
    }

    const workshopId = generateSlugId(props.workshopDetails.title);
    const now = new Date();

    const workshop: Workshop = {
      id: workshopId,
      createdAt: now,
      updatedAt: now,
      workshopDetails: {
        ...props.workshopDetails,
        creatorId: session.user.id,
        description: props.workshopDetails.description ?? "",
        schedule: props.workshopDetails.schedule ?? "",
        styles: props.workshopDetails.styles || [],
      },
      roles: (props.roles || []).map((role) => ({
        ...role,
        title: role.title as "ORGANIZER" | "TEACHER",
      })),
      videos: props.videos || [],
      gallery: props.gallery || [],
      associatedEventId: props.associatedEventId || undefined,
    };

    await insertWorkshop(workshop);

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

  // Check if workshop is associated with event and user is event team member
  let isEventTeamMember = false;
  if (oldWorkshop.associatedEventId) {
    const eventTeamMembers = await getEventTeamMembers(
      oldWorkshop.associatedEventId
    );
    isEventTeamMember = eventTeamMembers.includes(session.user.id);
  }

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
      oldWorkshop.workshopDetails.poster?.url
    ) {
      await deleteFromGCloudStorage(oldWorkshop.workshopDetails.poster.url);
    }

    // Upload new poster if exists
    if (editedWorkshop.workshopDetails.poster?.file) {
      const posterResults = await uploadToGCloudStorage([
        editedWorkshop.workshopDetails.poster.file,
      ]);
      if (
        posterResults.length > 0 &&
        posterResults[0].url &&
        posterResults[0].id
      ) {
        editedWorkshop.workshopDetails.poster.url = posterResults[0].url;
        editedWorkshop.workshopDetails.poster.id = posterResults[0].id;
      }
    }

    // Handle gallery photos
    const oldGalleryUrls = oldWorkshop.gallery.map((pic) => pic.url);
    const newGalleryUrls = editedWorkshop.gallery.map((pic) => pic.url);
    const deletedGalleryUrls = oldGalleryUrls.filter(
      (url) => !newGalleryUrls.includes(url)
    );

    for (const url of deletedGalleryUrls) {
      await deleteFromGCloudStorage(url);
    }

    // Upload new gallery photos
    const galleryFiles = editedWorkshop.gallery.filter((pic) => pic.file);
    if (galleryFiles.length > 0) {
      const galleryResults = await uploadToGCloudStorage(
        galleryFiles.map((pic) => pic.file!)
      );
      galleryResults.forEach((result, index) => {
        const originalPic = galleryFiles[index];
        const galleryIndex = editedWorkshop.gallery.findIndex(
          (p) => p.id === originalPic.id
        );
        if (galleryIndex !== -1 && result.url && result.id) {
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
      workshopDetails: {
        ...editedWorkshop.workshopDetails,
        creatorId: workshopCreatorId,
        description: editedWorkshop.workshopDetails.description ?? "",
        schedule: editedWorkshop.workshopDetails.schedule ?? "",
        styles: editedWorkshop.workshopDetails.styles || [],
      },
      roles: (editedWorkshop.roles || []).map((role) => ({
        ...role,
        title: role.title as "ORGANIZER" | "TEACHER",
      })),
      videos: editedWorkshop.videos || [],
      gallery: editedWorkshop.gallery || [],
      associatedEventId: editedWorkshop.associatedEventId || undefined,
    };

    await editWorkshopQuery(workshopId, workshop);

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
    if (workshop.workshopDetails.poster?.url) {
      urlsToDelete.push(workshop.workshopDetails.poster.url);
    }
    workshop.gallery.forEach((pic) => {
      if (pic.url) {
        urlsToDelete.push(pic.url);
      }
    });

    for (const url of urlsToDelete) {
      await deleteFromGCloudStorage(url);
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
