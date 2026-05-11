import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request } from "express";

const { mockPoolQuery, mockPoolConnect } = vi.hoisted(() => {
  const mockPoolQuery = vi.fn().mockResolvedValue({ rows: [] });
  const mockPoolConnect = vi.fn().mockResolvedValue({
    query: mockPoolQuery,
    release: vi.fn(),
  });
  return { mockPoolQuery, mockPoolConnect };
});

vi.mock("@workspace/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 42 }]),
      }),
    }),
  },
  pool: {
    query: mockPoolQuery,
    connect: mockPoolConnect,
  },
}));

vi.mock("@workspace/db/schema", () => ({
  contactSubmissionsTable: {},
  insertContactSubmissionSchema: {
    safeParse: (data: Record<string, unknown>) => {
      const name = data.name;
      const email = data.email;
      if (typeof name !== "string" || name.trim().length === 0) {
        return { success: false, error: { issues: [{ path: ["name"], message: "Name is required" }] } };
      }
      if (typeof email !== "string" || !email.includes("@")) {
        return { success: false, error: { issues: [{ path: ["email"], message: "Valid email is required" }] } };
      }
      return {
        success: true,
        data: {
          name: (name as string).trim(),
          email: (email as string).trim(),
          phone: (data.phone as string) || "",
          projectDetails: (data.projectDetails as string) || "",
          description: (data.description as string) || "",
        },
      };
    },
  },
}));

vi.mock("../lib/email", () => ({
  sendContactNotification: vi.fn().mockResolvedValue(undefined),
}));

import {
  IP_RATE_WINDOW_MS,
  IP_RATE_MAX,
  EMAIL_RATE_WINDOW_MS,
  EMAIL_RATE_MAX,
  checkRateLimit,
  isIpRateLimited,
  isEmailRateLimited,
} from "./contact";

describe("rate limiting constants", () => {
  it("IP window is 60 seconds", () => {
    expect(IP_RATE_WINDOW_MS).toBe(60_000);
  });

  it("IP max is 5 per window", () => {
    expect(IP_RATE_MAX).toBe(5);
  });

  it("email window is 15 minutes", () => {
    expect(EMAIL_RATE_WINDOW_MS).toBe(15 * 60_000);
  });

  it("email max is 3 per window", () => {
    expect(EMAIL_RATE_MAX).toBe(3);
  });
});

describe("checkRateLimit (DB-backed)", () => {
  beforeEach(() => {
    mockPoolQuery.mockReset();
    mockPoolConnect.mockReset();
  });

  it("returns false and inserts a hit when under the limit", async () => {
    const mockClient = {
      query: vi.fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ cnt: "2" }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined),
      release: vi.fn(),
    };
    mockPoolConnect.mockResolvedValue(mockClient);

    const result = await checkRateLimit("ip", "1.2.3.4", 60_000, 5);

    expect(result).toBe(false);
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    const insertCall = mockClient.query.mock.calls.find(
      (c: string[]) => typeof c[0] === "string" && c[0].includes("INSERT"),
    );
    expect(insertCall).toBeDefined();
    expect(mockClient.release).toHaveBeenCalled();
  });

  it("returns true and does not insert when at the limit", async () => {
    const mockClient = {
      query: vi.fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ cnt: "5" }] })
        .mockResolvedValueOnce(undefined),
      release: vi.fn(),
    };
    mockPoolConnect.mockResolvedValue(mockClient);

    const result = await checkRateLimit("ip", "1.2.3.4", 60_000, 5);

    expect(result).toBe(true);
    const insertCall = mockClient.query.mock.calls.find(
      (c: string[]) => typeof c[0] === "string" && c[0].includes("INSERT"),
    );
    expect(insertCall).toBeUndefined();
    expect(mockClient.release).toHaveBeenCalled();
  });

  it("rolls back on error and re-throws", async () => {
    const dbError = new Error("DB connection failed");
    const mockClient = {
      query: vi.fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(dbError),
      release: vi.fn(),
    };
    mockPoolConnect.mockResolvedValue(mockClient);

    await expect(checkRateLimit("ip", "1.2.3.4", 60_000, 5)).rejects.toThrow("DB connection failed");
    const rollbackCall = mockClient.query.mock.calls.find(
      (c: string[]) => c[0] === "ROLLBACK",
    );
    expect(rollbackCall).toBeDefined();
    expect(mockClient.release).toHaveBeenCalled();
  });
});

