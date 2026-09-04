import { resolveCanonicalStyleName } from "@/lib/utils/style-utils";
import type { DanceStyle } from "@/lib/utils/dance-styles";

/**
 * A section's heading, derived from the videos inside it.
 *
 * ## Why this is derived rather than stored
 *
 * `Section.title` is composed once, at publish time, by pasting the section's
 * division, type, format and styles into one string. It is then never
 * recomputed, so any later correction to the styles leaves the heading
 * asserting the old ones. After the 2026-09-04 pooled-style repair, 396
 * sections displayed styles their videos no longer carried — one read
 * "Bonnie & Clyde · Battle — 2v2 / breaking / hiphop / krump / open styles /
 * waacking" above a single video whose only style is Breaking.
 *
 * Rewriting the stored strings would fix it once and drift again on the next
 * correction. Deriving at render keeps the heading true by construction: the
 * videos ARE the evidence, so a heading computed from them cannot disagree
 * with them.
 *
 * ## What is preserved, and why that matters
 *
 * Only tokens that resolve to a registered dance style are replaced. Every
 * other part of the stored title is kept exactly as it is — the division
 * prefix, the section type, the format, and crucially any token that is not a
 * registered style.
 *
 * That last exclusion is the whole reason this is a targeted swap rather than
 * a rebuild. An event can run several tournaments that are all the same style:
 *
 *     ["Breaking"]  Battle — 1v1 / powermove
 *     ["Breaking"]  Battle — 1v1 / bgirl
 *     ["Breaking"]  Battle — 1v1 / toprock
 *
 * `powermove`, `bgirl` and `toprock` are moves and divisions, not registered
 * styles, so they live ONLY in the title. Rebuilding those three headings from
 * their styles would render "Battle — 1v1 / breaking" three times and collapse
 * three distinct competitions into one indistinguishable heading. Measured on
 * prod: 55 sections across 37 events depend on this.
 *
 * ## What this deliberately does not touch
 *
 * The stored `Section.title` remains the section's identity. It is the key the
 * manager's augment planner parses back into fields to place new footage, and
 * the value the site's own uniqueness check runs against. Nothing here writes
 * to the graph, and the sectioning algorithm is untouched — this is a display
 * concern only.
 */

/** Separates the division prefix from the rest: "Open · Battle — 1v1". */
const DIVISION_SEPARATOR = " · ";
/** Separates the section type from the format/styles list. */
const TYPE_SEPARATOR = " — ";
/** Separates the format from each style, and styles from each other. */
const PART_SEPARATOR = " / ";

interface TitleVideo {
  styles?: string[] | null;
}

interface TitleBracket {
  videos?: TitleVideo[] | null;
}

export interface TitleSection {
  title: string;
  videos?: TitleVideo[] | null;
  brackets?: TitleBracket[] | null;
}

/**
 * Every style witnessed by a section's own videos, flat and bracketed alike,
 * canonicalised and deduplicated. Order follows first appearance, which keeps
 * a section's heading stable between renders.
 */
export function stylesFromVideos(section: TitleSection): DanceStyle[] {
  const seen = new Set<string>();
  const out: DanceStyle[] = [];

  const take = (videos: TitleVideo[] | null | undefined) => {
    for (const video of videos ?? []) {
      for (const style of video.styles ?? []) {
        const canonical = resolveCanonicalStyleName(style);
        if (!canonical || seen.has(canonical)) continue;
        seen.add(canonical);
        out.push(canonical);
      }
    }
  };

  take(section.videos);
  for (const bracket of section.brackets ?? []) take(bracket.videos);

  return out;
}

/**
 * The heading to display for a section.
 *
 * Falls back to the stored title whenever deriving would be a guess or a
 * regression:
 *
 *  - the title has no ` — ` tail, so there is no style list to replace
 *    (a bare "Battle", or the shared "Other" every non-structural section gets)
 *  - the section has no videos carrying styles, so there is nothing to derive
 *    FROM — a blank heading is worse than a stale one
 *  - the title names no registered style at all, so nothing in it is claiming
 *    to be a style in the first place
 */
export function sectionDisplayTitle(section: TitleSection): string {
  const stored = (section.title ?? "").trim();
  if (!stored) return stored;

  const divisionIndex = stored.indexOf(DIVISION_SEPARATOR);
  const prefix =
    divisionIndex === -1
      ? ""
      : stored.slice(0, divisionIndex + DIVISION_SEPARATOR.length);
  const rest = stored.slice(prefix.length);

  const typeIndex = rest.indexOf(TYPE_SEPARATOR);
  if (typeIndex === -1) return stored;

  const head = rest.slice(0, typeIndex);
  const tail = rest.slice(typeIndex + TYPE_SEPARATOR.length);

  const parts = tail
    .split(PART_SEPARATOR)
    .map((p) => p.trim())
    .filter((p) => p !== "");

  const derived = stylesFromVideos(section);
  if (derived.length === 0) return stored;

  // A token is dropped only when it names a style the videos DID NOT witness.
  // Anything else is kept exactly as written — the format, and any word that
  // names a narrower thing than the style it resolves to.
  //
  // That second case is why this cannot simply drop every registered token.
  // `powermove`, `bgirl`, `toprock`, `footwork` and `rocking` are all
  // registered ALIASES of Breaking, and an event can run them as separate
  // tournaments:
  //
  //     ["Breaking"]  Battle — 1v1 / powermove
  //     ["Breaking"]  Battle — 1v1 / bgirl
  //     ["Breaking"]  Battle — 1v1 / toprock
  //
  // All three carry exactly ["Breaking"], so replacing their tails with the
  // derived style would render "Battle — 1v1 / breaking" three times and
  // collapse three distinct competitions into one heading. Keeping a token
  // whose style the videos confirm preserves the narrower word, and the
  // derived styles are only appended for what the title does not already
  // account for. Measured on prod: 55 sections across 37 events.
  const derivedKeys = new Set<string>(derived);

  const kept = parts.filter((p) => {
    const canonical = resolveCanonicalStyleName(p);
    return canonical === null || derivedKeys.has(canonical);
  });

  // Only styles no kept token already accounts for.
  const accountedFor = new Set<DanceStyle>(
    kept
      .map((p) => resolveCanonicalStyleName(p))
      .filter((c): c is DanceStyle => c !== null),
  );
  const missing = derived.filter((style) => !accountedFor.has(style));

  const rebuilt = [...kept, ...missing.map((s) => s.toLowerCase())];

  // Nothing actually moved — keep the stored string rather than emitting a
  // re-cased or re-ordered copy of it.
  if (
    rebuilt.length === parts.length &&
    rebuilt.every((p, i) => p === parts[i].toLowerCase())
  ) {
    return stored;
  }

  return `${prefix}${head}${TYPE_SEPARATOR}${rebuilt.join(PART_SEPARATOR)}`;
}
