"use client";

import { useSession } from "next-auth/react";
import {
  InvitationStatusCard,
  AdminInvitationGenerator,
} from "@/components/forms/invitation-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AUTH_LEVELS, getAuthLevelName } from "@/lib/utils/auth-utils";
import { AppNavbar } from "@/components/AppNavbar";
import { CityManagementCard } from "@/components/admin/CityManagementCard";

export default function AuthDemoPage() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <>
        <AppNavbar />
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Please sign in to view auth features.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </>
    );
  }

  const userAuthLevel = session.user?.auth || 0;
  const isAdmin = userAuthLevel >= AUTH_LEVELS.ADMIN;
  const isModerator = userAuthLevel >= AUTH_LEVELS.MODERATOR;
  const isCreator = userAuthLevel >= AUTH_LEVELS.CREATOR;

  return (
    <>
      <AppNavbar />
      <div className="container mx-auto py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Authentication Demo</h1>
          <p className="text-muted-foreground">
            Manage your authorization level and test invitation functionality.
          </p>
        </div>

        {/* Current User Status */}
        <Card>
          <CardHeader>
            <CardTitle>Your Authorization Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium">
                  {session.user?.name || session.user?.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  {session.user?.email}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={
                      session.user?.accountVerified ? "default" : "destructive"
                    }
                    className="text-xs"
                  >
                    {session.user?.accountVerified
                      ? "✓ Verified"
                      : "⚠ Unverified"}
                  </Badge>
                  {session.user?.accountVerified && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(
                        session.user.accountVerified
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <Badge
                variant={
                  userAuthLevel >= AUTH_LEVELS.CREATOR ? "default" : "secondary"
                }
              >
                Level {userAuthLevel}: {getAuthLevelName(userAuthLevel)}
              </Badge>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Available Auth Levels:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(AUTH_LEVELS).map(([name, level]) => (
                  <div key={name} className="flex justify-between">
                    <span>{name}:</span>
                    <Badge
                      variant={userAuthLevel >= level ? "default" : "outline"}
                    >
                      {level}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Invitation Status */}
          <InvitationStatusCard />

          {/* Admin Invitation Generator */}
          {isAdmin && <AdminInvitationGenerator />}

          {/* City Management - Admin only */}
          {isAdmin && <CityManagementCard />}

          {!isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Features</CardTitle>
                <CardDescription>
                  Admin features are available at authorization level{" "}
                  {AUTH_LEVELS.ADMIN} and above.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-muted-foreground">
                    Contact an administrator to receive an invitation to upgrade
                    your access level.
                  </p>

                  {/* Show what user can do at their current level */}
                  <div className="border-t pt-3">
                    <h5 className="font-medium mb-2">
                      Your Current Permissions:
                    </h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {userAuthLevel === AUTH_LEVELS.BASE_USER && (
                        <li>• Request tagging in events and videos</li>
                      )}
                      {isCreator && (
                        <>
                          <li>• Create events in assigned cities</li>
                          <li>• Update/delete your own events</li>
                          <li>• Tag/untag users in your events</li>
                        </>
                      )}
                      {isModerator && (
                        <>
                          <li>• Create your own events</li>
                          <li>• Update/delete any events in assigned cities</li>
                          <li>
                            • Tag/untag users in events in assigned cities
                          </li>
                        </>
                      )}
                      {isAdmin && (
                        <>
                          <li>• Full event management</li>
                          <li>• User permission management</li>
                          <li>• Manage user cities and global flags</li>
                          <li>• Ban/delete any users</li>
                          <li>• Read user reports</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Usage Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Examples</CardTitle>
            <CardDescription>
              How to use auth levels in your code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Server Actions:</h4>
                <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                  {`import { requireAuthLevel, AUTH_LEVELS, canUpdateEvent } from "@/lib/utils/auth-utils";
import { createInvitation, acceptInvitation } from "@/lib/server_actions/auth_actions";

export async function adminOnlyAction() {
  await requireAuthLevel(AUTH_LEVELS.ADMIN);
  // Your admin code here
}

export async function inviteUser(email: string, authLevel: number) {
  const result = await createInvitation(email, authLevel);
  if (result.success) {
    console.log("Invitation sent to", email);
  }
}

export async function updateEventAction(eventId: string) {
  const session = await auth();
  const context = { eventId, eventCreatorId: "creator_id", eventCityId: "city_id" };
  
  if (canUpdateEvent(session?.user?.auth || 0, context, session?.user?.id || "")) {
    // Update event code here
  } else {
    throw new Error("Permission denied");
  }
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium mb-2">Client Components:</h4>
                <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                  {`import { useSession } from "next-auth/react";
import { hasAuthLevel, AUTH_LEVELS, canCreateEvents } from "@/lib/utils/auth-utils";

function MyComponent() {
  const { data: session } = useSession();
  const authLevel = session?.user?.auth || 0;
  const canModerate = hasAuthLevel(session, AUTH_LEVELS.MODERATOR);
  const canCreateEventsAnywhere = canCreateEvents(authLevel);
  const canInviteUsers = hasAuthLevel(session, AUTH_LEVELS.ADMIN);
  
  return (
    <div>
      {canCreateEventsAnywhere && <CreateEventButton />}
      {canInviteUsers && <InviteUserButton />}
      {canModerate ? <ModeratorPanel /> : <UserPanel />}
    </div>
  );
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
