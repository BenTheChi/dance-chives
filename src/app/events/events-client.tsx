"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { EventCard } from "@/components/EventCard";
import { getSavedEventIds } from "@/lib/server_actions/event_actions";
import { TEventCard } from "@/types/event";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";

interface EventsClientProps {
  events: TEventCard[];
}

export function EventsClient({ events }: EventsClientProps) {
  const { data: session, status } = useSession();
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());
  const [canCreateEvents, setCanCreateEvents] = useState(false);

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

  return (
    <>
      {canCreateEvents && (
        <Button asChild variant="secondary" className="mb-8">
          <Link href="/add-event">Add Event</Link>
        </Button>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {events.map((event: TEventCard) => (
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
      {events.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No events found.</p>
        </div>
      )}
    </>
  );
}

