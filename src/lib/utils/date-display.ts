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

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const fullYear = String(parsed.getFullYear());

  switch (precision) {
    case "year":
      return fullYear;
    case "month":
      return `${month}/${fullYear}`;
    default: {
      const day = String(parsed.getDate()).padStart(2, "0");
      return `${month}/${day}/${fullYear.slice(-2)}`;
    }
  }
}
