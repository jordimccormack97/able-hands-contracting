import { Router, type IRouter, type Request } from "express";
import { db, pool } from "@workspace/db";
import {
  contactSubmissionsTable,
  insertContactSubmissionSchema,
} from "@workspace/db/schema";
import { sendContactNotification } from "../lib/email";
import { logger } from "../lib/logger";
import { pruneStats } from "../lib/pruneStats";

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

export const IP_RATE_WINDOW_MS = parsePositiveInt(process.env.IP_RATE_WINDOW_MS, 60_000);
export const IP_RATE_MAX = parsePositiveInt(process.env.IP_RATE_MAX, 5);

export const EMAIL_RATE_WINDOW_MS = parsePositiveInt(process.env.EMAIL_RATE_WINDOW_MS, 900_000);
export const EMAIL_RATE_MAX = parsePositiveInt(process.env.EMAIL_RATE_MAX, 3);

const RATE_LIMIT_TABLE_WARN_THRESHOLD = (() => {
  const parsed = parseInt(process.env.RATE_LIMIT_TABLE_WARN_THRESHOLD || "10000", 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 10_000;
  }
  return parsed;
})();

async function pruneExpiredHits(): Promise<void> {
  const start = Date.now();
  const cutoff = start - Math.max(IP_RATE_WINDOW_MS, EMAIL_RATE_WINDOW_MS);
  const result = await pool.query("DELETE FROM rate_limits WHERE hit_at <= $1", [cutoff]);
  const deletedCount = result.rowCount ?? 0;
  const durationMs = Date.now() - start;
  pruneStats.lastPruneAt = new Date();
  pruneStats.lastPruneDurationMs = durationMs;
  pruneStats.lastPruneDeletedCount = deletedCount;
  logger.info({ deletedCount, durationMs }, "Rate limit pruning completed");

  const countResult = await pool.query<{ cnt: string }>(
    "SELECT COUNT(*) AS cnt FROM rate_limits",
  );
  const tableSize = parseInt(countResult.rows[0].cnt, 10);
  if (tableSize >= RATE_LIMIT_TABLE_WARN_THRESHOLD) {
    logger.warn(
      { tableSize, threshold: RATE_LIMIT_TABLE_WARN_THRESHOLD },
      "Rate limit table size exceeds warning threshold",
    );
  }
}

const pruneTimer = setInterval(() => {
  pruneExpiredHits().catch((err) => {
    logger.error({ err }, "Rate limit pruning failed");
  });
}, 2 * 60_000);
pruneTimer.unref();

function advisoryLockKey(category: string, key: string): string {
  let hash = 0x811c9dc5;
  const str = `${category}:${key}`;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return String(hash & 0x7fffffff);
}

export async function checkRateLimit(
  category: string,
  key: string,
  windowMs: number,
  max: number,
): Promise<boolean> {
  const client = await pool.connect();
  try {
    const now = Date.now();
    const cutoff = now - windowMs;
    const lockId = advisoryLockKey(category, key);

    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [lockId]);

    const countResult = await client.query<{ cnt: string }>(
      "SELECT COUNT(*) AS cnt FROM rate_limits WHERE category = $1 AND key = $2 AND hit_at >= $3",
      [category, key, cutoff],
    );

    const count = parseInt(countResult.rows[0].cnt, 10);

    if (count >= max) {
      await client.query("COMMIT");
      return true;
    }

    await client.query(
      "INSERT INTO rate_limits (category, key, hit_at) VALUES ($1, $2, $3)",
      [category, key, now],
    );

    await client.query("COMMIT");
    return false;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function isIpRateLimited(req: Request): Promise<boolean> {
  const ip = req.ip || "unknown";
  return checkRateLimit("ip", ip, IP_RATE_WINDOW_MS, IP_RATE_MAX);
}

export async function isEmailRateLimited(email: string): Promise<boolean> {
  const normalized = email.toLowerCase();
  return checkRateLimit("email", normalized, EMAIL_RATE_WINDOW_MS, EMAIL_RATE_MAX);
}

const router: IRouter = Router();

router.post("/contact", async (req, res) => {
  if (typeof req.body?.website === "string" && req.body.website.trim().length > 0) {
    res.status(200).json({ success: true, id: 0 });
    return;
  }

  if (await isIpRateLimited(req)) {
    res
      .status(429)
      .json({ error: "Too many requests. Please try again later." });
    return;
  }

  const parsed = insertContactSubmissionSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }

  let uploads: Array<{ url: string; name: string; type: string; size: number }> = [];
  if (Array.isArray(parsed.data.uploads)) {
    uploads = parsed.data.uploads.slice(0, 10);
    for (const u of uploads) {
      if (
        typeof u?.url !== "string" ||
        (!u.url.startsWith("/api/storage/objects/") &&
          !u.url.startsWith("/objects/") &&
          !u.url.startsWith("https://storage.googleapis.com/"))
      ) {
        res.status(400).json({ error: "Invalid upload URL detected" });
        return;
      }
    }
  }
  parsed.data.uploads = uploads;

  if (parsed.data.serviceDetails && typeof parsed.data.serviceDetails !== "object") {
    parsed.data.serviceDetails = {};
  }

  if (await isEmailRateLimited(parsed.data.email)) {
    res
      .status(429)
      .json({ error: "Too many requests for this email. Please try again later." });
    return;
  }

  try {
    const [submission] = await db
      .insert(contactSubmissionsTable)
      .values(parsed.data)
      .returning();

    sendContactNotification(parsed.data).catch((emailErr) => {
      req.log.error({ emailErr }, "Failed to send contact notification email");
    });

    res.status(201).json({ success: true, id: submission.id });
  } catch (err) {
    req.log.error({ err }, "Failed to save contact submission");
    res.status(500).json({ error: "Failed to save submission" });
  }
});

export default router;
