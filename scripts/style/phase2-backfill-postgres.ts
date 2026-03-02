#!/usr/bin/env tsx

import { prisma } from "../../src/lib/primsa";
import { normalizeStyleNames } from "../../src/lib/utils/style-utils";

const APPLY = process.argv.includes("--apply");
const PREVIEW_LIMIT = 25;

type UpdateRow = {
  id: string;
  before: string[];
  after: string[];
};

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function summarizeChanges(label: string, rows: UpdateRow[]) {
  console.log(
    `[style:phase2:backfill-postgres] ${label} rows_to_update=${rows.length}`
  );
  for (const row of rows.slice(0, PREVIEW_LIMIT)) {
    console.log(
      `- ${label}:${row.id} before=[${row.before.join(", ")}] after=[${row.after.join(", ")}]`
    );
  }
}

async function main() {
  console.log(
    `[style:phase2:backfill-postgres] mode=${APPLY ? "apply" : "dry-run"}`
  );

  const invalidRows: string[] = [];

  const eventRows = await prisma.eventCard.findMany({
    select: { eventId: true, styles: true },
  });
  const eventUpdates: UpdateRow[] = [];
  for (const row of eventRows) {
    try {
      const normalized = normalizeStyleNames(row.styles || []);
      if (!arraysEqual(row.styles || [], normalized)) {
        eventUpdates.push({
          id: row.eventId,
          before: row.styles || [],
          after: normalized,
        });
      }
    } catch (error) {
      invalidRows.push(`event_cards:${row.eventId} (${String(error)})`);
    }
  }

  const sectionRows = await prisma.sectionCard.findMany({
    select: { sectionId: true, styles: true },
  });
  const sectionUpdates: UpdateRow[] = [];
  for (const row of sectionRows) {
    try {
      const normalized = normalizeStyleNames(row.styles || []);
      if (!arraysEqual(row.styles || [], normalized)) {
        sectionUpdates.push({
          id: row.sectionId,
          before: row.styles || [],
          after: normalized,
        });
      }
    } catch (error) {
      invalidRows.push(`section_cards:${row.sectionId} (${String(error)})`);
    }
  }

  const userRows = await prisma.userCard.findMany({
    select: { userId: true, styles: true },
  });
  const userUpdates: UpdateRow[] = [];
  for (const row of userRows) {
    try {
      const normalized = normalizeStyleNames(row.styles || []);
      if (!arraysEqual(row.styles || [], normalized)) {
        userUpdates.push({
          id: row.userId,
          before: row.styles || [],
          after: normalized,
        });
      }
    } catch (error) {
      invalidRows.push(`user_cards:${row.userId} (${String(error)})`);
    }
  }

  if (invalidRows.length > 0) {
    console.error(
      "[style:phase2:backfill-postgres] invalid style values found. Backfill aborted."
    );
    for (const row of invalidRows.slice(0, PREVIEW_LIMIT)) {
      console.error(`- ${row}`);
    }
    process.exitCode = 1;
    return;
  }

  summarizeChanges("event_cards", eventUpdates);
  summarizeChanges("section_cards", sectionUpdates);
  summarizeChanges("user_cards", userUpdates);

  if (!APPLY) {
    return;
  }

  for (const row of eventUpdates) {
    await prisma.eventCard.update({
      where: { eventId: row.id },
      data: { styles: row.after },
    });
  }

  for (const row of sectionUpdates) {
    await prisma.sectionCard.update({
      where: { sectionId: row.id },
      data: { styles: row.after },
    });
  }

  for (const row of userUpdates) {
    await prisma.userCard.update({
      where: { userId: row.id },
      data: { styles: row.after },
    });
  }

  console.log("[style:phase2:backfill-postgres] apply complete");
  console.log(
    "[style:phase2:backfill-postgres] reminder: revalidate style cache tags (event-styles/watch-sections) after apply"
  );
}

main()
  .catch((error) => {
    console.error("[style:phase2:backfill-postgres] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
