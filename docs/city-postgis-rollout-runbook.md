# City Maintenance Runbook

Legacy rollout phases were removed. Keep only maintenance commands used to audit and correct live data.

## Runtime Controls

- `CITY_READ_SOURCE`: `neo4j` (default) or `postgres`
- `CITY_SHADOW_COMPARE`: `true|false` (default `false`)
- `CITY_AUTOFIX_LOW_RISK`: `true|false` (default `false`)

## Maintenance Commands

- City duplicate audit (dry-run):
  - `npm run city:dedupe:prod`
- City duplicate correction:
  - `npm run city:dedupe:prod -- --apply`
- Style card backfill audit (dry-run):
  - `npm run style:backfill:prod`
- Style card backfill correction:
  - `npm run style:backfill:prod -- --apply`
