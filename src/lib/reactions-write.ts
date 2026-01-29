import { prisma } from "@/lib/primsa";

export interface ReactionsPayload {
  fire: number[];
  clap: number[];
  wow: number[];
  laugh: number[];
}

function sortArrays(payload: ReactionsPayload): ReactionsPayload {
  return {
    fire: [...payload.fire].sort((a, b) => a - b),
    clap: [...payload.clap].sort((a, b) => a - b),
    wow: [...payload.wow].sort((a, b) => a - b),
    laugh: [...payload.laugh].sort((a, b) => a - b),
  };
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function payloadEqualsDb(
  payload: ReactionsPayload,
  row: { fire: number[]; clap: number[]; wow: number[]; laugh: number[] } | null
): boolean {
  if (!row) {
    return (
      payload.fire.length === 0 &&
      payload.clap.length === 0 &&
      payload.wow.length === 0 &&
      payload.laugh.length === 0
    );
  }
  return (
    arraysEqual(payload.fire, row.fire) &&
    arraysEqual(payload.clap, row.clap) &&
    arraysEqual(payload.wow, row.wow) &&
    arraysEqual(payload.laugh, row.laugh)
  );
}

/**
 * Write one user's reactions for a video immediately (no batching). Used for anon.
 */
export async function writeReactionsImmediate(
  videoId: string,
  userId: string,
  payload: ReactionsPayload
): Promise<void> {
  const sorted = sortArrays(payload);
  await prisma.react.upsert({
    where: { userId_videoId: { userId, videoId } },
    create: {
      userId,
      videoId,
      fire: sorted.fire,
      clap: sorted.clap,
      wow: sorted.wow,
      laugh: sorted.laugh,
    },
    update: {
      fire: sorted.fire,
      clap: sorted.clap,
      wow: sorted.wow,
      laugh: sorted.laugh,
    },
  });
}

/**
 * Flush batched reactions for a video to the DB. Fetches current rows, diffs,
 * and upserts only changed userId+videoId rows. Arrays are sorted before write.
 */
export async function flushReactionsBatch(
  videoId: string,
  entries: Array<{ userId: string; payload: ReactionsPayload }>
): Promise<void> {
  if (entries.length === 0) return;

  const sortedEntries = entries.map((e) => ({
    userId: e.userId,
    payload: sortArrays(e.payload),
  }));

  const currentRows = await prisma.react.findMany({
    where: { videoId },
    select: { userId: true, fire: true, clap: true, wow: true, laugh: true },
  });
  const byUser = new Map(
    currentRows.map((r) => [r.userId, r] as [string, (typeof currentRows)[0]])
  );

  for (const { userId, payload } of sortedEntries) {
    const existing = byUser.get(userId) ?? null;
    if (payloadEqualsDb(payload, existing)) continue;

    await prisma.react.upsert({
      where: {
        userId_videoId: { userId, videoId },
      },
      create: {
        userId,
        videoId,
        fire: payload.fire,
        clap: payload.clap,
        wow: payload.wow,
        laugh: payload.laugh,
      },
      update: {
        fire: payload.fire,
        clap: payload.clap,
        wow: payload.wow,
        laugh: payload.laugh,
      },
    });
  }
}
