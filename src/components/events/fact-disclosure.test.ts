import { datePrecisionConfidence } from "@/components/events/FactDisclosure";

/**
 * The confidence line is the half of the disclosure that tells a member where
 * their knowledge beats the machine's, so it has to be honest about which part
 * of the date is actually unknown.
 */
describe("datePrecisionConfidence", () => {
  it("names the year as the only known part", () => {
    expect(datePrecisionConfidence("year")).toContain("year");
  });

  it("names the month as the only known part", () => {
    expect(datePrecisionConfidence("month")).toContain("month");
  });

  it("says nothing for a fully known date", () => {
    // A day-precision date has no gap, so a confidence line would be noise on
    // the 315 events that already know exactly when they happened.
    expect(datePrecisionConfidence("day")).toBeUndefined();
  });
});
