/**
 * Utility functions for maintenance mode
 * Set NEXT_PUBLIC_MAINTENANCE_MODE=true in your .env file to enable
 * Using NEXT_PUBLIC_ prefix so it works on both server and client
 */

export function isMaintenanceMode(): boolean {
  return process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
}

