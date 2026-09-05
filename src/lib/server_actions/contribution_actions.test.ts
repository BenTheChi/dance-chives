/**
 * Contribution server-action tests.
 *
 * These mock the two stores rather than talking to them: the point under test
 * is the *policy* around the writes — who may write, what order the stores are
 * written in, and whether the audit row can reconstruct the prior state. The
 * Cypher and the Prisma calls are asserted by shape, since a real Neo4j is not
 * available to the suite.
 */

const mockPrisma = {
  contribution: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  eventCard: { update: jest.fn(), findUnique: jest.fn() },
  eventDate: { deleteMany: jest.fn() },
  $executeRaw: jest.fn(),
};

const mockAuth = jest.fn();

const mockGraph = {
  setEventCityInGraph: jest.fn(),
  setEventTitleInGraph: jest.fn(),
  setEventSeriesInGraph: jest.fn(),
  setEventDateInGraph: jest.fn(),
  setEventStylesInGraph: jest.fn(),
};

const mockResolveCity = jest.fn();

// The factories are hoisted above the const declarations above, so each one
// reaches its double lazily rather than capturing it at definition time.
jest.mock("@/auth", () => ({ auth: () => mockAuth() }));
jest.mock("@/lib/primsa", () => ({
  get prisma() {
    return mockPrisma;
  },
}));
jest.mock("@/db/queries/event", () => ({
  setEventCityInGraph: (...a: unknown[]) => mockGraph.setEventCityInGraph(...a),
  setEventTitleInGraph: (...a: unknown[]) =>
    mockGraph.setEventTitleInGraph(...a),
  setEventSeriesInGraph: (...a: unknown[]) =>
    mockGraph.setEventSeriesInGraph(...a),
  setEventDateInGraph: (...a: unknown[]) => mockGraph.setEventDateInGraph(...a),
  setEventStylesInGraph: (...a: unknown[]) =>
    mockGraph.setEventStylesInGraph(...a),
}));
jest.mock("@/db/queries/city", () => ({
  resolveAndUpsertCityForWrite: (c: unknown) => mockResolveCity(c),
  getCityFromPostgres: jest.fn(),
}));
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));
jest.mock("@/lib/server_actions/calendar_revalidation", () => ({
  getCitySlug: (c: { slug?: string } | null) => c?.slug ?? null,
  revalidateCalendarForSlugs: jest.fn(),
}));

import {
  applyCityCorrection,
  applyDateCorrection,
  applyStyleCorrection,
  applyTitleCorrection,
  revertContribution,
} from "@/lib/server_actions/contribution_actions";
import { City } from "@/types/city";

const OSAKA = {
  id: "ChIJ_osaka",
  slug: "osaka-jp",
  name: "Osaka",
  countryCode: "JP",
  region: "Osaka",
  timezone: "Asia/Tokyo",
  latitude: 34.7,
  longitude: 135.5,
} as unknown as City;

function signedInAs(id: string, auth = 0) {
  mockAuth.mockResolvedValue({ user: { id, auth } });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.contribution.create.mockResolvedValue({ id: "contrib_1" });
  mockPrisma.eventCard.findUnique.mockResolvedValue({
    datePrecision: "year",
    displayDateLocal: "01/01/2019",
  });
  mockResolveCity.mockImplementation(async (c) => c);
  mockGraph.setEventCityInGraph.mockResolvedValue(null);
  mockGraph.setEventTitleInGraph.mockResolvedValue("Old Title");
  mockGraph.setEventSeriesInGraph.mockResolvedValue(null);
  mockGraph.setEventStylesInGraph.mockResolvedValue([]);
  mockGraph.setEventDateInGraph.mockResolvedValue({
    startDate: "2019-01-01",
    dates: null,
  });
});

