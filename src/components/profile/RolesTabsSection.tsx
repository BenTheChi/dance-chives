"use client";

import { useState, useMemo, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
function isEventInFuture(event: Event): boolean {
  if (!event.eventDetails.dates || event.eventDetails.dates.length === 0) {
    return false;
  }
  const firstDate = event.eventDetails.dates[0].date;
  const eventDate = parseEventDate(firstDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate >= today;
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
  // Determine default: show future if any future events exist, otherwise show past
  const hasFutureEvents = useMemo(() => {
    for (const role of sortedRoles) {
      const events = eventsByRole.get(role) || [];
      if (events.some(isEventInFuture)) {
        return true;
      }
    }
    return false;
  }, [eventsByRole, sortedRoles]);

  const [showFuture, setShowFuture] = useState(hasFutureEvents);

  // Update state when hasFutureEvents changes
  useEffect(() => {
    setShowFuture(hasFutureEvents);
  }, [hasFutureEvents]);

  // Calculate video counts per role
  const videoCountsByRole = useMemo(() => {
    const counts = new Map<string, number>();
    sortedRoles.forEach((role) => {
      const events = eventsByRole.get(role) || [];
      let totalVideos = 0;
      events.forEach((event) => {
        totalVideos += countVideosInEvent(event);
      });
      counts.set(role, totalVideos);
    });
    return counts;
  }, [eventsByRole, sortedRoles]);

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
      <div className="bg-primary-dark border-secondary-light border-4 rounded-sm overflow-visible">
        {/* Past/Future Toggle */}
        <div className="flex items-center gap-3 p-3 bg-primary rounded-sm border-b-3 border-secondary-light">
          <Switch
            id="past-future-toggle"
            checked={showFuture}
            onCheckedChange={setShowFuture}
          />
          <Label htmlFor="past-future-toggle" className="cursor-pointer">
            {showFuture ? "Future" : "Past"}
          </Label>
        </div>

        <Tabs defaultValue={sortedRoles[0]} className="w-full">
          <TabsList>
            {sortedRoles.map((role) => {
              const videoCount = videoCountsByRole.get(role) || 0;
              return (
                <TabsTrigger key={role} value={role}>
                  {role} ({videoCount})
                </TabsTrigger>
              );
            })}
          </TabsList>
          {sortedRoles.map((role) => {
            const filteredEvents = getFilteredAndSortedEvents(role);
            return (
              <TabsContent key={role} value={role}>
                <div className="max-h-[600px] overflow-y-auto py-3 px-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 overflow-visible">
                    {filteredEvents.map((event: Event) => {
                      const eventRoute = `/events/${event.id}`;

                      return (
                        <div key={event.id} className="overflow-visible">
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
