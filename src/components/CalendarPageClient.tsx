"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { City } from "@/types/city";
import { EventType } from "@/types/event";
import { CalendarEventData } from "@/db/queries/event";
import { CityCalendar } from "./CityCalendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  normalizeStyleForUrl,
  normalizeEventTypeForUrl,
} from "@/lib/utils/calendar-url-utils";
import { formatStyleNameForDisplay } from "@/lib/utils/style-utils";
import { generateCitySlug } from "@/lib/utils/city-slug";
import { subMonths, addMonths, startOfMonth, endOfMonth } from "date-fns";

const EVENT_TYPE_OPTIONS: EventType[] = [
  "Battle",
  "Competition",
  "Class",
  "Workshop",
  "Session",
  "Party",
  "Festival",
  "Performance",
  "Other",
];

interface CalendarPageClientProps {
  cities: City[];
  styles: string[];
  initialCity: City | null;
  initialStyle: string | null;
  initialEventType: EventType | null;
  events: CalendarEventData[];
}

export function CalendarPageClient({
  cities,
  styles,
  initialCity,
  initialStyle,
  initialEventType,
  events,
}: CalendarPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [selectedCity, setSelectedCity] = useState<City | null>(initialCity);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(
    initialStyle
  );
  const [selectedEventType, setSelectedEventType] =
    useState<EventType | null>(initialEventType);
  const hasSetUserCity = useRef(false);

  const [currentEvents, setCurrentEvents] =
    useState<CalendarEventData[]>(events);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Calculate 3-month date range: month before, current month, month after
  const getDateRange = (date: Date) => {
    const start = startOfMonth(subMonths(date, 1));
    const end = endOfMonth(addMonths(date, 1));
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  };

  // Update events when initial events prop changes (from server-side fetch)
  useEffect(() => {
    setCurrentEvents(events);
  }, [events]);

  // Set user's city as default if no city is selected and user is logged in
  useEffect(() => {
    // Only run once and only if no initial city is set
    if (hasSetUserCity.current || initialCity || status === "loading") {
      return;
    }

    if (session?.user?.id && !selectedCity) {
      hasSetUserCity.current = true;

      // Fetch user's city
      fetch("/api/user/city")
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          return null;
        })
        .then((data) => {
          if (data?.citySlug) {
            const userCity = cities.find((c) => {
              const citySlug = c.slug || generateCitySlug(c);
              return citySlug === data.citySlug;
            });
            if (userCity) {
              setSelectedCity(userCity);
            }
          }
        })
        .catch((err) => {
          console.error("Error fetching user city:", err);
        });
    }
  }, [session, status, initialCity, cities]);

  // Update URL when selections change
  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedCity) {
      const citySlug = selectedCity.slug || generateCitySlug(selectedCity);
      params.set("city", citySlug);
    }

    if (selectedStyle) {
      params.set("style", normalizeStyleForUrl(selectedStyle));
    }

    if (selectedEventType) {
      params.set("eventType", normalizeEventTypeForUrl(selectedEventType));
    }

    const newUrl = `/calendar${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    const currentUrl = `/calendar${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;

    // Only update if URL actually changed
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [selectedCity, selectedStyle, selectedEventType, router, searchParams]);

  // Fetch events when city, style, event type, or date changes (3-month batches)
  useEffect(() => {
    if (selectedCity) {
      const citySlug = selectedCity.slug || generateCitySlug(selectedCity);
      const styleParam = selectedStyle
        ? normalizeStyleForUrl(selectedStyle)
        : "";
      const eventTypeParam = selectedEventType
        ? normalizeEventTypeForUrl(selectedEventType)
        : "";
      const { startDate, endDate } = getDateRange(currentDate);

      fetch(
        `/api/calendar/events?city=${encodeURIComponent(citySlug)}${
          styleParam ? `&style=${encodeURIComponent(styleParam)}` : ""
        }${
          eventTypeParam
            ? `&eventType=${encodeURIComponent(eventTypeParam)}`
            : ""
        }&startDate=${startDate}&endDate=${endDate}`
      )
        .then((res) => res.json())
        .then((data) => setCurrentEvents(data.events || []))
        .catch((err) => {
          console.error("Error fetching events:", err);
          setCurrentEvents([]);
        });
    } else {
      setCurrentEvents([]);
    }
  }, [selectedCity, selectedStyle, selectedEventType, currentDate]);

  const handleCityChange = (cityValue: string) => {
    // cityValue could be either a slug or an id
    const city = cities.find((c) => {
      const citySlug = c.slug || generateCitySlug(c);
      return citySlug === cityValue || c.id === cityValue;
    });
    if (city) {
      setSelectedCity(city);
    }
  };

  const handleStyleChange = (styleValue: string) => {
    if (styleValue === "all") {
      setSelectedStyle(null);
    } else {
      // Find the style by matching the uppercase display name
      const style = styles.find(
        (s) => formatStyleNameForDisplay(s) === styleValue
      );
      if (style) {
        setSelectedStyle(style);
      }
    }
  };

  const handleEventTypeChange = (value: string) => {
    if (value === "all") {
      setSelectedEventType(null);
    } else {
      setSelectedEventType(value as EventType);
    }
  };

  return (
    <div className="flex flex-col">
      <h1 className="py-7 border-b-2 border-primary-light bg-charcoal">
        Calendar
      </h1>
      <div className="flex justify-center flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-4 sm:gap-8 py-3 sm:py-5 px-0 sm:px-10 lg:px-15 max-w-full sm:max-w-[1000px] lg:max-w-[1200px] w-full">
          {/* Filters */}
          <div className="flex flex-col justify-center items-center sm:flex-row gap-3 sm:gap-4 w-full">
            {/* City Dropdown */}
            <div>
              <label className="block text-3xl font-medium mb-2 text-center">
                City
              </label>
              <Select
                value={
                  selectedCity
                    ? selectedCity.slug || generateCitySlug(selectedCity)
                    : ""
                }
                onValueChange={handleCityChange}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => {
                    const citySlug = city.slug || generateCitySlug(city);
                    if (!citySlug || !citySlug.trim()) return null;
                    const key = city.id && city.id.trim() ? city.id : citySlug;
                    return (
                      <SelectItem key={key} value={citySlug}>
                        {city.name}
                        {city.region && `, ${city.region}`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Style Dropdown */}
            <div>
              <label className="block text-3xl font-medium mb-2 text-center">
                Style
              </label>
              <Select
                value={
                  selectedStyle
                    ? formatStyleNameForDisplay(selectedStyle)
                    : "all"
                }
                onValueChange={handleStyleChange}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="Select a style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ALL</SelectItem>
                  {styles.map((style) => (
                    <SelectItem
                      key={style}
                      value={formatStyleNameForDisplay(style)}
                    >
                      {formatStyleNameForDisplay(style)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Event Type Dropdown */}
            <div>
              <label className="block text-3xl font-medium mb-2 text-center">
                Type
              </label>
              <Select
                value={selectedEventType ?? "all"}
                onValueChange={handleEventTypeChange}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ALL</SelectItem>
                  {EVENT_TYPE_OPTIONS.map((eventType) => (
                    <SelectItem key={eventType} value={eventType}>
                      {eventType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calendar - Only show if a city is selected */}
          {selectedCity && (
            <div className="w-full min-w-0">
              <CityCalendar
                events={currentEvents}
                onDateChange={(date) => setCurrentDate(date)}
                selectedEventType={selectedEventType}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
