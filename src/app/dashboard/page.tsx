import { withPageAuth } from "@/lib/utils/page-auth";
import {
  getDashboardData,
  getSavedEventsForUser,
} from "@/lib/server_actions/request_actions";
import { DashboardClient, type DashboardData } from "./dashboard-client";
import { EventCard } from "@/types/event";

export default async function DashboardPage() {
  return withPageAuth({ requireVerification: true }, async () => {
    // Fetch initial data on server
    let dashboardData: DashboardData | null = null;
    let savedEvents: EventCard[] = [];

    try {
      const [data, saved] = await Promise.all([
        getDashboardData(),
        getSavedEventsForUser(),
      ]);
      dashboardData = data;
      savedEvents = saved;
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // If fetch fails, pass null/empty arrays - client component will handle refetch
      // This can happen if session isn't fully established yet (e.g., magic link flow)
    }

    return (
      <DashboardClient
        initialData={dashboardData}
        initialSavedEvents={savedEvents}
      />
    );
  });
}
