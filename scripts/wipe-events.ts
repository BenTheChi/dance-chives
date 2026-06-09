#!/usr/bin/env tsx
/**
 * wipe-events.ts — Audited destructive wipe of all events and their data.
 *
 * Removes from the TARGET environment (selected by APP_ENV):
 *   - Neo4j:    every :Event / :Section / :Video / :Bracket / :Image / :Gallery node
 *   - Postgres: event_cards (+cascades event_dates, section_cards), "Event",
 *               reacts, all event-tied requests + submissions, and the
 *               notifications / approvals that referenced those requests.
 *   - R2:       every object under the "events/" prefix (event + section posters,
 *               gallery images, and orphaned temp-* uploads).
 *
 * KEEPS: user accounts, user profiles (UserCard + Neo4j User STYLE/LOCATED_IN),
 *        City + Style nodes, cities + dance_styles tables, account-level requests
 *        (AuthLevelChangeRequest, AccountClaimRequest), and all users/* R2 objects.
 *
 * SAFETY:
 *   - Dry-run by default. Pass --confirm to actually mutate.
 *   - Refuses to run against production unless --i-understand-production is also passed.
 *   - Writes a full audit log to scripts/wipe-logs/wipe-<env>-<timestamp>.log
 *   - Postgres deletes run in a single transaction (all-or-nothing).
 *   - Verifies post-counts and that kept data is untouched.
 *
 * USAGE:
 *   # Dev dry-run (no changes):
 *   APP_ENV=development dotenv -e .env.local -- tsx scripts/wipe-events.ts
 *   # Dev execute:
 *   APP_ENV=development dotenv -e .env.local -- tsx scripts/wipe-events.ts --confirm
 *   # Prod execute (extra guard):
 *   APP_ENV=production dotenv -e .env.production -- tsx scripts/wipe-events.ts --confirm --i-understand-production
 *
 * (npm aliases are added in package.json: wipe:events:dev / :prod and :dev:run / :prod:run)
 */

import { mkdirSync, createWriteStream, WriteStream } from "fs";
import { resolve } from "path";
import {
  S3Client,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import driver from "../src/db/driver";
import { prisma } from "../src/lib/primsa";

// ---------------------------------------------------------------------------
// CLI / env
// ---------------------------------------------------------------------------
const args = new Set(process.argv.slice(2));
const CONFIRM = args.has("--confirm");
const UNDERSTAND_PROD = args.has("--i-understand-production");
const SKIP_R2 = args.has("--skip-r2");

const APP_ENV = process.env.APP_ENV || process.env.NODE_ENV || "development";
const IS_PROD = APP_ENV === "production";

// ---------------------------------------------------------------------------
// Audit logging
// ---------------------------------------------------------------------------
let logStream: WriteStream;
function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  logStream.write(line + "\n");
}
function section(title: string) {
  log("");
  log("=".repeat(70));
  log(title);
  log("=".repeat(70));
}

// ---------------------------------------------------------------------------
// Count helpers (used for pre/post verification)
// ---------------------------------------------------------------------------
const NEO4J_DELETE_LABELS = [
  "Event",
  "Section",
  "Video",
  "Bracket",
  "Image",
  "Gallery",
  // Auto-manager audit nodes ([:INGESTED] provenance); wiping content must
  // also wipe its provenance or rollback bookkeeping goes stale.
  "IngestRun",
];
const NEO4J_KEEP_LABELS = ["User", "City", "Style"];

async function neo4jCounts(labels: string[]): Promise<Record<string, number>> {
  const session = driver.session();
  const out: Record<string, number> = {};
  try {
    for (const label of labels) {
      const r = await session.run(
        `MATCH (n:${label}) RETURN count(n) AS c`
      );
      out[label] = (r.records[0]?.get("c") as { toNumber(): number }).toNumber();
    }
  } finally {
    await session.close();
  }
  return out;
}

async function pgCounts(): Promise<Record<string, number>> {
  const [
    eventCards,
    eventDates,
    sectionCards,
    eventLink,
    reacts,
    submissions,
    playlistSubmissions,
    reviewing,
    playlistReviewing,
    taggingReq,
    ownershipReq,
    teamReq,
    // kept tables (must NOT change)
    users,
    accounts,
    userCards,
    cities,
  ] = await prisma.$transaction([
    prisma.eventCard.count(),
    prisma.eventDate.count(),
    prisma.sectionCard.count(),
    prisma.event.count(),
    prisma.react.count(),
    prisma.submission.count(),
    prisma.playlistSubmission.count(),
    prisma.reviewing.count(),
    prisma.playlistReviewing.count(),
    prisma.taggingRequest.count(),
    prisma.ownershipRequest.count(),
    prisma.teamMemberRequest.count(),
    prisma.user.count(),
    prisma.account.count(),
    prisma.userCard.count(),
    prisma.city.count(),
  ]);
  // dance_styles has no Prisma model (the client only had one from a stale
  // generate); count it raw so regenerating the client can't break the wipe.
  const danceStylesRows = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`SELECT count(*)::bigint AS count FROM dance_styles`;
  const danceStyles = Number(danceStylesRows[0]?.count ?? 0);
  return {
    eventCards,
    eventDates,
    sectionCards,
    eventLink,
    reacts,
    submissions,
    playlistSubmissions,
    reviewing,
    playlistReviewing,
    taggingReq,
    ownershipReq,
    teamReq,
    users,
    accounts,
    userCards,
    cities,
    danceStyles,
  };
}

