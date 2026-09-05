"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

/**
 * Jump-to search over the help topics.
 *
 * The point is scanning, not full-text search: someone arriving here has a task
 * in mind ("wrong city", "delete my event") and wants the shortest path to it.
 * So this matches a small hand-written index of tasks and their synonyms rather
 * than the page body — a body search would return the paragraph containing the
 * word rather than the task the person came to do.
 *
 * It renders nothing until typed into, so it costs no vertical space on the
 * scan path for people who would rather read the two tracks.
 */

interface Topic {
  label: string;
  href: string;
  /** Words someone might actually type for this task. */
  keywords: string;
}

const TOPICS: Topic[] = [
  {
    label: "Fix a wrong or missing city",
    href: "/events",
    keywords: "city location where place wrong missing venue town country",
  },
  {
    label: "Fix a wrong or imprecise date",
    href: "/events",
    keywords: "date year month day when wrong imprecise unknown time",
  },
  {
    label: "Fix the dance styles on an event",
    href: "/events",
    keywords: "style styles breaking popping locking house hiphop wrong tag",
  },
  {
    label: "Undo a change someone made",
    href: "/contributions",
    keywords: "undo revert reverse mistake wrong change moderator history",
  },
  {
    label: "Claim an event as mine",
    href: "/help/page-ownership",
    keywords: "claim own ownership mine organiser organizer request page",
  },
  {
    label: "Add a new event",
    href: "/help/add-edit-events",
    keywords: "add create new event submit upload form",
  },
  {
    label: "Edit an event I own",
    href: "/help/add-edit-events",
    keywords: "edit change update event form poster section bracket photo",
  },
  {
    label: "Add someone to my event team",
    href: "/help/event-management",
    keywords: "team member add collaborator access permission share",
  },
  {
    label: "Hide or delete an event",
    href: "/help/event-management",
    keywords: "hide delete remove takedown visibility private unpublish",
  },
  {
    label: "Tag myself or someone else",
    href: "/help/role-tagging",
    keywords: "tag role dancer judge dj host credit myself someone instagram",
  },
  {
    label: "Report a problem or dispute",
    href: "/help/role-tagging",
    keywords: "report dispute appeal problem takedown copyright complaint",
  },
];

export function HelpSearch() {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return TOPICS.filter(
      (t) =>
        t.label.toLowerCase().includes(q) || t.keywords.includes(q),
    ).slice(0, 6);
  }, [query]);

  return (
    <div className="space-y-3">
      <label htmlFor="help-search" className="sr-only">
        Search help topics
      </label>
      <input
        id="help-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="What do you need to do? (e.g. wrong city, delete event)"
        className="w-full h-11 rounded-sm border-2 border-secondary-light bg-background px-4"
      />

      {query.trim() ? (
        matches.length > 0 ? (
          <ul className="rounded-sm border-2 border-secondary-light bg-background/50 divide-y divide-border">
            {matches.map((t) => (
              <li key={t.label}>
                <Link
                  href={t.href}
                  className="block px-4 py-3 text-sm hover:bg-secondary-light/20 transition-colors"
                >
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground px-1">
            Nothing matched. Try &ldquo;city&rdquo;, &ldquo;date&rdquo;,
            &ldquo;tag&rdquo;, or &ldquo;delete&rdquo; — or read the two sections
            below.
          </p>
        )
      ) : null}
    </div>
  );
}
