"use client";

import { AppNavbar } from "@/components/AppNavbar";
import { AccountVerificationGuard } from "@/components/AccountVerificationGuard";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getDashboardData,
  getSavedEventsForUser,
} from "@/lib/server_actions/request_actions";
import { SavedEventsCalendarSection } from "@/components/SavedEventsCalendarSection";
import { EventCard } from "@/components/EventCard";
import { TEventCard, EventType } from "@/types/event";
import { CalendarEventData } from "@/db/queries/event";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  IncomingRequestCard,
  OutgoingRequestCard,
} from "@/components/requests/RequestCard";
import { getAuthLevelName } from "@/lib/utils/auth-utils-shared";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AuthorizationChanger } from "@/components/admin/AuthorizationChanger";
import { AuthorizationRequestForm } from "@/components/admin/AuthorizationRequestForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface DashboardUser {
  name?: string | null;
  email?: string | null;
  auth?: number | null;
  displayName?: string | null;
  username?: string | null;
}

interface DashboardRequest {
  id: string;
  type: string;
  sender?: { id?: string; name?: string | null; email: string };
  targetUser?: { id?: string; name?: string | null; email: string };
  eventId?: string | null;
  eventTitle?: string | null;
  eventType?: string | null;
  videoId?: string | null;
  videoTitle?: string | null;
  sectionId?: string | null;
  sectionTitle?: string | null;
  role?: string;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
  requestedLevel?: number;
  currentLevel?: number;
  message?: string;
}

interface DashboardNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedRequestType?: string | null;
  relatedRequestId?: string | null;
  read: boolean;
  createdAt: Date;
}

// UserEvent is now TEventCard - keeping for backwards compatibility but will be removed
interface UserEvent {
  id: string;
  eventId: string;
  eventTitle: string;
  createdAt: string | null;
}

interface TeamMembership {
  eventId: string;
  eventTitle: string;
  createdAt: Date;
}

interface DashboardRequests {
  tagging: DashboardRequest[];
  teamMember: DashboardRequest[];
  authLevelChange: DashboardRequest[];
}

export interface DashboardData {
  user: DashboardUser;
  incomingRequests: DashboardRequests;
  outgoingRequests: DashboardRequests;
  notifications: DashboardNotification[];
  userEvents: TEventCard[];
  teamMemberships: TeamMembership[];
  hiddenEvents?: TEventCard[]; // Only for moderators/admins
}

interface DashboardClientProps {
  initialData: DashboardData | null;
  initialSavedEvents: TEventCard[];
}

