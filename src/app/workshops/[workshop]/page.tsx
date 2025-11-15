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
import VideoGallery from "@/components/VideoGallery";

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

  // Check if workshop is associated with event and user is event team member
  let isEventTeamMember = false;
  if (workshop.associatedEventId && session?.user?.id) {
    const eventTeamMembers = await getEventTeamMembers(
      workshop.associatedEventId
    );
    isEventTeamMember = eventTeamMembers.includes(session.user.id);
  }

  // Check if user can edit the workshop
  const canEdit =
    session?.user?.id && session?.user?.auth !== undefined
      ? canUpdateWorkshop(
          session.user.auth,
          {
            workshopId: workshop.id,
            workshopCreatorId: workshop.workshopDetails.creatorId,
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
            workshopCreatorId: workshop.workshopDetails.creatorId,
          },
          session.user.id
        )
      : false;

  // Get current user's roles for this workshop
  const currentUserRoles = workshop.roles
    .filter((role) => role.user?.id === session?.user?.id)
    .map((role) => fromNeo4jRoleFormat(role.title))
    .filter((role): role is string => role !== null);

  // Aggregate all unique styles from videos
  const allStyles = new Set<string>();
  workshop.videos.forEach((video) => {
    if (video.styles) {
      video.styles.forEach((style) => allStyles.add(style));
    }
  });
  const workshopStyles = Array.from(allStyles);

  // Group roles by title
  const rolesByTitle = new Map<string, Array<(typeof workshop.roles)[0]>>();
  workshop.roles.forEach((role) => {
    if (role.user) {
      const title = role.title;
      if (!rolesByTitle.has(title)) {
        rolesByTitle.set(title, []);
      }
      rolesByTitle.get(title)!.push(role);
    }
  });

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

          {workshop.workshopDetails.poster ? (
            <Image
              src={workshop.workshopDetails.poster.url}
              alt={workshop.workshopDetails.poster.title}
              width={500}
              height={500}
              className="object-contain rounded-md w-full md:col-span-1 xl:col-span-1"
            />
          ) : (
            <div className="w-full h-[300px] md:h-[400px] bg-gray-300 text-center m-auto flex items-center justify-center md:col-span-1 xl:col-span-1">
              No poster
            </div>
          )}

          <div className="flex flex-col gap-4 md:col-span-1 xl:col-span-1">
            {/* Workshop Details */}
            <section className="bg-blue-100 p-4 rounded-md flex flex-col gap-2">
              <h1 className="text-2xl font-bold">
                {workshop.workshopDetails.title}
              </h1>
              <div className="flex flex-row gap-2">
                <Calendar />
                <b>Date:</b>
                {workshop.workshopDetails.startDate}
              </div>
              <div className="flex flex-row gap-2">
                <Building />
                <b>City:</b>{" "}
                {workshop.workshopDetails.city.id ? (
                  <Link
                    href={`/cities/${workshop.workshopDetails.city.id}`}
                    className="hover:text-blue-600 hover:underline transition-colors"
                  >
                    {workshop.workshopDetails.city.name}
                    {workshop.workshopDetails.city.countryCode &&
                      `, ${workshop.workshopDetails.city.countryCode}`}
                  </Link>
                ) : (
                  <>
                    {workshop.workshopDetails.city.name}
                    {workshop.workshopDetails.city.countryCode &&
                      `, ${workshop.workshopDetails.city.countryCode}`}
                  </>
                )}
              </div>
              {workshop.workshopDetails.address && (
                <div className="flex flex-row gap-2">
                  <div className="flex flex-row gap-2">
                    <MapPin />
                    <b>Location:</b>
                  </div>
                  <div className="whitespace-pre-wrap">
                    {workshop.workshopDetails.address}
                  </div>
                </div>
              )}
              {workshop.workshopDetails.startTime &&
                workshop.workshopDetails.endTime && (
                  <div className="flex flex-row gap-2">
                    <Clock />
                    <b>Time:</b> {workshop.workshopDetails.startTime} -{" "}
                    {workshop.workshopDetails.endTime}
                  </div>
                )}
              {workshop.workshopDetails.cost && (
                <div className="flex flex-row gap-2">
                  <DollarSign />
                  <b>Cost:</b> {workshop.workshopDetails.cost}
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
              {workshop.associatedEventId && (
                <div className="flex flex-row gap-2">
                  <b>Associated Event:</b>
                  <Link
                    href={`/events/${workshop.associatedEventId}`}
                    className="hover:text-blue-600 hover:underline"
                  >
                    View Event
                  </Link>
                </div>
              )}
            </section>

            {/* Roles Section */}
            {rolesByTitle.size > 0 && (
              <section className="bg-green-100 p-4 rounded-md">
                <h2 className="text-xl font-bold mb-2">Roles</h2>
                <div className="flex flex-col gap-2">
                  {Array.from(rolesByTitle.entries()).map(
                    ([roleTitle, roles]) => (
                      <div
                        key={roleTitle}
                        className="flex flex-row gap-2 items-center flex-wrap"
                      >
                        <Badge variant="secondary">
                          {fromNeo4jRoleFormat(roleTitle) || roleTitle}
                        </Badge>
                        <div className="flex flex-row gap-1 items-center flex-wrap">
                          {roles.map((role, index) => (
                            <span key={`${role.id}-${index}`}>
                              {role.user?.username ? (
                                <Link
                                  href={`/profiles/${role.user.username}`}
                                  className="text-blue-500 hover:text-blue-700 hover:underline"
                                >
                                  {role.user.displayName || role.user.username}
                                </Link>
                              ) : (
                                <span className="text-blue-500">
                                  {role.user?.displayName ||
                                    role.user?.username}
                                </span>
                              )}
                              {index < roles.length - 1 && (
                                <span className="text-gray-500">, </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Description and Schedule */}
          <div className="flex flex-col gap-4 md:col-span-2 xl:col-span-2">
            {workshop.workshopDetails.description && (
              <section className="bg-red-100 p-4 rounded-md">
                <div className="flex flex-row justify-center items-center gap-2 font-bold text-2xl mb-2">
                  <FileText />
                  Description:
                </div>
                <div className="whitespace-pre-wrap">
                  {workshop.workshopDetails.description}
                </div>
              </section>
            )}

            {workshop.workshopDetails.schedule && (
              <section className="bg-blue-100 p-4 rounded-md">
                <div className="flex flex-row justify-center items-center gap-2 font-bold text-2xl mb-2">
                  <Calendar />
                  Schedule:
                </div>
                <div className="whitespace-pre-wrap">
                  {workshop.workshopDetails.schedule}
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
                  eventTitle={workshop.workshopDetails.title}
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
              <div className="flex flex-row gap-5 flex-wrap justify-center">
                {workshop.gallery.map((image) => (
                  <Image
                    key={image.id}
                    src={image.url}
                    alt={image.title}
                    width={100}
                    height={100}
                    className="object-contain w-full max-w-[200px] h-auto"
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
