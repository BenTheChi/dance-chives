# Event Wipe Plan — keep accounts, sync Postgres + Neo4j + R2

Removes all events, sections, videos, brackets, posters (DB + R2 files), tags, reacts,
and event-tied requests/submissions from **both** Neo4j and Postgres **and Cloudflare R2**,
across **dev and prod**. Executed via the audited script `scripts/wipe-events.ts`.

Keeps: user accounts, user profiles (UserCard + Neo4j User STYLE/LOCATED_IN), City nodes,
Style nodes, `cities` + `dance_styles` tables, account-level requests, and all `users/*`
R2 avatars.

## The script: `scripts/wipe-events.ts`

- **Dry-run by default.** `--confirm` required to mutate. Prod also needs
  `--i-understand-production`.
- Writes a full **audit log** to `scripts/wipe-logs/wipe-<env>-<timestamp>.log`
  (pre-counts, every delete with row counts, post-counts, verification result).
- Order: **R2 → Postgres (single transaction) → Neo4j (batched DETACH DELETE)**.
- Idempotent / re-runnable.
- Self-verifies: deleted sets == 0, kept sets (accounts/profiles/cities/styles) unchanged.

### npm aliases
```
npm run wipe:events:dev          # dev dry-run
npm run wipe:events:dev:run      # dev execute
npm run wipe:events:prod         # prod dry-run
npm run wipe:events:prod:run     # prod execute (includes --i-understand-production)
```

## What it deletes

**Neo4j** (DETACH DELETE, batched 1000/iter): `:Video`, `:Bracket`, `:Section`
(incl. CompetitionSection — carries `:Section`), `:Image` (== `:Gallery`, dual-labeled),
`:Event` (all subtypes carry `:Event`). Leaves User/City/Style + their interrelations.

**Postgres** (one transaction): `reacts`, `event_cards` (cascades `event_dates` +
`section_cards`), `Event`, `TaggingRequest`, `OwnershipRequest`, `TeamMemberRequest`,
`submissions` (cascades `reviewing`), `playlist_submissions` (cascades `playlist_reviewing`),
plus `RequestApproval` / `Notification` rows tied to TAGGING/TEAM_MEMBER/OWNERSHIP requests.

**R2**: every object under the **`events/`** prefix in the env's bucket
(`dance-chives-images-production` for prod/staging, `-development` for dev). This covers
event posters, section posters (`events/{id}/sections/...`), gallery images, **and orphaned
`events/temp-*` uploads** that DB references would miss. `users/*` avatars untouched —
verified that all event imagery lives under `events/` and avatars under `users/`.

## What it keeps
Accounts (`User`/`Account`/`Session`/`Authenticator`/tokens), profiles (`UserCard` + Neo4j
profile links), `cities`, `dance_styles`, City/Style nodes, account-level requests
(`AuthLevelChangeRequest`, `AccountClaimRequest`), `jobs`, all `users/*` R2 objects.

## Execution checklist (per environment)

1. **Backup (MANDATORY).** Neo4j Aura: manual snapshot from console.
   Postgres (Neon): create a branch or `pg_dump`. R2: prefix delete is the riskiest
   irreversible step — confirm Aura+Neon backups before running with `--confirm`.
2. **Dev dry-run:** `npm run wipe:events:dev` — review the log + pre-counts.
3. **Dev execute:** `npm run wipe:events:dev:run` — confirm verification passes.
4. **App smoke (dev):** homepage + a user profile load with no 500s.
5. **Prod dry-run:** `npm run wipe:events:prod` — review.
6. **Prod backup** (snapshot + branch) confirmed.
7. **Prod execute:** `npm run wipe:events:prod:run`.
8. **App smoke (prod).**

## Rollback
Restore Neo4j snapshot + Postgres branch/dump. R2 objects are not recoverable after
prefix delete unless the bucket has versioning — **verify R2 versioning or accept R2 loss
before executing.** DB deletes are idempotent so partial reruns are safe.

## Pre-flight data facts (prod, at planning time)
- Neo4j: 118 Event, 157 Section, 1418 Video, 314 Bracket, 108 Image/Gallery; keep 82 User, 32 City, 22 Style.
- Postgres: event_cards 118, event_dates 403, section_cards 150, Event 118, reacts 64,
  submissions 64, playlist_submissions 4, reviewing 41, playlist_reviewing 4,
  TaggingRequest 4, RequestApproval 13, Notification 56.
- R2 layout: `events/{eventId}/posters|gallery`, `events/{eventId}/sections/{sectionId}/posters`,
  `events/temp-*` (orphans), `users/{username}/profile-pictures` (KEEP).

## Auto-manager interplay (added 2026-06-09)

The wipe also deletes `:IngestRun` audit nodes (auto-manager publish
provenance). It does NOT touch the auto-manager's Postgres audit tables
(`dancechives_ingest_runs` / `_rows`) — after a wipe, runs there still read
`committed` for content that no longer exists. Treat a full wipe as a known
reset on the manager side too (a future `dancechives:mark-runs-wiped` command
can reconcile statuses if it ever matters).
