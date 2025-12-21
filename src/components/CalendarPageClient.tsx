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

  const [currentEvents, setCurrentEvents] = useState<CalendarEventData[]>(events);

  // Update events when initial events prop changes (from server-side fetch)
  useEffect(() => {
    if (initialCity && events.length > 0) {
      setCurrentEvents(events);
    }
  }, [initialCity, events]);

  // Update URL when selections change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (selectedCity?.slug) {
      params.set("city", selectedCity.slug);
    }
    
    if (selectedStyle) {
      params.set("style", normalizeStyleForUrl(selectedStyle));
    }

    const newUrl = `/calendar?${params.toString()}`;
    const currentUrl = `/calendar${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    
    // Only update if URL actually changed
    if (newUrl !== currentUrl) {
      router.push(newUrl, { scroll: false });
    }
  }, [selectedCity, selectedStyle, router, searchParams]);

  // Fetch events when city or style changes
  useEffect(() => {
    if (selectedCity?.slug) {
      const styleParam = selectedStyle ? normalizeStyleForUrl(selectedStyle) : '';
      fetch(`/api/calendar/events?city=${selectedCity.slug}${styleParam ? `&style=${styleParam}` : ''}`)
        .then(res => res.json())
        .then(data => setCurrentEvents(data.events || []))
        .catch(err => {
          console.error('Error fetching events:', err);
          setCurrentEvents([]);
        });
    } else {
      setCurrentEvents([]);
    }
  }, [selectedCity, selectedStyle]);

  const handleCityChange = (citySlug: string) => {
    const city = cities.find((c) => c.slug === citySlug);
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
        <div className="flex flex-col gap-8 py-5 px-3 sm:px-10 lg:px-15 max-w-[500px] sm:max-w-[1000px] lg:max-w-[1200px] w-full">
          {/* Header */}
          <div className="flex flex-col items-center gap-4">
            <h1 className="!text-[60px] mt-5">Calendar</h1>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
              {/* City Dropdown */}
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">City</label>
                <Select
                  value={selectedCity?.slug || ""}
                  onValueChange={handleCityChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.slug || city.id}>
                        {city.name}
                        {city.region && `, ${city.region}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Style Dropdown */}
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Style</label>
                <Select
                  value={
                    selectedStyle
                      ? formatStyleNameForDisplay(selectedStyle)
                      : "all"
                  }
                  onValueChange={handleStyleChange}
                >
                  <SelectTrigger className="w-full">
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
            <div className="w-full">
              <CityCalendar events={currentEvents} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

