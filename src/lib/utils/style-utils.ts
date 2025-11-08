/**
 * Converts a style name to lowercase for storage in Neo4j
 */
export function normalizeStyleName(style: string): string {
  return style.toLowerCase().trim();
}

/**
 * Capitalizes the first letter of a style name for display
 */
export function formatStyleNameForDisplay(style: string): string {
  if (!style) return style;
  const normalized = style.toLowerCase().trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Normalizes an array of style names to lowercase
 */
export function normalizeStyleNames(styles: string[]): string[] {
  return styles.map(normalizeStyleName);
}