// ---------------------------------------------------------------------------
// R2
// ---------------------------------------------------------------------------
function r2Client(): S3Client {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials not configured (CLOUDFLARE_R2_*).");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function r2BucketName(): string {
  // Mirror src/lib/R2.ts getBucketName()
  return IS_PROD || APP_ENV === "staging"
    ? "dance-chives-images-production"
    : "dance-chives-images-development";
}

async function wipeR2EventsPrefix(execute: boolean) {
  section("R2: delete objects under prefix events/");
  const client = r2Client();
  const Bucket = r2BucketName();
  log(`Bucket: ${Bucket}  Prefix: events/`);

  let token: string | undefined = undefined;
  let totalListed = 0;
  let totalDeleted = 0;
  do {
    const listed: ListObjectsV2CommandOutput = await client.send(
      new ListObjectsV2Command({
        Bucket,
        Prefix: "events/",
        ContinuationToken: token,
      })
    );
    const keys = (listed.Contents ?? []).map((o) => ({ Key: o.Key! }));
    totalListed += keys.length;
    token = listed.IsTruncated ? listed.NextContinuationToken : undefined;

    if (keys.length === 0) continue;

    // DeleteObjects allows up to 1000 keys per call; ListObjectsV2 returns <=1000.
    if (execute) {
      const res = await client.send(
        new DeleteObjectsCommand({
          Bucket,
          Delete: { Objects: keys, Quiet: true },
        })
      );
      const errs = res.Errors ?? [];
      totalDeleted += keys.length - errs.length;
      if (errs.length) {
        for (const e of errs) log(`  R2 ERROR ${e.Key}: ${e.Code} ${e.Message}`);
      }
      log(`  Deleted batch of ${keys.length - errs.length} objects`);
    } else {
      for (const k of keys.slice(0, 5)) log(`  [dry-run] would delete ${k.Key}`);
      if (keys.length > 5) log(`  [dry-run] ... and ${keys.length - 5} more`);
    }
  } while (token);

  log(`R2 listed: ${totalListed}, deleted: ${execute ? totalDeleted : 0}`);
}

// ---------------------------------------------------------------------------
// Postgres wipe (single transaction)
// ---------------------------------------------------------------------------
async function wipePostgres(execute: boolean) {
  section("Postgres: delete event-derived + event-tied rows");
  if (!execute) {
    log("[dry-run] would DELETE: reacts, event_cards (+cascade event_dates,");
    log("  section_cards), Event, TaggingRequest, OwnershipRequest,");
    log("  TeamMemberRequest, reviewing+submissions,");
    log("  playlist_reviewing+playlist_submissions, and the RequestApproval /");
    log("  Notification rows tied to TAGGING/TEAM_MEMBER/OWNERSHIP requests.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    log(`reacts: ${(await tx.react.deleteMany({})).count}`);
    // event_cards cascade removes event_dates + section_cards (FK onDelete: Cascade)
    log(`event_cards: ${(await tx.eventCard.deleteMany({})).count}`);
    log(`Event (ownership link): ${(await tx.event.deleteMany({})).count}`);
    log(`TaggingRequest: ${(await tx.taggingRequest.deleteMany({})).count}`);
    log(`OwnershipRequest: ${(await tx.ownershipRequest.deleteMany({})).count}`);
    log(`TeamMemberRequest: ${(await tx.teamMemberRequest.deleteMany({})).count}`);
    // reviewing cascades from submissions, but delete explicitly first to be safe
    log(`submissions: ${(await tx.submission.deleteMany({})).count}`);
    log(`playlist_submissions: ${(await tx.playlistSubmission.deleteMany({})).count}`);
    const approvals = await tx.requestApproval.deleteMany({
      where: { requestType: { in: ["TAGGING", "TEAM_MEMBER", "OWNERSHIP"] } },
    });
    log(`RequestApproval (event-tied): ${approvals.count}`);
    const notifs = await tx.notification.deleteMany({
      where: {
        OR: [
          { relatedRequestType: { in: ["TAGGING", "TEAM_MEMBER", "OWNERSHIP"] } },
          { type: { contains: "REQUEST" } },
        ],
      },
    });
    log(`Notification (event/request-tied): ${notifs.count}`);
  });
  log("Postgres transaction committed.");
}

