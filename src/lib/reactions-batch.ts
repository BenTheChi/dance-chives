import { flushReactionsBatch, type ReactionsPayload } from "./reactions-write";

const BATCH_DELAY_MS = 5 * 60 * 1000; // 5 minutes

const REACT_KEYS = ["fire", "clap", "wow", "laugh"] as const;
const MAX_PER_EMOJI = 3;

export function validateReactionsPayload(body: unknown):
  | {
      ok: true;
      payload: ReactionsPayload;
    }
  | { ok: false; error: string; status: number } {
  if (typeof body !== "object" || body === null) {
    return {
      ok: false,
      error: "Body must be an object with fire, clap, wow, laugh arrays",
      status: 400,
    };
  }
  const b = body as Record<string, unknown>;
  const payload: ReactionsPayload = { fire: [], clap: [], wow: [], laugh: [] };

  for (const key of REACT_KEYS) {
    const val = b[key];
    if (!Array.isArray(val)) {
      return {
        ok: false,
        error: `Invalid react: ${key} must be an array`,
        status: 400,
      };
    }
    if (val.length > MAX_PER_EMOJI) {
      return {
        ok: false,
        error: `Invalid react: ${key} has at most ${MAX_PER_EMOJI} entries`,
        status: 400,
      };
    }
    for (let i = 0; i < val.length; i++) {
      const n = val[i];
      if (typeof n !== "number" || !Number.isFinite(n) || n < 0) {
        return {
          ok: false,
          error: `Invalid react: ${key}[${i}] must be a non-negative number`,
          status: 400,
        };
      }
      payload[key].push(Math.floor(n));
    }
  }
  return { ok: true, payload };
}

const ANON_MAX_PER_EMOJI = 1;
const ANON_MAX_TOTAL = 2;

/** Validate payload for anon: 1 per emoji, total ≤ 2. */
export function validateReactionsPayloadAnon(body: unknown):
  | {
      ok: true;
      payload: ReactionsPayload;
    }
  | { ok: false; error: string; status: number } {
  const result = validateReactionsPayload(body);
  if (!result.ok) return result;
  const { payload } = result;
  for (const key of REACT_KEYS) {
    if (payload[key].length > ANON_MAX_PER_EMOJI) {
      return {
        ok: false,
        error: `Anonymous: at most ${ANON_MAX_PER_EMOJI} reaction per type`,
        status: 400,
      };
    }
  }
  const total =
    payload.fire.length +
    payload.clap.length +
    payload.wow.length +
    payload.laugh.length;
  if (total > ANON_MAX_TOTAL) {
    return {
      ok: false,
      error: `Anonymous: at most ${ANON_MAX_TOTAL} reactions per video`,
      status: 400,
    };
  }
  return { ok: true, payload };
}

interface VideoBatch {
  pendingByUser: Map<string, ReactionsPayload>;
  timer: ReturnType<typeof setTimeout> | null;
}

const batches = new Map<string, VideoBatch>();

function getOrCreateBatch(videoId: string): VideoBatch {
  let batch = batches.get(videoId);
  if (!batch) {
    batch = {
      pendingByUser: new Map(),
      timer: null,
    };
    batches.set(videoId, batch);
  }
  return batch;
}

function scheduleFlush(videoId: string): void {
  const batch = batches.get(videoId);
  if (!batch) return;

  if (batch.timer) clearTimeout(batch.timer);

  batch.timer = setTimeout(() => {
    batch.timer = null;
    const entries = Array.from(batch.pendingByUser.entries()).map(
      ([userId, payload]) => ({ userId, payload })
    );
    batch.pendingByUser.clear();
    if (entries.length > 0) {
      flushReactionsBatch(videoId, entries).catch((err) => {
        console.error("[reactions-batch] flush failed:", err);
      });
    }
  }, BATCH_DELAY_MS);
}

/**
 * Add or update pending reactions for a user on a video. Overwrites the full
 * reactions object for that user. Resets the 5-minute flush timer for this video.
 */
export function addToBatch(
  videoId: string,
  userId: string,
  payload: ReactionsPayload
): void {
  const batch = getOrCreateBatch(videoId);
  batch.pendingByUser.set(userId, { ...payload });
  scheduleFlush(videoId);
}

/**
 * Reset (clear) pending reactions for a user on a video. Same batching and
 * timer behavior as addToBatch.
 */
export function resetBatch(videoId: string, userId: string): void {
  addToBatch(videoId, userId, {
    fire: [],
    clap: [],
    wow: [],
    laugh: [],
  });
}
