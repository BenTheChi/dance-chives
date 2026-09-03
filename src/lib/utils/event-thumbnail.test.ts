import {
  bracketRank,
  isTrailerSectionTitle,
  resolveEventThumbnail,
} from "@/lib/utils/event-thumbnail";

describe("isTrailerSectionTitle", () => {
  // The section title is the ONLY record of a section's type once it reaches
  // Neo4j: Trailer, Highlights, Livestream and Other all collapse to the
  // `OtherSection` label, and Postgres stores sectionType 'Other' for each.
  it("matches the composed trailer titles", () => {
    expect(isTrailerSectionTitle("Trailer")).toBe(true);
    // SectionTitle::compose appends a positional index when a section has no
    // format and no styles, which is always true of a trailer.
    expect(isTrailerSectionTitle("Trailer 1")).toBe(true);
    expect(isTrailerSectionTitle("  trailer 12  ")).toBe(true);
  });

  it("does not match battle sections that share the OtherSection label", () => {
    expect(isTrailerSectionTitle("Battle — 1v1 / breaking")).toBe(false);
    expect(isTrailerSectionTitle("Kids · Battle — cypher / breaking")).toBe(
      false,
    );
  });

  it("does not match a section merely containing the word", () => {
    expect(isTrailerSectionTitle("Trailer Park Battle")).toBe(false);
    expect(isTrailerSectionTitle(null)).toBe(false);
    expect(isTrailerSectionTitle("")).toBe(false);
  });
});

describe("bracketRank", () => {
  it("orders the rounds worth showing first", () => {
    expect(bracketRank("Finals")).toBeLessThan(bracketRank("Semis"));
    expect(bracketRank("Semis")).toBeLessThan(bracketRank("Top 4"));
    expect(bracketRank("Top 8")).toBeLessThan(bracketRank("Top 16"));
    expect(bracketRank("Prelims")).toBeLessThan(bracketRank("Other"));
  });

  it("slots the word-labels against the numeric vocabulary", () => {
    // Events use one vocabulary or the other, rarely both.
    expect(bracketRank("Quarterfinals")).toBeGreaterThan(bracketRank("Top 32"));
    expect(bracketRank("Quarterfinals")).toBeLessThan(bracketRank("Prelims"));
  });

  it("sorts unknown titles after every known one", () => {
    expect(bracketRank("Round Robin")).toBeGreaterThan(bracketRank("Other"));
    expect(bracketRank(null)).toBeGreaterThan(bracketRank("Other"));
  });
});

describe("resolveEventThumbnail", () => {
  it("prefers a trailer over the finals", () => {
    // The real shape of Gotta Smoke Em All 2018, the first event to carry a
    // recovered trailer.
    expect(
      resolveEventThumbnail({
        sections: [
          {
            title: "Battle — 2v2 / breaking / house",
            position: 0,
            brackets: [
              {
                title: "Finals",
                position: 4,
                videos: [{ src: "VGZhYS0fvi4", position: 0 }],
              },
            ],
          },
          {
            title: "Trailer 1",
            position: 3,
            videos: [{ src: "MRVaReHdhzk", position: 0 }],
          },
        ],
      }),
    ).toEqual({
      videoSrc: "MRVaReHdhzk",
      url: "https://i.ytimg.com/vi/MRVaReHdhzk/hqdefault.jpg",
      tier: "trailer",
    });
  });

  it("does not mistake an untyped battle section for a trailer", () => {
    // 16 of the 17 OtherSection nodes live are battle sections. Selecting on
    // the label rather than the title would thumbnail these from a loose
    // battle clip and call it a trailer.
    expect(
      resolveEventThumbnail({
        sections: [
          {
            title: "Battle — 1v1 / breaking",
            position: 0,
            videos: [{ src: "LOOSE", position: 0 }],
          },
          {
            title: "Battle — 2v2",
            position: 1,
            brackets: [
              {
                title: "Finals",
                position: 0,
                videos: [{ src: "FINALS", position: 0 }],
              },
            ],
          },
        ],
      })?.tier,
    ).toBe("bracket");
  });

  it("ranks brackets across the whole event, not within a section", () => {
    expect(
      resolveEventThumbnail({
        sections: [
          {
            title: "A",
            position: 0,
            brackets: [
              {
                title: "Prelims",
                position: 0,
                videos: [{ src: "P", position: 0 }],
              },
            ],
          },
          {
            title: "B",
            position: 1,
            brackets: [
              {
                title: "Finals",
                position: 0,
                videos: [{ src: "F", position: 0 }],
              },
            ],
          },
        ],
      })?.videoSrc,
    ).toBe("F");
  });

  it("breaks a rank tie on bracket position", () => {
    // Some events carry two sections that both end in a Finals.
    expect(
      resolveEventThumbnail({
        sections: [
          {
            title: "A",
            position: 1,
            brackets: [
              {
                title: "Finals",
                position: 5,
                videos: [{ src: "LATE", position: 0 }],
              },
            ],
          },
          {
            title: "B",
            position: 0,
            brackets: [
              {
                title: "Finals",
                position: 1,
                videos: [{ src: "EARLY", position: 0 }],
              },
            ],
          },
        ],
      })?.videoSrc,
    ).toBe("EARLY");
  });

  it("falls back to any video, lowest position first", () => {
    const resolved = resolveEventThumbnail({
      sections: [
        {
          title: "Showcase — showcase",
          position: 0,
          videos: [
            { src: "THIRD", position: 3 },
            { src: "FIRST", position: 1 },
          ],
        },
      ],
    });
    expect(resolved?.tier).toBe("any");
    expect(resolved?.videoSrc).toBe("FIRST");
  });

  it("falls through a trailer section that holds no video", () => {
    expect(
      resolveEventThumbnail({
        sections: [
          { title: "Trailer 1", position: 0, videos: [] },
          {
            title: "B",
            position: 1,
            brackets: [
              {
                title: "Finals",
                position: 0,
                videos: [{ src: "F", position: 0 }],
              },
            ],
          },
        ],
      })?.tier,
    ).toBe("bracket");
  });

  it("returns null only when there is genuinely no video", () => {
    expect(resolveEventThumbnail({ sections: [] })).toBeNull();
    expect(
      resolveEventThumbnail({
        sections: [{ title: "S", position: 0, videos: [{ src: "" }] }],
      }),
    ).toBeNull();
  });
});
