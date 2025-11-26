import neo4j from "neo4j-driver";

const appEnv = process.env.APP_ENV || process.env.NODE_ENV || "development";

// All environments use the same variable names
let uri =
  process.env.NEO4J_URI ||
  (() => {
    throw new Error("NEO4J_URI is not defined");
  })();

// Remove any query parameters from URI to avoid conflicts with driver config
// Neo4j driver v5+ doesn't allow encryption/trust in both URL and config
const uriWithoutParams = uri.split("?")[0];
uri = uriWithoutParams;

// Check if the URI protocol already specifies encryption (+s suffix means secure/encrypted)
// Protocols: neo4j://, bolt:// (unencrypted) vs neo4j+s://, bolt+s:// (encrypted)
const uriHasEncryptionInProtocol =
  uri.includes("neo4j+s://") || uri.includes("bolt+s://");

// Determine if we're connecting to a local instance or Docker (no encryption needed)
// Docker uses service names like "neo4j" instead of "localhost"
const isLocal =
  uri.includes("localhost") ||
  uri.includes("127.0.0.1") ||
  uri.includes("neo4j:7687") || // Docker service name
  appEnv === "development" ||
  process.env.NEO4J_PASSWORD === "dev_password"; // Docker dev password

// For cloud instances (Neo4j Aura), convert to secure protocol if not already
// This ensures encryption is specified in the URI, not in config (avoiding conflicts)
if (!isLocal && !uriHasEncryptionInProtocol) {
  // Convert bolt:// to neo4j+s:// for cloud instances (Neo4j Aura requires encryption)
  if (uri.startsWith("bolt://")) {
    uri = uri.replace("bolt://", "neo4j+s://");
  } else if (uri.startsWith("neo4j://")) {
    uri = uri.replace("neo4j://", "neo4j+s://");
  }
}

// Log which Neo4j URI is being used
try {
  const url = new URL(uri.replace(/^(neo4j|bolt)(\+s)?:\/\//, "http://"));
  console.log(
    `📊 [Neo4j] Using ${appEnv} database: ${url.hostname}:${url.port || "7687"}`
  );
} catch (error: unknown) {
  console.error(
    `📊 [Neo4j] Using ${appEnv} database: ${uri.substring(0, 50)}...`,
    error
  );
}

const username =
  process.env.NEO4J_USERNAME ||
  process.env.NEO4J_USER ||
  (() => {
    throw new Error("NEO4J_USERNAME or NEO4J_USER is not defined");
  })();

const password =
  process.env.NEO4J_PASSWORD ||
  (() => {
    throw new Error("NEO4J_PASSWORD is not defined");
  })();

// Build driver config
// Note: Neo4j driver v5+ doesn't allow encryption/trust in both URL and config
// We've already cleaned the URI, so we can safely set it in config
const driverConfig: {
  encrypted?: boolean;
  trust?:
    | "TRUST_ALL_CERTIFICATES"
    | "TRUST_SYSTEM_CA_SIGNED_CERTIFICATES"
    | "TRUST_CUSTOM_CA_SIGNED_CERTIFICATES";
  connectionTimeout?: number;
  maxConnectionLifetime?: number;
  maxConnectionPoolSize?: number;
  connectionAcquisitionTimeout?: number;
} = {
  // Add connection timeout and retry settings
  connectionTimeout: 30000, // 30 seconds
  maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
  maxConnectionPoolSize: 50,
  connectionAcquisitionTimeout: 60000, // 60 seconds
};

// Set encryption/trust based on environment
// IMPORTANT: Don't set encryption/trust in config if it's already specified in the URI protocol
// Neo4j driver v5+ doesn't allow encryption/trust in both URL and config
// After the URI conversion above, cloud instances will use neo4j+s:// which specifies encryption in URI
const finalUriHasEncryption =
  uri.includes("neo4j+s://") || uri.includes("bolt+s://");

if (finalUriHasEncryption) {
  // URI already specifies encryption via +s protocol, don't set in config
  // This handles neo4j+s:// and bolt+s:// protocols
  // No need to set encrypted or trust in config
} else if (isLocal) {
  // Local instances: explicitly disable encryption
  driverConfig.encrypted = false;
} else {
  // Fallback: if somehow we still have a cloud instance without +s protocol
  // (shouldn't happen after the conversion above, but just in case)
  driverConfig.encrypted = true;
  driverConfig.trust = "TRUST_ALL_CERTIFICATES";
}

const driver = neo4j.driver(
  uri,
  neo4j.auth.basic(username, password),
  driverConfig
);

export default driver;
