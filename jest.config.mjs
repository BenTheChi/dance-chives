import nextJest from "next/jest.js";

/**
 * `next/jest` supplies the SWC transform Next already uses to build the app, so
 * tests compile TypeScript and path aliases (`@/…`) with the same settings as
 * production rather than a second, drifting babel config.
 *
 * Only pure-logic modules are tested today (the thumbnail ladder, the URL
 * parsers), so the environment is node. A DOM-testing suite would need
 * `jest-environment-jsdom` added and this switched to "jsdom".
 */
const createJestConfig = nextJest({ dir: "./" });

export default createJestConfig({
  testEnvironment: "node",
  // Scoped to src/: scripts/ and prisma/ hold no tests, and .next/ contains
  // built copies of test files that would otherwise run twice.
  roots: ["<rootDir>/src"],
});
