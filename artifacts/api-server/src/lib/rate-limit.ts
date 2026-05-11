export function pruneStore(store: Map<string, number[]>, windowMs: number, now = Date.now()): void {
  for (const [key, timestamps] of store) {
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) {
      store.delete(key);
    } else {
      store.set(key, valid);
    }
  }
}

export function checkRateLimit(
  store: Map<string, number[]>,
  key: string,
  windowMs: number,
  max: number,
  now = Date.now(),
): boolean {
  const hits = (store.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) return true;
  hits.push(now);
  store.set(key, hits);
  return false;
}
