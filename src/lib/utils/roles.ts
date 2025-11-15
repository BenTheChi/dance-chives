/**
 * Available roles for events
 * These are the only roles that can be assigned to users in events
 */
export const AVAILABLE_ROLES = [
  "Organizer",
  "DJ",
  "Photographer",
  "Videographer",
  "Designer",
  "MC",
  "Team Member",
] as const;

/**
 * Video-only role
 * This role can only be assigned to users in videos, not events
 */
export const VIDEO_ROLE_DANCER = "Dancer";

/**
 * Video-only role for winners
 * This role can only be assigned to users in videos, not events
 */
export const VIDEO_ROLE_WINNER = "Winner";

/**
 * Section-only role for winners
 * This role can only be assigned to users in sections, not events
 */
export const SECTION_ROLE_WINNER = "Winner";

/**
 * Available roles for workshops
 * These are the only roles that can be assigned to users in workshops
 */
export const WORKSHOP_ROLES = ["ORGANIZER", "TEACHER", "TEAM_MEMBER"] as const;

/**
 * Type for a valid workshop role title
 */
export type WorkshopRoleTitle = (typeof WORKSHOP_ROLES)[number];

/**
 * Check if a role is valid for workshops
 */
export function isValidWorkshopRole(role: string): role is WorkshopRoleTitle {
  return WORKSHOP_ROLES.includes(role as WorkshopRoleTitle);
}

/**
 * Get all available workshop roles as an array
 */
export function getAvailableWorkshopRoles(): readonly string[] {
  return WORKSHOP_ROLES;
}

/**
 * Check if a role is valid for events (excludes video-only and section-only roles)
 */
export function isValidEventRole(role: string): role is RoleTitle {
  return isValidRole(role);
}

/**
 * Check if a role is valid for videos
 * Includes both event roles and video-only roles
 * Case-insensitive comparison for video-only roles
 */
export function isValidVideoRole(role: string): boolean {
  const normalizedRole = role?.trim();
  return (
    isValidRole(normalizedRole) ||
    normalizedRole?.toLowerCase() === VIDEO_ROLE_DANCER.toLowerCase() ||
    normalizedRole?.toLowerCase() === VIDEO_ROLE_WINNER.toLowerCase()
  );
}

/**
 * Check if a role is valid for sections
 * Currently only supports Winner role, but extensible for future roles
 */
export function isValidSectionRole(role: string): boolean {
  return role === SECTION_ROLE_WINNER;
}

/**
 * Check if a role is valid for videos or sections
 * Helper function for combined validation
 */
export function isValidVideoOrSectionRole(role: string): boolean {
  return isValidVideoRole(role) || isValidSectionRole(role);
}

/**
 * Type for a valid role title
 */
export type RoleTitle = (typeof AVAILABLE_ROLES)[number];

/**
 * Get all available roles as an array
 */
export function getAvailableRoles(): readonly string[] {
  return AVAILABLE_ROLES;
}

/**
 * Check if a role is valid
 */
export function isValidRole(role: string): role is RoleTitle {
  return AVAILABLE_ROLES.includes(role as RoleTitle);
}

/**
 * Convert role to Neo4j format (uppercase)
 * Used when saving roles to Neo4j
 * Special case: "Team Member" becomes "TEAM_MEMBER"
 */
export function toNeo4jRoleFormat(role: string): string {
  if (role === "Team Member") {
    return "TEAM_MEMBER";
  }
  return role.toUpperCase();
}

/**
 * Convert role from Neo4j format to display format
 * Neo4j stores roles in uppercase, but we want to display them with proper capitalization
 * Special cases: DJ and MC stay as-is, TEAM_MEMBER becomes "Team Member"
 */
export function fromNeo4jRoleFormat(
  role: string | null | undefined
): string | null {
  if (!role) {
    return null;
  }
  if (role === "DJ" || role === "MC") {
    return role;
  }
  if (role === "TEAM_MEMBER") {
    return "Team Member";
  }
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

/**
 * Get Neo4j role format for all available roles
 * Used in Neo4j queries to filter valid roles
 */
export function getNeo4jRoleFormats(): string[] {
  return AVAILABLE_ROLES.map(toNeo4jRoleFormat);
}
