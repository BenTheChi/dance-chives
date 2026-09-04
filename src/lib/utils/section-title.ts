import { resolveCanonicalStyleName } from "@/lib/utils/style-utils";

/**
 * A section's heading, with the styles taken out.
 *
 * ## Why
 *
 * `Section.title` is composed once, at publish time, by pasting the section's
 * division, type, format and styles into one string, and is never recomputed.
 * Any later style correction therefore leaves the heading asserting the old
 * ones: after the 2026-09-04 pooled-style repair, 396 sections displayed
 * styles their videos no longer carried. One read "Bonnie & Clyde · Battle —
 * 2v2 / breaking / hiphop / krump / open styles / waacking" above a single
 * video whose only style is Breaking.
 *
 * The heading does not need to carry styles at all. Every section renders
 * style chips beside it, sourced from the videos, so a style in the title is
 * both duplication and a second copy free to drift. Removing it fixes the
 * drift by removing the thing that drifts.
 *
 * ## The one thing that is kept
 *
 * A token that reads exactly as the chip's own name goes. Every other token
 * stays — including the registry's alternate spellings, which do real work
 * here as section descriptors.
 *
 * `powermove`, `bgirl`, `footwork` and `toprock` are all registered aliases of
 * Breaking, so a chip flattens them into one word:
 *
 *     chips=["Breaking"]  Battle — 1v1 / powermove
 *     chips=["Breaking"]  Battle — 1v1 / bgirl
 *     chips=["Breaking"]  Battle — 1v1 / footwork
 *
 * Three separate tournaments, one chip between them. Stripping every token the
 * registry maps to a style would leave three identical `Battle — 1v1` headings
 * on one page — measured on prod, that collapses 603 sections across 181
 * events, and Book of Styles China 2026 alone loses 11 tournaments to a single
 * heading. Matching only the chip's own spelling keeps them all.
 *
 * ## What this does not touch
 *
 * The stored `Section.title` is untouched. It remains the key the manager's
 * augment planner parses to place new footage, and the value the site's
 * uniqueness check runs against. This is display only; nothing here writes to
 * the graph, and the sectioning algorithm is not involved.
 */

/** Separates the division prefix from the rest: "Open · Battle — 1v1". */
const DIVISION_SEPARATOR = " · ";
/** Separates the section type from the format/styles list. */
const TYPE_SEPARATOR = " — ";
/** Separates the format from each style, and styles from each other. */
const PART_SEPARATOR = " / ";

export interface TitleSection {
  title: string;
}

/** Punctuation and spacing never distinguish a style name, so `Hip Hop`,
 *  `hip-hop` and `hiphop` fold to one value. */
function fold(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * The heading to display for a section.
 *
 * Returns the stored title unchanged whenever there is nothing to remove — a
 * title with no ` — ` tail (a bare "Battle", or the shared "Other" every
 * non-structural section gets), or one whose tail is all format and
 * descriptors.
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

  const kept = parts.filter((part) => {
    const canonical = resolveCanonicalStyleName(part);
    // Only the chip's own spelling is redundant. An alias spelling names a
    // narrower thing than the chip shows, so it is a descriptor and stays.
    return canonical === null || fold(part) !== fold(canonical);
  });

  if (kept.length === parts.length) return stored;

  // The tail was styles all the way down. Keep the head alone rather than
  // emitting a dangling separator.
  if (kept.length === 0) return `${prefix}${head}`;

  return `${prefix}${head}${TYPE_SEPARATOR}${kept.join(PART_SEPARATOR)}`;
}
