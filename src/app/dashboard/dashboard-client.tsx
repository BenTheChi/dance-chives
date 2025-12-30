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
import { RequestSection } from "@/components/requests/RequestSection";
import { getAuthLevelName } from "@/lib/utils/auth-utils-shared";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AuthorizationChanger } from "@/components/admin/AuthorizationChanger";
import { AuthorizationRequestForm } from "@/components/admin/AuthorizationRequestForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";

interface DashboardUser {
  name?: string | null;
  email?: string | null;
  auth?: number | null;
  displayName?: string | null;
  username?: string | null;
  image?: string | null;
}

interface DashboardRequest {
  id: string;
  type: string;
  sender?: {
    id?: string;
    name?: string | null;
    email: string;
    displayName?: string | null;
    username?: string | null;
    avatar?: string | null;
    image?: string | null;
    city?: string | null;
    styles?: string[];
  };
  targetUser?: {
    id?: string;
    name?: string | null;
    email: string;
    displayName?: string | null;
    username?: string | null;
    avatar?: string | null;
    image?: string | null;
    city?: string | null;
    styles?: string[];
  };
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
  ownership?: DashboardRequest[];
  authLevelChange: DashboardRequest[];
}

export interface DashboardData {
  user: DashboardUser;
  incomingRequests: DashboardRequests;
  outgoingRequests: DashboardRequests;
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
      ownership: updateRequestInArray(
        dashboardData.incomingRequests?.ownership || []
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
      ownership: updateRequestInArray(
        dashboardData.outgoingRequests?.ownership || []
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
      ownership: [],
      authLevelChange: [],
    };
  const outgoingRequests: DashboardRequests =
    dashboardData?.outgoingRequests || {
      tagging: [],
      teamMember: [],
      ownership: [],
      authLevelChange: [],
    };
  const userEvents = dashboardData?.userEvents || [];
  const teamMemberships = dashboardData?.teamMemberships || [];

  const allIncoming: DashboardRequest[] = [
    ...(incomingRequests.tagging || []),
    ...(incomingRequests.teamMember || []),
    ...(incomingRequests.ownership || []),
    ...(incomingRequests.authLevelChange || []),
  ];

  const allOutgoing: DashboardRequest[] = [
    ...(outgoingRequests.tagging || []),
    ...(outgoingRequests.teamMember || []),
    ...(outgoingRequests.ownership || []),
    ...(outgoingRequests.authLevelChange || []),
  ];

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
        <div className="flex flex-col min-h-[calc(100vh-4.5rem)]">
          <h1 className="py-7 border-b-2 border-primary-light">Dashboard</h1>
          <div className="flex justify-center flex-1 min-h-0 overflow-y-auto">
            <div className="flex flex-col gap-8 py-5 px-3 sm:px-10 lg:px-15 max-w-[500px] sm:max-w-[1000px] lg:max-w-[1200px] w-full">
              <div className="text-center py-12">Loading dashboard...</div>
            </div>
          </div>
        </div>
      </AccountVerificationGuard>
    );
  }

  return (
    <AccountVerificationGuard requireVerification={true}>
      <AppNavbar />
      <div className="flex flex-col min-h-[calc(100vh-4.5rem)]">
        <h1 className="py-7 border-b-2 border-primary-light">Dashboard</h1>
        <div className="flex justify-center flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-8 py-5 px-3 sm:px-10 lg:px-15 max-w-[500px] sm:max-w-[1000px] lg:max-w-[1200px] w-full">
            {/* Welcome Section */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              {/* Profile Picture */}
              <div className="w-full sm:w-[250px] shrink-0">
                <div className="relative w-full sm:w-[250px] h-[250px] sm:h-[350px] rounded-sm border-4 border-primary-light overflow-hidden bg-primary-dark">
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt={user?.displayName || user?.name || "Profile picture"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <Image
                      src="/mascot/Default_Mascot2_Mono_onLight.png"
                      alt=""
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  )}
                </div>
              </div>
              {/* Welcome Content */}
              <div className="w-full sm:flex-1 lg:max-w-[800px] flex flex-col gap-4">
                <section className="border-4 border-primary-light py-4 px-4 bg-primary-dark rounded-sm w-full flex flex-col">
                  <div className="flex flex-col gap-4">
                    <h2 className="text-2xl font-semibold text-center">
                      Welcome back,{" "}
                      {user?.displayName || user?.name || user?.email || "User"}
                      !
                    </h2>
                    <div className="text-center">
                      <p className="text-sm">
                        Auth Level: {getAuthLevelName(user?.auth ?? 0)} (
                        {user?.auth ?? 0})
                      </p>
                    </div>
                    {/* <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {user?.auth != null && user.auth < AUTH_LEVELS.ADMIN && (
                        <Button
                          variant="outline"
                          onClick={() => setIsUpgradeDialogOpen(true)}
                          className="bg-periwinkle text-black border-black"
                        >
                          Request Access Upgrade
                        </Button>
                      )}
                    </div> */}
                  </div>
                </section>
              </div>
            </div>

            {/* Saved Events Calendar */}
            <SavedEventsCalendarSection events={calendarEvents} />

            {/* Saved Events Gallery */}
            {savedEvents.length > 0 ? (
              <section className="border-4 border-primary-light py-4 px-4 bg-primary-dark rounded-sm w-full">
                <h2 className="text-2xl font-semibold mb-2 text-center">
                  Saved Events
                </h2>
                <p className="text-sm text-center mb-6">
                  Events you have saved ({savedEvents.length})
                </p>
                <div className="max-h-[600px] overflow-y-auto p-3">
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
                </div>
              </section>
            ) : (
              <section className="border-4 border-primary-light py-4 px-4 bg-primary-dark rounded-sm w-full">
                <h2 className="text-2xl font-semibold mb-2 text-center">
                  Saved Events
                </h2>
                <div className="text-center py-12">
                  No saved events yet. Click the heart icon on any event to save
                  it.
                </div>
              </section>
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

            {/* Requests Section */}
            <RequestSection
              incomingRequests={allIncoming}
              outgoingRequests={allOutgoing}
              onRequestUpdated={handleRequestUpdated}
            />

            {/* Events Created Section */}
            {userEvents.length > 0 && (
              <section className="border-4 border-primary-light py-4 px-4 bg-primary-dark rounded-sm w-full">
                <h2 className="text-2xl font-semibold mb-2 text-center">
                  Your Events
                </h2>
                <p className="text-sm text-center mb-6">
                  Events you have created ({userEvents.length})
                </p>
                <div className="max-h-[600px] overflow-y-auto p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2 sm:gap-3">
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
                </div>
              </section>
            )}

            {/* Team Memberships Section */}
            {teamMemberships.length > 0 && (
              <section className="border-4 border-primary-light py-4 px-4 bg-primary-dark rounded-sm w-full">
                <h2 className="text-2xl font-semibold mb-2 text-center">
                  Team Memberships
                </h2>
                <p className="text-sm text-center mb-6">
                  Events where you are a team member ({teamMemberships.length})
                </p>
                <div className="space-y-2">
                  {teamMemberships.map((membership: TeamMembership) => (
                    <div
                      key={membership.eventId}
                      className="flex items-center justify-between rounded-sm border-2 border-primary-light p-3 bg-background"
                    >
                      <div>
                        <p className="font-medium">
                          Event: {membership.eventTitle}
                        </p>
                        <p className="text-sm">
                          Added:{" "}
                          {new Date(membership.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="bg-periwinkle text-black border-black"
                      >
                        <Link href={`/events/${membership.eventId}`}>View</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Hidden Events Section - Only for moderators/admins */}
            {initialData?.hiddenEvents &&
              initialData.hiddenEvents.length > 0 && (
                <section className="border-4 border-primary-light py-4 px-4 bg-primary-dark rounded-sm w-full">
                  <h2 className="text-2xl font-semibold mb-2 text-center">
                    Hidden Events
                  </h2>
                  <p className="text-sm text-center mb-6 text-muted-foreground">
                    All hidden events in the system (
                    {initialData.hiddenEvents.length})
                  </p>
                  <div className="max-h-[600px] overflow-y-auto p-3">
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
                  </div>
                </section>
              )}
          </div>
        </div>
      </div>
    </AccountVerificationGuard>
  );
}
