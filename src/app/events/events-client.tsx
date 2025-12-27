"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { EventCard } from "@/components/EventCard";
import { getSavedEventIds } from "@/lib/server_actions/event_actions";
import { TEventCard } from "@/types/event";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";

interface EventsClientProps {
  events: TEventCard[];
}

export function EventsClient({ events }: EventsClientProps) {
  const { data: session, status } = useSession();
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());
  const [canCreateEvents, setCanCreateEvents] = useState(false);
  const [showFutureEvents, setShowFutureEvents] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    const authLevel = session?.user?.auth ?? 0;
    setCanCreateEvents(authLevel >= AUTH_LEVELS.CREATOR);

    if (!session?.user?.id) return;

    const fetchSavedEvents = async () => {
      try {
        const savedResult = await getSavedEventIds();
        if (savedResult.status === 200 && "eventIds" in savedResult) {
          setSavedEventIds(new Set(savedResult.eventIds));
        }
      } catch (error) {
        console.error("Failed to fetch saved events:", error);
      }
    };

    fetchSavedEvents();
  }, [session, status]);

  // Filter events based on past/future
  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    return events.filter((event) => {
      if (!event.date) return false;

      try {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

        if (showFutureEvents) {
          // Show future events (including today)
          return eventDate >= today;
        } else {
          // Show past events (excluding today)
          return eventDate < today;
        }
      } catch {
        // If date parsing fails, include the event
        return true;
      }
    });
  }, [events, showFutureEvents]);

  return (
    <>
      <div className="flex gap-5">
        {canCreateEvents && (
          <div>
            <Button asChild variant="secondary" className="h-full">
              <Link
                href="/add-event"
                className="!card text-white !font-extrabold text-[18px]"
              >
                Add Event
              </Link>
            </Button>
          </div>
        )}
        <div className="flex items-center gap-3 bg-secondary p-3 rounded-sm border-4 border-secondary-light">
          <Label
            htmlFor="future-events-switch"
            className="font-bold cursor-pointer"
          >
            Past
          </Label>
          <Switch
            id="future-events-switch"
            checked={showFutureEvents}
            onCheckedChange={setShowFutureEvents}
          />
          <Label
            htmlFor="future-events-switch"
            className="font-bold cursor-pointer"
          >
            Future
          </Label>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredEvents.map((event: TEventCard) => (
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
            isSaved={savedEventIds.has(event.id)}
          />
        ))}
      </div>
      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {showFutureEvents
              ? "No future events found."
              : "No past events found."}
          </p>
        </div>
      )}
    </>
  );
}