describe("authentication", () => {
  // Decision 1: members only. The gate is the server action itself, so hiding
  // the UI is not what keeps anonymous writes out.
  it.each([
    ["city", () => applyCityCorrection("e1", OSAKA)],
    ["title", () => applyTitleCorrection("e1", "New")],
    ["styles", () => applyStyleCorrection("e1", ["Breaking"])],
    ["date", () => applyDateCorrection("e1", "05/04/2019", "day")],
  ])("rejects an anonymous %s correction", async (_field, call) => {
    mockAuth.mockResolvedValue(null);

    const result = await call();

    expect(result.status).toBe(401);
    expect(mockPrisma.contribution.create).not.toHaveBeenCalled();
  });

  it("writes nothing to either store when anonymous", async () => {
    mockAuth.mockResolvedValue(null);

    await applyTitleCorrection("e1", "New");

    expect(mockGraph.setEventTitleInGraph).not.toHaveBeenCalled();
    expect(mockPrisma.eventCard.update).not.toHaveBeenCalled();
  });
});

describe("audit trail", () => {
  it("records the exact prior value the graph write replaced", async () => {
    signedInAs("u1");
    mockGraph.setEventTitleInGraph.mockResolvedValue("Freestyle Session 12");

    await applyTitleCorrection("e1", "Freestyle Session Vol. 12", "a source");

    expect(mockPrisma.contribution.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: "e1",
          field: "title",
          oldValue: "Freestyle Session 12",
          newValue: "Freestyle Session Vol. 12",
          evidence: "a source",
          userId: "u1",
          status: "applied",
        }),
      }),
    );
  });

  it("takes oldValue from the write itself, not a separate read", async () => {
    signedInAs("u1");
    mockGraph.setEventStylesInGraph.mockResolvedValue(["Popping"]);

    await applyStyleCorrection("e1", ["Breaking"]);

    // The graph call is the only place the prior styles could have come from.
    expect(mockGraph.setEventStylesInGraph).toHaveBeenCalledWith("e1", [
      "Breaking",
    ]);
    expect(mockPrisma.contribution.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ oldValue: ["Popping"] }),
      }),
    );
  });

  it("flags the proposed event so ingest cannot silently overwrite the fix", async () => {
    signedInAs("u1");

    await applyTitleCorrection("e1", "New");

    expect(mockPrisma.$executeRaw).toHaveBeenCalled();
  });

  it("still applies the correction when flagging the PE fails", async () => {
    signedInAs("u1");
    mockPrisma.$executeRaw.mockRejectedValue(new Error("no such table"));

    const result = await applyTitleCorrection("e1", "New");

    expect(result.status).toBe(200);
  });
});

describe("write order", () => {
  // Neo4j is the source of truth and Postgres is derived: a failed graph write
  // must abort before the mirror is touched, or the card would advertise a
  // value the graph never accepted.
  it("does not touch Postgres when the graph write fails", async () => {
    signedInAs("u1");
    mockGraph.setEventTitleInGraph.mockRejectedValue(new Error("neo4j down"));

    const result = await applyTitleCorrection("e1", "New");

    expect(result.status).toBe(500);
    expect(mockPrisma.eventCard.update).not.toHaveBeenCalled();
    expect(mockPrisma.contribution.create).not.toHaveBeenCalled();
  });
});

describe("city corrections", () => {
  it("routes the city through the registry resolver", async () => {
    signedInAs("u1");

    await applyCityCorrection("e1", OSAKA);

    // A raw string write would create an orphan (:City) with no slug and break
    // /cities/[slug]; the resolver is what guarantees a registry row.
    expect(mockResolveCity).toHaveBeenCalledWith(OSAKA);
    expect(mockGraph.setEventCityInGraph).toHaveBeenCalledWith("e1", OSAKA);
  });

  it("rejects the correction when the city cannot be resolved", async () => {
    signedInAs("u1");
    mockResolveCity.mockRejectedValue(
      new Error("City must use a Google place_id"),
    );

    const result = await applyCityCorrection("e1", {
      id: "osaka",
      name: "Osaka",
    } as unknown as City);

    expect(result.status).toBe(500);
    expect(mockGraph.setEventCityInGraph).not.toHaveBeenCalled();
  });
});

