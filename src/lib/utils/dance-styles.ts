// Fallback list used at build time, in tests, and if the DB is unreachable.
// Source of truth is the dance_styles Postgres table. Do not add styles here —
// run the sync script in dance-chives-manager instead.
export const DANCE_STYLES = [
  "Animation",
  "Breaking",
  "Dancehall",
  "Hip Hop",
  "House",
  "Chicago Footwork",
  "Hustle",
  "Jazz",
  "Jookin",
  "Krump",
  "Locking",
  "Litefeet",
  "Open Styles",
  "Popping",
  "Salsa",
  "Shuffling",
  "Swing",
  "Turfing",
  "Tutting",
  "Voguing",
  "Waacking",
  "Waving",
] as const;

export type DanceStyle = string;

export function isValidDanceStyle(
  style: string,
  against: string[] = [...DANCE_STYLES]
): style is DanceStyle {
  return against.includes(style);
}

export function validateDanceStyles(
  styles: string[],
  against: string[] = [...DANCE_STYLES]
): DanceStyle[] {
  return styles.filter((s) => against.includes(s));
}
