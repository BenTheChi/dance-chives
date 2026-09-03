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
