"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  revertContribution,
  type ContributionField,
} from "@/lib/server_actions/contribution_actions";

/**
 * One correction as the moderation list needs it. `oldValue` is the whole
 * point of the view: it is what a revert would restore.
 */
export interface ContributionRow {
  id: string;
  createdAt: Date | string;
  eventId: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  evidence: string | null;
  status: string;
  user: {
    id: string;
    username: string | null;
    name: string | null;
  } | null;
}

const FIELD_FILTERS: (ContributionField | "all")[] = [
  "all",
  "city",
  "date",
  "styles",
  "title",
  "series",
];

/**
 * Render a stored JSON value as something a moderator can read at a glance.
 * The shapes differ per field (a city is an object, styles are an array), so
 * this stays deliberately loose rather than switching on field type.
 */
function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const name = obj.name ?? obj.displayDateLocal ?? obj.startDate;
    if (typeof name === "string") return name;
    return JSON.stringify(value);
  }
  return String(value);
}

export function ContributionsClient({
  initialContributions,
}: {
  initialContributions: ContributionRow[];
}) {
  const [rows, setRows] = useState(initialContributions);
  const [field, setField] = useState<ContributionField | "all">("all");
  const [userFilter, setUserFilter] = useState("");
  const [pending, startTransition] = useTransition();
  const [reverting, setReverting] = useState<string | null>(null);

  const visible = useMemo(() => {
    return rows.filter((row) => {
      if (field !== "all" && row.field !== field) return false;
      if (userFilter) {
        const handle = row.user?.username ?? row.user?.name ?? "";
        if (!handle.toLowerCase().includes(userFilter.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [rows, field, userFilter]);

  function handleRevert(id: string) {
    setReverting(id);
    startTransition(async () => {
      const result = await revertContribution(id);

      if (result.status === 200) {
        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "reverted" } : r)),
        );
        toast.success("Contribution reverted");
      } else {
        toast.error(
          "error" in result ? result.error : "Failed to revert contribution",
        );
      }
      setReverting(null);
    });
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-6 md:p-8 pb-16">
      <div>
        <h1 className="mb-2">Contributions</h1>
        <p className="text-muted-foreground">
          Corrections members have made to published events. Each one applied
          immediately; reverting restores the value it replaced.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {FIELD_FILTERS.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={field === f ? "default" : "outline"}
              onClick={() => setField(f)}
            >
              {f}
            </Button>
          ))}
        </div>

        <input
          type="text"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          placeholder="Filter by member…"
          className="ml-auto h-9 rounded-sm border-2 border-secondary-light bg-background px-3 text-sm"
        />
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          No contributions {rows.length > 0 ? "match this filter" : "yet"}.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b-2 border-secondary-light">
                <th className="py-2 pr-4 font-bold">Field</th>
                <th className="py-2 pr-4 font-bold">Was</th>
                <th className="py-2 pr-4 font-bold">Now</th>
                <th className="py-2 pr-4 font-bold">Member</th>
                <th className="py-2 pr-4 font-bold">Event</th>
                <th className="py-2 pr-4 font-bold">When</th>
                <th className="py-2 font-bold" />
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const isReverted = row.status === "reverted";
                return (
                  <tr
                    key={row.id}
                    className="border-b border-border align-top"
                  >
                    <td className="py-3 pr-4">
                      <Badge variant="outline">{row.field}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground line-through">
                      {displayValue(row.oldValue)}
                    </td>
                    <td className="py-3 pr-4 font-medium">
                      {displayValue(row.newValue)}
                      {row.evidence ? (
                        <div className="text-xs text-muted-foreground mt-1">
                          {row.evidence}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4">
                      {row.user?.username ?? row.user?.name ?? "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/events/${row.eventId}`}
                        className="underline"
                      >
                        view
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      {isReverted ? (
                        <span className="text-muted-foreground text-xs">
                          reverted
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending && reverting === row.id}
                          onClick={() => handleRevert(row.id)}
                        >
                          {pending && reverting === row.id
                            ? "Reverting…"
                            : "Revert"}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
