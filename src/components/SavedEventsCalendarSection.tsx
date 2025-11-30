"use client";

import { CityCalendar } from "./CityCalendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarEventData } from "@/db/queries/event";

interface SavedEventsCalendarSectionProps {
  events: CalendarEventData[];
}

export function SavedEventsCalendarSection({
  events,
}: SavedEventsCalendarSectionProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Events Calendar</CardTitle>
          <CardDescription>Your saved events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No saved events to display on the calendar.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Events Calendar</CardTitle>
        <CardDescription>Your saved events</CardDescription>
      </CardHeader>
      <CardContent>
        <CityCalendar events={events} />
      </CardContent>
    </Card>
  );
}

