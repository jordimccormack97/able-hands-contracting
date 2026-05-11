import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID, createHash } from "crypto";
import { db, pool } from "@workspace/db";
import { contactSubmissionsTable, adminSessionsTable, submissionStatusEnum, type SubmissionStatus } from "@workspace/db/schema";
import { and, desc, eq, ilike, lt, or } from "drizzle-orm";
import { pruneStats } from "../lib/pruneStats";

function isValidStatus(value: string): value is SubmissionStatus {
  return (submissionStatusEnum as readonly string[]).includes(value);
}

const router: IRouter = Router();

const SESSION_TTL_MS = Math.max(
  60_000,
  Math.min(Number(process.env.ADMIN_SESSION_TTL_MS) || 60 * 60 * 1000, 24 * 60 * 60 * 1000),
);
const COOKIE_NAME = "admin_session";

function extractRequestOriginHost(req: Request): string | null {
  const origin = req.headers["origin"] as string | undefined;
  if (origin) {
    try {
      return new URL(origin).host;
    } catch {
      return "";
    }
  }

  const referer = req.headers["referer"] as string | undefined;
  if (referer) {
    try {
      return new URL(referer).host;
    } catch {
      return "";
    }
  }

  return null;
}

function rejectCrossOrigin(req: Request, res: Response, strict = false): boolean {
  const sourceHost = extractRequestOriginHost(req);

  if (sourceHost === null) {
    if (strict) {
      res.status(403).json({ error: "Forbidden" });
      return true;
    }
    return false;
  }

  const host = req.headers["host"];
  if (!host || sourceHost !== host) {
    res.status(403).json({ error: "Forbidden" });
    return true;
  }

  return false;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function pruneExpiredSessions(): Promise<void> {
  await db
    .delete(adminSessionsTable)
    .where(lt(adminSessionsTable.expiresAt, new Date()));
}

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const hashed = hashToken(token);
  const [session] = await db
    .select()
    .from(adminSessionsTable)
    .where(eq(adminSessionsTable.token, hashed))
    .limit(1);
  if (!session) return false;
  if (new Date() > session.expiresAt) {
    await db.delete(adminSessionsTable).where(eq(adminSessionsTable.token, hashed));
    return false;
  }
  return true;
}

async function requireAdminSession(req: Request, res: Response): Promise<boolean> {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!(await isValidSession(token))) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  return true;
}

function parsePositiveInt(envVar: string | undefined, fallback: number): number {
  if (envVar === undefined) return fallback;
  const n = Number(envVar);
  if (!Number.isInteger(n) || n < 1) {
    console.warn(
      `Invalid env value "${envVar}" (expected positive integer), using default ${fallback}`,
    );
    return fallback;
  }
  return n;
}

const ADMIN_RATE_WINDOW_MS = parsePositiveInt(process.env.ADMIN_RATE_WINDOW_MS, 60_000);
const ADMIN_RATE_MAX = parsePositiveInt(process.env.ADMIN_RATE_MAX, 10);
const adminIpHits = new Map<string, number[]>();

function isAdminRateLimited(req: Request): boolean {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown";
  const now = Date.now();
  const hits = (adminIpHits.get(ip) || []).filter(
    (t) => now - t < ADMIN_RATE_WINDOW_MS,
  );
  if (hits.length >= ADMIN_RATE_MAX) return true;
  hits.push(now);
  adminIpHits.set(ip, hits);
  return false;
}

router.post("/admin/login", async (req, res) => {
  if (rejectCrossOrigin(req, res, true)) return;
  if (isAdminRateLimited(req)) {
    res
      .status(429)
      .json({ error: "Too many requests. Please try again later." });
    return;
  }

  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    res.status(503).json({ error: "Admin access is not configured" });
    return;
  }

  const provided = req.body?.key as string | undefined;
  if (!provided || provided !== adminKey) {
    res.status(401).json({ error: "Invalid admin key" });
    return;
  }

  await pruneExpiredSessions();

  const token = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await db.insert(adminSessionsTable).values({ token: hashToken(token), createdAt: now, expiresAt });

  const isProduction = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });

  res.json({ ok: true });
});

