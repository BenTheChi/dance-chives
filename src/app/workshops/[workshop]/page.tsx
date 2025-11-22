import { Button } from "@/components/ui/button";
import { Workshop } from "@/types/workshop";
import {
  Building,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AppNavbar } from "@/components/AppNavbar";
import { getWorkshop } from "@/db/queries/workshop";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { isWorkshopCreator } from "@/db/queries/workshop";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";
import { StyleBadge } from "@/components/ui/style-badge";
import { Badge } from "@/components/ui/badge";
import { canUpdateWorkshop, canDeleteWorkshop } from "@/lib/utils/auth-utils";
import {
  getWorkshopTeamMembers,
  isWorkshopTeamMember,
} from "@/db/queries/workshop";
import { getEventTeamMembers } from "@/db/queries/team-member";
import { getUser } from "@/db/queries/user";
import VideoGallery from "@/components/VideoGallery";
import { TagSelfDropdown } from "@/components/workshops/TagSelfDropdown";
import { formatTimeToAMPM } from "@/lib/utils/calendar-utils";
import { PhotoGallery } from "@/components/PhotoGallery";
import { PosterImage } from "@/components/PosterImage";

type PageProps = {
  params: Promise<{ workshop: string }>;
};

// Helper function to validate workshop ID format
function isValidWorkshopId(id: string): boolean {
  const invalidPatterns = [
    /\.(svg|png|jpg|jpeg|gif|ico|css|js|json|xml|txt|pdf|doc|docx)$/i,
    /^(logo|favicon|robots|sitemap|manifest)/i,
  ];

  return !invalidPatterns.some((pattern) => pattern.test(id));
}