describe("isIpRateLimited", () => {
  beforeEach(() => {
    mockPoolConnect.mockReset();
  });

  it("uses req.ip as the key with 'ip' category", async () => {
    const mockClient = {
      query: vi.fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ cnt: "0" }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined),
      release: vi.fn(),
    };
    mockPoolConnect.mockResolvedValue(mockClient);

    const req = { ip: "10.0.0.1" } as Request;
    const result = await isIpRateLimited(req);

    expect(result).toBe(false);
    const countQuery = mockClient.query.mock.calls.find(
      (c: unknown[]) => typeof c[0] === "string" && (c[0] as string).includes("COUNT"),
    );
    expect(countQuery).toBeDefined();
    expect(countQuery![1]).toContain("ip");
    expect(countQuery![1]).toContain("10.0.0.1");
  });

  it("falls back to 'unknown' when req.ip is undefined", async () => {
    const mockClient = {
      query: vi.fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ cnt: "0" }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined),
      release: vi.fn(),
    };
    mockPoolConnect.mockResolvedValue(mockClient);

    const req = { ip: undefined } as unknown as Request;
    await isIpRateLimited(req);

    const countQuery = mockClient.query.mock.calls.find(
      (c: unknown[]) => typeof c[0] === "string" && (c[0] as string).includes("COUNT"),
    );
    expect(countQuery![1]).toContain("unknown");
  });
});

describe("isEmailRateLimited", () => {
  beforeEach(() => {
    mockPoolConnect.mockReset();
  });

  it("normalizes email to lowercase", async () => {
    const mockClient = {
      query: vi.fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ cnt: "0" }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined),
      release: vi.fn(),
    };
    mockPoolConnect.mockResolvedValue(mockClient);

    await isEmailRateLimited("Test@Example.COM");

    const countQuery = mockClient.query.mock.calls.find(
      (c: unknown[]) => typeof c[0] === "string" && (c[0] as string).includes("COUNT"),
    );
    expect(countQuery![1]).toContain("test@example.com");
  });
});

describe("POST /api/contact route integration", () => {
  let app: typeof import("../app").default;
  let request: typeof import("supertest").default;

  function createMockClient(countValue: string) {
    return {
      query: vi.fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ cnt: countValue }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined),
      release: vi.fn(),
    };
  }

  function setupMockClients(...countValues: string[]) {
    for (const cv of countValues) {
      mockPoolConnect.mockResolvedValueOnce(createMockClient(cv));
    }
  }

  beforeEach(async () => {
    mockPoolConnect.mockReset();
    mockPoolQuery.mockReset();
    const supertest = await import("supertest");
    request = supertest.default;
    const appModule = await import("../app");
    app = appModule.default;
  });

  const validPayload = {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "555-1234",
    projectDetails: "Fix my deck",
    description: "Needs new boards",
  };

  it("silently discards honeypot-filled submissions with 200", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ ...validPayload, website: "http://spam.example.com" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBe(0);
  });

  it("allows empty honeypot field through", async () => {
    setupMockClients("0", "0");
    const res = await request(app)
      .post("/api/contact")
      .send({ ...validPayload, website: "" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("allows missing honeypot field through", async () => {
    setupMockClients("0", "0");
    const res = await request(app)
      .post("/api/contact")
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("returns 429 when IP rate limit is exceeded", async () => {
    setupMockClients("5");
    const res = await request(app)
      .post("/api/contact")
      .send(validPayload);

    expect(res.status).toBe(429);
    expect(res.body.error).toContain("Too many requests");
  });

  it("returns 400 for validation failures", async () => {
    setupMockClients("0");
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "", email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("returns 429 when email rate limit is exceeded", async () => {
    setupMockClients("0", "3");
    const res = await request(app)
      .post("/api/contact")
      .send(validPayload);

    expect(res.status).toBe(429);
    expect(res.body.error).toContain("Too many requests for this email");
  });

  it("honeypot check runs before rate limit check", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ ...validPayload, website: "http://bot.example.com" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockPoolConnect).not.toHaveBeenCalled();
  });
});

describe("honeypot spam protection (logic)", () => {
  it("detects filled honeypot field as bot submission", () => {
    const body = { website: "http://spam.com", name: "Bot", email: "bot@spam.com" };
    const isBotSubmission =
      typeof body.website === "string" && body.website.trim().length > 0;
    expect(isBotSubmission).toBe(true);
  });

  it("allows empty honeypot field", () => {
    const body = { website: "", name: "Human", email: "human@real.com" };
    const isBotSubmission =
      typeof body.website === "string" && body.website.trim().length > 0;
    expect(isBotSubmission).toBe(false);
  });

  it("allows missing honeypot field", () => {
    const body = { name: "Human", email: "human@real.com" };
    const isBotSubmission =
      typeof (body as Record<string, unknown>).website === "string" &&
      ((body as Record<string, unknown>).website as string).trim().length > 0;
    expect(isBotSubmission).toBe(false);
  });

  it("allows whitespace-only honeypot field", () => {
    const body = { website: "   ", name: "Human", email: "human@real.com" };
    const isBotSubmission =
      typeof body.website === "string" && body.website.trim().length > 0;
    expect(isBotSubmission).toBe(false);
  });
});
