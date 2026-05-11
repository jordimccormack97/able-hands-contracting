import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, pruneStore } from "./rate-limit";

describe("checkRateLimit", () => {
  let store: Map<string, number[]>;
  const windowMs = 60_000;
  const max = 5;
  const now = 1_000_000;

  beforeEach(() => {
    store = new Map();
  });

  it("allows requests under the limit", () => {
    for (let i = 0; i < max; i++) {
      expect(checkRateLimit(store, "key1", windowMs, max, now + i)).toBe(false);
    }
  });

  it("blocks when the limit is reached", () => {
    for (let i = 0; i < max; i++) {
      checkRateLimit(store, "key1", windowMs, max, now + i);
    }
    expect(checkRateLimit(store, "key1", windowMs, max, now + max)).toBe(true);
  });

  it("resets after the time window elapses", () => {
    for (let i = 0; i < max; i++) {
      checkRateLimit(store, "key1", windowMs, max, now + i);
    }
    expect(checkRateLimit(store, "key1", windowMs, max, now + max)).toBe(true);

    const afterWindow = now + windowMs + 1;
    expect(checkRateLimit(store, "key1", windowMs, max, afterWindow)).toBe(false);
  });

  it("tracks different keys independently", () => {
    for (let i = 0; i < max; i++) {
      checkRateLimit(store, "key1", windowMs, max, now + i);
    }
    expect(checkRateLimit(store, "key1", windowMs, max, now + max)).toBe(true);
    expect(checkRateLimit(store, "key2", windowMs, max, now + max)).toBe(false);
  });

  it("records timestamps correctly in the store", () => {
    checkRateLimit(store, "key1", windowMs, max, now);
    checkRateLimit(store, "key1", windowMs, max, now + 100);
    const timestamps = store.get("key1")!;
    expect(timestamps).toEqual([now, now + 100]);
  });

  it("evicts stale timestamps when checking", () => {
    checkRateLimit(store, "key1", windowMs, max, now);
    checkRateLimit(store, "key1", windowMs, max, now + 1);

    const afterWindow = now + windowMs + 1;
    checkRateLimit(store, "key1", windowMs, max, afterWindow);
    const timestamps = store.get("key1")!;
    expect(timestamps).toEqual([afterWindow]);
  });
});

describe("pruneStore", () => {
  let store: Map<string, number[]>;
  const windowMs = 60_000;
  const now = 1_000_000;

  beforeEach(() => {
    store = new Map();
  });

  it("removes entries whose timestamps are all expired", () => {
    store.set("expired", [now - windowMs - 1]);
    pruneStore(store, windowMs, now);
    expect(store.has("expired")).toBe(false);
  });

  it("keeps entries with at least one valid timestamp", () => {
    store.set("partial", [now - windowMs - 1, now - 100]);
    pruneStore(store, windowMs, now);
    expect(store.has("partial")).toBe(true);
    expect(store.get("partial")).toEqual([now - 100]);
  });

  it("keeps fully valid entries unchanged", () => {
    const timestamps = [now - 1000, now - 500, now - 100];
    store.set("valid", [...timestamps]);
    pruneStore(store, windowMs, now);
    expect(store.get("valid")).toEqual(timestamps);
  });

  it("handles an empty store", () => {
    pruneStore(store, windowMs, now);
    expect(store.size).toBe(0);
  });

  it("prunes multiple keys correctly", () => {
    store.set("expired1", [now - windowMs - 100]);
    store.set("expired2", [now - windowMs - 200]);
    store.set("valid1", [now - 100]);
    store.set("partial", [now - windowMs - 1, now - 50]);
    pruneStore(store, windowMs, now);

    expect(store.has("expired1")).toBe(false);
    expect(store.has("expired2")).toBe(false);
    expect(store.has("valid1")).toBe(true);
    expect(store.has("partial")).toBe(true);
    expect(store.get("partial")).toEqual([now - 50]);
  });
});
