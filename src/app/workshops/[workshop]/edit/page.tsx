import React from "react";
import { AppNavbar } from "@/components/AppNavbar";
import WorkshopFormWrapper from "@/components/WorkshopFormWrapper";
import { getWorkshop } from "@/db/queries/workshop";
import { generateShortId } from "@/lib/utils";
import { WorkshopFormValues } from "@/components/forms/workshop-form";
import { auth } from "@/auth";
import {
  canUpdateWorkshop,
} from "@/lib/utils/auth-utils";
import { notFound, redirect } from "next/navigation";
import {
  getWorkshopCreator,
  isWorkshopTeamMember,
} from "@/db/queries/workshop";

export default async function EditWorkshopPage({
  params,
}: {
  params: Promise<{ workshop: string }>;
}) {
  const { workshop } = await params;
  const session = await auth();

  // Check authentication
  if (!session?.user?.id) {
    redirect("/login");
  }

  const currWorkshop = await getWorkshop(workshop);

  // Check if workshop exists
  if (!currWorkshop) {
    notFound();
  }

  const workshopCreatorId = await getWorkshopCreator(workshop);
  if (!workshopCreatorId) {
    redirect(`/workshops/${workshop}`);
  }

  // Check if user is workshop team member
  const isTeamMember = await isWorkshopTeamMember(workshop, session.user.id);

  // Workshops are no longer associated with events as sub-events
  const isEventTeamMember = false;

  // Check authorization - allow team members even without auth level
  const authLevel = session.user.auth ?? 0;
  const hasPermission = canUpdateWorkshop(
    authLevel,
    {
      workshopId: workshop,
      workshopCreatorId: workshopCreatorId,
      isTeamMember: isTeamMember,
      isEventTeamMember: isEventTeamMember,
    },
    session.user.id
  );

  if (!hasPermission) {
    redirect(`/workshops/${workshop}`);
  }

  // Workshop roles should stay in uppercase format (ORGANIZER, TEACHER)
  const formattedRoles = currWorkshop.roles.map((role) => {
    return {
      ...role,
      title: role.title, // Keep uppercase format for workshop roles
      id: role.id + "-" + generateShortId(),
    };
  });

  // Add null values to picture objects
  const formattedPictures = currWorkshop.gallery.map((picture) => {
    return {
      ...picture,
      file: null,
    };
  });

  // Add null values to workshopDetails objects
  const formattedWorkshopDetails = {
    ...currWorkshop.eventDetails,
    description: currWorkshop.eventDetails?.description || "",
    schedule: currWorkshop.eventDetails?.schedule || "",
    address: currWorkshop.eventDetails?.address || "",
    startTime: currWorkshop.eventDetails?.startTime || "",
    endTime: currWorkshop.eventDetails?.endTime || "",
    cost: currWorkshop.eventDetails?.cost || "",
    styles: currWorkshop.eventDetails?.styles || [],
    poster: currWorkshop.eventDetails?.poster
      ? {
          ...currWorkshop.eventDetails.poster,
          title: currWorkshop.eventDetails.poster.title || "",
          file: null,
        }
      : null,
  };

  // Format subevents for form
  const formattedSubEvents = (currWorkshop.subEvents || []).map((subEvent) => ({
    id: subEvent.id,
    title: subEvent.title,
    type: (subEvent.type as "competition" | "workshop" | "session") || "competition",
    imageUrl: subEvent.imageUrl,
    date: subEvent.date || "",
    city: subEvent.city || "",
    cityId: subEvent.cityId,
    styles: subEvent.styles || [],
  }));

  const initialData: WorkshopFormValues = {
    workshopDetails:
      formattedWorkshopDetails as WorkshopFormValues["workshopDetails"],
    roles: formattedRoles,
    videos: currWorkshop.videos,
    gallery: formattedPictures,
    subEvents: formattedSubEvents,
  };

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col gap-4 p-6 md:px-4">
        <WorkshopFormWrapper initialData={initialData} />
      </div>
    </>
  );
}
