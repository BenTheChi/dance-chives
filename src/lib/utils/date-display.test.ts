import { formatEventDate } from "./date-display";

describe("formatEventDate", () => {
  it("renders each precision at its own resolution", () => {
    expect(formatEventDate("2023-06-14", "day")).toBe("06/14/23");
    expect(formatEventDate("2023-06-14", "month")).toBe("06/2023");
    expect(formatEventDate("2023-06-14", "year")).toBe("2023");
  });

  it("reads an ISO date off the string, not a local Date", () => {
    // The regression this guards: `new Date("2023-01-01")` is UTC midnight, so
    // local getters in any negative-offset zone report 2022-12-31. Year-only
    // is the archive's most common precision, and the event page passes the
    // graph's raw `YYYY-MM-DD`, so this rendered 150 events a year early.
    expect(formatEventDate("2023-01-01", "year")).toBe("2023");
    expect(formatEventDate("2023-01-01", "month")).toBe("01/2023");
    expect(formatEventDate("2023-01-01", "day")).toBe("01/01/23");
  });

  it("agrees across the two shapes the app stores dates in", () => {
    // Cards pass `displayDateLocal` (MM/DD/YYYY, parsed as LOCAL midnight); the
    // event page passes the graph's ISO date (UTC midnight). They described the
    // same day and used to disagree by one.
    for (const precision of ["day", "month", "year"] as const) {
      expect(formatEventDate("2019-06-01", precision)).toBe(
        formatEventDate("06/01/2019", precision),
      );
    }
  });

  it("keeps an ISO datetime on its own calendar day", () => {
    expect(formatEventDate("2023-06-14T00:00:00.000Z", "day")).toBe("06/14/23");
  });

  it("passes through what it cannot parse", () => {
    expect(formatEventDate("")).toBe("");
    // V8's Date parser is lenient enough to read a year out of loose prose
    // ("sometime in 2019" -> Jan 1 2019), so the passthrough only catches what
    // it rejects outright. Nothing in the archive stores a date this way; the
    // branch exists so a malformed row renders as itself rather than as
    // "NaN/NaN/NaN".
    expect(formatEventDate("not a date at all")).toBe("not a date at all");
  });
});
