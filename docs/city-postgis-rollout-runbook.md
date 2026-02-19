# City PostGIS Rollout Runbook

## Runtime Controls

- `CITY_READ_SOURCE`: `neo4j` (default) or `postgres`
- `CITY_SHADOW_COMPARE`: `true|false` (default `false`)
- `CITY_AUTOFIX_LOW_RISK`: `true|false` (default `false`)

## Promotion Gates

1. Keep `CITY_READ_SOURCE=neo4j` through production backfill and write-gate rollout.
2. Enable `CITY_SHADOW_COMPARE=true` in dev first, then production shadow window.
3. Allow cutover only after strict delta gate:
   - 100% city-id parity
   - zero unresolved cities
   - zero high-risk mismatches
4. Flip to `CITY_READ_SOURCE=postgres` only after gate pass.

## Rollback

- Immediate rollback path: set `CITY_READ_SOURCE=neo4j`.
- Keep write gate enabled (resolved city required).
- Keep audit scripts available for post-rollback investigation.

## MCP Command Anchors

- Phase2 prod fill + audits:
  - `npm run city:phase2:backfill:prod`
  - `npm run city:phase2:audit:prod`
- Phase5 dev normalize:
  - `npm run city:phase5:normalize:dev`
- Phase8 strict prod delta gate:
  - `npm run city:phase8:delta-gate:prod`

## Stabilization (Phase9)

- Keep `CITY_READ_SOURCE=neo4j` rollback path available during soak window.
- Keep `CITY_SHADOW_COMPARE=true` in production for parity monitoring through soak.
- No periodic city refresh job by design; only explicit write-path upserts are allowed.
- Regression checks to run during soak:
  - `npm run city:phase2:audit:prod`
  - `npm run city:phase8:delta-gate:prod`
