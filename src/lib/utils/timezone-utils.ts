import { fromZonedTime, formatInTimeZone, toZonedTime } from "date-fns-tz";
import { parse, isValid } from "date-fns";

/**
 * Parse an MM/DD/YYYY date string into a Date (local, midnight).
 * This is only used as an intermediate step before converting using a timezone.
 */
export function parseMmddyyyy(dateStr: string): Date {
  const parsed = parse(dateStr, "MM/dd/yyyy", new Date());
  if (!isValid(parsed)) {
    throw new Error(`Invalid date string (expected MM/DD/YYYY): ${dateStr}`);
  }
  return parsed;
}

/**
 * Convert a date (MM/DD/YYYY) + time (HH:mm) in an IANA timezone into a UTC Date.
 */
export function zonedDateTimeToUtc(opts: {
  dateMmddyyyy: string;
  timeHHmm: string;
  timeZone: string;
}): Date {
  const { dateMmddyyyy, timeHHmm, timeZone } = opts;
  const d = parseMmddyyyy(dateMmddyyyy);
  const [hh, mm] = timeHHmm.split(":").map((v) => Number(v));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
    throw new Error(`Invalid time string (expected HH:mm): ${timeHHmm}`);
  }
  // Create a "wall clock" Date and interpret it in the provided timeZone.
  const wallClock = new Date(d);
  wallClock.setHours(hh, mm, 0, 0);
  const result = fromZonedTime(wallClock, timeZone);
  if (!isValid(result)) {
    throw new Error(
      `Failed to convert date/time to UTC: ${dateMmddyyyy} ${timeHHmm} ${timeZone}`
    );
  }
  return result;
}

/**
 * Convert an all-day date (MM/DD/YYYY) in an IANA timezone into a UTC instant representing
 * the start of that local day.
 */
export function zonedStartOfDayToUtc(opts: {
  dateMmddyyyy: string;
  timeZone: string;
}): Date {
  return zonedDateTimeToUtc({
    dateMmddyyyy: opts.dateMmddyyyy,
    timeHHmm: "00:00",
    timeZone: opts.timeZone,
  });
}

/**
 * Format a UTC instant into a display date (MM/DD/YYYY) in a timezone.
 */
export function formatDateInTimeZoneMmddyyyy(opts: {
  utc: Date;
  timeZone: string;
}): string {
  return formatInTimeZone(opts.utc, opts.timeZone, "MM/dd/yyyy");
}

/**
 * Format a UTC instant into a display time (h:mm a) in a timezone.
 */
export function formatTimeInTimeZoneHmmaa(opts: {
  utc: Date;
  timeZone: string;
}): string {
  return formatInTimeZone(opts.utc, opts.timeZone, "h:mm a");
}

/**
 * Get the local calendar date (YYYY-MM-DD) for a UTC instant in a timezone.
 * Useful for all-day comparisons and for splitting days.
 */
export function localIsoDateInTimeZone(opts: {
  utc: Date;
  timeZone: string;
}): string {
  return formatInTimeZone(opts.utc, opts.timeZone, "yyyy-MM-dd");
}

/**
 * Convert UTC instant to the equivalent zoned Date object (mostly for UI libs).
 */
export function utcToZonedDate(opts: { utc: Date; timeZone: string }): Date {
  return toZonedTime(opts.utc, opts.timeZone);
}
