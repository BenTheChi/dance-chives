import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  __prismaDatabaseUrl?: string | undefined;
};

// Helper function to get the appropriate DATABASE_URL
// Uses DEV_DATABASE_URL in development, DATABASE_URL otherwise
const getDatabaseUrl = (): string | undefined => {
  const nodeEnv = process.env.NODE_ENV || "development";
  let databaseUrl: string | undefined;

  if (nodeEnv === "development") {
    databaseUrl = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL;
  } else {
    databaseUrl = process.env.DATABASE_URL;
  }

  // Log which database URL is being used (only show hostname for security)
  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      console.log(
        `📊 [Prisma] Using ${nodeEnv} database: ${url.hostname}:${
          url.port || "default"
        }`
      );
    } catch {
      console.log(
        `📊 [Prisma] Using ${nodeEnv} database: (URL parsing failed)`
      );
    }
  } else {
    console.error(
      `❌ [Prisma] No database URL found for ${nodeEnv} environment!`
    );
  }

  return databaseUrl;
};

const databaseUrl = getDatabaseUrl();

// Store the database URL we used to create the client
const getCachedDatabaseUrl = (): string | undefined => {
  return globalForPrisma.__prismaDatabaseUrl;
};

const setCachedDatabaseUrl = (url: string | undefined): void => {
  globalForPrisma.__prismaDatabaseUrl = url;
};

// Check if we need to recreate the client (different URL or doesn't exist)
const cachedUrl = getCachedDatabaseUrl();
if (!globalForPrisma.prisma || cachedUrl !== databaseUrl) {
  // Disconnect existing client if URL changed
  if (globalForPrisma.prisma && cachedUrl !== databaseUrl) {
    console.log(
      `🔄 [Prisma] Database URL changed from ${cachedUrl?.substring(
        0,
        30
      )}... to ${databaseUrl?.substring(0, 30)}..., reinitializing client`
    );
    globalForPrisma.prisma.$disconnect().catch(() => {});
  }

  // Create new client with the correct database URL
  globalForPrisma.prisma = new PrismaClient(
    databaseUrl
      ? {
          datasources: {
            db: {
              url: databaseUrl,
            },
          },
        }
      : undefined
  );

  setCachedDatabaseUrl(databaseUrl);
}

export const prisma = globalForPrisma.prisma;
