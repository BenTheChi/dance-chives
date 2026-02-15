import { canonicalizeInstagramPostOrReelUrl } from "@/lib/submissions/instagram-url";

describe("canonicalizeInstagramPostOrReelUrl", () => {
  it("canonicalizes post URLs and strips query/hash", () => {
    expect(
      canonicalizeInstagramPostOrReelUrl(
        "https://instagram.com/p/ABC_123/?utm_source=ig_web_copy_link#frag"
      )
    ).toEqual({
      canonicalUrl: "https://www.instagram.com/p/ABC_123/",
      shortcode: "ABC_123",
      kind: "p",
    });
  });

  it("canonicalizes reel URLs", () => {
    expect(
      canonicalizeInstagramPostOrReelUrl("https://www.instagram.com/reel/xyz987/")
    ).toEqual({
      canonicalUrl: "https://www.instagram.com/reel/xyz987/",
      shortcode: "xyz987",
      kind: "reel",
    });
  });

  it("rejects profile URLs", () => {
    expect(
      canonicalizeInstagramPostOrReelUrl("https://www.instagram.com/someuser/")
    ).toBeNull();
  });

  it("rejects non-instagram hosts", () => {
    expect(
      canonicalizeInstagramPostOrReelUrl("https://example.com/p/abc123/")
    ).toBeNull();
  });
});
