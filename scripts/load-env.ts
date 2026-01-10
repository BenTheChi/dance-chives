#!/usr/bin/env tsx
/**
 * Environment loader utility
 * Loads the appropriate .env file based on NODE_ENV
 *
 * Usage:
 *   tsx scripts/load-env.ts
 *   NODE_ENV=staging tsx scripts/load-env.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Determine which environment file to load
// Checks APP_ENV first (which overrides NODE_ENV), then falls back to NODE_ENV
const getEnvFile = (): string => {
  // APP_ENV takes precedence over NODE_ENV
  const appEnv = process.env.APP_ENV;
  const nodeEnv = process.env.NODE_ENV || "development";

  // Use APP_ENV if set, otherwise use NODE_ENV
  const env = appEnv || nodeEnv;

  // Map environment to .env file
  const envFileMap: Record<string, string> = {
    development: ".env.local",
    staging: ".env.staging",
    production: ".env.production",
  };

  const envFile = envFileMap[env] || ".env.local";
  return resolve(process.cwd(), envFile);
};

// Load the appropriate .env file
const envFile = getEnvFile();
const appEnv = process.env.APP_ENV;
const nodeEnv = process.env.NODE_ENV || "development";
const env = appEnv || nodeEnv;

console.log(`[load-env] APP_ENV: ${appEnv || "not set"}`);
console.log(`[load-env] NODE_ENV: ${nodeEnv}`);
console.log(`[load-env] Using environment: ${env}`);
console.log(`[load-env] Loading file: ${envFile}`);

const result = config({ path: envFile });

if (result.error) {
  console.warn(`[load-env] Warning: Could not load ${envFile}`);
  console.warn(`[load-env] ${result.error.message}`);
  console.warn(
    `[load-env] Make sure the file exists or create it from the example.`
  );
} else {
  console.log(`[load-env] Successfully loaded ${envFile}`);
  // Optionally log which variables were loaded (without values for security)
  const loadedKeys = Object.keys(result.parsed || {});
  if (loadedKeys.length > 0) {
    console.log(`[load-env] Loaded ${loadedKeys.length} environment variables`);
  }
}

// Export the loaded config for use in other scripts
export { envFile, nodeEnv };
