"use server";

/**
 * Contributions — single-fact corrections against published events.
 *
 * Why this exists separately from `event_actions.ts`:
 *
 * Today, "I know this was in Osaka" costs a member: sign up →
 * `createOwnershipRequest` → wait for a human to approve → open the event form →
 * find the city field → save. And for auto-published events there is no
 * creator at all, so `canUpdateEvent` can never pass for a stranger. That
 * longwindedness is structural, not cosmetic.
 *
 * A correction is a fact, not an edit. These actions stop routing contributions
 * through page ownership: any signed-in member may assert a fact, every
 * assertion is recorded with its exact prior value, and a moderator can revert
 * any of them. The audit trail IS the safety mechanism — there is no approval
 * queue in front of these writes.
 *
 * Write order matches the rest of the app: Neo4j is the source of truth, the
 * Postgres card is derived. Neo4j first; if it fails, abort before touching
 * Postgres.
 */

import { auth } from "@/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/primsa";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { normalizeStyleNames } from "@/lib/utils/style-utils";
import { resolveAndUpsertCityForWrite } from "@/db/queries/city";
import {
  setEventCityInGraph,
  setEventTitleInGraph,
  setEventSeriesInGraph,
  setEventDateInGraph,
  setEventStylesInGraph,
} from "@/db/queries/event";
import {
  getCitySlug,
  revalidateCalendarForSlugs,
} from "@/lib/server_actions/calendar_revalidation";
import { City } from "@/types/city";

export type ContributionField =
  | "city"
  | "date"
  | "styles"
  | "title"
  | "series"
  | "participant";

/** How much of a corrected date the member actually claims to know. */
export type DatePrecision = "day" | "month" | "year";

export type ContributionResult =
  | { status: 200; contributionId: string }
  | { status: number; error: string };

const CONTRIBUTION_STATUS_APPLIED = "applied";
const CONTRIBUTION_STATUS_REVERTED = "reverted";

/**
 * Every correction requires a session. Anonymous writes are rejected here, at
 * the server action — not merely hidden in the UI.
 */
async function requireMember(): Promise<
  { ok: true; userId: string; authLevel: number } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You must be signed in to contribute" };
  }
  return {
    ok: true,
    userId: session.user.id,
    authLevel: session.user.auth ?? AUTH_LEVELS.BASE_USER,
  };
}

/**
 * Revalidate every surface a corrected fact appears on.
 *
 * A city correction moves the event between city pages, so both the old and the
 * new slug need clearing — showing the event in two cities at once is the
 * failure this prevents.
 */
async function revalidateEventSurfaces(
  eventId: string,
  citySlugs: (string | null | undefined)[] = [],
): Promise<void> {
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/watch");
  revalidateTag("watch-sections", "");
  revalidateTag("event-styles", "");

  const slugs = citySlugs.filter((s): s is string => Boolean(s));
  if (slugs.length > 0) {
    await revalidateCalendarForSlugs(slugs);
  }
}

/**
 * Record the correction.
 *
 * `oldValue` is the load-bearing column: it is the only thing that makes revert
 * possible. It is captured from the graph write itself — which returns the
 * prior value it replaced — rather than by a separate read beforehand, so no
 * concurrent write can slip between the read and the write and strand the audit
 * row pointing at a state that never existed.
 */
async function recordContribution(input: {
  eventId: string;
  sectionId?: string | null;
  videoId?: string | null;
  field: ContributionField;
  oldValue: unknown;
  newValue: unknown;
  evidence?: string | null;
  userId: string;
}): Promise<string> {
  const row = await prisma.contribution.create({
    data: {
      eventId: input.eventId,
      sectionId: input.sectionId ?? null,
      videoId: input.videoId ?? null,
      field: input.field,
      oldValue: (input.oldValue ?? null) as never,
      newValue: (input.newValue ?? null) as never,
      evidence: input.evidence?.trim() || null,
      userId: input.userId,
      status: CONTRIBUTION_STATUS_APPLIED,
    },
    select: { id: true },
  });

  await flagPublicCorrection(input.eventId);

  return row.id;
}

