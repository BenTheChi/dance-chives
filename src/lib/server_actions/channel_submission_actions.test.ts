/**
 * Channel submission server-action tests.
 *
 * The policy is the point: this form is open to the public, so what is under
 * test is who gets through, what gets deduped, and what a stranger is told.
 * Prisma and the YouTube API are mocked — the assertions are about the
 * decisions, not the SQL.
 */

const mockPrisma = {
  channelSubmission: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

const mockHeaders = jest.fn();

jest.mock("@/lib/primsa", () => ({
  get prisma() {
    return mockPrisma;
  },
}));

jest.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}));

import {
  submitChannel,
  submitChannels,
} from "@/lib/server_actions/channel_submission_actions";
import { initialChannelSubmissionState } from "@/lib/submissions/channel-submission-state";

function formWith(url: string): FormData {
  const data = new FormData();
  data.set("channelUrl", url);
  return data;
}

/** Each test gets its own IP so the rate limiter's state does not leak. */
let ipCounter = 0;
function freshIp(): Headers {
  ipCounter += 1;
  return new Headers({ "x-forwarded-for": `203.0.113.${ipCounter}` });
}

const submit = (url: string) =>
  submitChannel(initialChannelSubmissionState, formWith(url));

describe("submitChannel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHeaders.mockImplementation(() => freshIp());
    mockPrisma.$queryRaw.mockResolvedValue([]);
    mockPrisma.channelSubmission.findFirst.mockResolvedValue(null);
    mockPrisma.channelSubmission.create.mockResolvedValue({ id: "new" });
    mockPrisma.channelSubmission.update.mockResolvedValue({ id: "existing" });
    delete process.env.YOUTUBE_API_KEY;
  });

  /**
   * The headline change: no session, no problem. The review queue in the
   * manager is the gate, not membership.
   */
  it("accepts a submission from a signed-out visitor", async () => {
    const result = await submit("https://www.youtube.com/@example");

    expect(result.status).toBe("success");
    expect(result.message).toMatch(/thank you/i);
    expect(mockPrisma.channelSubmission.create).toHaveBeenCalledTimes(1);
  });

  it("rejects a link that is not a channel, without writing anything", async () => {
    const result = await submit("https://www.youtube.com/watch?v=abc123");

    expect(result.status).toBe("error");
    expect(mockPrisma.channelSubmission.create).not.toHaveBeenCalled();
  });

  /**
   * A channel a human turned down must not re-enter the queue, and the
   * submitter must not be told it was rejected — that invites argument and
   * leaks an editorial judgement. Same wording as any other known channel.
   */
  it("silently absorbs a re-submission of a rejected channel", async () => {
    mockPrisma.channelSubmission.findFirst.mockResolvedValue({
      id: "old",
      status: "rejected",
    });

    const result = await submit("https://www.youtube.com/@example");

    expect(result.status).toBe("success");
    expect(result.message).toBe(
      "Thanks — we've already got this one on our radar.",
    );
    expect(result.message).not.toMatch(/reject/i);
    expect(mockPrisma.channelSubmission.create).not.toHaveBeenCalled();
    expect(mockPrisma.channelSubmission.update).not.toHaveBeenCalled();
  });

  /**
   * A second submitter refreshes the existing claim rather than stacking a
   * duplicate for someone to review twice.
   */
  it("updates an existing pending submission instead of creating a second", async () => {
    mockPrisma.channelSubmission.findFirst.mockResolvedValue({
      id: "old",
      status: "pending",
    });

    await submit("https://www.youtube.com/@example");

    expect(mockPrisma.channelSubmission.update).toHaveBeenCalledTimes(1);
    expect(mockPrisma.channelSubmission.create).not.toHaveBeenCalled();
  });

  it("tells the submitter plainly when the channel is already archived", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ channel_name: "Already Here" }]);

    const result = await submit("https://www.youtube.com/@example");

    expect(result.status).toBe("success");
    expect(result.resolved?.alreadyArchived).toBe(true);
    expect(mockPrisma.channelSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "duplicate" }),
      }),
    );
  });

  /**
   * The only thing between a public form and the ingest pipeline's quota.
   * It must trip before any YouTube call, so a blocked request costs nothing.
   */
  it("rate limits by IP, and spends no quota on a blocked request", async () => {
    const sameIp = new Headers({ "x-forwarded-for": "198.51.100.7" });
    mockHeaders.mockImplementation(() => sameIp);

    const fetchSpy = jest.spyOn(global, "fetch");
    process.env.YOUTUBE_API_KEY = "test-key";
    fetchSpy.mockResolvedValue({ ok: false } as Response);

    for (let i = 0; i < 5; i++) {
      const allowed = await submit("https://www.youtube.com/@example");
      expect(allowed.status).toBe("success");
    }

    fetchSpy.mockClear();
    const blocked = await submit("https://www.youtube.com/@example");

    expect(blocked.status).toBe("error");
    expect(blocked.message).toMatch(/try again/i);
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});

