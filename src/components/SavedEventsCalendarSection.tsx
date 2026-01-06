"use client";

import { CityCalendar } from "./CityCalendar";
import { CalendarEventData } from "@/db/queries/event";

interface SavedEventsCalendarSectionProps {
  events: CalendarEventData[];
}

export function SavedEventsCalendarSection({
  events,
}: SavedEventsCalendarSectionProps) {
  if (events.length === 0) {
    return (
      <section className="border-4 border-secondary-light py-4 px-4 bg-secondary-dark rounded-sm w-full">
        <h2 className="text-2xl font-semibold mb-2 text-center">
          Saved Events Calendar
        </h2>
        <div className="text-center py-8 text-muted-foreground">
          No saved events to display on the calendar.
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <h2 className="text-2xl font-semibold mb-4 text-center">
        Saved Events Calendar
      </h2>
      <div className="w-full min-w-0">
        <CityCalendar events={events} />
      </div>
    </section>
  );
}
