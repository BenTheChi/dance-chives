/**
 * Converts a style name to lowercase for storage in Neo4j
 */
export function normalizeStyleName(style: string): string {
  return style.toLowerCase().trim();
}

/**
 * Converts a style name to upper case for display
 */
export function formatStyleNameForDisplay(style: string): string {
  if (!style) return style;
  return style.toUpperCase().trim();
}

/**
 * Formats an array of style names to uppercase
 */
export function normalizeStyleNames(styles: string[]): string[] {
  return styles.map(formatStyleNameForDisplay);
}