describe("submitChannels (bulk)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHeaders.mockImplementation(() => freshIp());
    mockPrisma.$queryRaw.mockResolvedValue([]);
    mockPrisma.channelSubmission.findFirst.mockResolvedValue(null);
    mockPrisma.channelSubmission.create.mockResolvedValue({ id: "new" });
    mockPrisma.channelSubmission.update.mockResolvedValue({ id: "existing" });
    delete process.env.YOUTUBE_API_KEY;
  });

  const bulkSubmit = (channels: string) => {
    const data = new FormData();
    data.set("channels", channels);
    return submitChannels(initialChannelSubmissionState, data);
  };

  it("splits on newlines and commas alike", async () => {
    const result = await bulkSubmit(
      "https://www.youtube.com/@one, https://www.youtube.com/@two\n@three",
    );

    expect(result.status).toBe("success");
    expect(mockPrisma.channelSubmission.create).toHaveBeenCalledTimes(3);
    expect(result.message).toContain("3 channels added");
  });

  /**
   * The count reported back has to be honest about what the paste contained,
   * so a channel named three ways is caught before the write — including
   * across case, since the parser folds handles.
   */
  it("dedupes within a single paste, case included", async () => {
    const result = await bulkSubmit(
      "@example\nhttps://www.youtube.com/@example\n@EXAMPLE",
    );

    expect(mockPrisma.channelSubmission.create).toHaveBeenCalledTimes(1);
    expect(result.message).toContain("1 channel added");
  });

  it("reports what was added, already known, and unreadable", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ channel_name: "Known" }]);

    // Splitting is on any whitespace, so each junk token counts separately —
    // these are two tokens, not one line.
    const result = await bulkSubmit(
      "@fresh\n@known\nhttps://vimeo.com/12345\ngibberish",
    );

    expect(result.message).toContain("1 channel added");
    expect(result.message).toContain("1 already known");
    expect(result.message).toContain("2 we couldn't read");
  });

  it("refuses a paste longer than the cap without writing anything", async () => {
    const tooMany = Array.from(
      { length: 21 },
      (_, i) => `https://www.youtube.com/@channel${i}`,
    ).join("\n");

    const result = await bulkSubmit(tooMany);

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/at most 20/);
    expect(mockPrisma.channelSubmission.create).not.toHaveBeenCalled();
  });

  it("errors when nothing in the paste was a channel", async () => {
    const result = await bulkSubmit("not a link\nalso not a link");

    expect(result.status).toBe("error");
    expect(mockPrisma.channelSubmission.create).not.toHaveBeenCalled();
  });

  it("is rate limited by the same counter as single submissions", async () => {
    const sameIp = new Headers({ "x-forwarded-for": "198.51.100.44" });
    mockHeaders.mockImplementation(() => sameIp);

    for (let i = 0; i < 5; i++) {
      await bulkSubmit("https://www.youtube.com/@example");
    }

    const blocked = await bulkSubmit("https://www.youtube.com/@example");
    expect(blocked.status).toBe("error");
    expect(blocked.message).toMatch(/try again/i);
  });
});
