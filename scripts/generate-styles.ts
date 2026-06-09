/**
 * Generate src/lib/utils/dance-styles.generated.ts from the dance_styles
 * table — THE style registry (consolidation decided 2026-06-09).
 *
 * Add/change styles via the auto-manager's Filament (Rules > Dance Styles),
 * then run: npm run styles:generate
 *
 * --check: regenerate in memory and diff against the committed file; exits
 * nonzero on drift. Skips (exit 0) when DATABASE_URL is absent so non-DB
 * builds don't break.
 */
import { Pool } from "pg";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const OUT_PATH = path.join(
  __dirname,
  "../src/lib/utils/dance-styles.generated.ts"
);
const CHECK = process.argv.includes("--check");

function toLookupKey(style: string): string {
  return style
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.warn("[generate-styles] DATABASE_URL not set — skipping.");
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { rows } = await pool.query<{ name: string; aliases: string[] | null }>(
    "SELECT name, aliases FROM dance_styles ORDER BY name"
  );
  await pool.end();

  const names = rows.map((r) => r.name);
  const canonicalKeys = new Map(names.map((n) => [toLookupKey(n), n]));

  // alias -> canonical name; drop aliases that just restate a canonical key,
  // fail on an alias claimed by two styles or shadowing another style's name.
  const aliasPairs: Array<[string, string]> = [];
  const seenAliasKeys = new Map<string, string>();
  for (const row of rows) {
    for (const alias of row.aliases ?? []) {
      const key = toLookupKey(alias);
      if (!key) continue;
      const canonicalOwner = canonicalKeys.get(key);
      if (canonicalOwner === row.name) continue; // restates itself
      if (canonicalOwner) {
        throw new Error(
          `Alias "${alias}" of "${row.name}" shadows canonical style "${canonicalOwner}"`
        );
      }
      const prior = seenAliasKeys.get(key);
      if (prior && prior !== row.name) {
        throw new Error(
          `Alias "${alias}" claimed by both "${prior}" and "${row.name}"`
        );
      }
      if (!prior) {
        seenAliasKeys.set(key, row.name);
        aliasPairs.push([key, row.name]);
      }
    }
  }

  const body = `// AUTO-GENERATED from the dance_styles table (the style registry).
// Do not edit by hand. To add or change styles: auto-manager Filament
// (Rules > Dance Styles), then run \`npm run styles:generate\`.

export const DANCE_STYLES = [
${names.map((n) => `  ${JSON.stringify(n)},`).join("\n")}
] as const;

export type DanceStyle = (typeof DANCE_STYLES)[number];

/** Lookup-key (lowercased, dash/underscore-folded) -> canonical name. */
export const STYLE_ALIASES: ReadonlyArray<readonly [string, DanceStyle]> = [
${aliasPairs.map(([a, n]) => `  [${JSON.stringify(a)}, ${JSON.stringify(n)}],`).join("\n")}
];
`;

  if (CHECK) {
    let current = "";
    try {
      current = readFileSync(OUT_PATH, "utf8");
    } catch {
      // missing file counts as drift
    }
    if (current !== body) {
      console.error(
        "[generate-styles] DRIFT: dance-styles.generated.ts does not match the dance_styles table. Run `npm run styles:generate`."
      );
      process.exit(1);
    }
    console.log("[generate-styles] generated file matches the table.");
    return;
  }

  writeFileSync(OUT_PATH, body);
  console.log(
    `[generate-styles] wrote ${names.length} styles, ${aliasPairs.length} aliases.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
