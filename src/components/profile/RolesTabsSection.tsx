"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { EventCard } from "@/components/EventCard";
import { Event } from "@/types/event";

interface RolesTabsSectionProps {
  eventsByRole: Map<string, Event[]>;
  sortedRoles: string[];
  savedEventIds: Set<string>;
}

// Helper function to parse date string (MM/DD/YYYY format)
function parseEventDate(dateStr: string): Date {
  if (dateStr.includes("-")) {
    return new Date(dateStr);
  }
  const [month, day, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}

// Check if event is in the future
// Returns true if the event has at least one future date
function isEventInFuture(event: Event): boolean {
  if (!event.eventDetails.dates || event.eventDetails.dates.length === 0) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if any date is in the future
  return event.eventDetails.dates.some((dateEntry) => {
    const eventDate = parseEventDate(dateEntry.date);
    return eventDate && eventDate >= today;
  });
}

// Count videos in an event
function countVideosInEvent(event: Event): number {
  let count = 0;
  if (event.sections) {
    event.sections.forEach((section) => {
      count += section.videos?.length || 0;
      if (section.brackets) {
        section.brackets.forEach((bracket) => {
          count += bracket.videos?.length || 0;
        });
      }
    });
  }
  return count;
}

export function RolesTabsSection({
  eventsByRole,
  sortedRoles,
  savedEventIds,
}: RolesTabsSectionProps) {
  // Check if there are any future events across all roles
  const hasFutureEvents = useMemo(() => {
    for (const role of sortedRoles) {
      const events = eventsByRole.get(role) || [];
      if (events.some((event) => isEventInFuture(event))) {
        return true;
      }
    }
    return false;
  }, [eventsByRole, sortedRoles]);

  // Default to future if there are future events, otherwise default to past
  const [showFuture, setShowFuture] = useState(hasFutureEvents);

  // Filter and sort events based on past/future toggle
  const getFilteredAndSortedEvents = (role: string): Event[] => {
    const events = eventsByRole.get(role) || [];
    const filtered = events.filter((event) =>
      showFuture ? isEventInFuture(event) : !isEventInFuture(event)
    );

    // Sort: ascending for future, descending for past
    return filtered.sort((a, b) => {
      const dateA = a.eventDetails.dates?.[0]?.date
        ? parseEventDate(a.eventDetails.dates[0].date)
        : new Date(0);
      const dateB = b.eventDetails.dates?.[0]?.date
        ? parseEventDate(b.eventDetails.dates[0].date)
        : new Date(0);

      if (showFuture) {
        return dateA.getTime() - dateB.getTime(); // Ascending
      } else {
        return dateB.getTime() - dateA.getTime(); // Descending
      }
    });
  };

  if (sortedRoles.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      <h2 className="text-2xl font-bold mb-4">Events with Roles</h2>
      <div className="bg-secondary-dark border-primary-light border-4 rounded-sm overflow-hidden">
        {/* Past/Future Toggle */}
        <div className="flex items-center justify-center gap-3 p-3 bg-secondary-dark rounded-sm border-b-3 border-primary-light text-center">
          <span className="text-sm font-semibold uppercase">Past</span>
          <Switch
            id="past-future-toggle"
            checked={showFuture}
            onCheckedChange={setShowFuture}
          />
          <span className="text-sm font-semibold uppercase">Future</span>
        </div>

        <Tabs defaultValue={sortedRoles[0]} className="w-full">
          <TabsList className="flex flex-col sm:flex-row sm:flex-wrap justify-center items-stretch sm:items-center gap-2 p-3 bg-transparent text-secondary-light w-full mt-8 mb-2 sm:mt-0">
            {sortedRoles.map((role) => {
              const filteredEventsCount =
                getFilteredAndSortedEvents(role).length;
              return (
                <TabsTrigger
                  key={role}
                  value={role}
                  className="px-4 py-4 rounded-sm transition-all duration-200 border-2 border-transparent hover:border-charcoal hover:shadow-[4px_4px_0_0_rgb(49,49,49)] active:shadow-[2px_2px_0_0_rgb(49,49,49)] text-base font-bold uppercase tracking-wide font-display text-secondary-light hover:bg-periwinkle-light hover:text-periwinkle data-[state=active]:border-charcoal data-[state=active]:shadow-[4px_4px_0_0_rgb(49,49,49)] data-[state=active]:bg-mint data-[state=active]:text-primary w-full sm:w-auto"
                >
                  {role} ({filteredEventsCount})
                </TabsTrigger>
              );
            })}
          </TabsList>
          {sortedRoles.map((role) => {
            const filteredEvents = getFilteredAndSortedEvents(role);
            return (
              <TabsContent key={role} value={role}>
                <div className="max-h-[600px] overflow-y-auto overflow-x-hidden py-3 px-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 justify-items-center sm:justify-items-start">
                    {filteredEvents.map((event: Event) => {
                      const eventRoute = `/events/${event.id}`;

                      return (
                        <div
                          key={event.id}
                          className="flex justify-center sm:justify-start"
                        >
                          <EventCard
                            id={event.id}
                            title={event.eventDetails.title}
                            imageUrl={event.eventDetails.poster?.url}
                            date={
                              event.eventDetails.dates &&
                              event.eventDetails.dates.length > 0
                                ? event.eventDetails.dates[0].date
                                : ""
                            }
                            city={event.eventDetails.city.name || ""}
                            cityId={event.eventDetails.city.id}
                            styles={event.eventDetails.styles || []}
                            eventType={event.eventDetails.eventType}
                            href={eventRoute}
                            isSaved={savedEventIds.has(event.id)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </section>
  );
}
