import {
  canonicalizeYouTubePlaylistUrl,
  extractPlaylistIdFromYouTubeUrl,
} from "@/lib/submissions/youtube-playlist";

describe("canonicalizeYouTubePlaylistUrl", () => {
  it("canonicalizes playlist URLs by list id", () => {
    expect(
      canonicalizeYouTubePlaylistUrl(
        "https://www.youtube.com/watch?v=abc12345678&list=PLgwRr69mvJD9WN5qu0P9-wFbTJE88jQk8&index=12"
      )
    ).toEqual({
      canonicalUrl:
        "https://www.youtube.com/playlist?list=PLgwRr69mvJD9WN5qu0P9-wFbTJE88jQk8",
      playlistId: "PLgwRr69mvJD9WN5qu0P9-wFbTJE88jQk8",
    });
  });

  it("normalizes extra query params and fragments to canonical playlist URL", () => {
    expect(
      canonicalizeYouTubePlaylistUrl(
        "https://www.youtube.com/playlist?list=PLGXrzppXOvU70zyh8QggvJFszk2dPgpxq&si=abc123#t=5"
      )
    ).toEqual({
      canonicalUrl:
        "https://www.youtube.com/playlist?list=PLGXrzppXOvU70zyh8QggvJFszk2dPgpxq",
      playlistId: "PLGXrzppXOvU70zyh8QggvJFszk2dPgpxq",
    });
  });

  it("rejects non-URL direct playlist ids", () => {
    expect(canonicalizeYouTubePlaylistUrl("PLGXrzppXOvU70zyh8QggvJFszk2dPgpxq"))
      .toBeNull();
  });

  it("rejects non-playlist URLs", () => {
    expect(
      canonicalizeYouTubePlaylistUrl("https://www.youtube.com/watch?v=abc12345678")
    ).toBeNull();
  });
});

describe("extractPlaylistIdFromYouTubeUrl", () => {
  it("extracts list id from URL", () => {
    expect(
      extractPlaylistIdFromYouTubeUrl(
        "https://www.youtube.com/playlist?list=PLXbDQcfjgBRzsM2Wy7rAMgOCPHAClpxXF"
      )
    ).toBe("PLXbDQcfjgBRzsM2Wy7rAMgOCPHAClpxXF");
  });
});
