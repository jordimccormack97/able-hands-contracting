import { pgTable, serial, text, bigint, index } from "drizzle-orm/pg-core";

export const rateLimitsTable = pgTable(
  "rate_limits",
  {
    id: serial("id").primaryKey(),
    category: text("category").notNull(),
    key: text("key").notNull(),
    hitAt: bigint("hit_at", { mode: "number" }).notNull(),
  },
  (table) => [
    index("rate_limits_category_key_idx").on(table.category, table.key),
    index("rate_limits_hit_at_idx").on(table.hitAt),
  ],
);
