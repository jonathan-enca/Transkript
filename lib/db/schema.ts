import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Ads table - stores creative metadata
 */
export const ads = sqliteTable("ads", {
  id: text("id").primaryKey(),
  accountId: text("account_id"), // Reference to accounts table
  creativeId: text("creative_id").notNull(),
  name: text("name").notNull(),
  format: text("format").notNull(), // "video", "image", "carousel", "dynamic"
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url"),
  imageUrl: text("image_url"),
  videoDurationSeconds: integer("video_duration_seconds"),

  // Ad copy
  headline: text("headline"),
  body: text("body"),
  callToAction: text("call_to_action"),

  // Campaign/AdSet context
  campaignId: text("campaign_id").notNull(),
  campaignName: text("campaign_name").notNull(),
  campaignObjective: text("campaign_objective"),
  adsetId: text("adset_id").notNull(),
  adsetName: text("adset_name").notNull(),

  // Status & metadata
  status: text("status").notNull(), // "ACTIVE", "PAUSED", "ARCHIVED"
  createdTime: integer("created_time", { mode: "timestamp" }).notNull(),
  updatedTime: integer("updated_time", { mode: "timestamp" }).notNull(),

  // Activity tracking (calculated during sync)
  firstSpendDate: text("first_spend_date"), // YYYY-MM-DD - First date with spend > 0
  lastActiveDate: text("last_active_date"), // YYYY-MM-DD - Last date with spend > 0
  daysActive: integer("days_active").default(0), // Number of days with spend > 0
  totalSpend: real("total_spend").default(0), // Cumulative spend (denormalized for perf)

  // Tags (parsed from naming convention or set manually)
  tagConcept: text("tag_concept"), // e.g., "UGC", "Testimonial", "Product"
  tagHook: text("tag_hook"), // e.g., "ProblemAware", "SocialProof", "Curiosity"
  tagFormat: text("tag_format"), // e.g., "Talking Head", "B-Roll", "Static Lifestyle"
  tagOffer: text("tag_offer"), // e.g., "-20%", "Free Shipping", "Bundle"
  tagCreator: text("tag_creator"), // e.g., "Sarah", "In-house", "Agency"
  tagLanguage: text("tag_language"), // e.g., "FR", "EN"

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
  addToCart: integer("add_to_cart").default(0),
  initiateCheckout: integer("initiate_checkout").default(0),

  // Calculated metrics (computed during sync)
  hookRate: real("hook_rate").default(0), // 3s views / impressions * 100
  holdRate: real("hold_rate").default(0), // ThruPlay / 3s views * 100

  // Meta quality signals
  qualityRanking: text("quality_ranking"),
  engagementRateRanking: text("engagement_rate_ranking"),
  conversionRateRanking: text("conversion_rate_ranking"),

  // Breakdowns (stored as JSON)
  breakdownPlatform: text("breakdown_platform"), // JSON: {"facebook": {...}, "instagram": {...}}
  breakdownPlacement: text("breakdown_placement"), // JSON: {"feed": {...}, "stories": {...}, "reels": {...}}

  // Legacy fields (kept for backwards compatibility)
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
  metricName: text("metric_name").notNull(), // e.g., 'hook_rate', 'ctr', 'cpa', 'roas'
  period: text("period").notNull(), // 'last_30d', 'last_90d', 'all_time'
  formatFilter: text("format_filter").notNull().default("all"), // 'all', 'video', 'image'

  // Percentiles
  p10: real("p10").notNull(),
  p25: real("p25").notNull(),
  p50: real("p50").notNull(),
  p75: real("p75").notNull(),
  p90: real("p90").notNull(),
  mean: real("mean").notNull(),

  // Metadata
  computedAt: integer("computed_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  sampleSize: integer("sample_size").notNull(), // Number of ads used to compute benchmarks
});

/**
 * Sync log table - tracks sync history
 */
export const syncLog = sqliteTable("sync_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(), // 'initial', 'daily_cron', 'manual'
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  adsSynced: integer("ads_synced").default(0),
  daysSynced: integer("days_synced").default(0),
  errors: text("errors"), // JSON array of errors
  status: text("status").notNull(), // 'running', 'success', 'partial', 'failed'
});

/**
 * User settings table - stores app configuration
 */
