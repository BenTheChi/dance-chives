import { Button } from "@/components/ui/button";
import { Session } from "@/types/session";
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
import { getSession } from "@/db/queries/session";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { isSessionCreator } from "@/db/queries/session";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";
import { StyleBadge } from "@/components/ui/style-badge";
import { Badge } from "@/components/ui/badge";
import { canUpdateSession, canDeleteSession } from "@/lib/utils/auth-utils";
import {
  getSessionTeamMembers,
  isSessionTeamMember,
} from "@/db/queries/team-member";
import { getUser } from "@/db/queries/user";
import VideoGallery from "@/components/VideoGallery";
import { TagSelfDropdown } from "@/components/sessions/TagSelfDropdown";
import { DeleteSessionButton } from "@/components/DeleteSessionButton";
import { formatTimeToAMPM } from "@/lib/utils/calendar-utils";
import { PhotoGallery } from "@/components/PhotoGallery";
import { PosterImage } from "@/components/PosterImage";

type PageProps = {
  params: Promise<{ session: string }>;
};

// Helper function to validate session ID format
function isValidSessionId(id: string): boolean {
  const invalidPatterns = [
    /\.(svg|png|jpg|jpeg|gif|ico|css|js|json|xml|txt|pdf|doc|docx)$/i,
    /^(logo|favicon|robots|sitemap|manifest)/i,
  ];

  return !invalidPatterns.some((pattern) => pattern.test(id));
}

