"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  View,
  ToolbarProps,
  Navigate,
} from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addDays,
  addMonths,
  subMonths,
  setMonth,
  setYear,
  getMonth,
  getYear,
} from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CalendarEventData, CalendarSessionData } from "@/db/queries/event";
import {
  convertEventToCalendarEvents,
  CalendarEvent,
} from "@/lib/utils/calendar-utils";
import { EventType, EventDate } from "@/types/event";
import { CalendarEventPopover } from "./CalendarEventPopover";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CityCalendarProps {
  events: CalendarEventData[]; // Includes all event types (competitions, workshops, sessions, etc.)
  sessions?: CalendarSessionData[]; // Optional for backward compatibility, but events array should contain all
  onDateChange?: (date: Date) => void; // Callback when the calendar date changes
}

// Predefined colors for each event type
const EVENT_COLORS: Record<EventType, string> = {
  Battle: "#ef4444", // Red
  Competition: "#3b82f6", // Blue
  Class: "#10b981", // Green
  Workshop: "#f59e0b", // Orange
  Session: "#8b5cf6", // Purple
  Party: "#ec4899", // Pink
  Festival: "#f97316", // Orange-red
  Performance: "#6366f1", // Indigo
  Other: "#ffffff", // White
};

// Event type labels for legend
const EVENT_TYPE_LABELS: Record<EventType, string> = {
  Battle: "Battle",
  Competition: "Competition",
  Class: "Class",
  Workshop: "Workshop",
  Session: "Session",
  Party: "Party",
  Festival: "Festival",
  Performance: "Performance",
  Other: "Other",
};

// Month names for dropdown
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Generate year options (current year ± 10 years)
const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 10; i <= currentYear + 10; i++) {
    years.push(i);
  }
  return years;
};

// Custom toolbar component props
interface CustomToolbarProps extends ToolbarProps<CalendarEvent> {
  onDateChange?: (date: Date) => void;
}

