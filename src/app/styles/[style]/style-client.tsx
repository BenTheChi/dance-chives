"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { EventCard } from "@/components/EventCard";
import { UserCard } from "@/components/UserCard";
import { getSavedEventIds } from "@/lib/server_actions/event_actions";
import { TEventCard } from "@/types/event";

interface StyleClientProps {
  cityFilteredEvents?: TEventCard[];
  cityFilteredUsers?: Array<{
    id: string;
    displayName?: string;
    username?: string;
    image?: string;
    styles?: string[];
  }>;
  allEvents: TEventCard[];
}

export function StyleClient({
  cityFilteredEvents,
  cityFilteredUsers,
  allEvents,
}: StyleClientProps) {
  const { data: session, status } = useSession();
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === "loading" || !session?.user?.id) return;

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

  // Determine city name from filtered events if available
  const cityName =
    cityFilteredEvents && cityFilteredEvents.length > 0
      ? cityFilteredEvents[0].city
      : undefined;

  return (
    <>
      {/* Events in Your City Section */}
      {cityFilteredEvents && cityFilteredEvents.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Events in Your City</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {cityFilteredEvents.map((event) => (
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
        </section>
      )}

      {/* All Events Section (if no city-filtered events) */}
      {(!cityFilteredEvents || cityFilteredEvents.length === 0) &&
        allEvents.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Events</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {allEvents.map((event) => (
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
          </section>
        )}

      {/* Users in Your City Section */}
      {cityFilteredUsers && cityFilteredUsers.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Users in Your City</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {cityFilteredUsers.map((user) => (
              <UserCard
                key={user.id}
                displayName={user.displayName || ""}
                username={user.username || ""}
                image={user.image}
                styles={user.styles}
                city={cityName || ""}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