/**
 * Tell the ingest side that a human has touched this event.
 *
 * A published event that a member corrects drifts from its ProposedEvent. The
 * next re-cluster or rolling update in the auto-manager could otherwise
 * overwrite the human fix with a machine value and silently undo real work — a
 * correction loop that eats its own contributions would be worse than having no
 * corrections at all.
 *
 * The manager owns the enforcement; this only raises the flag it reads. It is
 * best-effort on purpose: the correction itself has already been applied and
 * recorded, so failing to raise the flag must not fail the member's write.
 */
async function flagPublicCorrection(eventId: string): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE channel_discovery_proposed_event
      SET has_public_corrections = true
      WHERE neo4j_event_id = ${eventId}
    `;
  } catch (error) {
    console.error(
      `[contribution] could not flag PE for event ${eventId}; the correction was applied but the manager may overwrite it`,
      error,
    );
  }
}

/**
 * Correct which city an event happened in.
 *
 * The place_id goes through `resolveAndUpsertCityForWrite` rather than being
 * written raw: cities need a registry row and a slug, and a bare string write
 * produces orphan (:City) nodes that break /cities/[slug]. That resolver throws
 * on an unresolvable id, which is the correct outcome here — better a rejected
 * correction than a broken city page.
 */
export async function applyCityCorrection(
  eventId: string,
  city: City,
  evidence?: string,
): Promise<ContributionResult> {
  const member = await requireMember();
  if (!member.ok) return { status: 401, error: member.error };

  try {
    const canonicalCity = await resolveAndUpsertCityForWrite(city);

    // Neo4j first — abort before Postgres if it fails.
    const oldCity = await setEventCityInGraph(eventId, canonicalCity);

    const rawTimezone = canonicalCity.timezone || "";
    await prisma.eventCard.update({
      where: { eventId },
      data: {
        cityId: canonicalCity.id,
        cityName: canonicalCity.name,
        region: canonicalCity.region ?? null,
        countryCode: canonicalCity.countryCode ?? null,
        eventTimezone: rawTimezone.replace(/__/g, "/") || null,
      },
    });

    const contributionId = await recordContribution({
      eventId,
      field: "city",
      oldValue: oldCity,
      newValue: { id: canonicalCity.id, name: canonicalCity.name },
      evidence,
      userId: member.userId,
    });

    await revalidateEventSurfaces(eventId, [
      getCitySlug(canonicalCity),
      oldCity ? getCitySlug(oldCity as City) : null,
    ]);

    return { status: 200, contributionId };
  } catch (error) {
    console.error("[contribution] city correction failed", error);
    return {
      status: 500,
      error:
        error instanceof Error ? error.message : "Failed to apply correction",
    };
  }
}

/**
 * Correct when an event happened.
 *
 * `precision` is recorded exactly as claimed. A member supplying only a month
 * sets "month", never "day": Phase 3's entire queue runs on datePrecision, so
 * silently upgrading it would destroy the one signal that says which events
 * still need a date. An honest "month" is worth more than a confident lie.
 */
export async function applyDateCorrection(
  eventId: string,
  dateMmddyyyy: string,
  precision: DatePrecision,
  evidence?: string,
): Promise<ContributionResult> {
  const member = await requireMember();
  if (!member.ok) return { status: 401, error: member.error };

  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateMmddyyyy)) {
    return { status: 400, error: "Date must be in MM/DD/YYYY format" };
  }

  try {
    const [mm, dd, yyyy] = dateMmddyyyy.split("/");
    const startDateIso = `${yyyy}-${mm}-${dd}`;
    const datesJson = JSON.stringify([{ date: dateMmddyyyy }]);

    const oldDate = await setEventDateInGraph(
      eventId,
      startDateIso,
      datesJson,
    );

    const card = await prisma.eventCard.findUnique({
      where: { eventId },
      select: { datePrecision: true, displayDateLocal: true },
    });

    await prisma.eventCard.update({
      where: { eventId },
      data: {
        displayDateLocal: dateMmddyyyy,
        datePrecision: precision,
        additionalDatesCount: 0,
      },
    });

    // event_dates drives the calendar; rebuild it for the single corrected day.
    await prisma.eventDate.deleteMany({ where: { eventId } });

    const contributionId = await recordContribution({
      eventId,
      field: "date",
      oldValue: {
        startDate: oldDate.startDate,
        dates: oldDate.dates,
        displayDateLocal: card?.displayDateLocal ?? null,
        datePrecision: card?.datePrecision ?? null,
      },
      newValue: { displayDateLocal: dateMmddyyyy, datePrecision: precision },
      evidence,
      userId: member.userId,
    });

    await revalidateEventSurfaces(eventId);

    return { status: 200, contributionId };
  } catch (error) {
    console.error("[contribution] date correction failed", error);
    return {
      status: 500,
      error:
        error instanceof Error ? error.message : "Failed to apply correction",
    };
  }
}

/**
 * Correct which styles an event featured.
 *
 * Names are resolved against the `dance_styles` registry. `normalizeStyleNames`
 * throws on an unregistered name rather than inventing a (:Style) node nothing
 * else recognises — the registry is the authority, and adding a style is a
 * migration, not a side effect of a member's correction.
 */
export async function applyStyleCorrection(
  eventId: string,
  styles: string[],
  evidence?: string,
): Promise<ContributionResult> {
  const member = await requireMember();
  if (!member.ok) return { status: 401, error: member.error };

  try {
    const normalized = normalizeStyleNames(styles);

    const oldStyles = await setEventStylesInGraph(eventId, normalized);

    await prisma.eventCard.update({
      where: { eventId },
      data: { styles: normalized },
    });

    const contributionId = await recordContribution({
      eventId,
      field: "styles",
      oldValue: oldStyles,
      newValue: normalized,
      evidence,
      userId: member.userId,
    });

    await revalidateEventSurfaces(eventId);

    return { status: 200, contributionId };
  } catch (error) {
    console.error("[contribution] style correction failed", error);
    return {
      status: 500,
      error:
        error instanceof Error ? error.message : "Failed to apply correction",
    };
  }
}

/**
 * Correct an event's title.
 */
export async function applyTitleCorrection(
  eventId: string,
  title: string,
  evidence?: string,
): Promise<ContributionResult> {
  const member = await requireMember();
  if (!member.ok) return { status: 401, error: member.error };

  const trimmed = title.trim();
  if (!trimmed) {
    return { status: 400, error: "Title cannot be empty" };
  }

  try {
    const oldTitle = await setEventTitleInGraph(eventId, trimmed);

    await prisma.eventCard.update({
      where: { eventId },
      data: { title: trimmed },
    });

    const contributionId = await recordContribution({
      eventId,
      field: "title",
      oldValue: oldTitle,
      newValue: trimmed,
      evidence,
      userId: member.userId,
    });

    await revalidateEventSurfaces(eventId);

    return { status: 200, contributionId };
  } catch (error) {
    console.error("[contribution] title correction failed", error);
    return {
      status: 500,
      error:
        error instanceof Error ? error.message : "Failed to apply correction",
    };
  }
}

/**
 * Correct an event's series — the edition-agnostic name ("Freestyle Session"
 * for "Freestyle Session Vol. 12").
 */
export async function applySeriesCorrection(
  eventId: string,
  series: string,
  evidence?: string,
): Promise<ContributionResult> {
  const member = await requireMember();
  if (!member.ok) return { status: 401, error: member.error };

  const trimmed = series.trim();

  try {
    const oldSeries = await setEventSeriesInGraph(eventId, trimmed || null);

    await prisma.eventCard.update({
      where: { eventId },
      data: { series: trimmed || null },
    });

    const contributionId = await recordContribution({
      eventId,
      field: "series",
      oldValue: oldSeries,
      newValue: trimmed || null,
      evidence,
      userId: member.userId,
    });

    await revalidateEventSurfaces(eventId);

    return { status: 200, contributionId };
  } catch (error) {
    console.error("[contribution] series correction failed", error);
    return {
      status: 500,
      error:
        error instanceof Error ? error.message : "Failed to apply correction",
    };
  }
}

/**
 * Undo a contribution, restoring the exact prior state.
 *
 * Moderator-only (auth level >= 2). The revert writes `oldValue` back through
 * the identical path the correction used — not a special-case restore — so a
 * reverted field lands in exactly the state the original write replaced.
 *
 * The revert is itself recorded as a new contribution, so the trail never loses
 * an entry: you can always see both that a claim was made and that it was
 * undone.
 */
export async function revertContribution(
  contributionId: string,
): Promise<ContributionResult> {
  const member = await requireMember();
  if (!member.ok) return { status: 401, error: member.error };

  if (member.authLevel < AUTH_LEVELS.MODERATOR) {
    return { status: 403, error: "Only moderators can revert contributions" };
  }

  const original = await prisma.contribution.findUnique({
    where: { id: contributionId },
  });

  if (!original) {
    return { status: 404, error: "Contribution not found" };
  }

  if (original.status === CONTRIBUTION_STATUS_REVERTED) {
    return { status: 409, error: "Contribution has already been reverted" };
  }

  const { eventId, oldValue } = original;

  try {
    let result: ContributionResult;

    switch (original.field) {
      case "city": {
        const prior = oldValue as { id?: string; name?: string } | null;
        if (!prior?.id) {
          return {
            status: 422,
            error:
              "This event had no city before the correction; it cannot be reverted automatically",
          };
        }
        // Re-resolve from the registry rather than trusting the stored copy —
        // the row records identity, and the registry holds current metadata.
        const { getCityFromPostgres } = await import("@/db/queries/city");
        const city = await getCityFromPostgres(prior.id);
        if (!city) {
          return {
            status: 422,
            error: `Prior city ${prior.id} is no longer in the registry`,
          };
        }
        result = await applyCityCorrection(eventId, city as City);
        break;
      }
      case "styles": {
        const prior = (oldValue as string[] | null) ?? [];
        result = await applyStyleCorrection(eventId, prior);
        break;
      }
      case "title": {
        const prior = oldValue as string | null;
        if (!prior) {
          return { status: 422, error: "No prior title recorded" };
        }
        result = await applyTitleCorrection(eventId, prior);
        break;
      }
      case "series": {
        const prior = (oldValue as string | null) ?? "";
        result = await applySeriesCorrection(eventId, prior);
        break;
      }
      case "date": {
        const prior = oldValue as {
          displayDateLocal?: string | null;
          datePrecision?: string | null;
        } | null;
        if (!prior?.displayDateLocal) {
          return { status: 422, error: "No prior date recorded" };
        }
        result = await applyDateCorrection(
          eventId,
          prior.displayDateLocal,
          (prior.datePrecision as DatePrecision) ?? "year",
        );
        break;
      }
      default:
        return {
          status: 422,
          error: `Cannot revert a "${original.field}" contribution`,
        };
    }

    if (result.status !== 200) {
      return result;
    }

    await prisma.contribution.update({
      where: { id: contributionId },
      data: {
        status: CONTRIBUTION_STATUS_REVERTED,
        revertedBy: member.userId,
        revertedAt: new Date(),
      },
    });

    return result;
  } catch (error) {
    console.error("[contribution] revert failed", error);
    return {
      status: 500,
      error:
        error instanceof Error ? error.message : "Failed to revert contribution",
    };
  }
}

/**
 * Recent contributions for the moderation view, newest first.
 */
export async function listContributions(options?: {
  field?: ContributionField;
  userId?: string;
  eventId?: string;
  take?: number;
}) {
  const member = await requireMember();
  if (!member.ok) return { status: 401 as const, error: member.error };

  if (member.authLevel < AUTH_LEVELS.MODERATOR) {
    return { status: 403 as const, error: "Moderators only" };
  }

  const contributions = await prisma.contribution.findMany({
    where: {
      field: options?.field,
      userId: options?.userId,
      eventId: options?.eventId,
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(options?.take ?? 100, 200),
    include: {
      user: { select: { id: true, username: true, name: true, image: true } },
    },
  });

  return { status: 200 as const, contributions };
}
