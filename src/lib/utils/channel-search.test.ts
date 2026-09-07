import { matchChannels, MAX_VISIBLE } from "@/lib/utils/channel-search";
import type { ArchivedChannel } from "@/db/queries/archived-channels";

const channel = (
  name: string,
  videoCount = 0,
  url: string | null = null,
): ArchivedChannel => ({ id: name, name, url, videoCount });

const CHANNELS = [
  channel("stance", 5395, "https://youtube.com/@stancelive"),
  channel("Kit B Films", 2871, "https://youtube.com/@kitbfilms"),
  channel("Bitgoeul Dancers", 868, "https://youtube.com/@bitgoeul"),
  channel("No Limits", 1734, null),
];

describe("matchChannels", () => {
  it("returns everything, in order, for a blank query", () => {
    // Blank means "show me what's archived", so the caller's most-videos-first
    // ordering has to survive untouched.
    expect(matchChannels(CHANNELS, "")).toEqual(CHANNELS);
    expect(matchChannels(CHANNELS, "   ")).toEqual(CHANNELS);
  });

  it("matches on a partial name, case-insensitively", () => {
    expect(matchChannels(CHANNELS, "kit").map((c) => c.name)).toEqual([
      "Kit B Films",
    ]);
    expect(matchChannels(CHANNELS, "STANCE").map((c) => c.name)).toEqual([
      "stance",
    ]);
  });

  it("finds a channel from a pasted URL", () => {
    // The field doubles as the submission box, so what arrives is usually a
    // URL — it still has to answer "is this one already archived?".
    expect(
      matchChannels(CHANNELS, "https://youtube.com/@bitgoeul").map((c) => c.name),
    ).toEqual(["Bitgoeul Dancers"]);
  });

  it("matches a handle against a differently-punctuated name", () => {
    // "@kitbfilms" has no spaces; "Kit B Films" does. Folding punctuation is
    // what connects them.
    expect(matchChannels(CHANNELS, "@kitbfilms").map((c) => c.name)).toEqual([
      "Kit B Films",
    ]);
  });

  it("ignores spacing and punctuation in the query", () => {
    expect(matchChannels(CHANNELS, "no limits").map((c) => c.name)).toEqual([
      "No Limits",
    ]);
    expect(matchChannels(CHANNELS, "nolimits").map((c) => c.name)).toEqual([
      "No Limits",
    ]);
  });

  it("returns nothing when a channel is genuinely absent", () => {
    // The empty result is the signal to submit, so it must not fall back to
    // showing everything.
    expect(matchChannels(CHANNELS, "some new channel")).toEqual([]);
  });

  it("handles a channel with no url without matching everything", () => {
    expect(matchChannels(CHANNELS, "youtube").map((c) => c.name)).not.toContain(
      "No Limits",
    );
  });

  it("caps the rendered list at 50", () => {
    const many = Array.from({ length: 120 }, (_, i) => channel(`chan${i}`));
    expect(matchChannels(many, "chan").slice(0, MAX_VISIBLE)).toHaveLength(50);
  });
});
