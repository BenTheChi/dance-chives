// Environment configuration utility
// Helps determine which database configuration to use

/**
 * Get the actual environment, distinguishing between staging and production.
 * Checks VERCEL_ENV first (if on Vercel), then NODE_ENV, then APP_ENV.
 * VERCEL_ENV can be: "development", "preview" (staging), or "production"
 */
export const getActualEnvironment = (): "development" | "staging" | "production" => {
  const nodeEnv = String(process.env.NODE_ENV || "");
  
  // Check VERCEL_ENV first (Vercel sets this automatically)
  // "preview" means staging/preview deployments
  if (process.env.VERCEL_ENV === "preview" || nodeEnv === "staging") {
    return "staging";
  }
  
  // Check custom APP_ENV variable (for non-Vercel deployments)
  if (process.env.APP_ENV === "staging") {
    return "staging";
  }
  
  // Check if explicitly set to production
  if (nodeEnv === "production" || process.env.VERCEL_ENV === "production") {
    return "production";
  }
  
  // Default to development
  return "development";
};

export const actualEnv = getActualEnvironment();
export const isDevelopment = actualEnv === "development";
export const isStaging = actualEnv === "staging";
export const isProduction = actualEnv === "production";

// Helper function to get the appropriate environment variable
// Uses DEV_ prefixed variables in development, standard variables otherwise
const getEnvVar = (devVar: string, standardVar: string): string | undefined => {
  if (isDevelopment) {
    return process.env[devVar] || process.env[standardVar];
  }
  return process.env[standardVar];
};

// Database configuration detection
export const isLocalDatabase = () => {
  const dbUrl = getEnvVar("DEV_DATABASE_URL", "DATABASE_URL");
  const neo4jUri = getEnvVar("DEV_NEO4J_URI", "NEO4J_URI");

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
  const dbUrl = getEnvVar("DEV_DATABASE_URL", "DATABASE_URL") || "";
  const neo4jUri = getEnvVar("DEV_NEO4J_URI", "NEO4J_URI") || "";
  const neo4jUsername =
    getEnvVar("DEV_NEO4J_USERNAME", "NEO4J_USERNAME") || "neo4j";
  const neo4jPassword = getEnvVar("DEV_NEO4J_PASSWORD", "NEO4J_PASSWORD") || "";

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
    actualEnv,
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
