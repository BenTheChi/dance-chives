// Environment configuration utility
// Helps determine which database configuration to use

/**
 * Get the actual environment, distinguishing between staging and production.
 * Checks APP_ENV first (set in .env files), then VERCEL_ENV, then NODE_ENV.
 * APP_ENV overrides NODE_ENV which Next.js forces to "production" for builds.
 * VERCEL_ENV can be: "development", "preview" (staging), or "production"
 */
export const getActualEnvironment = (): "development" | "staging" | "production" => {
  // Check APP_ENV first (set in .env files)
  // This overrides NODE_ENV which Next.js forces to "production" for builds
  if (process.env.APP_ENV) {
    return process.env.APP_ENV as "development" | "staging" | "production";
  }
  
  // Check VERCEL_ENV (Vercel sets this automatically)
  // "preview" means staging/preview deployments
  if (process.env.VERCEL_ENV === "preview") {
    return "staging";
  }
  
  if (process.env.VERCEL_ENV === "production") {
    return "production";
  }
  
  // Fall back to NODE_ENV
  const nodeEnv = String(process.env.NODE_ENV || "");
  if (nodeEnv === "production") {
    return "production";
  }
  
  // Default to development
  return "development";
};

export const actualEnv = getActualEnvironment();
export const isDevelopment = actualEnv === "development";
export const isStaging = actualEnv === "staging";
export const isProduction = actualEnv === "production";

// Database configuration detection
export const isLocalDatabase = () => {
  const dbUrl = process.env.DATABASE_URL;
  const neo4jUri = process.env.NEO4J_URI;

  return (
    dbUrl?.includes("localhost") ||
    dbUrl?.includes("127.0.0.1") ||
    neo4jUri?.includes("localhost") ||
    neo4jUri?.includes("127.0.0.1")
  );
};

export const isCloudDatabase = () => !isLocalDatabase();

// Database URLs with fallbacks
export const getDatabaseConfig = () => {
  const dbUrl = process.env.DATABASE_URL || "";
  const neo4jUri = process.env.NEO4J_URI || "";
  const neo4jUsername = process.env.NEO4J_USERNAME || "neo4j";
  const neo4jPassword = process.env.NEO4J_PASSWORD || "";

  return {
    postgres: {
      url: dbUrl,
      isLocal:
        dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1") || false,
    },
    neo4j: {
      uri: neo4jUri,
      username: neo4jUsername,
      password: neo4jPassword,
      isLocal:
        neo4jUri.includes("localhost") ||
        neo4jUri.includes("127.0.0.1") ||
        false,
    },
  };
};

// Environment info for debugging
export const getEnvironmentInfo = () => {
  const config = getDatabaseConfig();

  return {
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    appEnv: process.env.APP_ENV,
    actualEnv: actualEnv,
    isDevelopment,
    isStaging,
    isProduction,
    isLocalDatabase: isLocalDatabase(),
    isCloudDatabase: isCloudDatabase(),
    databases: {
      postgres: {
        configured: !!config.postgres.url,
        isLocal: config.postgres.isLocal,
        host: config.postgres.url
          ? new URL(config.postgres.url).hostname
          : "not configured",
      },
      neo4j: {
        configured: !!config.neo4j.uri,
        isLocal: config.neo4j.isLocal,
        host: config.neo4j.uri
          ? new URL(config.neo4j.uri).hostname
          : "not configured",
      },
    },
  };
};
