"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { City } from "@/types/city";
import { CalendarEventData } from "@/db/queries/event";
import { CityCalendar } from "./CityCalendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeStyleForUrl } from "@/lib/utils/calendar-url-utils";
import { formatStyleNameForDisplay } from "@/lib/utils/style-utils";
import { generateCitySlug } from "@/lib/utils/city-slug";
import { subMonths, addMonths, startOfMonth, endOfMonth } from "date-fns";

interface CalendarPageClientProps {
  cities: City[];
  styles: string[];
  initialCity: City | null;
  initialStyle: string | null;
  events: CalendarEventData[];
}

export function CalendarPageClient({
  cities,
  styles,
  initialCity,
  initialStyle,
  events,
}: CalendarPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCity, setSelectedCity] = useState<City | null>(initialCity);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(
    initialStyle
  );

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
    if (initialCity) {
      setCurrentEvents(events);
    }
  }, [initialCity, events]);

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

    const newUrl = `/calendar?${params.toString()}`;
    const currentUrl = `/calendar${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;

    // Only update if URL actually changed
    if (newUrl !== currentUrl) {
      router.push(newUrl, { scroll: false });
    }
  }, [selectedCity, selectedStyle, router, searchParams]);

  // Fetch events when city, style, or date changes (3-month batches)
  useEffect(() => {
    if (selectedCity) {
      const citySlug = selectedCity.slug || generateCitySlug(selectedCity);
      const styleParam = selectedStyle
        ? normalizeStyleForUrl(selectedStyle)
        : "";
      const { startDate, endDate } = getDateRange(currentDate);

      fetch(
        `/api/calendar/events?city=${encodeURIComponent(citySlug)}${
          styleParam ? `&style=${encodeURIComponent(styleParam)}` : ""
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
  }, [selectedCity, selectedStyle, currentDate]);

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

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.6rem)]">
      <div className="flex justify-center flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col px-5 gap-4 sm:gap-8 py-3 sm:py-5 px-0 sm:px-10 lg:px-15 max-w-full sm:max-w-[1000px] lg:max-w-[1200px] w-full">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <h1 className="!text-[40px] sm:!text-[60px] mt-2 sm:mt-5">
              Calendar
            </h1>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:max-w-2xl min-w-0">
              {/* City Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
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
                      return (
                        <SelectItem key={city.id} value={citySlug}>
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
                <label className="block text-sm font-medium mb-2">Style</label>
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
            </div>
          </div>

          {/* Calendar - Only show if a city is selected */}
          {selectedCity && (
            <div className="w-full min-w-0">
              <CityCalendar
                events={currentEvents}
                onDateChange={(date) => setCurrentDate(date)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
