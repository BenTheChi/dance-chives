import { Suspense } from "react";
import { getCitySchedule } from "@/db/queries/event";
import { CityCalendar } from "./CityCalendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CityCalendarSectionProps {
  cityId: number;
}

async function CalendarContent({ cityId }: { cityId: number }) {
  const scheduleData = await getCitySchedule(cityId);

  if (!scheduleData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No schedule data available for this city.
      </div>
    );
  }

  return (
    <CityCalendar
      events={scheduleData.events}
      subevents={scheduleData.subevents}
      workshops={scheduleData.workshops}
      sessions={scheduleData.sessions}
    />
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-[600px] w-full" />
    </div>
  );
}

export function CityCalendarSection({ cityId }: CityCalendarSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule</CardTitle>
        <CardDescription>
          View all events, workshops, and sessions in this city
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<CalendarSkeleton />}>
          <CalendarContent cityId={cityId} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
