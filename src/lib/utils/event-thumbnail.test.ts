import {
  bracketRank,
  isTrailerVideo,
  resolveEventThumbnail,
} from "@/lib/utils/event-thumbnail";

describe("isTrailerVideo", () => {
  // The video's own type is the record now: the manager sets it from the
  // Gemini category and publishes it as the `TrailerVideo` node label.
  it("matches a video typed as a trailer", () => {
    expect(isTrailerVideo({ src: "a", type: "trailer" })).toBe(true);
  });

  it("does not match other video types", () => {
    expect(isTrailerVideo({ src: "a", type: "battle" })).toBe(false);
    expect(isTrailerVideo({ src: "a", type: "freestyle" })).toBe(false);
    expect(isTrailerVideo({ src: "a", type: null })).toBe(false);
    expect(isTrailerVideo({ src: "a" })).toBe(false);
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
            // The section is titled "Other" like every other non-structural
            // one; only the video's type marks it as a trailer.
            title: "Other",
            position: 3,
            videos: [{ src: "MRVaReHdhzk", position: 0, type: "trailer" }],
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
    // 16 of the 17 OtherSection nodes live are battle sections, so the
    // section label discriminates nothing. Untyped videos are not trailers.
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

  it("finds a trailer whatever its section is titled", () => {
    // The old title heuristic could only see a section composed as "Trailer"
    // or "Trailer N" — titles that no longer exist, since every non-structural
    // section now composes to "Other". Typing the video finds it regardless,
    // including in a section holding footage alongside the trailer.
    expect(
      resolveEventThumbnail({
        sections: [
          {
            title: "Other",
            position: 0,
            videos: [
              { src: "CLIP", position: 0 },
              { src: "TRAILER", position: 1, type: "trailer" },
            ],
          },
        ],
      }),
    ).toEqual({
      videoSrc: "TRAILER",
      url: "https://i.ytimg.com/vi/TRAILER/hqdefault.jpg",
      tier: "trailer",
    });
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

  it("falls through an empty section that could have held a trailer", () => {
    expect(
      resolveEventThumbnail({
        sections: [
          { title: "Other", position: 0, videos: [] },
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
