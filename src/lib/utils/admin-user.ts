import { prisma } from "@/lib/primsa";
import { getUserByUsername, signupUser } from "@/db/queries/user";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_USERNAME } from "./admin-user-constants";
import driver from "@/db/driver";
// Re-export client-safe constants and functions
export {
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_USERNAME,
  isReservedUsername,
  canUseReservedUsername,
} from "./admin-user-constants";

/**
 * Get or create the super admin user
 * This user is guaranteed to exist and is used for orphaned events
 * @returns The super admin user ID
 */
export async function getOrCreateSuperAdminUser(): Promise<string> {
  // First, try to find the user by email in PostgreSQL
  let adminUser = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
  });

  if (adminUser) {
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
      // Create or update Neo4j user profile
      await signupUser(adminUser.id, {
        displayName: adminUser.name || "Admin",
        username: SUPER_ADMIN_USERNAME,
        date: "01/01/2000", // Default date
        city: {
          id: "",
          name: "Unknown",
          region: "",
          countryCode: "",
        },
        styles: [],
      });
    }

    return adminUser.id;
  }

  // User doesn't exist, create it
  // First create in PostgreSQL
  adminUser = await prisma.user.create({
    data: {
      email: SUPER_ADMIN_EMAIL,
      name: "Admin",
      auth: AUTH_LEVELS.SUPER_ADMIN,
      accountVerified: new Date(),
      emailVerified: new Date(),
    },
  });

  // Then create in Neo4j
  await signupUser(adminUser.id, {
    displayName: "Admin",
    username: SUPER_ADMIN_USERNAME,
    date: "01/01/2000",
    city: {
      id: "",
      name: "Unknown",
      region: "",
      countryCode: "",
    },
    styles: [],
  });

  console.log(
    `✅ Created super admin user: ${SUPER_ADMIN_EMAIL} (username: ${SUPER_ADMIN_USERNAME})`
  );

  return adminUser.id;
}


