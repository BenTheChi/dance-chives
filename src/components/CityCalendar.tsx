"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  View,
  Navigate,
  ToolbarProps,
} from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addDays,
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
  convertSessionToCalendarEvents,
  CalendarEvent,
} from "@/lib/utils/calendar-utils";
import { CalendarEventPopover } from "./CalendarEventPopover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  events: CalendarEventData[]; // Includes competitions and workshops
  sessions: CalendarSessionData[];
}

// Predefined colors for each event type
const EVENT_COLORS = {
  event: "#3b82f6", // Blue for competitions
  workshop: "#f59e0b", // Orange for workshops
  session: "#8b5cf6", // Purple for sessions
};

// Event type labels for legend
const EVENT_TYPE_LABELS = {
  event: "Competition",
  workshop: "Workshop",
  session: "Session",
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

  const goToToday = () => {
    onNavigate(Navigate.TODAY);
  };

  const goToBack = () => {
    onNavigate(Navigate.PREVIOUS);
  };

  const goToNext = () => {
    onNavigate(Navigate.NEXT);
  };

  const handleMonthChange = (monthIndex: string) => {
    const newDate = setMonth(date, parseInt(monthIndex));
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      onNavigate(newDate as any);
    }
  };

  const handleYearChange = (year: string) => {
    const newDate = setYear(date, parseInt(year));
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      onNavigate(newDate as any);
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
    <div className="flex justify-between items-center mb-4">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={goToToday} className="h-8">
          Today
        </Button>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={goToBack}
            className="h-8 px-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            className="h-8 px-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={currentMonth.toString()}
          onValueChange={handleMonthChange}
        >
          <SelectTrigger size="sm" className="w-[140px] h-8">
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
          <SelectTrigger size="sm" className="w-[100px] h-8">
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
          <div className="rbc-toolbar-label text-lg font-semibold ml-2">
            {label()}
          </div>
        )}
      </div>
      <div className="rbc-btn-group flex gap-1">
        <Button
          variant={view === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => onView("month")}
          className="h-8"
        >
          Month
        </Button>
        <Button
          variant={view === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => onView("week")}
          className="h-8"
        >
          Week
        </Button>
        <Button
          variant={view === "day" ? "default" : "outline"}
          size="sm"
          onClick={() => onView("day")}
          className="h-8"
        >
          Day
        </Button>
      </div>
    </div>
  );
}

export function CityCalendar({ events, sessions }: CityCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>("month");
  const calendarRef = useRef<HTMLDivElement>(null);

  // Convert all items to calendar events
  const calendarEvents = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    // Convert events (includes competitions and workshops, filter out those with no dates)
    // Returns array since events can have multiple dates
    events
      .filter((event) => (event.dates && event.dates.length > 0) || event.startDate)
      .forEach((event) => {
        const eventCalendarEvents = convertEventToCalendarEvents(event);
        allEvents.push(...eventCalendarEvents);
      });

    // Convert sessions (returns array, so we spread it)
    sessions.forEach((session) => {
      const sessionEvents = convertSessionToCalendarEvents(session);
      allEvents.push(...sessionEvents);
    });

    return allEvents;
  }, [events, sessions]);

  // Style events by type
  const eventPropGetter = (event: CalendarEvent) => {
    // Use the event type for coloring (competition, workshop, session)
    const eventType = event.resource.type;
    const color =
      EVENT_COLORS[eventType as keyof typeof EVENT_COLORS] ||
      EVENT_COLORS.event;
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

  return (
    <div ref={calendarRef} className="relative">
      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <span className="text-sm font-medium">Event Types:</span>
        {Object.entries(EVENT_TYPE_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{
                backgroundColor:
                  EVENT_COLORS[type as keyof typeof EVENT_COLORS],
              }}
            />
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
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
