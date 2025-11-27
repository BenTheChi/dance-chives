/**
 * Check if a time value is empty (handles undefined, null, empty string, whitespace)
 */
export function isTimeEmpty(time: string | undefined | null): boolean {
  return !time || time.trim() === "";
}

/**
 * Check if both times are empty (all-day event)
 */
export function isAllDayEvent(
  startTime: string | undefined | null,
  endTime: string | undefined | null
): boolean {
  return isTimeEmpty(startTime) && isTimeEmpty(endTime);
}

/**
 * Normalize time to empty string if empty, otherwise return trimmed value
 */
export function normalizeTime(time: string | undefined | null): string {
  return isTimeEmpty(time) ? "" : time?.trim() ?? "";
}