// Custom toolbar component
function CustomToolbar({
  date,
  view,
  onNavigate,
  onView,
  onDateChange,
}: CustomToolbarProps) {
  const currentMonth = getMonth(date);
  const currentYear = getYear(date);
  const yearOptions = getYearOptions();

  const handleMonthChange = (monthIndex: string) => {
    const newDate = setMonth(date, parseInt(monthIndex));
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      onNavigate(Navigate.DATE, newDate);
    }
  };

  const handleYearChange = (year: string) => {
    const newDate = setYear(date, parseInt(year));
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      onNavigate(Navigate.DATE, newDate);
    }
  };

  const handleNavigate = (action: "PREV" | "NEXT" | "TODAY") => {
    if (onDateChange) {
      // Calculate new date based on action and current view
      let newDate: Date;
      if (action === "TODAY") {
        newDate = new Date();
      } else if (action === "PREV") {
        if (view === "month") {
          newDate = subMonths(date, 1);
        } else if (view === "week") {
          newDate = addDays(date, -7);
        } else {
          newDate = addDays(date, -1);
        }
      } else {
        // NEXT
        if (view === "month") {
          newDate = addMonths(date, 1);
        } else if (view === "week") {
          newDate = addDays(date, 7);
        } else {
          newDate = addDays(date, 1);
        }
      }
      onDateChange(newDate);
    } else {
      onNavigate(action as any);
    }
  };

  const label = () => {
    if (view === "month") {
      return format(date, "MMMM yyyy");
    } else if (view === "week") {
      const start = startOfWeek(date);
      const end = addDays(start, 6);
      if (format(start, "MMMM") === format(end, "MMMM")) {
        return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
      } else {
        return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
      }
    } else if (view === "day") {
      return format(date, "EEEE, MMMM d, yyyy");
    }
    return format(date, "MMMM yyyy");
  };

  return (
    <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={currentMonth.toString()}
          onValueChange={handleMonthChange}
        >
          <SelectTrigger size="sm" className="h-8 text-xs sm:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((month, index) => (
              <SelectItem key={month} value={index.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={currentYear.toString()} onValueChange={handleYearChange}>
          <SelectTrigger size="sm" className="h-8 text-xs sm:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {view !== "month" && (
          <div className="text-xs sm:text-lg font-semibold truncate">
            {label()}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* Navigation buttons */}
        <div className=" flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigate("PREV")}
            className="h-8 w-8 p-0"
            title="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigate("TODAY")}
            className="h-8 px-3 text-xs sm:text-sm"
            title="Today"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigate("NEXT")}
            className="h-8 w-8 p-0"
            title="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {/* View buttons */}
        <div className=" flex gap-1">
          <Button
            variant={view === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => onView("month")}
            className="h-8 text-xs sm:text-sm flex-1 sm:flex-initial"
          >
            Month
          </Button>
          <Button
            variant={view === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => onView("week")}
            className="h-8 text-xs sm:text-sm flex-1 sm:flex-initial"
          >
            Week
          </Button>
          <Button
            variant={view === "day" ? "default" : "outline"}
            size="sm"
            onClick={() => onView("day")}
            className="h-8 text-xs sm:text-sm flex-1 sm:flex-initial"
          >
            Day
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CityCalendar({
  events,
  sessions,
  onDateChange,
}: CityCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>("month");
  const calendarRef = useRef<HTMLDivElement>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);

  // Convert all items to calendar events
  const calendarEvents = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    // Convert events (includes all event types: competitions, workshops, sessions, etc.)
    // Returns array since events can have multiple dates
    events
      .filter(
        (event) => (event.dates && event.dates.length > 0) || event.startDate
      )
      .forEach((event) => {
        const eventCalendarEvents = convertEventToCalendarEvents(event);
        allEvents.push(...eventCalendarEvents);
      });

    // Convert sessions for backward compatibility (if sessions array is provided separately)
    // Note: Sessions should now be included in the events array with eventType="Session"
    // This converts CalendarSessionData to CalendarEventData format
    if (sessions && sessions.length > 0) {
      sessions.forEach((session) => {
        // Parse JSON dates array from session
        let parsedDates: EventDate[] = [];
        try {
          const datesStr = session.dates || "[]";
          parsedDates =
            typeof datesStr === "string" ? JSON.parse(datesStr) : datesStr;
        } catch (error) {
          console.error("Error parsing session dates:", error);
          parsedDates = [];
        }

        // Convert session to CalendarEventData format
        const sessionEventData: CalendarEventData = {
          id: session.id,
          title: session.title,
          dates:
            Array.isArray(parsedDates) && parsedDates.length > 0
              ? parsedDates
              : undefined,
          eventType: "Session" as EventType,
          poster: session.poster,
          styles: session.styles,
        };

        // Convert to calendar events using the generic function
        const sessionCalendarEvents =
          convertEventToCalendarEvents(sessionEventData);
        allEvents.push(...sessionCalendarEvents);
      });
    }

    return allEvents;
  }, [events, sessions]);

  // Style events by type
  const eventPropGetter = (event: CalendarEvent) => {
    // Use eventType from resource
    const eventType = event.resource.eventType;
    const color =
      eventType && EVENT_COLORS[eventType]
        ? EVENT_COLORS[eventType]
        : EVENT_COLORS.Other;
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: "white",
      },
    };
  };

  // Handle event click
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setPopoverOpen(true);
  };

  // Handle view change
  const handleViewChange = (view: View) => {
    setCurrentView(view);
  };

  // Handle navigation
  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        popoverOpen
      ) {
        setPopoverOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popoverOpen]);

  // Monitor for react-big-calendar overlay and prevent calendar interactions when it's open
  useEffect(() => {
    const checkOverlay = () => {
      const overlay = document.querySelector(".rbc-overlay");
      const calendarElement =
        calendarRef.current?.querySelector(".rbc-calendar");
      const isOpen = overlay !== null;

      setOverlayOpen(isOpen);

      // Add/remove class to disable calendar interactions
      if (calendarElement) {
        if (isOpen) {
          calendarElement.classList.add("rbc-calendar-overlay-open");
        } else {
          calendarElement.classList.remove("rbc-calendar-overlay-open");
        }
      }
    };

    // Check initially
    checkOverlay();

    // Use MutationObserver to watch for overlay appearance/disappearance
    const observer = new MutationObserver(checkOverlay);

    // Observe the calendar container for changes
    if (calendarRef.current) {
      observer.observe(calendarRef.current, {
        childList: true,
        subtree: true,
      });
    }

    // Also check periodically as a fallback
    const interval = setInterval(checkOverlay, 100);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  // Prevent calendar interactions when overlay is open
  // The CSS will handle disabling pointer events on calendar cells/events
  // react-big-calendar will handle closing the overlay when clicking outside

  return (
    <div
      ref={calendarRef}
      className="relative w-full bg-primary-dark p-4 rounded-sm border-4 border-primary-light"
    >
      {/* Legend */}
      <div className="mb-4 grid grid-cols-3 sm:flex sm:flex-wrap gap-1 sm:gap-4 items-center">
        {(Object.keys(EVENT_TYPE_LABELS) as Array<EventType | "event">)
          .filter(
            (type) =>
              type !== "event" && type !== "Competition" && type !== "Festival"
          ) // Exclude "event", "Competition", and "Festival" from legend
          .map((type) => (
            <div key={type} className="flex items-center gap-1.5 sm:gap-2">
              <div
                className="w-3 h-3 sm:w-4 sm:h-4 rounded flex-shrink-0"
                style={{
                  backgroundColor: EVENT_COLORS[type],
                }}
              />
              <span className="text-xs sm:text-sm">
                {EVENT_TYPE_LABELS[type]}
              </span>
            </div>
          ))}
      </div>
      <div className="w-full min-w-0 mx-0 sm:mx-0 overflow-x-auto">
        <div
          className={`px-0 sm:px-0 min-w-0 w-full ${
            overlayOpen ? "pointer-events-none" : ""
          }`}
          style={overlayOpen ? { position: "relative" } : undefined}
        >
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{
              height: "calc(100vh - 300px)",
              minHeight: "400px",
              maxHeight: "800px",
              width: "100%",
            }}
            eventPropGetter={eventPropGetter}
            onSelectEvent={handleSelectEvent}
            view={currentView}
            onView={handleViewChange}
            date={currentDate}
            onNavigate={handleNavigate}
            views={["month", "week", "day"]}
            components={{
              toolbar: (props) => (
                <CustomToolbar {...props} onDateChange={handleNavigate} />
              ),
            }}
            popup
          />
        </div>
      </div>
      {selectedEvent && (
        <CalendarEventPopover
          event={selectedEvent}
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
        />
      )}
    </div>
  );
}
