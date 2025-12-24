/**
 * Formats a date as a relative time string (Facebook-style)
 * Examples: "Just now", "10 min", "2 hr", "3 wk", "1 month", "2 yr"
 * Rounds down to the nearest unit
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }

  if (diffHours < 24) {
    return `${diffHours} hr`;
  }

  // Round down to weeks (no days in format - min/hr/wk/month/yr only)
  if (diffWeeks < 4) {
    return `${diffWeeks} wk`;
  }

  if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths !== 1 ? "s" : ""}`;
  }

  return `${diffYears} yr`;
}

