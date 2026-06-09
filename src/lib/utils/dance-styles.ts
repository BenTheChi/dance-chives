// The style whitelist is GENERATED from the dance_styles table — the single
// style registry shared with the auto-manager. To add or change styles, use
// the auto-manager's Filament (Rules > Dance Styles), then run
// `npm run styles:generate`. Never hand-edit the generated file.
export { DANCE_STYLES, type DanceStyle } from "./dance-styles.generated";

import { DANCE_STYLES, type DanceStyle } from "./dance-styles.generated";

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
