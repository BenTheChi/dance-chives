import React from "react";
import { AppNavbar } from "@/components/AppNavbar";
import SessionFormWrapper from "@/components/SessionFormWrapper";
import { getSession } from "@/db/queries/session";
import { generateShortId } from "@/lib/utils";
import { SessionFormValues } from "@/components/forms/session-form";
import { auth } from "@/auth";
import {
  canUpdateSession,
  SessionPermissionContext,
} from "@/lib/utils/auth-utils";
import { notFound, redirect } from "next/navigation";
import { getSessionCreator } from "@/db/queries/session";
import {
  getSessionTeamMembers,
  isSessionTeamMember,
} from "@/db/queries/team-member";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ session: string }>;
}) {
  const { session } = await params;
  const sessionData = await auth();

  // Check authentication
  if (!sessionData?.user?.id) {
    redirect("/login");
  }

  const currSession = await getSession(session);

  // Check if session exists
  if (!currSession) {
    notFound();
  }

  const sessionCreatorId = await getSessionCreator(session);
  if (!sessionCreatorId) {
    redirect(`/sessions/${session}`);
  }

  // Check if user is session team member
  const isTeamMember = await isSessionTeamMember(session, sessionData.user.id);

  // Check authorization - allow team members even without auth level
  const authLevel = sessionData.user.auth ?? 0;
  const hasPermission = canUpdateSession(
    authLevel,
    {
      sessionId: session,
      sessionCreatorId: sessionCreatorId,
      isTeamMember: isTeamMember,
    },
    sessionData.user.id
  );

  if (!hasPermission) {
    redirect(`/sessions/${session}`);
  }

  // Session roles should be converted from Neo4j format
  const formattedRoles = currSession.roles.map((role) => {
    return {
      ...role,
      title: fromNeo4jRoleFormat(role.title) || role.title,
      id: role.id + "-" + generateShortId(),
    };
  });

  // Add null values to picture objects
  const formattedPictures = currSession.gallery.map((picture) => {
    return {
      ...picture,
      file: null,
    };
  });

  // Format dates array
  const formattedDates = currSession.eventDetails.dates.map((date) => ({
    date: date.date,
    startTime: date.startTime,
    endTime: date.endTime,
  }));

  // Add null values to sessionDetails objects
  const formattedSessionDetails = {
    ...currSession.eventDetails,
    description: currSession.eventDetails.description || "",
    schedule: currSession.eventDetails.schedule || "",
    address: currSession.eventDetails.address || "",
    cost: currSession.eventDetails.cost || "",
    styles: currSession.eventDetails.styles || [],
    dates: formattedDates,
    poster: currSession.eventDetails.poster
      ? {
          ...currSession.eventDetails.poster,
          title: currSession.eventDetails.poster.title || "",
          file: null,
        }
      : null,
  };

  const initialData: SessionFormValues = {
    sessionDetails:
      formattedSessionDetails as SessionFormValues["sessionDetails"],
    roles: formattedRoles,
    videos: currSession.videos,
    gallery: formattedPictures,
  };

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col gap-4 p-6 md:px-4">
        <SessionFormWrapper initialData={initialData} />
      </div>
    </>
  );
}
