export type DatePrecision = "day" | "month" | "year";

/**
 * Format an event's display date honestly: auto-imported events often only
 * know their year (sometimes month), and rendering a fake exact date
 * ("01/01/19" for a year-only event) is misleading.
 *
 *   day   -> MM/DD/YY  (existing card format)
 *   month -> MM/YYYY
 *   year  -> YYYY
 */
export function formatEventDate(
  date: string,
  precision: DatePrecision = "day",
): string {
  if (!date) return "";

  // A calendar date is read off the string, never off a Date's local getters.
  // `new Date("2023-01-01")` is UTC midnight by spec, so `getFullYear()` in any
  // negative-offset zone returns 2022 — which would render every year-only
  // event, the archive's most common precision, as the year before it happened.
  // (`MM/DD/YYYY` parses as LOCAL midnight instead, so the two input shapes
  // disagreed with each other as well.)
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(date);

  let year: string;
  let month: string;
  let day: string;

  if (iso) {
    [, year, month, day] = iso;
  } else if (slash) {
    [, month, day, year] = slash;
  } else {
    // Anything else falls back to Date parsing, read in UTC to match the
    // literal above rather than re-introducing the shift.
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    year = String(parsed.getUTCFullYear());
    month = String(parsed.getUTCMonth() + 1);
    day = String(parsed.getUTCDate());
  }

  month = month.padStart(2, "0");
  day = day.padStart(2, "0");

  switch (precision) {
    case "year":
      return year;
    case "month":
      return `${month}/${year}`;
    default:
      return `${month}/${day}/${year.slice(-2)}`;
  }
}
