import neo4j from "neo4j-driver";

const uri =
  process.env.NEO4J_URI ||
  (() => {
    throw new Error("NEO4J_URI is not defined");
  })();

// Determine if we're connecting to a local instance
const isLocal = uri.includes("localhost") || uri.includes("127.0.0.1");

const driver = neo4j.driver(
  uri,
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME ||
      (() => {
        throw new Error("NEO4J_USERNAME is not defined");
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
  }
);

export default driver;