describe("date corrections", () => {
  // datePrecision is the signal Phase 3's queue runs on. A member who supplies
  // only a month must not have that recorded as a known day.
  it.each([
    ["day" as const],
    ["month" as const],
    ["year" as const],
  ])("records %s precision exactly as claimed", async (precision) => {
    signedInAs("u1");

    await applyDateCorrection("e1", "05/04/2019", precision);

    expect(mockPrisma.eventCard.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ datePrecision: precision }),
      }),
    );
  });

  it("captures the prior precision alongside the prior date", async () => {
    signedInAs("u1");
    mockPrisma.eventCard.findUnique.mockResolvedValue({
      datePrecision: "year",
      displayDateLocal: "01/01/2019",
    });

    await applyDateCorrection("e1", "05/04/2019", "day");

    expect(mockPrisma.contribution.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          oldValue: expect.objectContaining({
            displayDateLocal: "01/01/2019",
            datePrecision: "year",
          }),
        }),
      }),
    );
  });

  it("rejects a malformed date before writing anything", async () => {
    signedInAs("u1");

    const result = await applyDateCorrection("e1", "2019-05-04", "day");

    expect(result.status).toBe(400);
    expect(mockGraph.setEventDateInGraph).not.toHaveBeenCalled();
  });
});

describe("style corrections", () => {
  it("rejects a style that is not in the registry", async () => {
    signedInAs("u1");

    const result = await applyStyleCorrection("e1", ["Not A Real Style"]);

    expect(result.status).toBe(500);
    expect(mockGraph.setEventStylesInGraph).not.toHaveBeenCalled();
  });

  it("canonicalises registered styles before writing", async () => {
    signedInAs("u1");

    await applyStyleCorrection("e1", ["breaking"]);

    expect(mockGraph.setEventStylesInGraph).toHaveBeenCalledWith("e1", [
      "Breaking",
    ]);
  });
});

describe("revert", () => {
  const applied = {
    id: "contrib_1",
    eventId: "e1",
    field: "title",
    oldValue: "Freestyle Session 12",
    status: "applied",
  };

  it("refuses a member below moderator", async () => {
    signedInAs("u1", 1);
    mockPrisma.contribution.findUnique.mockResolvedValue(applied);

    const result = await revertContribution("contrib_1");

    expect(result.status).toBe(403);
    expect(mockGraph.setEventTitleInGraph).not.toHaveBeenCalled();
  });

  it("restores the exact prior state through the same write path", async () => {
    signedInAs("mod", 2);
    mockPrisma.contribution.findUnique.mockResolvedValue(applied);

    const result = await revertContribution("contrib_1");

    expect(result.status).toBe(200);
    expect(mockGraph.setEventTitleInGraph).toHaveBeenCalledWith(
      "e1",
      "Freestyle Session 12",
    );
  });

  it("marks the original reverted and records who did it", async () => {
    signedInAs("mod", 2);
    mockPrisma.contribution.findUnique.mockResolvedValue(applied);

    await revertContribution("contrib_1");

    expect(mockPrisma.contribution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "contrib_1" },
        data: expect.objectContaining({
          status: "reverted",
          revertedBy: "mod",
        }),
      }),
    );
  });

  it("leaves a trail entry for the revert itself", async () => {
    signedInAs("mod", 2);
    mockPrisma.contribution.findUnique.mockResolvedValue(applied);

    await revertContribution("contrib_1");

    // The revert goes through the ordinary correction path, so it writes its
    // own row — the trail never loses an entry.
    expect(mockPrisma.contribution.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          field: "title",
          newValue: "Freestyle Session 12",
        }),
      }),
    );
  });

  it("does not revert the same contribution twice", async () => {
    signedInAs("mod", 2);
    mockPrisma.contribution.findUnique.mockResolvedValue({
      ...applied,
      status: "reverted",
    });

    const result = await revertContribution("contrib_1");

    expect(result.status).toBe(409);
  });

  it("refuses when no prior state was recorded", async () => {
    signedInAs("mod", 2);
    mockPrisma.contribution.findUnique.mockResolvedValue({
      ...applied,
      oldValue: null,
    });

    const result = await revertContribution("contrib_1");

    expect(result.status).toBe(422);
    expect(mockGraph.setEventTitleInGraph).not.toHaveBeenCalled();
  });
});
