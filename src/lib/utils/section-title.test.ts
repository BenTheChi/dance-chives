import { sectionDisplayTitle, stylesFromVideos } from "./section-title";

const vid = (...styles: string[]) => ({ styles });

describe("sectionDisplayTitle", () => {
  it("replaces stale styles with the ones its videos carry", () => {
    // The reported section: one Breaking video under a five-style heading.
    expect(
      sectionDisplayTitle({
        title:
          "Bonnie & Clyde · Battle — 2v2 / breaking / hiphop / krump / open styles / waacking",
        videos: [vid("Breaking")],
      }),
    ).toBe("Bonnie & Clyde · Battle — 2v2 / breaking");
  });

  it("keeps a narrower word for a style its videos confirm", () => {
    // `powermove`, `bgirl` and `toprock` are all registered ALIASES of
    // Breaking, and an event can run them as separate tournaments. Each
    // carries exactly ["Breaking"], so replacing the tail would render
    // "Battle — 1v1 / breaking" three times and collapse three distinct
    // competitions into one heading. The narrower word is kept, and nothing
    // is appended because it already accounts for Breaking.
    expect(
      sectionDisplayTitle({
        title: "Battle — 1v1 / powermove",
        videos: [vid("Breaking")],
      }),
    ).toBe("Battle — 1v1 / powermove");

    expect(
      sectionDisplayTitle({
        title: "Battle — 1v1 / bgirl",
        videos: [vid("Breaking")],
      }),
    ).toBe("Battle — 1v1 / bgirl");
  });

  it("drops a narrower word when its videos do not back it", () => {
    // The distinction only earns its place while the footage supports it.
    expect(
      sectionDisplayTitle({
        title: "Battle — 1v1 / powermove",
        videos: [vid("Popping")],
      }),
    ).toBe("Battle — 1v1 / popping");
  });

  it("reads styles out of brackets as well as direct videos", () => {
    expect(
      sectionDisplayTitle({
        title: "Battle — 1v1 / hiphop / popping",
        brackets: [{ videos: [vid("Popping"), vid("Popping")] }],
      }),
    ).toBe("Battle — 1v1 / popping");
  });

  it("keeps the format and the division prefix", () => {
    expect(
      sectionDisplayTitle({
        title: "Youth · Battle — 7 to smoke / popping / waving",
        videos: [vid("Popping")],
      }),
    ).toBe("Youth · Battle — 7 to smoke / popping");
  });

  it("falls back to the stored title when there is nothing to derive from", () => {
    // A blank heading is worse than a stale one.
    expect(
      sectionDisplayTitle({
        title: "Battle — 1v1 / breaking / hiphop",
        videos: [vid()],
      }),
    ).toBe("Battle — 1v1 / breaking / hiphop");
  });

  it("leaves titles with no style list alone", () => {
    expect(sectionDisplayTitle({ title: "Other", videos: [vid("Breaking")] })).toBe("Other");
    expect(sectionDisplayTitle({ title: "Battle 2", videos: [vid("Breaking")] })).toBe("Battle 2");
  });

  it("appends the videos' styles to a heading that claimed none", () => {
    // Same shape as the `powermove` case above: a title whose tail holds only
    // non-style tokens. Appending is consistent with those and strictly more
    // informative than leaving the heading silent about what was danced.
    expect(sectionDisplayTitle({ title: "Battle — crew", videos: [vid("Breaking")] })).toBe(
      "Battle — crew / breaking",
    );
  });

  it("adds a style the heading never claimed", () => {
    // The heading is a view of the videos, so a style they carry belongs in it
    // even when the stored string predates it.
    expect(
      sectionDisplayTitle({
        title: "Battle — 1v1 / breaking",
        videos: [vid("Breaking"), vid("Hip Hop")],
      }),
    ).toBe("Battle — 1v1 / breaking / hip hop");
  });

  it("survives an empty or missing title", () => {
    expect(sectionDisplayTitle({ title: "" })).toBe("");
  });
});

describe("stylesFromVideos", () => {
  it("canonicalises and dedupes across videos and brackets", () => {
    expect(
      stylesFromVideos({
        title: "x",
        videos: [vid("hiphop"), vid("Hip Hop")],
        brackets: [{ videos: [vid("breaking")] }],
      }),
    ).toEqual(["Hip Hop", "Breaking"]);
  });

  it("drops tokens that are not registered styles", () => {
    expect(stylesFromVideos({ title: "x", videos: [vid("powermove", "Breaking")] })).toEqual([
      "Breaking",
    ]);
  });
});
