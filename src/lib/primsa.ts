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
    // Only log error if not in build context (where env vars may not be available)
    const isBuildContext =
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.NEXT_PHASE === "phase-production-compile";
    if (!isBuildContext) {
      console.error(
        `❌ [Prisma] No database URL found for ${nodeEnv} environment!`
      );
    }
  }

  return databaseUrl;
};

// Store the database URL we used to create the client
const getCachedDatabaseUrl = (): string | undefined => {
  return globalForPrisma.__prismaDatabaseUrl;
};

const setCachedDatabaseUrl = (url: string | undefined): void => {
  globalForPrisma.__prismaDatabaseUrl = url;
};

function getPrismaClient(): PrismaClient {
  const databaseUrl = getDatabaseUrl();

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
    // If no database URL is available (e.g., during build), create client without it
    // It will fail at runtime when actually used, which is expected
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

  return globalForPrisma.prisma;
}

// Create a proxy that lazily initializes the Prisma client when first accessed
// This prevents build-time errors when DATABASE_URL is not available
const prismaProxy = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export const prisma = prismaProxy;
