import { DANCE_STYLES, DanceStyle } from "@/lib/utils/dance-styles";

const canonicalStyleByLookupKey = new Map<string, DanceStyle>(
  DANCE_STYLES.map((style) => [toStyleLookupKey(style), style])
);

const STYLE_ALIASES: Array<[string, DanceStyle]> = [
  ["hiphop", "Hip Hop"],
  ["all style", "Open Styles"],
  ["all styles", "Open Styles"],
  ["allstyle", "Open Styles"],
  ["open style", "Open Styles"],
];

const styleAliasByLookupKey = new Map<string, DanceStyle>(
  STYLE_ALIASES.map(([style, canonical]) => [toStyleLookupKey(style), canonical])
);

function toStyleLookupKey(style: string): string {
  return style
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function titleCaseFallback(style: string): string {
  const trimmed = style.trim().replace(/\s+/g, " ");
  if (!trimmed) return trimmed;
  return trimmed
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Resolves a style string to the canonical whitelist value.
 * Returns null for unknown styles.
 */
export function resolveCanonicalStyleName(style: string): DanceStyle | null {
  const key = toStyleLookupKey(style);
  return (
    canonicalStyleByLookupKey.get(key) ?? styleAliasByLookupKey.get(key) ?? null
  );
}

/**
 * Converts a style to canonical Title Case.
 * Throws when style is outside the canonical whitelist.
 */
export function normalizeStyleName(style: string): DanceStyle {
  const canonical = resolveCanonicalStyleName(style);
  if (!canonical) {
    throw new Error(`Invalid dance style: "${style}"`);
  }
  return canonical;
}

/**
 * Formats a style name for display using canonical Title Case.
 * Unknown values are rendered in Title Case fallback form.
 */
export function formatStyleNameForDisplay(style: string): string {
  if (!style) return style;
  return resolveCanonicalStyleName(style) ?? titleCaseFallback(style);
}

/**
 * Canonicalizes and deduplicates style names.
 * strict=true throws on unknown style; strict=false skips unknown styles.
 */
export function normalizeStyleNames(
  styles: string[],
  options: { strict?: boolean } = {}
): string[] {
  const strict = options.strict ?? true;
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const style of styles) {
    const canonical = resolveCanonicalStyleName(style);
    if (!canonical) {
      if (strict) {
        throw new Error(`Invalid dance style: "${style}"`);
      }
      continue;
    }

    if (seen.has(canonical)) {
      continue;
    }

    seen.add(canonical);
    normalized.push(canonical);
  }

  return normalized;
}
