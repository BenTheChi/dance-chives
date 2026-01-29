"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { EventCard } from "@/components/EventCard";
import { TEventCard, EventType } from "@/types/event";
import { City } from "@/types/city";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { EventFilters } from "@/components/events/EventFilters";

interface EventsClientProps {
  futureEvents: TEventCard[];
  pastEvents: TEventCard[];
  cities: City[];
  styles: string[];
}

export function EventsClient({
  futureEvents,
  pastEvents,
  cities,
  styles,
}: EventsClientProps) {
  const { data: session, status } = useSession();
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());
  const [canCreateEvents, setCanCreateEvents] = useState(false);

  // Applied filter values (used for actual filtering)
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(
    null
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hasVideos, setHasVideos] = useState(false);
  const [hasPoster, setHasPoster] = useState(false);

  // Draft filter values (used in the UI, not applied until save)
  const [draftCityId, setDraftCityId] = useState<string | null>(null);
  const [draftStyles, setDraftStyles] = useState<string[]>([]);
  const [draftEventType, setDraftEventType] = useState<EventType | null>(null);
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftEndDate, setDraftEndDate] = useState("");
  const [draftHasVideos, setDraftHasVideos] = useState(false);
  const [draftHasPoster, setDraftHasPoster] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  // Default to showing future events if there are any
  const [showFutureEvents, setShowFutureEvents] = useState(
    futureEvents.length > 0
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  // Filter cities to only show those available in the currently displayed events (past or future)
  const availableCities = useMemo(() => {
    const sourceEvents = showFutureEvents ? futureEvents : pastEvents;

    // Get unique cityIds from the events
    const cityIds = new Set(
      sourceEvents
        .map((event) => event.cityId)
        .filter(
          (cityId): cityId is string => cityId !== undefined && cityId !== null
        )
    );

    // Filter cities to only include those that appear in the events
    return cities.filter((city) => cityIds.has(city.id));
  }, [cities, futureEvents, pastEvents, showFutureEvents]);

  // Filter event types to only show those available in the currently displayed events (past or future)
  const availableEventTypes = useMemo(() => {
    const sourceEvents = showFutureEvents ? futureEvents : pastEvents;

    // Get unique event types from the events
    const eventTypes = new Set(
      sourceEvents
        .map((event) => event.eventType)
        .filter(
          (eventType): eventType is EventType =>
            eventType !== undefined && eventType !== null
        )
    );

    // Return sorted array of available event types
    return Array.from(eventTypes).sort();
  }, [futureEvents, pastEvents, showFutureEvents]);

  // Sync draft values with applied values when they change externally
  useEffect(() => {
    setDraftCityId(selectedCityId);
    setDraftStyles(selectedStyles);
    setDraftEventType(selectedEventType);
    setDraftStartDate(startDate);
    setDraftEndDate(endDate);
    setDraftHasVideos(hasVideos);
    setDraftHasPoster(hasPoster);
  }, [
    selectedCityId,
    selectedStyles,
    selectedEventType,
    startDate,
    endDate,
    hasVideos,
    hasPoster,
  ]);

  // Reset selectedCityId if it's no longer in available cities
  useEffect(() => {
    if (
      selectedCityId &&
      !availableCities.some((city) => city.id === selectedCityId)
    ) {
      setSelectedCityId(null);
      setDraftCityId(null);
    }
  }, [availableCities, selectedCityId]);

  // Reset selectedEventType if it's no longer in available event types
  useEffect(() => {
    if (selectedEventType && !availableEventTypes.includes(selectedEventType)) {
      setSelectedEventType(null);
      setDraftEventType(null);
    }
  }, [availableEventTypes, selectedEventType]);

  // Handle saving filters - apply draft values to actual filter values
  const handleSaveFilters = () => {
    setSelectedCityId(draftCityId);
    setSelectedStyles(draftStyles);
    setSelectedEventType(draftEventType);
    setStartDate(draftStartDate);
    setEndDate(draftEndDate);
    setHasVideos(draftHasVideos);
    setHasPoster(draftHasPoster);
  };

  // Handle clearing filters - reset all draft values to empty/default
  const handleClearFilters = () => {
    setDraftCityId(null);
    setDraftStyles([]);
    setDraftEventType(null);
    setDraftStartDate("");
    setDraftEndDate("");
    setDraftHasVideos(false);
    setDraftHasPoster(false);
  };

  const filteredEvents = useMemo(() => {
    // Use the pre-sorted arrays based on showFutureEvents
    const sourceEvents = showFutureEvents ? futureEvents : pastEvents;

    if (!sourceEvents || sourceEvents.length === 0) return [];

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

    // Filter events based on city, styles, date range, and past event filters (hasVideos, hasPoster)
    // No need to filter by past/future since arrays are already separated
    return sourceEvents.filter((event) => {
      if (!event.date) return false;

      const eventDate = parseEventDate(event.date);

      if (selectedCityId && event.cityId !== selectedCityId) {
        return false;
      }

      if (selectedEventType && event.eventType !== selectedEventType) {
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

      // Past event filters (only apply when showing past events)
      if (!showFutureEvents) {
        if (hasVideos && !event.hasVideos) {
          return false;
        }

        if (hasPoster && !event.imageUrl) {
          return false;
        }
      }

      return true;
    });
    // No sorting needed - events are already sorted server-side
  }, [
    futureEvents,
    pastEvents,
    showFutureEvents,
    selectedCityId,
    selectedEventType,
    selectedStyles,
    startDate,
    endDate,
    hasVideos,
    hasPoster,
  ]);

  return (
    <>
      <div className="flex flex-col gap-4 w-full sticky sm:static top-0 z-10">
        <div className="max-w-[1000px] mx-auto flex flex-col sm:gap-4 items-center mb-10 w-full">
          <EventFilters
            cities={availableCities}
            styles={styles}
            selectedCityId={draftCityId}
            onCityChange={setDraftCityId}
            selectedStyles={draftStyles}
            onStylesChange={setDraftStyles}
            availableEventTypes={availableEventTypes}
            selectedEventType={draftEventType}
            onEventTypeChange={setDraftEventType}
            startDate={draftStartDate}
            onStartDateChange={setDraftStartDate}
            endDate={draftEndDate}
            onEndDateChange={setDraftEndDate}
            showPastEventFilters={!showFutureEvents}
            hasVideos={draftHasVideos}
            onHasVideosChange={setDraftHasVideos}
            hasPoster={draftHasPoster}
            onHasPosterChange={setDraftHasPoster}
            onSave={handleSaveFilters}
            onClear={handleClearFilters}
          />
          <div className="flex flex-wrap justify-center gap-5 w-full">
            <div className="flex items-center justify-center gap-3 bg-secondary p-3 rounded-sm border-t-0 border-b-4 border-l-4 border-r-4 border-secondary-light w-full sm:border-t-4 sm:max-w-[200px]">
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
