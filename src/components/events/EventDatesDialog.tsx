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

type Cursor = {
  cursorType: "future" | "past";
  cursorStartUtc: string | null;
  cursorId: string | null;
} | null;

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
  nextCursor: Cursor;
  hasMore: boolean;
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
  const [cursor, setCursor] = useState<Cursor>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchPage = useCallback(
    async (opts: { reset: boolean }) => {
      const query = new URLSearchParams();
      query.set("limit", "20");
      if (!opts.reset && cursor?.cursorType) {
        query.set("cursorType", cursor.cursorType);
        if (cursor.cursorStartUtc)
          query.set("cursorStartUtc", cursor.cursorStartUtc);
        if (cursor.cursorId) query.set("cursorId", cursor.cursorId);
      }

      const res = await fetch(
        `/api/events/${eventId}/dates?${query.toString()}`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch dates: ${res.status}`);
      }
      const data = (await res.json()) as ApiResponse;
      setTimeZone(data.eventTimezone || "UTC");
      setCursor(data.nextCursor);
      setHasMore(Boolean(data.hasMore));
      setItems((prev) => (opts.reset ? data.items : [...prev, ...data.items]));
    },
    [cursor, eventId]
  );

  const onOpenChange = useCallback(
    async (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen && items.length === 0 && !isLoading) {
        setIsLoading(true);
        try {
          await fetchPage({ reset: true });
        } finally {
          setIsLoading(false);
        }
      }
    },
    [fetchPage, isLoading, items.length]
  );

  const onShowMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      await fetchPage({ reset: false });
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage, hasMore, isLoading]);

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
      <Button variant="outline" onClick={() => onOpenChange(true)}>
        More dates
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dates</DialogTitle>
            <div className="text-xs text-muted-foreground">{timeZone}</div>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto space-y-3">
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
                      (a, b) => +new Date(a.startUtc) - +new Date(b.startUtc)
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
                      (a, b) => +new Date(b.startUtc) - +new Date(a.startUtc)
                    )
                    .map((item) => (
                      <li key={item.id} className="text-sm">
                        {formatRow({ item, timeZone })}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onShowMore} disabled={!hasMore || isLoading}>
              {isLoading
                ? "Loading..."
                : hasMore
                ? "Show more"
                : "No more dates"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
