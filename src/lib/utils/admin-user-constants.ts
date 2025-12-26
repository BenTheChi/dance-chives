/**
 * Super Admin User Configuration (Client-Safe)
 * These constants can be safely imported in client components
 */
export const SUPER_ADMIN_EMAIL = "benchi@dancechives.com";
export const SUPER_ADMIN_USERNAME = "admin";

/**
 * Check if a username is reserved (Client-Safe)
 */
export function isReservedUsername(username: string): boolean {
  return username.toLowerCase() === SUPER_ADMIN_USERNAME.toLowerCase();
}

/**
 * Check if an email is allowed to use the reserved username (Client-Safe)
 */
export function canUseReservedUsername(
  username: string,
  email: string
): boolean {
  if (!isReservedUsername(username)) {
    return true; // Not a reserved username, so it's allowed
  }
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

