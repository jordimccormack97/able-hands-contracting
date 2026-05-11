export interface PruneStats {
  lastPruneAt: Date | null;
  lastPruneDurationMs: number | null;
  lastPruneDeletedCount: number | null;
}

export const pruneStats: PruneStats = {
  lastPruneAt: null,
  lastPruneDurationMs: null,
  lastPruneDeletedCount: null,
};
