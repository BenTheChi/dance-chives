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
] as const;

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
 */
export function toNeo4jRoleFormat(role: string): string {
  return role.toUpperCase();
}

/**
 * Convert role from Neo4j format to display format
 * Neo4j stores roles in uppercase, but we want to display them with proper capitalization
 * Special cases: DJ and MC stay as-is
 */
export function fromNeo4jRoleFormat(role: string): string {
  if (role === "DJ" || role === "MC") {
    return role;
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
