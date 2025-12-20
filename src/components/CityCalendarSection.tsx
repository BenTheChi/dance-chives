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
  cityId: string;
}

async function CalendarContent({ cityId }: { cityId: string }) {
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
      sessions={scheduleData.sessions}
    />
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-[400px] sm:h-[500px] md:h-[600px] w-full" />
    </div>
  );
}

export function CityCalendarSection({ cityId }: CityCalendarSectionProps) {
  return (
    <section className="p-6 bg-neutral-50 rounded-sm border-2 border-black">
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarContent cityId={cityId} />
      </Suspense>
    </section>
  );
}