router.post("/admin/logout", async (req, res) => {
  if (rejectCrossOrigin(req, res, true)) return;
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (token) {
    await db.delete(adminSessionsTable).where(eq(adminSessionsTable.token, hashToken(token)));
  }
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

router.get("/admin/session", async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (await isValidSession(token)) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

router.get("/admin/submissions", async (req, res) => {
  if (isAdminRateLimited(req)) {
    res
      .status(429)
      .json({ error: "Too many requests. Please try again later." });
    return;
  }
  if (!(await requireAdminSession(req, res))) return;

  const search = (req.query.search as string) || "";
  const statusFilter = (req.query.status as string) || "";
  const sourceFilter = (req.query.source as string) || "";
  const serviceFilter = (req.query.serviceType as string) || "";
  const zipFilter = (req.query.zip as string) || "";

  try {
    const conditions = [];

    if (statusFilter && isValidStatus(statusFilter)) {
      conditions.push(eq(contactSubmissionsTable.status, statusFilter));
    }

    if (sourceFilter) {
      conditions.push(eq(contactSubmissionsTable.source, sourceFilter));
    }

    if (serviceFilter) {
      conditions.push(eq(contactSubmissionsTable.serviceType, serviceFilter));
    }

    if (zipFilter.trim()) {
      conditions.push(ilike(contactSubmissionsTable.zipCode, `${zipFilter.trim()}%`));
    }

    if (search.trim()) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(contactSubmissionsTable.name, pattern),
          ilike(contactSubmissionsTable.email, pattern),
          ilike(contactSubmissionsTable.phone, pattern),
          ilike(contactSubmissionsTable.projectSummary, pattern),
          ilike(contactSubmissionsTable.projectDetails, pattern),
          ilike(contactSubmissionsTable.description, pattern),
          ilike(contactSubmissionsTable.zipCode, pattern),
        )!,
      );
    }

    let query = db
      .select()
      .from(contactSubmissionsTable)
      .orderBy(desc(contactSubmissionsTable.createdAt));

    if (conditions.length === 1) {
      query = query.where(conditions[0]) as typeof query;
    } else if (conditions.length > 1) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const submissions = await query;
    res.json({ submissions });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch submissions");
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

router.patch("/admin/submissions/:id/status", async (req, res) => {
  if (isAdminRateLimited(req)) {
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return;
  }
  if (!(await requireAdminSession(req, res))) return;

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid submission ID" });
    return;
  }

  const { status } = req.body as { status: string };
  if (!status || !isValidStatus(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${submissionStatusEnum.join(", ")}` });
    return;
  }

  try {
    const [updated] = await db
      .update(contactSubmissionsTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(contactSubmissionsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    res.json({ submission: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update submission status");
    res.status(500).json({ error: "Failed to update submission status" });
  }
});

router.patch("/admin/submissions/:id/notes", async (req, res) => {
  if (isAdminRateLimited(req)) {
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return;
  }
  if (!(await requireAdminSession(req, res))) return;

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid submission ID" });
    return;
  }

  const { notes } = req.body as { notes: string };
  if (typeof notes !== "string") {
    res.status(400).json({ error: "Notes must be a string" });
    return;
  }

  try {
    const [updated] = await db
      .update(contactSubmissionsTable)
      .set({ notes, updatedAt: new Date() })
      .where(eq(contactSubmissionsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    res.json({ submission: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update notes");
    res.status(500).json({ error: "Failed to update notes" });
  }
});

router.delete("/admin/submissions/:id", async (req, res) => {
  if (isAdminRateLimited(req)) {
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return;
  }
  if (!(await requireAdminSession(req, res))) return;

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid submission ID" });
    return;
  }

  try {
    const [deleted] = await db
      .delete(contactSubmissionsTable)
      .where(eq(contactSubmissionsTable.id, id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete submission");
    res.status(500).json({ error: "Failed to delete submission" });
  }
});

const serverStartedAt = new Date();

router.get("/admin/health", async (req, res) => {
  if (isAdminRateLimited(req)) {
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return;
  }
  if (!(await requireAdminSession(req, res))) return;

  try {
    const countResult = await pool.query<{ cnt: string }>(
      "SELECT COUNT(*) AS cnt FROM rate_limits",
    );
    const rateLimitTableSize = parseInt(countResult.rows[0].cnt, 10);

    res.json({
      status: "ok",
      uptimeSeconds: Math.floor((Date.now() - serverStartedAt.getTime()) / 1000),
      serverStartedAt: serverStartedAt.toISOString(),
      rateLimits: {
        tableSize: rateLimitTableSize,
        lastPrune: pruneStats.lastPruneAt
          ? {
              at: pruneStats.lastPruneAt.toISOString(),
              durationMs: pruneStats.lastPruneDurationMs,
              deletedCount: pruneStats.lastPruneDeletedCount,
            }
          : null,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Health check failed");
    res.status(500).json({ error: "Health check failed" });
  }
});

const SESSION_CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
setInterval(() => {
  pruneExpiredSessions().catch(() => {});
}, SESSION_CLEANUP_INTERVAL_MS);

export default router;
