import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Ads table - stores creative metadata
 */
export const ads = sqliteTable("ads", {
  id: text("id").primaryKey(),
  creativeId: text("creative_id").notNull(),
  name: text("name").notNull(),
  format: text("format").notNull(), // "video", "image", "carousel"
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url"),
  imageUrl: text("image_url"),

  // Ad copy
  headline: text("headline"),
  body: text("body"),
  callToAction: text("call_to_action"),

  // Campaign/AdSet context
  campaignId: text("campaign_id").notNull(),
  campaignName: text("campaign_name").notNull(),
  adsetId: text("adset_id").notNull(),
  adsetName: text("adset_name").notNull(),

  // Status & metadata
  status: text("status").notNull(), // "ACTIVE", "PAUSED", "ARCHIVED"
  createdTime: integer("created_time", { mode: "timestamp" }).notNull(),
  updatedTime: integer("updated_time", { mode: "timestamp" }).notNull(),

  // Sync metadata
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Daily metrics table - stores performance data per day per ad
 */
export const dailyMetrics = sqliteTable("daily_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adId: text("ad_id")
    .notNull()
    .references(() => ads.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD format

  // Core metrics
  spend: real("spend").notNull().default(0),
  impressions: integer("impressions").notNull().default(0),
  reach: integer("reach").notNull().default(0),
  frequency: real("frequency").notNull().default(0),

  // Click metrics
  clicks: integer("clicks").notNull().default(0),
  cpc: real("cpc").notNull().default(0),
  ctr: real("ctr").notNull().default(0),
  outboundClicks: integer("outbound_clicks").notNull().default(0),
  outboundClicksCtr: real("outbound_clicks_ctr").notNull().default(0),
  costPerOutboundClick: real("cost_per_outbound_click").notNull().default(0),
  inlineLinkClicks: integer("inline_link_clicks").notNull().default(0),
  inlineLinkClickCtr: real("inline_link_click_ctr").notNull().default(0),

  // Cost metrics
  cpm: real("cpm").notNull().default(0),

  // Video metrics
  video3sViews: integer("video_3s_views").notNull().default(0),
  video15sViews: integer("video_15s_views").notNull().default(0),
  video25Pct: integer("video_25_pct").notNull().default(0),
  video50Pct: integer("video_50_pct").notNull().default(0),
  video75Pct: integer("video_75_pct").notNull().default(0),
  video100Pct: integer("video_100_pct").notNull().default(0),
  videoAvgTimeWatched: real("video_avg_time_watched").notNull().default(0),
  videoThruPlays: integer("video_thru_plays").notNull().default(0),

  // Conversion metrics
  purchases: integer("purchases").notNull().default(0),
  purchaseValue: real("purchase_value").notNull().default(0),
  costPerPurchase: real("cost_per_purchase").notNull().default(0),
  purchaseRoas: real("purchase_roas").notNull().default(0),

  // Placement breakdown
  placement: text("placement"), // "feed", "stories", "reels", etc.
  platform: text("platform"), // "facebook", "instagram"

  // Sync metadata
  syncedAt: integer("synced_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Benchmarks table - stores percentile benchmarks for scoring
 */
export const benchmarks = sqliteTable("benchmarks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  metricName: text("metric_name").notNull().unique(),

  // Percentiles
  p10: real("p10").notNull(),
  p25: real("p25").notNull(),
  p50: real("p50").notNull(),
  p75: real("p75").notNull(),
  p90: real("p90").notNull(),

  // Metadata
  computedAt: integer("computed_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  sampleSize: integer("sample_size").notNull(), // Number of ads used to compute benchmarks
});

/**
 * User accounts table - stores Meta ad account connections
 */
export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),

  // Meta account info
  adAccountId: text("ad_account_id").notNull().unique(),
  adAccountName: text("ad_account_name").notNull(),
  accessToken: text("access_token").notNull(),
  tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),

  // User preferences
  currency: text("currency").notNull().default("EUR"),
  targetHookRate: real("target_hook_rate").default(30),
  targetCpa: real("target_cpa"),
  targetRoas: real("target_roas").default(3),

  // Sync settings
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  syncFrequency: text("sync_frequency").notNull().default("daily"), // "daily", "manual"

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Type exports for use in the app
export type Ad = typeof ads.$inferSelect;
export type NewAd = typeof ads.$inferInsert;
export type DailyMetric = typeof dailyMetrics.$inferSelect;
export type NewDailyMetric = typeof dailyMetrics.$inferInsert;
export type Benchmark = typeof benchmarks.$inferSelect;
export type NewBenchmark = typeof benchmarks.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