// ---------------------------------------------------------------------------
// Neo4j wipe (batched DETACH DELETE)
// ---------------------------------------------------------------------------
async function wipeNeo4j(execute: boolean) {
  section("Neo4j: DETACH DELETE event graph");
  // Image == Gallery (dual-labeled); deleting :Image removes both.
  // IngestRun last: audit nodes for the auto-manager's [:INGESTED] provenance —
  // content goes first, then its provenance.
  const order = ["Video", "Bracket", "Section", "Image", "Event", "IngestRun"];
  if (!execute) {
    for (const label of order) {
      log(`[dry-run] would DETACH DELETE all :${label} nodes (batched)`);
    }
    return;
  }
  const session = driver.session();
  try {
    for (const label of order) {
      let deletedTotal = 0;
      // Batch to avoid large transaction heap pressure on the Video set.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const r = await session.run(
          `MATCH (n:${label}) WITH n LIMIT 1000 DETACH DELETE n RETURN count(n) AS c`
        );
        const c = (r.records[0]?.get("c") as { toNumber(): number }).toNumber();
        deletedTotal += c;
        if (c === 0) break;
      }
      log(`:${label} deleted ${deletedTotal}`);
    }
  } finally {
    await session.close();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  mkdirSync(resolve(process.cwd(), "scripts/wipe-logs"), { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  logStream = createWriteStream(
    resolve(process.cwd(), `scripts/wipe-logs/wipe-${APP_ENV}-${ts}.log`)
  );

  section(`EVENT WIPE  env=${APP_ENV}  mode=${CONFIRM ? "EXECUTE" : "DRY-RUN"}`);
  log(`Args: ${[...args].join(" ") || "(none)"}`);

  if (IS_PROD && CONFIRM && !UNDERSTAND_PROD) {
    log("REFUSING: production execute requires --i-understand-production.");
    process.exitCode = 2;
    return;
  }

  // --- Pre-counts ---
  section("PRE-COUNTS");
  const preNeo = await neo4jCounts([
    ...NEO4J_DELETE_LABELS,
    ...NEO4J_KEEP_LABELS,
  ]);
  const prePg = await pgCounts();
  log("Neo4j: " + JSON.stringify(preNeo));
  log("Postgres: " + JSON.stringify(prePg));

  // --- Execute (order: R2 -> Postgres -> Neo4j) ---
  if (!SKIP_R2) await wipeR2EventsPrefix(CONFIRM);
  else log("Skipping R2 (--skip-r2).");
  await wipePostgres(CONFIRM);
  await wipeNeo4j(CONFIRM);

  // --- Post-counts + verification ---
  section("POST-COUNTS");
  const postNeo = await neo4jCounts([
    ...NEO4J_DELETE_LABELS,
    ...NEO4J_KEEP_LABELS,
  ]);
  const postPg = await pgCounts();
  log("Neo4j: " + JSON.stringify(postNeo));
  log("Postgres: " + JSON.stringify(postPg));

  if (CONFIRM) {
    section("VERIFICATION");
    const problems: string[] = [];
    for (const label of NEO4J_DELETE_LABELS) {
      if (postNeo[label] !== 0) problems.push(`Neo4j :${label} = ${postNeo[label]} (expected 0)`);
    }
    for (const label of NEO4J_KEEP_LABELS) {
      if (postNeo[label] !== preNeo[label])
        problems.push(`Neo4j :${label} changed ${preNeo[label]} -> ${postNeo[label]} (should be unchanged)`);
    }
    const zeroPg = ["eventCards", "eventDates", "sectionCards", "eventLink", "reacts", "submissions", "playlistSubmissions", "reviewing", "playlistReviewing", "taggingReq", "ownershipReq", "teamReq"] as const;
    for (const k of zeroPg) {
      if (postPg[k] !== 0) problems.push(`Postgres ${k} = ${postPg[k]} (expected 0)`);
    }
    const keepPg = ["users", "accounts", "userCards", "cities", "danceStyles"] as const;
    for (const k of keepPg) {
      if (postPg[k] !== prePg[k]) problems.push(`Postgres ${k} changed ${prePg[k]} -> ${postPg[k]} (should be unchanged)`);
    }
    if (problems.length) {
      log("VERIFICATION FAILED:");
      problems.forEach((p) => log("  ✗ " + p));
      process.exitCode = 1;
    } else {
      log("✓ All checks passed: event data gone, accounts/profiles/reference intact.");
    }
  } else {
    log("Dry-run complete. Re-run with --confirm to execute.");
  }
}

main()
  .catch((e) => {
    if (logStream) log("FATAL: " + (e?.stack || e));
    else console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await driver.close().catch(() => {});
    await prisma.$disconnect().catch(() => {});
    logStream?.end();
  });
