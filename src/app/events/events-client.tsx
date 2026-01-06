"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { EventCard } from "@/components/EventCard";
import { TEventCard } from "@/types/event";
import { City } from "@/types/city";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { EventFilters } from "@/components/events/EventFilters";

interface EventsClientProps {
  events: TEventCard[];
  cities: City[];
  styles: string[];
}

export function EventsClient({ events, cities, styles }: EventsClientProps) {
  const { data: session, status } = useSession();
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());
  const [canCreateEvents, setCanCreateEvents] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Check if there are any future events to determine default state
  const hasFutureEvents = useMemo(() => {
    if (!events || events.length === 0) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events.some((event) => {
      if (!event.date) return false;
      try {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      } catch {
        return false;
      }
    });
  }, [events]);

  const [showFutureEvents, setShowFutureEvents] = useState(hasFutureEvents);

  useEffect(() => {
    setShowFutureEvents(hasFutureEvents);
  }, [hasFutureEvents]);

  useEffect(() => {
    if (status === "loading") return;

    const authLevel = session?.user?.auth ?? 0;
    setCanCreateEvents(authLevel >= AUTH_LEVELS.CREATOR);

    if (!session?.user?.id) return;

    const fetchSavedEvents = async () => {
      try {
        const response = await fetch("/api/events/saved");
        if (response.ok) {
          const data = await response.json();
          setSavedEventIds(new Set(data?.eventIds ?? []));
        } else if (response.status === 401) {
          setSavedEventIds(new Set());
        } else {
          const errorData = await response.json().catch(() => null);
          console.error(
            "Failed to fetch saved events:",
            errorData?.error || response.statusText
          );
        }
      } catch (error) {
        console.error("Failed to fetch saved events:", error);
        setSavedEventIds(new Set());
      }
    };

    fetchSavedEvents();
  }, [session, status]);

  const parseEventDate = (value: string): Date | null => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  };

  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let parsedStartDate: Date | null = null;
    if (startDate) {
      const candidate = new Date(startDate);
      if (!Number.isNaN(candidate.getTime())) {
        candidate.setHours(0, 0, 0, 0);
        parsedStartDate = candidate;
      }
    }

    let parsedEndDate: Date | null = null;
    if (endDate) {
      const candidate = new Date(endDate);
      if (!Number.isNaN(candidate.getTime())) {
        candidate.setHours(23, 59, 59, 999);
        parsedEndDate = candidate;
      }
    }

    const filtered = events.filter((event) => {
      if (!event.date) return false;

      const eventDate = parseEventDate(event.date);

      const matchesFutureFilter = (() => {
        if (!eventDate) return true;
        if (showFutureEvents) {
          return eventDate >= today;
        }
        return eventDate < today;
      })();

      if (!matchesFutureFilter) {
        return false;
      }

      if (selectedCityId && event.cityId !== selectedCityId) {
        return false;
      }

      if (selectedStyles.length > 0) {
        const eventStyleSet = new Set(
          (event.styles || []).map((style) => style.toLowerCase())
        );
        const hasMatch = selectedStyles.some((style) =>
          eventStyleSet.has(style.toLowerCase())
        );
        if (!hasMatch) {
          return false;
        }
      }

      if (parsedStartDate && eventDate && eventDate < parsedStartDate) {
        return false;
      }

      if (parsedEndDate && eventDate && eventDate > parsedEndDate) {
        return false;
      }

      return true;
    });

    // Sort events based on whether showing future or past
    return filtered.sort((a, b) => {
      const dateA = parseEventDate(a.date);
      const dateB = parseEventDate(b.date);

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      if (showFutureEvents) {
        // Future events: soonest to later (ascending)
        return dateA.getTime() - dateB.getTime();
      } else {
        // Past events: most recent to oldest (descending)
        return dateB.getTime() - dateA.getTime();
      }
    });
  }, [
    events,
    showFutureEvents,
    selectedCityId,
    selectedStyles,
    startDate,
    endDate,
  ]);

  return (
    <>
      <div className="flex flex-col gap-4 w-full">
        <div className="max-w-[1000px] mx-auto flex flex-col gap-4 items-center mb-10">
          <EventFilters
            cities={cities}
            styles={styles}
            selectedCityId={selectedCityId}
            onCityChange={setSelectedCityId}
            selectedStyles={selectedStyles}
            onStylesChange={setSelectedStyles}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
          />
          <div className="flex flex-wrap gap-5">
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
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-12">
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
