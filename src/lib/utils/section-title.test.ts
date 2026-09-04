import { sectionDisplayTitle } from "./section-title";

describe("sectionDisplayTitle", () => {
  it("removes styles the chips already render", () => {
    // The reported section. Its chips carry the styles; the heading listed
    // four it no longer has.
    expect(
      sectionDisplayTitle({
        title:
          "Bonnie & Clyde · Battle — 2v2 / breaking / hiphop / krump / open styles / waacking",
      }),
    ).toBe("Bonnie & Clyde · Battle — 2v2");
  });

  it("keeps an alias spelling, which is a descriptor", () => {
    // All four are registered aliases of Breaking, so every one of these
    // sections chips as ["Breaking"]. Dropping the words would leave four
    // identical "Battle — 1v1" headings on one page.
    for (const word of ["powermove", "bgirl", "toprock", "footwork"]) {
      expect(sectionDisplayTitle({ title: `Battle — 1v1 / ${word}` })).toBe(
        `Battle — 1v1 / ${word}`,
      );
    }
  });

  it("removes a style whatever its punctuation or case", () => {
    // compose() emits the PE's raw spelling, so the chip's name arrives in
    // several shapes: `hiphop`, `hip-hop`, `Hip Hop`.
    expect(sectionDisplayTitle({ title: "Battle — 1v1 / hiphop" })).toBe("Battle — 1v1");
    expect(sectionDisplayTitle({ title: "Battle — 1v1 / hip-hop" })).toBe("Battle — 1v1");
    expect(sectionDisplayTitle({ title: "Battle — 1v1 / Hip Hop" })).toBe("Battle — 1v1");
    expect(sectionDisplayTitle({ title: "Battle — 1v1 / open styles" })).toBe("Battle — 1v1");
  });

  it("keeps the format and the division prefix", () => {
    expect(
      sectionDisplayTitle({ title: "Youth · Battle — 7 to smoke / popping / waving" }),
    ).toBe("Youth · Battle — 7 to smoke");
    expect(sectionDisplayTitle({ title: "U18 · Battle — 1v1 / breaking" })).toBe(
      "U18 · Battle — 1v1",
    );
  });

  it("keeps a free-text descriptor that is not a style at all", () => {
    expect(
      sectionDisplayTitle({ title: "Battle — 1v1 / smoothest dancer / popping" }),
    ).toBe("Battle — 1v1 / smoothest dancer");
  });

  it("keeps a mixed tail's descriptors and drops only its styles", () => {
    // `chicago footwork` is itself a canonical style, so it goes too — unlike
    // the bare `footwork`, which is only an alias of Breaking and stays.
    expect(
      sectionDisplayTitle({ title: "Battle — crew / breaking / chicago footwork" }),
    ).toBe("Battle — crew");
    expect(sectionDisplayTitle({ title: "Battle — crew / breaking / footwork" })).toBe(
      "Battle — crew / footwork",
    );
  });

  it("leaves a title with no styles in it alone", () => {
    expect(sectionDisplayTitle({ title: "Other" })).toBe("Other");
    expect(sectionDisplayTitle({ title: "Battle 2" })).toBe("Battle 2");
    expect(sectionDisplayTitle({ title: "Battle — crew" })).toBe("Battle — crew");
    expect(sectionDisplayTitle({ title: "Battle — 1v1" })).toBe("Battle — 1v1");
  });

  it("survives an empty title", () => {
    expect(sectionDisplayTitle({ title: "" })).toBe("");
  });
});