export default async function WorkshopPage({ params }: PageProps) {
  const paramResult = await params;

  // Validate the workshop ID before trying to fetch it
  if (!isValidWorkshopId(paramResult.workshop)) {
    notFound();
  }

  const workshop = (await getWorkshop(paramResult.workshop)) as Workshop;

  // Check if current user is the creator
  const session = await auth();
  const isCreator = session?.user?.id
    ? await isWorkshopCreator(workshop.id, session.user.id)
    : false;

  // Check if user is workshop team member
  const isTeamMember = session?.user?.id
    ? await isWorkshopTeamMember(workshop.id, session.user.id)
    : false;

  // Note: Workshops are no longer associated with events
  const isEventTeamMember = false;

  // Check if user can edit the workshop
  const canEdit =
    session?.user?.id && session?.user?.auth !== undefined
      ? canUpdateWorkshop(
          session.user.auth,
          {
            workshopId: workshop.id,
            workshopCreatorId: workshop.eventDetails?.creatorId ?? "",
            isTeamMember: isTeamMember,
            isEventTeamMember: isEventTeamMember,
          },
          session.user.id
        )
      : false;

  // Check if user can delete the workshop
  const canDelete =
    session?.user?.id && session?.user?.auth !== undefined
      ? canDeleteWorkshop(
          session.user.auth,
          {
            workshopId: workshop.id,
            workshopCreatorId: workshop.eventDetails?.creatorId ?? "",
          },
          session.user.id
        )
      : false;

  // Get current user's roles for this workshop
  // Exclude TEAM_MEMBER - team members are shown separately
  const currentUserRoles = workshop.roles
    .filter(
      (role) =>
        role.user?.id === session?.user?.id && role.title !== "TEAM_MEMBER"
    )
    .map((role) => fromNeo4jRoleFormat(role.title))
    .filter((role): role is string => role !== null);

  // Aggregate all unique styles from workshop and videos
  const allStyles = new Set<string>();

  // Add workshop-level styles
  if (workshop.eventDetails?.styles) {
    workshop.eventDetails.styles.forEach((style) => allStyles.add(style));
  }

  // Add video-level styles
  workshop.videos.forEach((video) => {
    if (video.styles) {
      video.styles.forEach((style) => allStyles.add(style));
    }
  });

  const workshopStyles = Array.from(allStyles);

  // Group roles by title (exclude TEAM_MEMBER - team members are shown separately)
  const rolesByTitle = new Map<string, Array<(typeof workshop.roles)[0]>>();
  workshop.roles.forEach((role) => {
    if (role.user && role.title !== "TEAM_MEMBER") {
      const title = role.title;
      if (!rolesByTitle.has(title)) {
        rolesByTitle.set(title, []);
      }
      rolesByTitle.get(title)!.push(role);
    }
  });

  // Fetch creator and team members for Team Members section
  const creator = workshop.eventDetails?.creatorId
    ? await getUser(workshop.eventDetails.creatorId)
    : null;
  const teamMemberIds = await getWorkshopTeamMembers(workshop.id);
  const teamMembers = await Promise.all(teamMemberIds.map((id) => getUser(id)));
  const validTeamMembers = teamMembers.filter(
    (member): member is NonNullable<typeof member> => member !== null
  );

  // Note: Workshops are no longer associated with events
  const eventTeamMemberIds: string[] = [];
  const eventTeamMembers: NonNullable<Awaited<ReturnType<typeof getUser>>>[] =
    [];

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col justify-center items-center gap-2 py-5 px-15">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 auto-rows-min w-full">
          <div className="flex flex-row justify-between items-center mb-2 w-full col-span-1 md:col-span-2 xl:col-span-4 auto-rows-min">
            <Link href="/workshops" className="hover:underline">
              {`Back to Workshops`}
            </Link>
            {canEdit && (
              <Button asChild>
                <Link href={`/workshops/${workshop.id}/edit`}>Edit</Link>
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" asChild>
                <Link href={`/workshops/${workshop.id}/delete`}>Delete</Link>
              </Button>
            )}
          </div>

          <PosterImage
            poster={workshop.eventDetails.poster ?? null}
            className="md:col-span-1 xl:col-span-1"
          />

          <div className="flex flex-col gap-4 md:col-span-1 xl:col-span-1">
            {/* Workshop Details */}
            <section className="bg-blue-100 p-4 rounded-md flex flex-col gap-2">
              <h1 className="text-2xl font-bold">
                {workshop.eventDetails.title}
              </h1>
              {workshop.eventDetails.parentEvent && (
                <div className="flex flex-row gap-2">
                  <span>Main Event:</span>
                  <Link
                    href={`/competitions/${workshop.eventDetails.parentEvent.id}`}
                    className="hover:text-blue-600 hover:underline transition-colors"
                  >
                    {workshop.eventDetails.parentEvent.title}
                  </Link>
                </div>
              )}
              <div className="flex flex-row gap-2">
                <Calendar />
                <b>Date:</b>
                {workshop.eventDetails.startDate}
              </div>
              <div className="flex flex-row gap-2">
                <Building />
                <b>City:</b>{" "}
                {workshop.eventDetails.city.id ? (
                  <Link
                    href={`/cities/${workshop.eventDetails.city.id}`}
                    className="hover:text-blue-600 hover:underline transition-colors"
                  >
                    {workshop.eventDetails.city.name}
                    {workshop.eventDetails.city.countryCode &&
                      `, ${workshop.eventDetails.city.countryCode}`}
                  </Link>
                ) : (
                  <>
                    {workshop.eventDetails.city.name}
                    {workshop.eventDetails.city.countryCode &&
                      `, ${workshop.eventDetails.city.countryCode}`}
                  </>
                )}
              </div>
              {workshop.eventDetails.address && (
                <div className="flex flex-row gap-2">
                  <div className="flex flex-row gap-2">
                    <MapPin />
                    <b>Location:</b>
                  </div>
                  <div className="whitespace-pre-wrap">
                    {workshop.eventDetails.address}
                  </div>
                </div>
              )}
              {workshop.eventDetails.startTime &&
                workshop.eventDetails.endTime && (
                  <div className="flex flex-row gap-2">
                    <Clock />
                    <b>Time:</b>{" "}
                    {formatTimeToAMPM(workshop.eventDetails.startTime)} -{" "}
                    {formatTimeToAMPM(workshop.eventDetails.endTime)}
                  </div>
                )}
              {workshop.eventDetails.cost && (
                <div className="flex flex-row gap-2">
                  <DollarSign />
                  <b>Cost:</b> {workshop.eventDetails.cost}
                </div>
              )}
              {workshopStyles.length > 0 && (
                <div className="flex flex-row gap-2 items-center">
                  <b>Styles:</b>
                  <div className="flex flex-wrap gap-1">
                    {workshopStyles.map((style) => (
                      <StyleBadge key={style} style={style} />
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Roles Section */}
            <section className="bg-green-100 p-4 rounded-md">
              <h2 className="text-xl font-bold mb-2">Roles</h2>
              <TagSelfDropdown
                workshopId={workshop.id}
                currentUserRoles={currentUserRoles}
                isTeamMember={isTeamMember}
              />
              {rolesByTitle.size > 0 && (
                <div className="flex flex-col gap-2">
                  {Array.from(rolesByTitle.entries()).map(
                    ([roleTitle, roles]) => (
                      <div
                        key={roleTitle}
                        className="flex flex-row gap-2 items-center flex-wrap"
                      >
                        <span>
                          {fromNeo4jRoleFormat(roleTitle) || roleTitle}:{" "}
                        </span>
                        {roles.map((role, index) => (
                          <Badge
                            key={`${role.id}-${index}`}
                            variant="secondary"
                            asChild
                          >
                            {role.user?.username ? (
                              <Link href={`/profiles/${role.user.username}`}>
                                {role.user.displayName || role.user.username}
                              </Link>
                            ) : (
                              <span>
                                {role.user?.displayName || role.user?.username}
                              </span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            {/* Team Members Section */}
            {(creator ||
              validTeamMembers.length > 0 ||
              eventTeamMembers.length > 0) && (
              <section className="bg-green-100 p-4 rounded-md">
                <h2 className="text-xl font-bold mb-2">Team Members</h2>
                <div className="flex flex-col gap-2">
                  {creator && (
                    <div className="flex flex-row gap-2 items-center flex-wrap">
                      <span>Creator: </span>
                      <Badge variant="secondary" asChild>
                        {creator.username ? (
                          <Link href={`/profiles/${creator.username}`}>
                            {creator.displayName || creator.username}
                          </Link>
                        ) : (
                          <span>{creator.displayName || creator.username}</span>
                        )}
                      </Badge>
                    </div>
                  )}
                  {validTeamMembers.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-row gap-2 items-center flex-wrap">
                        {validTeamMembers.map((member) => (
                          <Badge key={member.id} variant="secondary" asChild>
                            {member.username ? (
                              <Link href={`/profiles/${member.username}`}>
                                {member.displayName || member.username}
                              </Link>
                            ) : (
                              <span>
                                {member.displayName || member.username}
                              </span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {eventTeamMembers.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="text-sm font-semibold text-gray-600">
                        Team Members (from Event):
                      </div>
                      <div className="flex flex-row gap-2 items-center flex-wrap">
                        {eventTeamMembers.map((member) => (
                          <Badge
                            key={member.id}
                            variant="outline"
                            className="border-blue-300 text-blue-700"
                            asChild
                          >
                            {member.username ? (
                              <Link href={`/profiles/${member.username}`}>
                                {member.displayName || member.username}
                              </Link>
                            ) : (
                              <span>
                                {member.displayName || member.username}
                              </span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Description and Schedule */}
          <div className="flex flex-col gap-4 md:col-span-2 xl:col-span-2">
            {workshop.eventDetails.description && (
              <section className="bg-red-100 p-4 rounded-md">
                <div className="flex flex-row justify-center items-center gap-2 font-bold text-2xl mb-2">
                  <FileText />
                  Description:
                </div>
                <div className="whitespace-pre-wrap">
                  {workshop.eventDetails.description}
                </div>
              </section>
            )}

            {workshop.eventDetails.schedule && (
              <section className="bg-blue-100 p-4 rounded-md">
                <div className="flex flex-row justify-center items-center gap-2 font-bold text-2xl mb-2">
                  <Calendar />
                  Schedule:
                </div>
                <div className="whitespace-pre-wrap">
                  {workshop.eventDetails.schedule}
                </div>
              </section>
            )}

            {/* Videos Section */}
            {workshop.videos.length > 0 && (
              <section className="bg-purple-100 p-4 rounded-md">
                <h2 className="text-2xl font-bold mb-4">Videos</h2>
                <VideoGallery
                  videos={workshop.videos}
                  eventLink={`/workshops/${workshop.id}`}
                  eventTitle={workshop.eventDetails.title}
                  eventId={workshop.id}
                  sectionTitle=""
                  sectionStyles={[]}
                  applyStylesToVideos={false}
                  currentUserId={session?.user?.id}
                />
              </section>
            )}
          </div>

          {/* Photo Gallery */}
          {workshop.gallery.length > 0 && (
            <section className="flex flex-col bg-red-100 rounded-md p-4 w-full md:col-span-2 xl:col-span-4">
              <h2 className="text-2xl font-bold mb-2 text-center">
                Photo Gallery
              </h2>
              <PhotoGallery images={workshop.gallery} />
            </section>
          )}
        </div>
      </div>
    </>
  );
}
