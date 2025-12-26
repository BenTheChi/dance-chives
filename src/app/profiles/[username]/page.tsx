import { notFound } from "next/navigation";
import { getUserProfile } from "@/lib/server_actions/auth_actions";
import { AppNavbar } from "@/components/AppNavbar";
import { StyleBadge } from "@/components/ui/style-badge";
import Image from "next/image";
import Link from "next/link";
import { Event, Role } from "@/types/event";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";
import { TaggedVideosSection } from "@/components/profile/TaggedVideosSection";
import { SectionsWonSection } from "@/components/profile/SectionsWonSection";
import { ProfileClient, ProfileRolesSection } from "./profile-client";

interface PageProps {
  params: Promise<{ username: string }>;
}

// Enable static generation with revalidation (ISR)
export const revalidate = 3600; // Revalidate every hour

export default async function ProfilePage({ params }: PageProps) {
  const paramResult = await params;
  const username = paramResult.username;

  // Fetch profile without auth (static generation)
  const profileResult = await getUserProfile(username);

  if (!profileResult.success || !profileResult.profile) {
    notFound();
  }

  const profile = profileResult.profile;

  // Group events with roles by role type
  const eventsByRole = new Map<string, Event[]>();
  if (profile.eventsWithRoles) {
    profile.eventsWithRoles.forEach((event: Event) => {
      event.roles.forEach((role: Role) => {
        const roleTitle = role.title;
        const displayRole = fromNeo4jRoleFormat(roleTitle) || roleTitle;
        if (!eventsByRole.has(displayRole)) {
          eventsByRole.set(displayRole, []);
        }
        // Only add event if it's not already in this role's array
        const roleEvents = eventsByRole.get(displayRole)!;
        if (!roleEvents.find((e) => e.id === event.id)) {
          roleEvents.push(event);
        }
      });
    });
  }

  // Sort roles alphabetically for consistent tab order
  const sortedRoles = Array.from(eventsByRole.keys()).sort();

  // Format city for display
  const cityDisplay =
    profile.city && typeof profile.city === "object"
      ? `${profile.city.name}${
          profile.city.region ? `, ${profile.city.region}` : ""
        }`
      : profile.city || "";

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center justify-between py-7 border-b-2 border-primary-light">
          <h1 className="flex-1">{profile.displayName || profile.username}</h1>
        </div>
        <div className="flex justify-center flex-1 min-h-0 overflow-y-auto overflow-x-visible">
          <div className="flex flex-col items-center gap-8 py-5 px-5 sm:px-10 lg:px-15 max-w-[800px] w-full overflow-visible">
            <ProfileClient username={username} />
            {/* Row 1: Image + Details - using flex for exact sizing */}
            <div className="flex flex-col sm:flex-row gap-4 w-full items-center sm:items-start">
              {/* Image */}
              <div className="w-[250px]">
                {profile.image ? (
                  <div className="relative w-[250px] h-[350px] rounded-sm border-4 border-primary-light overflow-hidden">
                    <Image
                      src={profile.image}
                      alt={profile.displayName || profile.username}
                      width={250}
                      height={350}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="relative w-[250px] h-[350px] bg-neutral-400 rounded-sm overflow-hidden border-4 border-primary-light">
                    <Image
                      src="/mascot/3:4_Mascot2_Mono_onLight.png"
                      alt=""
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
              {/* Profile Details */}
              <div className="w-full sm:flex-1 lg:max-w-[800px] flex flex-col items-center gap-4">
                <section className="border-4 border-primary-light py-4 px-4 bg-primary-dark rounded-sm w-full flex flex-col">
                  <div className="flex flex-col items-center gap-4">
                    {/* @username | city */}
                    {cityDisplay && <h2>{cityDisplay}</h2>}

                    {/* Style badges */}
                    {profile.styles && profile.styles.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {profile.styles.map((style: string) => (
                          <StyleBadge key={style} style={style} />
                        ))}
                      </div>
                    )}

                    {/* Instagram link */}
                    {profile.instagram && (
                      <div className="flex items-center justify-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-instagram-icon lucide-instagram"
                        >
                          <rect
                            width="20"
                            height="20"
                            x="2"
                            y="2"
                            rx="5"
                            ry="5"
                          />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                        </svg>
                        <Link
                          href={`https://instagram.com/${profile.instagram.replace(
                            /^@/,
                            ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:underline"
                        >
                          @{profile.instagram.replace(/^@/, "")}
                        </Link>
                      </div>
                    )}

                    {/* Description */}
                    {profile.bio && (
                      <p className="whitespace-pre-wrap pl-3">{profile.bio}</p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-8 py-5 px-5 sm:px-10 lg:px-15 max-w-[1500px] w-full overflow-visible">
          {/* Events with Roles - Tabs */}
          {sortedRoles.length > 0 && (
            <ProfileRolesSection
              eventsByRole={eventsByRole}
              sortedRoles={sortedRoles}
            />
          )}

          {/* Tagged Videos */}
          {profile.taggedVideos && profile.taggedVideos.length > 0 && (
            <TaggedVideosSection videos={profile.taggedVideos} />
          )}

          {/* Sections Won */}
          {profile.winningSections && profile.winningSections.length > 0 && (
            <SectionsWonSection sections={profile.winningSections} />
          )}
        </div>
      </div>
    </>
  );
}
