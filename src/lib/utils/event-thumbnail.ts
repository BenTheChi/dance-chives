/**
 * Which video represents an event.
 *
 * Every published event has at least one video and every video's `src` is a
 * bare YouTube id with `srcType = 'youtube'`, so an event thumbnail costs no
 * API call and no storage — the only question is which video to show. This
 * module answers that, and `EventCard.thumbnailVideoSrc` / `thumbnailTier`
 * cache the answer at publish time (resolving per render would mean a graph
 * traversal per row, which the list view cannot afford).
 *
 * Posters would be the obvious source, but there are zero of them across all
 * 1,073 events: the archive is machine-built from YouTube, so YouTube is also
 * where its imagery has to come from.
 */

/** Rungs of the resolution ladder, best first. */
export type ThumbnailTier = "trailer" | "bracket" | "any";

export interface ResolvedThumbnail {
  /** Bare YouTube id, matching `Video.src`. */
  videoSrc: string;
  url: string;
  tier: ThumbnailTier;
}

/**
 * Bracket rank, best first — the round whose video best represents an event.
 *
 * This mirrors the manager's `BracketPosition::rank()`, which is the pipeline's
 * own bracket-vocabulary parser and therefore the authority; the two must agree
 * or a publish and a backfill will disagree about the same event.
 *
 * Measured against the live corpus, with two things worth keeping in mind:
 *
 *  - `Semis` (920) and `Quarterfinals` (73) coexist with the numeric labels as
 *    separate vocabularies. The word-labels sit where the manager puts them on
 *    the shared scale: Semis just above `Top 4`, and Quarterfinals between
 *    `Top 6` and `Top 8`, because a quarterfinal IS the round of eight. It was
 *    previously slotted below `Top 32` here, which cost the two live events
 *    carrying `Top 16` + `Quarterfinals` and nothing else the correct pick.
 *  - `Other` (494) is a real bracket title the manager emits for rounds it
 *    could not name, not a fallback. It ranks last but is still a bracket —
 *    285 events carry one and 222 carry it alongside a real Finals, so ranking
 *    it any higher would misthumbnail a fifth of the archive.
 */
const BRACKET_RANK: readonly string[] = [
  "Finals",
  "Semis",
  "Top 4",
  "Top 6",
  "Quarterfinals",
  "Top 8",
  "Top 10",
  "Top 12",
  "Top 14",
  "Top 16",
  "Top 18",
  "Top 24",
  "Top 26",
  "Top 28",
  "Top 30",
  "Top 32",
  "Top 42",
  "Top 48",
  "Prelims",
  "Other",
];

const BRACKET_RANK_BY_TITLE = new Map(
  BRACKET_RANK.map((title, index) => [title.toLowerCase(), index]),
);

/** Unranked bracket titles sort after every known one, in graph order. */
const UNRANKED = Number.MAX_SAFE_INTEGER;

export function bracketRank(title: string | null | undefined): number {
  if (!title) return UNRANKED;
  return BRACKET_RANK_BY_TITLE.get(title.trim().toLowerCase()) ?? UNRANKED;
}

/**
 * Is this a trailer video?
 *
 * Read off the video's own `type`, which the manager sets from the Gemini
 * category and publishes as the `TrailerVideo` node label. Section titles used
 * to carry this: Trailer/Highlights/Livestream/Other all collapse into the
 * `OtherSection` label, so the section label discriminated nothing and the
 * composed section title ("Trailer", "Trailer 2") was the only signal left.
 * The video type is now the real one, so match on it instead of parsing a
 * string.
 *
 * Note the video TITLE is still useless here and must not be used: five videos
 * in the corpus say trailer/teaser/promo and four are battles between dancers
 * named Promo and Teaser ("TEASER vs BOYHAPY", "Miel vs Teaser", "Tata vs
 * Promo", "Promo vs Wealthy").
 */
export function isTrailerVideo(video: ThumbnailVideo): boolean {
  return video.type === "trailer";
}

