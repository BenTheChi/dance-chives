"use client";

import { AppNavbar } from "@/components/AppNavbar";
import { AccountVerificationGuard } from "@/components/AccountVerificationGuard";
import { useEffect, useState } from "react";
import {
  getDashboardData,
  getUnreadNotificationCount,
} from "@/lib/server_actions/request_actions";
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
import { getAuthLevelName, AUTH_LEVELS } from "@/lib/utils/auth-utils";
import { Bell, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AuthorizationChanger } from "@/components/admin/AuthorizationChanger";
import { AuthorizationRequestForm } from "@/components/admin/AuthorizationRequestForm";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadDashboard = async () => {
    try {
      const data = await getDashboardData();
      setDashboardData(data);
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestUpdated = (requestId: string, newStatus: string) => {
    if (!dashboardData) return;

    // Update the request status in the dashboard data
    const updateRequestInArray = (requests: any[]) => {
      return requests.map((req: any) => {
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

  useEffect(() => {
    loadDashboard();
  }, []);

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

  const user = dashboardData?.user;
  const incomingRequests = dashboardData?.incomingRequests || {};
  const outgoingRequests = dashboardData?.outgoingRequests || {};
  const notifications = dashboardData?.notifications || [];
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
    (request: any) => request.status === "PENDING"
  );
  const requestHistory = allOutgoing.filter(
    (request: any) => request.status !== "PENDING"
  );

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
                  Welcome Back {user?.name || user?.email || "User"}
                  {user?.displayName && ` (${user.displayName})`}!
                </CardTitle>
                <CardDescription className="space-y-1">
                  <div>
                    Authorization Level: {getAuthLevelName(user?.auth ?? 0)} (
                    {user?.auth ?? 0})
                  </div>
                </CardDescription>
                <div className="flex gap-2 mt-4">
                  {user?.auth !== undefined &&
                    user.auth >= AUTH_LEVELS.CREATOR && (
                      <>
                        <Button asChild>
                          <Link href="/add-event">Add Event</Link>
                        </Button>
                        <Button asChild>
                          <Link href="/add-workshop">Add Workshop</Link>
                        </Button>
                      </>
                    )}
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
                </div>
              </div>
              {unreadCount > 0 && (
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {unreadCount} unread
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Authorization Level Manager - Admin/SuperAdmin Only */}
        {user?.auth >= AUTH_LEVELS.ADMIN && <AuthorizationChanger />}

        {/* Authorization Request Form - Base Users, Creators, and Moderators Only */}
        {user?.auth !== undefined && user.auth < AUTH_LEVELS.ADMIN && (
          <AuthorizationRequestForm
            currentUserAuthLevel={user.auth ?? 0}
            onRequestSubmitted={loadDashboard}
          />
        )}

        {/* Notifications Section */}
        {notifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {notifications.slice(0, 5).map((notification: any) => (
                  <div
                    key={notification.id}
                    className={`rounded-lg border p-3 ${
                      !notification.read ? "bg-blue-50 dark:bg-blue-950" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                {allIncoming.map((request: any) => (
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
                {pendingOutgoing.map((request: any) => (
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
                {requestHistory.map((request: any) => (
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
              <div className="space-y-2">
                {userEvents.map((event: any) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {event.eventTitle || `Event ID: ${event.eventId}`}
                      </p>
                      {event.createdAt && (
                        <p className="text-sm text-muted-foreground">
                          Created:{" "}
                          {new Date(event.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/events/${event.eventId}`}>View</a>
                    </Button>
                  </div>
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
                {teamMemberships.map((membership: any) => (
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

        {/* Empty State */}
        {allIncoming.length === 0 &&
          pendingOutgoing.length === 0 &&
          requestHistory.length === 0 &&
          userEvents.length === 0 &&
          teamMemberships.length === 0 && (
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
