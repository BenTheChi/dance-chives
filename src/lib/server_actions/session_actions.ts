"use server";
import { auth } from "@/auth";
import {
  deleteFromR2,
  uploadSessionPosterToR2,
  uploadSessionGalleryToR2,
} from "../R2";
import {
  insertSession,
  editSession as editSessionQuery,
  getSession as getSessionQuery,
  deleteSession as deleteSessionQuery,
  getSessionPictures,
} from "@/db/queries/session";
import { Session, SessionDetails, Picture } from "@/types/session";
import { generateSlugId } from "@/lib/utils";
import {
  canCreateWorkshops, // Reuse same permission check as workshops
  canUpdateSession,
  canDeleteSession,
} from "@/lib/utils/auth-utils";
import { getSessionCreator } from "@/db/queries/session";
import {
  getSessionTeamMembers,
  isSessionTeamMember,
} from "@/db/queries/team-member";

interface addSessionProps {
  sessionDetails: {
    creatorId: string;
    title: string;
    city: {
      id: number;
      name: string;
      countryCode: string;
      region: string;
      population: number;
    };
    dates: {
      date: string;
      startTime: string;
      endTime: string;
    }[];
    description?: string;
    schedule?: string;
    address?: string;
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
}

interface response {
  error?: string;
  status: number;
  session: Session | null;
}

export async function addSession(props: addSessionProps): Promise<response> {
  const session = await auth();

  if (!session) {
    console.error("No user session found");
    return {
      error: "No user session found",
      status: 401,
      session: null,
    };
  }

  // Check if user can create sessions (reuse workshop permission check)
  if (!canCreateWorkshops(session.user.auth || 0)) {
    return {
      error: "You do not have permission to create sessions",
      status: 403,
      session: null,
    };
  }

  try {
    // Generate sessionId first (needed for R2 path generation)
    const sessionId = generateSlugId(props.sessionDetails.title);

    // Upload sessionDetails poster if exists
    if (props.sessionDetails.poster?.file) {
      const posterResult = await uploadSessionPosterToR2(
        props.sessionDetails.poster.file,
        sessionId
      );
      if (posterResult.success && posterResult.url && posterResult.id) {
        props.sessionDetails.poster.url = posterResult.url;
        props.sessionDetails.poster.id = posterResult.id;
      }
    }

    // Upload gallery photos if they have files
    const galleryFiles = props.gallery.filter((pic) => pic.file);
    if (galleryFiles.length > 0) {
      const galleryResults = await uploadSessionGalleryToR2(
        galleryFiles.map((pic) => pic.file!),
        sessionId
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

    const sessionData: Session = {
      id: sessionId,
      createdAt: now,
      updatedAt: now,
      sessionDetails: {
        ...props.sessionDetails,
        creatorId: session.user.id,
        description: props.sessionDetails.description ?? "",
        schedule: props.sessionDetails.schedule ?? "",
        styles: props.sessionDetails.styles || [],
      },
      roles: props.roles || [],
      videos: props.videos || [],
      gallery: props.gallery || [],
    };

    await insertSession(sessionData);

    const createdSession = await getSessionQuery(sessionId);

    return {
      error: undefined,
      status: 200,
      session: createdSession,
    };
  } catch (error) {
    console.error("Error creating session:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to create session",
      status: 500,
      session: null,
    };
  }
}

export async function editSession(
  sessionId: string,
  editedSession: addSessionProps
): Promise<response> {
  console.log("🟢 [editSession] Starting editSession");
  const session = await auth();

  if (!session) {
    console.error("No user session found");
    return {
      error: "No user session found",
      status: 401,
      session: null,
    };
  }

  const response = await getSessionQuery(sessionId);

  if (!response) {
    return {
      error: "Failed to fetch session to edit",
      status: 500,
      session: null,
    };
  }

  const oldSession = response as Session;

  // Check if user is session creator
  const sessionCreatorId = await getSessionCreator(sessionId);
  if (!sessionCreatorId) {
    return {
      error: "Session creator not found",
      status: 500,
      session: null,
    };
  }

  // Check if user is session team member
  const isTeamMember = await isSessionTeamMember(sessionId, session.user.id);

  // Check authorization - allow team members even without auth level
  const authLevel = session.user.auth ?? 0;
  const hasPermission = canUpdateSession(
    authLevel,
    {
      sessionId: sessionId,
      sessionCreatorId: sessionCreatorId,
      isTeamMember: isTeamMember,
    },
    session.user.id
  );

  if (!hasPermission) {
    return {
      error: "You do not have permission to edit this session",
      status: 403,
      session: null,
    };
  }

  try {
    // Delete old poster if new one is being uploaded
    if (
      editedSession.sessionDetails.poster?.file &&
      oldSession.sessionDetails.poster?.url
    ) {
      await deleteFromR2(oldSession.sessionDetails.poster.url);
    }

    // Upload new poster if exists
    if (editedSession.sessionDetails.poster?.file) {
      const posterResult = await uploadSessionPosterToR2(
        editedSession.sessionDetails.poster.file,
        sessionId
      );
      if (posterResult.success && posterResult.url && posterResult.id) {
        editedSession.sessionDetails.poster.url = posterResult.url;
        editedSession.sessionDetails.poster.id = posterResult.id;
      }
    }

    // Handle gallery photos
    const oldGalleryUrls = oldSession.gallery.map((pic) => pic.url);
    const newGalleryUrls = editedSession.gallery.map((pic) => pic.url);
    const deletedGalleryUrls = oldGalleryUrls.filter(
      (url) => !newGalleryUrls.includes(url)
    );

    for (const url of deletedGalleryUrls) {
      await deleteFromR2(url);
    }

    // Upload new gallery photos
    const galleryFiles = editedSession.gallery.filter((pic) => pic.file);
    if (galleryFiles.length > 0) {
      const galleryResults = await uploadSessionGalleryToR2(
        galleryFiles.map((pic) => pic.file!),
        sessionId
      );
      galleryResults.forEach((result, index) => {
        const originalPic = galleryFiles[index];
        const galleryIndex = editedSession.gallery.findIndex(
          (p) => p.id === originalPic.id
        );
        if (galleryIndex !== -1 && result.success && result.url && result.id) {
          editedSession.gallery[galleryIndex].url = result.url;
          editedSession.gallery[galleryIndex].id = result.id;
        }
      });
    }

    const now = new Date();

    const sessionData: Session = {
      id: sessionId,
      createdAt: oldSession.createdAt,
      updatedAt: now,
      sessionDetails: {
        ...editedSession.sessionDetails,
        creatorId: sessionCreatorId,
        description: editedSession.sessionDetails.description ?? "",
        schedule: editedSession.sessionDetails.schedule ?? "",
        styles: editedSession.sessionDetails.styles || [],
      },
      roles: editedSession.roles || [],
      videos: editedSession.videos || [],
      gallery: editedSession.gallery || [],
    };

    await editSessionQuery(sessionId, sessionData);

    const updatedSession = await getSessionQuery(sessionId);

    return {
      error: undefined,
      status: 200,
      session: updatedSession,
    };
  } catch (error) {
    console.error("Error editing session:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to update session",
      status: 500,
      session: null,
    };
  }
}

export async function deleteSession(sessionId: string): Promise<response> {
  const session = await auth();

  if (!session) {
    return {
      error: "No user session found",
      status: 401,
      session: null,
    };
  }

  const sessionData = await getSessionQuery(sessionId);

  if (!sessionData) {
    return {
      error: "Session not found",
      status: 404,
      session: null,
    };
  }

  // Check authorization
  if (!session.user.auth) {
    return {
      error: "User authorization level not found",
      status: 403,
      session: null,
    };
  }

  const sessionCreatorId = await getSessionCreator(sessionId);
  if (!sessionCreatorId) {
    return {
      error: "Session creator not found",
      status: 500,
      session: null,
    };
  }

  const isTeamMember = await isSessionTeamMember(sessionId, session.user.id);

  const hasPermission = canDeleteSession(
    session.user.auth,
    {
      sessionId: sessionId,
      sessionCreatorId: sessionCreatorId,
      isTeamMember: isTeamMember,
    },
    session.user.id
  );

  if (!hasPermission) {
    return {
      error: "You do not have permission to delete this session",
      status: 403,
      session: null,
    };
  }

  try {
    // Delete poster and gallery from storage
    const pictures = await getSessionPictures(sessionId);

    for (const url of pictures) {
      await deleteFromR2(url);
    }

    await deleteSessionQuery(sessionId);

    return {
      error: undefined,
      status: 200,
      session: null,
    };
  } catch (error) {
    console.error("Error deleting session:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete session",
      status: 500,
      session: null,
    };
  }
}
