import neo4j from "neo4j-driver";

const uri =
  process.env.NEO4J_URI ||
  (() => {
    throw new Error("NEO4J_URI is not defined");
  })();

// Determine if we're connecting to a local instance or Docker (no encryption needed)
// Docker uses service names like "neo4j" instead of "localhost"
const isLocal =
  uri.includes("localhost") ||
  uri.includes("127.0.0.1") ||
  uri.includes("neo4j:7687") || // Docker service name
  process.env.NODE_ENV === "development" ||
  process.env.NEO4J_PASSWORD === "dev_password"; // Docker dev password

const driver = neo4j.driver(
  uri,
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME ||
      process.env.NEO4J_USER ||
      (() => {
        throw new Error("NEO4J_USERNAME or NEO4J_USER is not defined");
      })(),
    process.env.NEO4J_PASSWORD ||
      (() => {
        throw new Error("NEO4J_PASSWORD is not defined");
      })()
  ),
  {
    // Disable encryption for local Docker instances
    // Enable encryption for cloud instances (Neo4j Aura)
    encrypted: isLocal ? false : true,
    // Add connection timeout and retry settings for Docker
    connectionTimeout: 30000, // 30 seconds
    maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 60000, // 60 seconds
  }
);

export default driver;
