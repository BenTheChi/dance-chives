import { prisma } from "@/lib/primsa";
import { getUserByUsername, signupUser } from "@/db/queries/user";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_USERNAME } from "./admin-user-constants";
import { resolveAndUpsertCityForWrite } from "@/db/queries/city";
// Re-export client-safe constants and functions
export {
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_USERNAME,
  isReservedUsername,
  canUseReservedUsername,
} from "./admin-user-constants";

/**
 * Get the super admin user if it exists
 * This user is used for orphaned events, but is NOT created automatically.
 * The user must sign up with benchi@dancechives.com to get super admin privileges.
 * @returns The super admin user ID, or null if the user doesn't exist
 */
export async function getSuperAdminUser(): Promise<string | null> {
  // Try to find the user by email in PostgreSQL
  const adminUser = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
  });

  if (!adminUser) {
    // User doesn't exist - they need to sign up first
    return null;
  }

  // Ensure the user has super admin privileges
  if (adminUser.auth !== AUTH_LEVELS.SUPER_ADMIN) {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { auth: AUTH_LEVELS.SUPER_ADMIN },
    });
  }

  // Check if user exists in Neo4j with the correct username
  const neo4jUser = await getUserByUsername(SUPER_ADMIN_USERNAME);
  if (!neo4jUser || neo4jUser.id !== adminUser.id) {
    // Create or update Neo4j user profile if PostgreSQL user exists but Neo4j doesn't
    const adminCity = await resolveAndUpsertCityForWrite({
      id: "ChIJE9on3F3HwoAR9AhGJW_fL-I",
      name: "Los Angeles",
      region: "CA",
      countryCode: "US",
      timezone: "America/Los_Angeles",
      latitude: 34.0522342,
      longitude: -118.2436849,
    });

    await signupUser(adminUser.id, {
      displayName: adminUser.name || "Admin",
      username: SUPER_ADMIN_USERNAME,
      date: "01/01/2000", // Default date
      city: adminCity,
      styles: [],
    });
  }

  return adminUser.id;
}

/**
 * @deprecated Use getSuperAdminUser() instead. This function is kept for backward compatibility
 * but will not create the user if it doesn't exist.
 */
export async function getOrCreateSuperAdminUser(): Promise<string | null> {
  return getSuperAdminUser();
}
