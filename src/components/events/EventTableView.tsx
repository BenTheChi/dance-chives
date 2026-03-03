"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { TEventCard } from "@/types/event";

const TITLE_CHAR_LIMIT = 48;

interface EventTableViewProps {
  events: TEventCard[];
  className?: string;
}

function clampTitle(title: string): string {
  if (title.length <= TITLE_CHAR_LIMIT) return title;
  return `${title.slice(0, TITLE_CHAR_LIMIT).trimEnd()}...`;
}

function formatDate(value: string): string {
  if (!value) return "-";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value;

  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  const year = String(parsedDate.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
}

export function EventTableView({ events, className }: EventTableViewProps) {
  const router = useRouter();
  const cellClassName = "px-4 py-3 text-sm font-medium";

  const handleNavigate = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  return (
    <div
      className={cn(
        "w-full max-w-[1200px] mx-auto bg-primary-dark sm:rounded-sm border-4 border-primary-light overflow-hidden",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed">
          <thead className="bg-primary-light text-charcoal">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-bold w-[120px]">
                Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-bold w-[300px]">
                Title
              </th>
              <th className="px-4 py-3 text-left text-sm font-bold w-[130px]">
                Type
              </th>
              <th className="px-4 py-3 text-left text-sm font-bold w-[250px]">
                Styles
              </th>
              <th className="px-4 py-3 text-left text-sm font-bold w-[170px]">
                City
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, index) => {
              const rowBackground =
                index % 2 === 0
                  ? "bg-primary/85 text-foreground"
                  : "bg-primary-dark text-foreground";
              const formattedStyles =
                event.styles && event.styles.length > 0
                  ? event.styles.join(", ")
                  : "-";
              const eventHref = `/events/${event.id}`;

              return (
                <tr
                  key={event.id}
                  onClick={() => handleNavigate(event.id)}
                  className={cn(
                    rowBackground,
                    "cursor-pointer border-b border-primary-light/25 transition-colors hover:bg-primary-light/20 focus-within:bg-primary-light/20"
                  )}
                >
                  <td className={cn(cellClassName, "whitespace-nowrap")}>
                    {formatDate(event.date)}
                  </td>
                  <td className={cellClassName}>
                    <Link
                      href={eventHref}
                      className="block truncate rounded-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
                      title={event.title}
                      aria-label={`Open event ${event.title}`}
                    >
                      {clampTitle(event.title)}
                    </Link>
                  </td>
                  <td className={cn(cellClassName, "whitespace-nowrap")}>
                    {event.eventType || "-"}
                  </td>
                  <td className={cellClassName}>
                    <span
                      className="block truncate text-sm font-medium"
                      title={formattedStyles}
                    >
                      {formattedStyles}
                    </span>
                  </td>
                  <td className={cn(cellClassName, "whitespace-nowrap")}>
                    {event.city || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