export default async function SessionPage({ params }: PageProps) {
  const paramResult = await params;

  // Validate the session ID before trying to fetch it
  if (!isValidSessionId(paramResult.session)) {
    notFound();
  }

  const session = (await getSession(paramResult.session)) as Session;

  // Check if current user is the creator
  const sessionData = await auth();
  const isCreator = sessionData?.user?.id
    ? await isSessionCreator(session.id, sessionData.user.id)
    : false;

  // Check if user is session team member
  const isTeamMember = sessionData?.user?.id
    ? await isSessionTeamMember(session.id, sessionData.user.id)
    : false;

  // Check if user can edit the session
  const canEdit =
    sessionData?.user?.id && sessionData?.user?.auth !== undefined
      ? canUpdateSession(
          sessionData.user.auth,
          {
            sessionId: session.id,
            sessionCreatorId: session.sessionDetails.creatorId,
            isTeamMember: isTeamMember,
          },
          sessionData.user.id
        )
      : false;

  // Check if user can delete the session
  const canDelete =
    sessionData?.user?.id && sessionData?.user?.auth !== undefined
      ? canDeleteSession(
          sessionData.user.auth,
          {
            sessionId: session.id,
            sessionCreatorId: session.sessionDetails.creatorId,
            isTeamMember: isTeamMember,
          },
          sessionData.user.id
        )
      : false;

  // Get current user's roles for this session
  // Exclude TEAM_MEMBER - team members are shown separately
  const currentUserRoles = session.roles
    .filter(
      (role) =>
        role.user?.id === sessionData?.user?.id && role.title !== "TEAM_MEMBER"
    )
    .map((role) => fromNeo4jRoleFormat(role.title))
    .filter((role): role is string => role !== null);

  // Aggregate all unique styles from session and videos
  const allStyles = new Set<string>();

  // Add session-level styles
  if (session.sessionDetails.styles) {
    session.sessionDetails.styles.forEach((style) => allStyles.add(style));
  }

  // Add video-level styles
  session.videos.forEach((video) => {
    if (video.styles) {
      video.styles.forEach((style) => allStyles.add(style));
    }
  });

  const sessionStyles = Array.from(allStyles);

  // Group roles by title (exclude TEAM_MEMBER - team members are shown separately)
  const rolesByTitle = new Map<string, Array<(typeof session.roles)[0]>>();
  session.roles.forEach((role) => {
    if (role.user && role.title !== "TEAM_MEMBER") {
      const title = role.title;
      if (!rolesByTitle.has(title)) {
        rolesByTitle.set(title, []);
      }
      rolesByTitle.get(title)!.push(role);
    }
  });

  // Fetch creator and team members for Team Members section
  const creator = session.sessionDetails.creatorId
    ? await getUser(session.sessionDetails.creatorId)
    : null;
  const teamMemberIds = await getSessionTeamMembers(session.id);
  const teamMembers = await Promise.all(teamMemberIds.map((id) => getUser(id)));
  const validTeamMembers = teamMembers.filter(
    (member): member is NonNullable<typeof member> => member !== null
  );

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col justify-center items-center gap-2 py-5 px-15">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 auto-rows-min w-full">
          <div className="flex flex-row justify-between items-center mb-2 w-full col-span-1 md:col-span-2 xl:col-span-4 auto-rows-min">
            <Link href="/sessions" className="hover:underline">
              {`Back to Sessions`}
            </Link>
            {canEdit && (
              <Button asChild>
                <Link href={`/sessions/${session.id}/edit`}>Edit</Link>
              </Button>
            )}
            {canDelete && (
              <DeleteSessionButton sessionId={session.id} />
            )}
          </div>

          <PosterImage
            poster={session.sessionDetails.poster}
            className="md:col-span-1 xl:col-span-1"
          />

          <div className="flex flex-col gap-4 md:col-span-1 xl:col-span-1">
            {/* Session Details */}
            <section className="bg-blue-100 p-4 rounded-md flex flex-col gap-2">
              <h1 className="text-2xl font-bold">
                {session.sessionDetails.title}
              </h1>
              {/* Multiple Dates */}
              {session.sessionDetails.dates && session.sessionDetails.dates.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row gap-2">
                    <Calendar />
                    <b>Dates:</b>
                  </div>
                  {session.sessionDetails.dates.map((date, index) => (
                    <div key={index} className="ml-6 flex flex-col gap-1">
                      <div className="flex flex-row gap-2">
                        <span>{date.date}</span>
                      </div>
                      {(date.startTime || date.endTime) && (
                        <div className="flex flex-row gap-2 ml-4">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatTimeToAMPM(date.startTime)} - {formatTimeToAMPM(date.endTime)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-row gap-2">
                <Building />
                <b>City:</b>{" "}
                {session.sessionDetails.city.id ? (
                  <Link
                    href={`/cities/${session.sessionDetails.city.id}`}
                    className="hover:text-blue-600 hover:underline transition-colors"
                  >
                    {session.sessionDetails.city.name}
                    {session.sessionDetails.city.countryCode &&
                      `, ${session.sessionDetails.city.countryCode}`}
                  </Link>
                ) : (
                  <>
                    {session.sessionDetails.city.name}
                    {session.sessionDetails.city.countryCode &&
                      `, ${session.sessionDetails.city.countryCode}`}
                  </>
                )}
              </div>
              {session.sessionDetails.address && (
                <div className="flex flex-row gap-2">
                  <div className="flex flex-row gap-2">
                    <MapPin />
                    <b>Location:</b>
                  </div>
                  <div className="whitespace-pre-wrap">
                    {session.sessionDetails.address}
                  </div>
                </div>
              )}
              {session.sessionDetails.cost && (
                <div className="flex flex-row gap-2">
                  <DollarSign />
                  <b>Cost:</b> {session.sessionDetails.cost}
                </div>
              )}
              {sessionStyles.length > 0 && (
                <div className="flex flex-row gap-2 items-center">
                  <b>Styles:</b>
                  <div className="flex flex-wrap gap-1">
                    {sessionStyles.map((style) => (
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
                sessionId={session.id}
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
            {(creator || validTeamMembers.length > 0) && (
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
                </div>
              </section>
            )}
          </div>

          {/* Description and Schedule */}
          <div className="flex flex-col gap-4 md:col-span-2 xl:col-span-2">
            {session.sessionDetails.description && (
              <section className="bg-red-100 p-4 rounded-md">
                <div className="flex flex-row justify-center items-center gap-2 font-bold text-2xl mb-2">
                  <FileText />
                  Description:
                </div>
                <div className="whitespace-pre-wrap">
                  {session.sessionDetails.description}
                </div>
              </section>
            )}

            {session.sessionDetails.schedule && (
              <section className="bg-blue-100 p-4 rounded-md">
                <div className="flex flex-row justify-center items-center gap-2 font-bold text-2xl mb-2">
                  <Calendar />
                  Schedule:
                </div>
                <div className="whitespace-pre-wrap">
                  {session.sessionDetails.schedule}
                </div>
              </section>
            )}

            {/* Videos Section */}
            {session.videos.length > 0 && (
              <section className="bg-purple-100 p-4 rounded-md">
                <h2 className="text-2xl font-bold mb-4">Videos</h2>
                <VideoGallery
                  videos={session.videos}
                  eventLink={`/sessions/${session.id}`}
                  eventTitle={session.sessionDetails.title}
                  eventId={session.id}
                  sectionTitle=""
                  sectionStyles={[]}
                  applyStylesToVideos={false}
                  currentUserId={sessionData?.user?.id}
                />
              </section>
            )}
          </div>

          {/* Photo Gallery */}
          {session.gallery.length > 0 && (
            <section className="flex flex-col bg-red-100 rounded-md p-4 w-full md:col-span-2 xl:col-span-4">
              <h2 className="text-2xl font-bold mb-2 text-center">
                Photo Gallery
              </h2>
              <PhotoGallery images={session.gallery} />
            </section>
          )}
        </div>
      </div>
    </>
  );
}

