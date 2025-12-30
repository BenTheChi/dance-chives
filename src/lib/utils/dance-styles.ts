export const DANCE_STYLES = [
  "Animation",
  "Breaking",
  "Dancehall",
  "Hip Hop",
  "House",
  "Hustle",
  "Salsa",
  "Swing",
  "Jookin",
  "Krump",
  "Locking",
  "Litefeet",
  "Open Styles",
  "Popping",
  "Shuffling",
  "Turfing",
  "Tutting",
  "Voguing",
  "Waacking",
  "Waving",
] as const;

export type DanceStyle = (typeof DANCE_STYLES)[number];

/**
 * Validates if a string is a valid dance style
 */
export function isValidDanceStyle(style: string): style is DanceStyle {
  return DANCE_STYLES.includes(style as DanceStyle);
}

/**
 * Validates an array of strings to ensure all are valid dance styles
 */
export function validateDanceStyles(styles: string[]): DanceStyle[] {
  return styles.filter(isValidDanceStyle);
}
