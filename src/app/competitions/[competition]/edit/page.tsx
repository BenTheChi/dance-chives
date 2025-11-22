import { AppNavbar } from "@/components/AppNavbar";
import CompetitionFormWrapper from "@/components/CompetitionFormWrapper";
import { getCompetition } from "@/db/queries/competition";
import { generateShortId } from "@/lib/utils";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";
import { FormValues } from "@/components/forms/competition-form";
import { auth } from "@/auth";
import { canUpdateCompetition } from "@/lib/utils/auth-utils";
import { notFound, redirect } from "next/navigation";
import { isTeamMember } from "@/db/queries/team-member";

export default async function EditCompetitionPage({
  params,
}: {
  params: Promise<{ competition: string }>;
}) {
  const { competition } = await params;
  const session = await auth();

  // Check authentication
  if (!session?.user?.id) {
    redirect("/login");
  }

  const currEvent = await getCompetition(competition);

  // Check if event exists
  if (!currEvent) {
    notFound();
  }

  // Check if user is a team member
  const isEventTeamMember = await isTeamMember(competition, session.user.id);

  // Check authorization - allow team members even without auth level
  const authLevel = session.user.auth ?? 0;
  const hasPermission = canUpdateCompetition(
    authLevel,
    {
      eventId: competition,
      eventCreatorId: currEvent.eventDetails.creatorId,
      isTeamMember: isEventTeamMember,
    },
    session.user.id
  );

  if (!hasPermission) {
    redirect(`/competitions/${competition}`);
  }

  //Convert roles from Neo4j format (uppercase) to display format
  const formattedRoles = (currEvent.roles || []).map((role) => {
    return {
      ...role,
      title: fromNeo4jRoleFormat(role.title) || role.title,
      id: role.id + "-" + generateShortId(),
    };
  });

  //Add null values to picture objects
  const formattedPictures = (currEvent.gallery || []).map((picture) => {
    return {
      ...picture,
      file: null,
    };
  });

  //Add null values to subEvent objects
  const formattedSubEvents = (currEvent.subEvents || []).map((subEvent) => {
    return {
      ...subEvent,
      poster: subEvent.poster
        ? {
            ...subEvent.poster,
            title: subEvent.poster.title || "",
            file: null,
          }
        : null,
    };
  });

  //Add null values to workshop objects and format roles
  const formattedWorkshops = (currEvent.workshops || []).map((workshop) => {
    return {
      ...workshop,
      workshopDetails: {
        ...workshop.workshopDetails,
        poster: workshop.workshopDetails.poster
          ? {
              ...workshop.workshopDetails.poster,
              title: workshop.workshopDetails.poster.title || "",
              file: null,
            }
          : null,
      },
      roles: workshop.roles.map((role) => {
        // Ensure role has proper structure
        const roleTitle =
          role.title?.toUpperCase() || role.id?.toUpperCase() || "ORGANIZER";
        return {
          id: generateShortId(), // Generate a unique ID for the form
          title: (roleTitle === "ORGANIZER" || roleTitle === "TEACHER"
            ? roleTitle
            : "ORGANIZER") as "ORGANIZER" | "TEACHER",
          user:
            role.user && role.user.id
              ? {
                  id: role.user.id,
                  displayName: role.user.displayName || "",
                  username: role.user.username || "",
                }
              : null,
        };
      }),
      videos: workshop.videos.map((video) => ({
        ...video,
        file: null,
      })),
      gallery: workshop.gallery.map((picture) => ({
        ...picture,
        file: null,
      })),
    };
  });

  //Add null values to eventDetails objects
  const formattedEventDetails = {
    ...currEvent.eventDetails,
    poster: currEvent.eventDetails.poster
      ? {
          ...currEvent.eventDetails.poster,
          title: currEvent.eventDetails.poster.title || "",
          file: null,
        }
      : null,
  };

  //Convert event to FormValues
  // Note: Zod's preprocess will convert undefined/null to "" for description/schedule fields
  const eventFormValues = {
    eventDetails: formattedEventDetails,
    sections: currEvent.sections,
    roles: formattedRoles,
    subEvents: formattedSubEvents,
    workshops: formattedWorkshops,
    gallery: formattedPictures,
  } as FormValues;

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col gap-4 p-6 md:px-4">
        <CompetitionFormWrapper initialData={eventFormValues} />
      </div>
    </>
  );
}

