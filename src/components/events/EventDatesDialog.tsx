"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatInTimeZone } from "date-fns-tz";

type ApiItem = {
  id: string;
  kind: "timed" | "allDay";
  startUtc: string;
  endUtc: string | null;
  localDate: string | null;
};

type ApiResponse = {
  eventId: string;
  eventTimezone: string;
  items: ApiItem[];
};

function formatRow(opts: { item: ApiItem; timeZone: string }): string {
  const { item, timeZone } = opts;
  const start = new Date(item.startUtc);
  const date = formatInTimeZone(start, timeZone, "MMM d, yyyy");

  if (item.kind === "allDay") {
    return `${date}`;
  }

  const startTime = formatInTimeZone(start, timeZone, "h:mm a");
  const endTime = item.endUtc
    ? formatInTimeZone(new Date(item.endUtc), timeZone, "h:mm a")
    : null;

  return endTime
    ? `${date} • ${startTime} – ${endTime}`
    : `${date} • ${startTime}`;
}

export function EventDatesDialog(props: { eventId: string }) {
  const { eventId } = props;
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timeZone, setTimeZone] = useState<string>("UTC");
  const [items, setItems] = useState<ApiItem[]>([]);

  const fetchDates = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/dates`);
    if (!res.ok) {
      throw new Error(`Failed to fetch dates: ${res.status}`);
    }
    const data = (await res.json()) as ApiResponse;
    setTimeZone(data.eventTimezone || "UTC");
    setItems(data.items);
  }, [eventId]);

  const onOpenChange = useCallback(
    async (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen && items.length === 0 && !isLoading) {
        setIsLoading(true);
        try {
          await fetchDates();
        } finally {
          setIsLoading(false);
        }
      }
    },
    [fetchDates, isLoading, items.length]
  );

  // For display: split by comparing to "now" for timed; for all-day trust localDate vs today in TZ
  const nowUtc = useMemo(() => new Date(), []);
  const todayIso = useMemo(
    () => formatInTimeZone(nowUtc, timeZone, "yyyy-MM-dd"),
    [nowUtc, timeZone]
  );

  const future = useMemo(() => {
    return items.filter((i) => {
      if (i.kind === "allDay") {
        return (i.localDate || "") >= todayIso;
      }
      return new Date(i.startUtc) >= nowUtc;
    });
  }, [items, nowUtc, todayIso]);

  const past = useMemo(() => {
    return items.filter((i) => {
      if (i.kind === "allDay") {
        return (i.localDate || "") < todayIso;
      }
      return new Date(i.startUtc) < nowUtc;
    });
  }, [items, nowUtc, todayIso]);

  return (
    <>
      <Button variant="link" onClick={() => onOpenChange(true)}>
        More dates
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dates</DialogTitle>
            <div className="text-xs text-muted-foreground">{timeZone}</div>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto space-y-3">
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Upcoming</div>
                  {future.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No upcoming dates.
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {future
                        .slice()
                        .sort(
                          (a, b) =>
                            +new Date(a.startUtc) - +new Date(b.startUtc)
                        )
                        .map((item) => (
                          <li key={item.id} className="text-sm">
                            {formatRow({ item, timeZone })}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="text-sm font-semibold">Past</div>
                  {past.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No past dates.
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {past
                        .slice()
                        .sort(
                          (a, b) =>
                            +new Date(b.startUtc) - +new Date(a.startUtc)
                        )
                        .map((item) => (
                          <li key={item.id} className="text-sm">
                            {formatRow({ item, timeZone })}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
