import { AppNavbar } from "@/components/AppNavbar";
import WorkshopFormWrapper from "@/components/WorkshopFormWrapper";
import { getWorkshop } from "@/db/queries/workshop";
import { generateShortId } from "@/lib/utils";
import { WorkshopFormValues } from "@/components/forms/workshop-form";
import { auth } from "@/auth";
import {
  canUpdateWorkshop,
  WorkshopPermissionContext,
} from "@/lib/utils/auth-utils";
import { notFound, redirect } from "next/navigation";
import {
  getWorkshopCreator,
  getWorkshopTeamMembers,
  isWorkshopTeamMember,
} from "@/db/queries/workshop";
import { getEventTeamMembers } from "@/db/queries/team-member";

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

  // Check authorization
  if (!session.user.auth) {
    redirect(`/workshops/${workshop}`);
  }

  const workshopCreatorId = await getWorkshopCreator(workshop);
  if (!workshopCreatorId) {
    redirect(`/workshops/${workshop}`);
  }

  // Check if user is workshop team member
  const isTeamMember = await isWorkshopTeamMember(workshop, session.user.id);

  // Check if workshop is associated with event and user is event team member
  let isEventTeamMember = false;
  if (currWorkshop.associatedEventId) {
    const eventTeamMembers = await getEventTeamMembers(
      currWorkshop.associatedEventId
    );
    isEventTeamMember = eventTeamMembers.includes(session.user.id);
  }

  const hasPermission = canUpdateWorkshop(
    session.user.auth,
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
    ...currWorkshop.workshopDetails,
    description: currWorkshop.workshopDetails.description || "",
    schedule: currWorkshop.workshopDetails.schedule || "",
    address: currWorkshop.workshopDetails.address || "",
    startTime: currWorkshop.workshopDetails.startTime || "",
    endTime: currWorkshop.workshopDetails.endTime || "",
    cost: currWorkshop.workshopDetails.cost || "",
    poster: currWorkshop.workshopDetails.poster
      ? {
          ...currWorkshop.workshopDetails.poster,
          title: currWorkshop.workshopDetails.poster.title || "",
          file: null,
        }
      : null,
  };

  const initialData: WorkshopFormValues = {
    workshopDetails:
      formattedWorkshopDetails as WorkshopFormValues["workshopDetails"],
    roles: formattedRoles,
    videos: currWorkshop.videos,
    gallery: formattedPictures,
    associatedEventId: currWorkshop.associatedEventId || null,
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
