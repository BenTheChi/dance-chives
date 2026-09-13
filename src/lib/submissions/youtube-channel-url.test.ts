import { parseYouTubeChannelUrl } from "@/lib/submissions/youtube-channel-url";

describe("parseYouTubeChannelUrl", () => {
  it("reads the four channel URL shapes", () => {
    expect(
      parseYouTubeChannelUrl("https://www.youtube.com/@bitgoeuldancers").ref,
    ).toEqual({
      kind: "handle",
      value: "@bitgoeuldancers",
      url: "https://www.youtube.com/@bitgoeuldancers",
    });

    expect(
      parseYouTubeChannelUrl(
        "https://www.youtube.com/channel/UCKHOlclseeJlvy07RHiMI-A",
      ).ref?.kind,
    ).toBe("id");

    expect(
      parseYouTubeChannelUrl("https://www.youtube.com/user/somebody").ref?.kind,
    ).toBe("user");

    expect(
      parseYouTubeChannelUrl("https://www.youtube.com/c/SomeName").ref?.kind,
    ).toBe("custom");
  });

  it("accepts what people actually paste", () => {
    // A bare handle copied off the channel page, and a URL with no scheme.
    expect(parseYouTubeChannelUrl("@bitgoeuldancers").ok).toBe(true);
    expect(parseYouTubeChannelUrl("youtube.com/@bitgoeuldancers").ok).toBe(true);
    expect(parseYouTubeChannelUrl("UCKHOlclseeJlvy07RHiMI-A").ok).toBe(true);
  });

  it("rejects a video with a message about videos", () => {
    // The likeliest mistake by far, so it must not read as "invalid URL".
    expect(
      parseYouTubeChannelUrl("https://www.youtube.com/watch?v=MRVaReHdhzk")
        .error,
    ).toBe("is_video");
    expect(parseYouTubeChannelUrl("https://youtu.be/MRVaReHdhzk").error).toBe(
      "is_video",
    );
    expect(
      parseYouTubeChannelUrl("https://www.youtube.com/shorts/abc123").error,
    ).toBe("is_video");
  });

  it("distinguishes a playlist from a video carrying a list", () => {
    expect(
      parseYouTubeChannelUrl("https://www.youtube.com/playlist?list=PLxyz")
        .error,
    ).toBe("is_playlist");
    // A watch URL with a list is still a video; report the closer problem.
    expect(
      parseYouTubeChannelUrl("https://www.youtube.com/watch?v=abc&list=PLxyz")
        .error,
    ).toBe("is_video");
  });

  it("folds handle case so one channel is one canonical url", () => {
    // The dedupe hole this closes: whenever the YouTube lookup fails there is
    // no channel id to match on, and the canonical url is the only key left.
    // `@Name` and `@name` must not become two rows for one channel.
    const spellings = [
      "@BoogStudio_TW",
      "@boogstudio_tw",
      "https://www.youtube.com/@BOOGSTUDIO_TW",
      "youtube.com/@BoogStudio_tw",
    ];

    const urls = spellings.map((s) => parseYouTubeChannelUrl(s).ref?.url);

    expect(new Set(urls).size).toBe(1);
    expect(urls[0]).toBe("https://www.youtube.com/@boogstudio_tw");

    // `value` and `url` must agree — a caller matching on either gets the
    // same answer.
    expect(parseYouTubeChannelUrl("@BoogStudio_TW").ref?.value).toBe(
      "@boogstudio_tw",
    );

    // Legacy vanity and /user/ names fold for the same reason.
    expect(parseYouTubeChannelUrl("https://www.youtube.com/c/SomeName").ref).toEqual(
      {
        kind: "custom",
        value: "somename",
        url: "https://www.youtube.com/c/somename",
      },
    );
    expect(
      parseYouTubeChannelUrl("https://www.youtube.com/user/SomeBody").ref?.url,
    ).toBe("https://www.youtube.com/user/somebody");
  });

  it("NEVER folds a channel id", () => {
    // `UC` + 22 chars is case-sensitive base64. Lowercasing it returns zero
    // results from the YouTube API — verified against the live endpoint — so
    // folding here would silently orphan the channel. This is the regression
    // that matters most in this file.
    const id = "UCr0T5S5UhRZ9RESlMckKKmg";

    expect(parseYouTubeChannelUrl(id).ref).toEqual({
      kind: "id",
      value: id,
      url: `https://www.youtube.com/channel/${id}`,
    });

    expect(
      parseYouTubeChannelUrl(`https://www.youtube.com/channel/${id}`).ref?.url,
    ).toBe(`https://www.youtube.com/channel/${id}`);

    // A lowercased id is not a valid id at all, so it must not quietly pass
    // as a `custom` vanity name under the bare-segment branch.
    expect(parseYouTubeChannelUrl(`https://www.youtube.com/channel/${id.toLowerCase()}`).error).toBe(
      "unrecognized",
    );
  });

  it("rejects everything else with a reason", () => {
    expect(parseYouTubeChannelUrl("https://vimeo.com/12345").error).toBe(
      "not_youtube",
    );
    expect(parseYouTubeChannelUrl("").error).toBe("empty");
    expect(parseYouTubeChannelUrl("   ").error).toBe("empty");
    expect(parseYouTubeChannelUrl("not a url at all !!").error).toBe(
      "unrecognized",
    );
    // Channel ids are UC + 22 chars; anything else under /channel/ is a typo.
    expect(
      parseYouTubeChannelUrl("https://www.youtube.com/channel/NOTAVALIDID")
        .error,
    ).toBe("unrecognized");
  });
});
