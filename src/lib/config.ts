// Environment configuration utility
// Helps determine which database configuration to use

export const isDevelopment = process.env.NODE_ENV === "development";
export const isProduction = process.env.NODE_ENV === "production";

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
  return {
    postgres: {
      url: process.env.DATABASE_URL || "",
      isLocal: process.env.DATABASE_URL?.includes("localhost") || false,
    },
    neo4j: {
      uri: process.env.NEO4J_URI || "",
      username: process.env.NEO4J_USERNAME || "neo4j",
      password: process.env.NEO4J_PASSWORD || "",
      isLocal: process.env.NEO4J_URI?.includes("localhost") || false,
    },
  };
};

// Environment info for debugging
export const getEnvironmentInfo = () => {
  const config = getDatabaseConfig();

  return {
    nodeEnv: process.env.NODE_ENV,
    isDevelopment,
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