export function DashboardClient({
  initialData,
  initialSavedEvents,
}: DashboardClientProps) {
  const { status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromMagicLinkLogin = searchParams.get("fromMagicLinkLogin") === "true";

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    initialData || null
  );
  const [savedEvents, setSavedEvents] = useState<TEventCard[]>(
    initialSavedEvents || []
  );
  const [loading, setLoading] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [hasRefreshedSession, setHasRefreshedSession] = useState(false);
  const [hasAttemptedRefetch, setHasAttemptedRefetch] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [data, saved] = await Promise.all([
        getDashboardData(),
        getSavedEventsForUser(),
      ]);
      setDashboardData(data);
      setSavedEvents(saved);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh session if we arrived via magic link login
  useEffect(() => {
    if (
      fromMagicLinkLogin &&
      update &&
      !hasRefreshedSession &&
      status !== "loading"
    ) {
      setHasRefreshedSession(true);
      update().finally(() => {
        // Refetch data after session refresh, then clean up URL
        loadDashboard().finally(() => {
          router.replace("/dashboard");
        });
      });
    }
  }, [
    fromMagicLinkLogin,
    update,
    router,
    hasRefreshedSession,
    loadDashboard,
    status,
  ]);

  // Refetch data if initial data is missing (e.g., server fetch failed)
  // Only attempt once to prevent infinite loops
  useEffect(() => {
    if (
      !dashboardData &&
      !loading &&
      !hasAttemptedRefetch &&
      status !== "loading"
    ) {
      setHasAttemptedRefetch(true);
      loadDashboard();
    }
  }, [dashboardData, loading, loadDashboard, hasAttemptedRefetch, status]);

  const handleRequestUpdated = (requestId: string, newStatus: string) => {
    if (!dashboardData) return;

    // Update the request status in the dashboard data
    const updateRequestInArray = (requests: DashboardRequest[]) => {
      return requests.map((req: DashboardRequest) => {
        if (req.id === requestId) {
          return { ...req, status: newStatus };
        }
        return req;
      });
    };

    const updatedIncomingRequests = {
      ...dashboardData.incomingRequests,
      tagging: updateRequestInArray(
        dashboardData.incomingRequests?.tagging || []
      ),
      teamMember: updateRequestInArray(
        dashboardData.incomingRequests?.teamMember || []
      ),
      authLevelChange: updateRequestInArray(
        dashboardData.incomingRequests?.authLevelChange || []
      ),
    };

    const updatedOutgoingRequests = {
      ...dashboardData.outgoingRequests,
      tagging: updateRequestInArray(
        dashboardData.outgoingRequests?.tagging || []
      ),
      teamMember: updateRequestInArray(
        dashboardData.outgoingRequests?.teamMember || []
      ),
      authLevelChange: updateRequestInArray(
        dashboardData.outgoingRequests?.authLevelChange || []
      ),
    };

    setDashboardData({
      ...dashboardData,
      incomingRequests: updatedIncomingRequests,
      outgoingRequests: updatedOutgoingRequests,
    });
  };

  const user = dashboardData?.user;
  const incomingRequests: DashboardRequests =
    dashboardData?.incomingRequests || {
      tagging: [],
      teamMember: [],
      authLevelChange: [],
    };
  const outgoingRequests: DashboardRequests =
    dashboardData?.outgoingRequests || {
      tagging: [],
      teamMember: [],
      authLevelChange: [],
    };
  const userEvents = dashboardData?.userEvents || [];
  const teamMemberships = dashboardData?.teamMemberships || [];

  const allIncoming = [
    ...(incomingRequests.tagging || []),
    ...(incomingRequests.teamMember || []),
    ...(incomingRequests.authLevelChange || []),
  ];

  const allOutgoing = [
    ...(outgoingRequests.tagging || []),
    ...(outgoingRequests.teamMember || []),
    ...(outgoingRequests.authLevelChange || []),
  ];

  // Separate pending and non-pending outgoing requests
  const pendingOutgoing = allOutgoing.filter(
    (request: DashboardRequest) => request.status === "PENDING"
  );
  const requestHistory = allOutgoing.filter(
    (request: DashboardRequest) => request.status !== "PENDING"
  );

  // Convert saved TEventCard[] to CalendarEventData[] format
  const convertToCalendarEvents = (
    events: TEventCard[]
  ): CalendarEventData[] => {
    return events.map((event) => {
      // Parse date string to dates array format
      let dates:
        | Array<{ date: string; startTime?: string; endTime?: string }>
        | undefined;
      if (event.date) {
        try {
          // Try to parse as date string (MM/DD/YYYY or ISO format)
          dates = [{ date: event.date }];
        } catch {
          dates = undefined;
        }
      }

      return {
        id: event.id,
        title: event.title,
        startDate: event.date || undefined,
        dates: dates,
        eventType: (event.eventType || "Battle") as EventType,
        poster: event.imageUrl
          ? {
              id: "",
              title: event.title,
              url: event.imageUrl,
              type: "image",
            }
          : null,
        styles: event.styles || [],
      };
    });
  };

  const calendarEvents = convertToCalendarEvents(savedEvents);

  if (loading) {
    return (
      <AccountVerificationGuard requireVerification={true}>
        <AppNavbar />
        <main className="container mx-auto p-6">
          <div>Loading dashboard...</div>
        </main>
      </AccountVerificationGuard>
    );
  }

  return (
    <AccountVerificationGuard requireVerification={true}>
      <AppNavbar />
      <main className="container mx-auto p-6 space-y-6">
        {/* Welcome Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl font-semibold">
                  Welcome back, {user?.name || user?.email || "User"}!
                </CardTitle>
                <CardDescription className="space-y-1">
                  <div>
                    Role Level: {getAuthLevelName(user?.auth ?? 0)} (
                    {user?.auth ?? 0})
                  </div>
                </CardDescription>
                <div className="flex gap-2 mt-4">
                  {user?.username && (
                    <>
                      <Button variant="outline" asChild>
                        <Link href={`/profiles/${user.username}`}>
                          <UserIcon className="mr-2 h-4 w-4" />
                          Go To Profile
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={`/profiles/${user.username}/edit`}>
                          <UserIcon className="mr-2 h-4 w-4" />
                          Edit Profile
                        </Link>
                      </Button>
                    </>
                  )}
                  {user?.auth != null && user.auth < AUTH_LEVELS.ADMIN && (
                    <Button
                      variant="outline"
                      onClick={() => setIsUpgradeDialogOpen(true)}
                    >
                      Request Access Upgrade
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Saved Events Calendar */}
        <SavedEventsCalendarSection events={calendarEvents} />

        {/* Saved Events Gallery */}
        {savedEvents.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Saved Events</CardTitle>
              <CardDescription>
                Events you have saved ({savedEvents.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {savedEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    series={event.series}
                    imageUrl={event.imageUrl}
                    date={event.date}
                    city={event.city}
                    cityId={event.cityId}
                    styles={event.styles}
                    eventType={event.eventType}
                    isSaved={true}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Saved Events</CardTitle>
              <CardDescription>Events you have saved</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                No saved events yet. Click the heart icon on any event to save
                it.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Authorization Request Form Dialog - Base Users, Creators, and Moderators Only */}
        {user?.auth != null && user.auth < AUTH_LEVELS.ADMIN && (
          <>
            <AuthorizationChanger />
            <Dialog
              open={isUpgradeDialogOpen}
              onOpenChange={setIsUpgradeDialogOpen}
            >
              <DialogContent>
                <AuthorizationRequestForm
                  currentUserAuthLevel={user.auth ?? 0}
                  onRequestSubmitted={async () => {
                    await loadDashboard();
                    setIsUpgradeDialogOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </>
        )}

        {/* Incoming Requests Section */}
        {allIncoming.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Incoming Requests</CardTitle>
              <CardDescription>
                Requests that require your approval ({allIncoming.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allIncoming.map((request: DashboardRequest) => (
                  <IncomingRequestCard
                    key={`${request.type}-${request.id}`}
                    request={request}
                    onRequestUpdated={handleRequestUpdated}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Outgoing Requests Section - Pending Only */}
        {pendingOutgoing.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Requests</CardTitle>
              <CardDescription>
                Pending requests you have submitted ({pendingOutgoing.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingOutgoing.map((request: DashboardRequest) => (
                  <OutgoingRequestCard
                    key={`${request.type}-${request.id}`}
                    request={request}
                    onRequestUpdated={handleRequestUpdated}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Request History Section */}
        {requestHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Request History</CardTitle>
              <CardDescription>
                Completed and cancelled requests ({requestHistory.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requestHistory.map((request: DashboardRequest) => (
                  <OutgoingRequestCard
                    key={`${request.type}-${request.id}`}
                    request={request}
                    onRequestUpdated={handleRequestUpdated}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Events Created Section */}
        {userEvents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Events</CardTitle>
              <CardDescription>
                Events you have created ({userEvents.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {userEvents.map((event: TEventCard) => (
                  <EventCard
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    series={event.series}
                    imageUrl={event.imageUrl}
                    date={event.date}
                    city={event.city}
                    cityId={event.cityId}
                    styles={event.styles}
                    eventType={event.eventType}
                    isSaved={false}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Memberships Section */}
        {teamMemberships.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Team Memberships</CardTitle>
              <CardDescription>
                Events where you are a team member ({teamMemberships.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teamMemberships.map((membership: TeamMembership) => (
                  <div
                    key={membership.eventId}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        Event: {membership.eventTitle}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Added:{" "}
                        {new Date(membership.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/events/${membership.eventId}`}>View</a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hidden Events Section - Only for moderators/admins */}
        {initialData?.hiddenEvents && initialData.hiddenEvents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Hidden Events</CardTitle>
              <CardDescription>
                All hidden events in the system (
                {initialData.hiddenEvents.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {initialData.hiddenEvents.map((event: TEventCard) => (
                  <EventCard
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    series={event.series}
                    imageUrl={event.imageUrl}
                    date={event.date}
                    city={event.city}
                    cityId={event.cityId}
                    styles={event.styles}
                    eventType={event.eventType}
                    isSaved={false}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {allIncoming.length === 0 &&
          pendingOutgoing.length === 0 &&
          requestHistory.length === 0 &&
          userEvents.length === 0 &&
          teamMemberships.length === 0 &&
          (!initialData?.hiddenEvents ||
            initialData.hiddenEvents.length === 0) && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No requests or activities to display.
                </p>
              </CardContent>
            </Card>
          )}
      </main>
    </AccountVerificationGuard>
  );
}