/** Minimal shapes — deliberately structural, so both Neo4j rows and the app's
 *  own `Section`/`Bracket` types satisfy them. */
export interface ThumbnailVideo {
  src?: string | null;
  position?: number | null;
  /** The video's own type, as published (`TrailerVideo` -> "trailer"). */
  type?: string | null;
}

export interface ThumbnailBracket {
  title?: string | null;
  position?: number | null;
  videos?: ThumbnailVideo[] | null;
}

export interface ThumbnailSection {
  title?: string | null;
  position?: number | null;
  videos?: ThumbnailVideo[] | null;
  brackets?: ThumbnailBracket[] | null;
}

export interface ThumbnailEvent {
  sections?: ThumbnailSection[] | null;
}

/** Sorts by `position`, treating a missing one as "after everything ranked". */
function byPosition<T extends { position?: number | null }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => (a.position ?? UNRANKED) - (b.position ?? UNRANKED),
  );
}

function firstVideo(videos: ThumbnailVideo[] | null | undefined): string | null {
  if (!videos || videos.length === 0) return null;
  for (const video of byPosition(videos)) {
    const src = video.src?.trim();
    if (src) return src;
  }
  return null;
}

/**
 * `hqdefault` exists for every YouTube video. `maxresdefault` does not — it is
 * absent for a large share of older uploads and 404s silently, which across a
 * grid reads as a broken page rather than a missing image. Callers wanting
 * maxres must treat it as an enhancement with an onError fallback to this.
 */
export function youtubeThumbnailUrl(videoSrc: string): string {
  return `https://i.ytimg.com/vi/${videoSrc}/hqdefault.jpg`;
}

/**
 * Walk the ladder, first match wins.
 *
 *   1. Trailer — a video in a section the manager typed as a trailer. This is
 *      the event advertising itself, so it is the best possible representation.
 *   2. Bracket — the highest-ranked bracket present, then its first video.
 *      The final of an event is the shot worth showing.
 *   3. Any video — lowest position in the lowest-positioned section.
 *
 * Rung 3 guarantees termination: every published event has at least one video.
 * A null return therefore means the event genuinely has no video at all, which
 * is what the caller's mascot placeholder is still there for.
 *
 * Measured live: 1 trailer · 1,050 bracket · 22 any · 0 with no video.
 */
export function resolveEventThumbnail(
  event: ThumbnailEvent,
): ResolvedThumbnail | null {
  const sections = event.sections ?? [];
  if (sections.length === 0) return null;

  const pick = (videoSrc: string, tier: ThumbnailTier): ResolvedThumbnail => ({
    videoSrc,
    url: youtubeThumbnailUrl(videoSrc),
    tier,
  });

  // 1. Trailer, matched on the video's own type. Only a section's direct
  //    videos are considered: a trailer is never inside a bracket, so a
  //    bracketed video typed as one would be a data error, not a trailer.
  for (const section of byPosition(sections)) {
    for (const video of byPosition(section.videos ?? [])) {
      if (!isTrailerVideo(video)) continue;
      const src = video.src?.trim();
      if (src) return pick(src, "trailer");
    }
  }

  // 2. Bracket, ranked across the whole event rather than within one section:
  //    an event's Finals is its Finals wherever it sits.
  let best: { rank: number; position: number; src: string } | null = null;

  for (const section of sections) {
    for (const bracket of section.brackets ?? []) {
      const src = firstVideo(bracket.videos);
      if (!src) continue;

      const rank = bracketRank(bracket.title);
      const position = bracket.position ?? UNRANKED;

      if (
        best === null ||
        rank < best.rank ||
        (rank === best.rank && position < best.position)
      ) {
        best = { rank, position, src };
      }
    }
  }

  if (best) return pick(best.src, "bracket");

  // 3. Any video at all.
  for (const section of byPosition(sections)) {
    const src = firstVideo(section.videos);
    if (src) return pick(src, "any");
  }

  return null;
}