export const userSettings = sqliteTable("user_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(), // JSON value
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
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

/**
 * Concepts table - groups ads by concept
 */
export const concepts = sqliteTable("concepts", {
  id: text("id").primaryKey(), // UUID
  name: text("name").notNull(), // Display name
  description: text("description"),
  groupingMethod: text("grouping_method").notNull(), // 'naming_convention' | 'fuzzy' | 'manual'
  conceptKey: text("concept_key"), // Pattern that formed the group
  representativeAdId: text("representative_ad_id"), // Hero ad (most spend)
  thumbnailUrl: text("thumbnail_url"),
  firstLaunchDate: text("first_launch_date"), // YYYY-MM-DD
  status: text("status").notNull(), // 'active' | 'paused' | 'retired'
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Ad-Concept junction table
 */
export const adConcepts = sqliteTable("ad_concepts", {
  adId: text("ad_id")
    .notNull()
    .references(() => ads.id, { onDelete: "cascade" }),
  conceptId: text("concept_id")
    .notNull()
    .references(() => concepts.id, { onDelete: "cascade" }),
  isManualOverride: integer("is_manual_override", { mode: "boolean" }).default(false),
  variationLabel: text("variation_label"), // What differentiates this ad from others in concept
});

/**
 * Concept daily metrics - aggregated metrics per concept per day
 */
export const conceptMetrics = sqliteTable("concept_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conceptId: text("concept_id")
    .notNull()
    .references(() => concepts.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD

  // Aggregated metrics (sums)
  totalSpend: real("total_spend").default(0),
  totalImpressions: integer("total_impressions").default(0),
  totalClicks: integer("total_clicks").default(0),
  totalOutboundClicks: integer("total_outbound_clicks").default(0),
  totalPurchases: integer("total_purchases").default(0),
  totalPurchaseValue: real("total_purchase_value").default(0),
  totalVideo3sViews: integer("total_video_3s_views").default(0),
  totalVideoThruplay: integer("total_video_thruplay").default(0),

  // Calculated metrics (on aggregated totals)
  avgCpa: real("avg_cpa").default(0),
  avgRoas: real("avg_roas").default(0),
  avgCtr: real("avg_ctr").default(0),
  avgCpm: real("avg_cpm").default(0),
  avgHookRate: real("avg_hook_rate").default(0),
  avgHoldRate: real("avg_hold_rate").default(0),

  // Concept metadata at this date
  activeAdsCount: integer("active_ads_count").default(0),
  totalAdsCount: integer("total_ads_count").default(0),
});

/**
 * Account daily metrics - for Media Buying module
 */
export const accountDailyMetrics = sqliteTable("account_daily_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: text("account_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD

  // Core metrics
  spend: real("spend").default(0),
  impressions: integer("impressions").default(0),
  reach: integer("reach").default(0),
  frequency: real("frequency").default(0),
  clicks: integer("clicks").default(0),
  uniqueClicks: integer("unique_clicks").default(0),
  cpc: real("cpc").default(0),
  cpm: real("cpm").default(0),
  ctr: real("ctr").default(0),
  outboundClicks: integer("outbound_clicks").default(0),
  outboundCtr: real("outbound_ctr").default(0),
  linkClicks: integer("link_clicks").default(0),

  // Funnel events
  viewContent: integer("view_content").default(0),
  viewContentValue: real("view_content_value").default(0),
  addToCart: integer("add_to_cart").default(0),
  addToCartValue: real("add_to_cart_value").default(0),
  initiateCheckout: integer("initiate_checkout").default(0),
  initiateCheckoutValue: real("initiate_checkout_value").default(0),
  purchases: integer("purchases").default(0),
  purchaseValue: real("purchase_value").default(0),

  // Calculated metrics
  roas: real("roas").default(0),
  cpa: real("cpa").default(0),
  costPerAtc: real("cost_per_atc").default(0),
  costPerIc: real("cost_per_ic").default(0),
  atcRate: real("atc_rate").default(0), // add_to_cart / link_clicks * 100
  icRate: real("ic_rate").default(0), // initiate_checkout / add_to_cart * 100
  purchaseRate: real("purchase_rate").default(0), // purchases / initiate_checkout * 100
  clickToPurchaseRate: real("click_to_purchase_rate").default(0), // purchases / link_clicks * 100
  aov: real("aov").default(0), // purchase_value / purchases
});

/**
 * Campaign daily metrics - for Media Buying module
 */
export const campaignDailyMetrics = sqliteTable("campaign_daily_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: text("campaign_id").notNull(),
  campaignName: text("campaign_name").notNull(),
  campaignObjective: text("campaign_objective"),
  accountId: text("account_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD

  // Core metrics
  spend: real("spend").default(0),
  impressions: integer("impressions").default(0),
  reach: integer("reach").default(0),
  frequency: real("frequency").default(0),
  clicks: integer("clicks").default(0),
  cpc: real("cpc").default(0),
  cpm: real("cpm").default(0),
  ctr: real("ctr").default(0),
  outboundClicks: integer("outbound_clicks").default(0),

  // Funnel events
  viewContent: integer("view_content").default(0),
  addToCart: integer("add_to_cart").default(0),
  initiateCheckout: integer("initiate_checkout").default(0),
  purchases: integer("purchases").default(0),
  purchaseValue: real("purchase_value").default(0),

  // Calculated metrics
  roas: real("roas").default(0),
  cpa: real("cpa").default(0),
  aov: real("aov").default(0),

  // Campaign metadata
  status: text("status").notNull(), // 'ACTIVE', 'PAUSED', 'ARCHIVED'
  funnelStage: text("funnel_stage"), // 'TOF' | 'MOF' | 'BOF' | 'RETARGETING' | 'RETENTION' | null
});

/**
 * AdSet daily metrics - for Media Buying module
 */
export const adsetDailyMetrics = sqliteTable("adset_daily_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adsetId: text("adset_id").notNull(),
  adsetName: text("adset_name").notNull(),
  campaignId: text("campaign_id").notNull(),
  accountId: text("account_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD

  // Core metrics
  spend: real("spend").default(0),
  impressions: integer("impressions").default(0),
  reach: integer("reach").default(0),
  frequency: real("frequency").default(0),
  cpc: real("cpc").default(0),
  cpm: real("cpm").default(0),
  ctr: real("ctr").default(0),
  purchases: integer("purchases").default(0),
  purchaseValue: real("purchase_value").default(0),
  roas: real("roas").default(0),
  cpa: real("cpa").default(0),

  // AdSet metadata
  status: text("status").notNull(),
  dailyBudget: real("daily_budget"),
  bidStrategy: text("bid_strategy"),
  optimizationGoal: text("optimization_goal"),

  // Breakdown (JSON)
  ageGenderBreakdown: text("age_gender_breakdown"), // JSON
});

/**
 * Budget targets - for Media Buying pacing
 */
export const budgetTargets = sqliteTable("budget_targets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: text("account_id").notNull(),
  periodType: text("period_type").notNull(), // 'daily' | 'weekly' | 'monthly'
  periodStart: text("period_start").notNull(), // YYYY-MM-DD
  periodEnd: text("period_end").notNull(), // YYYY-MM-DD
  targetSpend: real("target_spend").notNull(),
  targetRoas: real("target_roas"),
  targetCpa: real("target_cpa"),
  targetPurchases: integer("target_purchases"),
  notes: text("notes"),
});

/**
 * Daily recommendations - auto-generated actions for media buyers
 */
export const dailyRecommendations = sqliteTable("daily_recommendations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: text("account_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  type: text("type").notNull(), // 'scale' | 'cut' | 'watch' | 'test' | 'budget' | 'alert'
  priority: text("priority").notNull(), // 'high' | 'medium' | 'low'
  entityType: text("entity_type").notNull(), // 'account' | 'campaign' | 'adset' | 'ad'
  entityId: text("entity_id"),
  entityName: text("entity_name"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dataPoints: text("data_points"), // JSON with supporting data
  status: text("status").notNull().default("pending"), // 'pending' | 'applied' | 'dismissed'
  createdAt: integer("created_at", { mode: "timestamp" })
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
export type SyncLog = typeof syncLog.$inferSelect;
export type NewSyncLog = typeof syncLog.$inferInsert;
export type UserSetting = typeof userSettings.$inferSelect;
export type NewUserSetting = typeof userSettings.$inferInsert;
export type Concept = typeof concepts.$inferSelect;
export type NewConcept = typeof concepts.$inferInsert;
export type AdConcept = typeof adConcepts.$inferSelect;
export type NewAdConcept = typeof adConcepts.$inferInsert;
export type ConceptMetric = typeof conceptMetrics.$inferSelect;
export type NewConceptMetric = typeof conceptMetrics.$inferInsert;
export type AccountDailyMetric = typeof accountDailyMetrics.$inferSelect;
export type NewAccountDailyMetric = typeof accountDailyMetrics.$inferInsert;
export type CampaignDailyMetric = typeof campaignDailyMetrics.$inferSelect;
export type NewCampaignDailyMetric = typeof campaignDailyMetrics.$inferInsert;
export type AdsetDailyMetric = typeof adsetDailyMetrics.$inferSelect;
export type NewAdsetDailyMetric = typeof adsetDailyMetrics.$inferInsert;
export type BudgetTarget = typeof budgetTargets.$inferSelect;
export type NewBudgetTarget = typeof budgetTargets.$inferInsert;
export type DailyRecommendation = typeof dailyRecommendations.$inferSelect;
export type NewDailyRecommendation = typeof dailyRecommendations.$inferInsert;
