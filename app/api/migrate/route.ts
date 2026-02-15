import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

/**
 * POST /api/migrate
 * Run database migrations (creates tables if they don't exist)
 *
 * This is a one-time setup endpoint to initialize the database schema.
 */
export async function POST() {
  try {
    console.log("🚀 Running database migrations...");

    // Check schema version to avoid data loss
    let schemaVersion = 0;
    try {
      const versionResult = await db.run(sql`
        SELECT value FROM user_settings WHERE key = 'schema_version'
      `);
      schemaVersion = parseInt((versionResult as any).rows?.[0]?.value || "0");
    } catch {
      // Table doesn't exist yet, this is first migration
      schemaVersion = 0;
    }

    console.log(`📊 Current schema version: ${schemaVersion}`);

    // Create accounts table (keep existing data)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id TEXT NOT NULL,
        ad_account_id TEXT NOT NULL,
        ad_account_name TEXT NOT NULL,
        access_token TEXT NOT NULL,
        token_expires_at INTEGER,
        currency TEXT DEFAULT 'EUR' NOT NULL,
        target_hook_rate REAL DEFAULT 30,
        target_cpa REAL,
        target_roas REAL DEFAULT 3,
        last_sync_at INTEGER,
        sync_frequency TEXT DEFAULT 'daily' NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
      )
    `);

    await db.run(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS accounts_ad_account_id_unique
      ON accounts (ad_account_id)
    `);

    // Only DROP tables on first migration (schema_version = 0)
    // After that, we keep historical data
    if (schemaVersion === 0) {
      console.log("🔄 First migration - recreating tables with correct schema...");

      // Drop old ads table if it exists (to recreate with correct schema)
      console.log("🗑️ Dropping old ads table if exists...");
      await db.run(sql`DROP TABLE IF EXISTS ads`);

      // Create ads table with all fields
      console.log("📦 Creating ads table with full schema...");
      await db.run(sql`
        CREATE TABLE ads (
        id TEXT PRIMARY KEY NOT NULL,
        account_id TEXT,
        creative_id TEXT NOT NULL,
        name TEXT NOT NULL,
        format TEXT NOT NULL,
        thumbnail_url TEXT,
        video_url TEXT,
        image_url TEXT,
        video_duration_seconds INTEGER,
        headline TEXT,
        body TEXT,
        call_to_action TEXT,
        campaign_id TEXT NOT NULL,
        campaign_name TEXT NOT NULL,
        campaign_objective TEXT,
        adset_id TEXT NOT NULL,
        adset_name TEXT NOT NULL,
        status TEXT NOT NULL,
        created_time INTEGER NOT NULL,
        updated_time INTEGER NOT NULL,
        first_spend_date TEXT,
        last_active_date TEXT,
        days_active INTEGER DEFAULT 0,
        total_spend REAL DEFAULT 0,
        tag_concept TEXT,
        tag_hook TEXT,
        tag_format TEXT,
        tag_offer TEXT,
        tag_creator TEXT,
        tag_language TEXT,
        last_synced_at INTEGER DEFAULT (unixepoch()) NOT NULL
      )
    `);

      // Drop old daily_metrics table if it exists (to recreate with correct schema)
      console.log("🗑️ Dropping old daily_metrics table if exists...");
      await db.run(sql`DROP TABLE IF EXISTS daily_metrics`);

      // Create daily_metrics table
      console.log("📦 Creating daily_metrics table with full schema...");
      await db.run(sql`
        CREATE TABLE daily_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        ad_id TEXT NOT NULL,
        date TEXT NOT NULL,
        spend REAL DEFAULT 0 NOT NULL,
        impressions INTEGER DEFAULT 0 NOT NULL,
        reach INTEGER DEFAULT 0 NOT NULL,
        frequency REAL DEFAULT 0 NOT NULL,
        clicks INTEGER DEFAULT 0 NOT NULL,
        cpc REAL DEFAULT 0 NOT NULL,
        ctr REAL DEFAULT 0 NOT NULL,
        outbound_clicks INTEGER DEFAULT 0 NOT NULL,
        outbound_clicks_ctr REAL DEFAULT 0 NOT NULL,
        cost_per_outbound_click REAL DEFAULT 0 NOT NULL,
        inline_link_clicks INTEGER DEFAULT 0 NOT NULL,
        inline_link_click_ctr REAL DEFAULT 0 NOT NULL,
        cpm REAL DEFAULT 0 NOT NULL,
        video_3s_views INTEGER DEFAULT 0 NOT NULL,
        video_15s_views INTEGER DEFAULT 0 NOT NULL,
        video_25_pct INTEGER DEFAULT 0 NOT NULL,
        video_50_pct INTEGER DEFAULT 0 NOT NULL,
        video_75_pct INTEGER DEFAULT 0 NOT NULL,
        video_100_pct INTEGER DEFAULT 0 NOT NULL,
        video_avg_time_watched REAL DEFAULT 0 NOT NULL,
        video_thru_plays INTEGER DEFAULT 0 NOT NULL,
        purchases INTEGER DEFAULT 0 NOT NULL,
        purchase_value REAL DEFAULT 0 NOT NULL,
        cost_per_purchase REAL DEFAULT 0 NOT NULL,
        purchase_roas REAL DEFAULT 0 NOT NULL,
        add_to_cart INTEGER DEFAULT 0,
        initiate_checkout INTEGER DEFAULT 0,
        hook_rate REAL DEFAULT 0,
        hold_rate REAL DEFAULT 0,
        quality_ranking TEXT,
        engagement_rate_ranking TEXT,
        conversion_rate_ranking TEXT,
        breakdown_platform TEXT,
        breakdown_placement TEXT,
        placement TEXT,
        platform TEXT,
        synced_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE
      )
    `);

      // Drop and recreate all other tables to ensure schema is up to date
      // (except user_settings which stores schema version)
      console.log("🗑️ Dropping old tables if they exist...");
      await db.run(sql`DROP TABLE IF EXISTS benchmarks`);
      await db.run(sql`DROP TABLE IF EXISTS sync_log`);
      await db.run(sql`DROP TABLE IF EXISTS ad_concepts`);
      await db.run(sql`DROP TABLE IF EXISTS concept_metrics`);
      await db.run(sql`DROP TABLE IF EXISTS concepts`);
      await db.run(sql`DROP TABLE IF EXISTS account_daily_metrics`);
      await db.run(sql`DROP TABLE IF EXISTS campaign_daily_metrics`);
      await db.run(sql`DROP TABLE IF EXISTS adset_daily_metrics`);
      await db.run(sql`DROP TABLE IF EXISTS budget_targets`);
      await db.run(sql`DROP TABLE IF EXISTS daily_recommendations`);

      // Create benchmarks table
      console.log("📦 Creating all remaining tables...");
      await db.run(sql`
        CREATE TABLE benchmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        metric_name TEXT NOT NULL,
        period TEXT DEFAULT 'last_30d' NOT NULL,
        format_filter TEXT DEFAULT 'all' NOT NULL,
        p10 REAL NOT NULL,
        p25 REAL NOT NULL,
        p50 REAL NOT NULL,
        p75 REAL NOT NULL,
        p90 REAL NOT NULL,
        mean REAL NOT NULL,
        computed_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        sample_size INTEGER NOT NULL
      )
    `);

    // Create sync_log table
    await db.run(sql`
      CREATE TABLE sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        type TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        ads_synced INTEGER DEFAULT 0,
        days_synced INTEGER DEFAULT 0,
        errors TEXT,
        status TEXT NOT NULL
      )
    `);

    // Create concepts table
    await db.run(sql`
      CREATE TABLE concepts (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        grouping_method TEXT NOT NULL,
        concept_key TEXT,
        representative_ad_id TEXT,
        thumbnail_url TEXT,
        first_launch_date TEXT,
        status TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
      )
    `);

    // Create ad_concepts junction table
    await db.run(sql`
      CREATE TABLE ad_concepts (
        ad_id TEXT NOT NULL,
        concept_id TEXT NOT NULL,
        is_manual_override INTEGER DEFAULT 0,
        variation_label TEXT,
        PRIMARY KEY (ad_id, concept_id),
        FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE,
        FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE
      )
    `);

    // Create concept_metrics table
    await db.run(sql`
      CREATE TABLE concept_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        concept_id TEXT NOT NULL,
        date TEXT NOT NULL,
        total_spend REAL DEFAULT 0,
        total_impressions INTEGER DEFAULT 0,
        total_clicks INTEGER DEFAULT 0,
        total_outbound_clicks INTEGER DEFAULT 0,
        total_purchases INTEGER DEFAULT 0,
        total_purchase_value REAL DEFAULT 0,
        total_video_3s_views INTEGER DEFAULT 0,
        total_video_thruplay INTEGER DEFAULT 0,
        avg_cpa REAL DEFAULT 0,
        avg_roas REAL DEFAULT 0,
        avg_ctr REAL DEFAULT 0,
        avg_cpm REAL DEFAULT 0,
        avg_hook_rate REAL DEFAULT 0,
        avg_hold_rate REAL DEFAULT 0,
        active_ads_count INTEGER DEFAULT 0,
        total_ads_count INTEGER DEFAULT 0,
        FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE
      )
    `);

    // Create account_daily_metrics table
    await db.run(sql`
      CREATE TABLE account_daily_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        account_id TEXT NOT NULL,
        date TEXT NOT NULL,
        spend REAL DEFAULT 0,
        impressions INTEGER DEFAULT 0,
        reach INTEGER DEFAULT 0,
        frequency REAL DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        unique_clicks INTEGER DEFAULT 0,
        cpc REAL DEFAULT 0,
        cpm REAL DEFAULT 0,
        ctr REAL DEFAULT 0,
        outbound_clicks INTEGER DEFAULT 0,
        outbound_ctr REAL DEFAULT 0,
        link_clicks INTEGER DEFAULT 0,
        view_content INTEGER DEFAULT 0,
        view_content_value REAL DEFAULT 0,
        add_to_cart INTEGER DEFAULT 0,
        add_to_cart_value REAL DEFAULT 0,
        initiate_checkout INTEGER DEFAULT 0,
        initiate_checkout_value REAL DEFAULT 0,
        purchases INTEGER DEFAULT 0,
        purchase_value REAL DEFAULT 0,
        roas REAL DEFAULT 0,
        cpa REAL DEFAULT 0,
        cost_per_atc REAL DEFAULT 0,
        cost_per_ic REAL DEFAULT 0,
        atc_rate REAL DEFAULT 0,
        ic_rate REAL DEFAULT 0,
        purchase_rate REAL DEFAULT 0,
        click_to_purchase_rate REAL DEFAULT 0,
        aov REAL DEFAULT 0
      )
    `);

    // Create campaign_daily_metrics table
    await db.run(sql`
      CREATE TABLE campaign_daily_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        campaign_id TEXT NOT NULL,
        campaign_name TEXT NOT NULL,
        campaign_objective TEXT,
        account_id TEXT NOT NULL,
        date TEXT NOT NULL,
        spend REAL DEFAULT 0,
        impressions INTEGER DEFAULT 0,
        reach INTEGER DEFAULT 0,
        frequency REAL DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        cpc REAL DEFAULT 0,
        cpm REAL DEFAULT 0,
        ctr REAL DEFAULT 0,
        outbound_clicks INTEGER DEFAULT 0,
        view_content INTEGER DEFAULT 0,
        add_to_cart INTEGER DEFAULT 0,
        initiate_checkout INTEGER DEFAULT 0,
        purchases INTEGER DEFAULT 0,
        purchase_value REAL DEFAULT 0,
        roas REAL DEFAULT 0,
        cpa REAL DEFAULT 0,
        aov REAL DEFAULT 0,
        status TEXT NOT NULL,
        funnel_stage TEXT
      )
    `);

    // Create adset_daily_metrics table
    await db.run(sql`
      CREATE TABLE adset_daily_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        adset_id TEXT NOT NULL,
        adset_name TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        account_id TEXT NOT NULL,
        date TEXT NOT NULL,
        spend REAL DEFAULT 0,
        impressions INTEGER DEFAULT 0,
        reach INTEGER DEFAULT 0,
        frequency REAL DEFAULT 0,
        cpc REAL DEFAULT 0,
        cpm REAL DEFAULT 0,
        ctr REAL DEFAULT 0,
        purchases INTEGER DEFAULT 0,
        purchase_value REAL DEFAULT 0,
        roas REAL DEFAULT 0,
        cpa REAL DEFAULT 0,
        status TEXT NOT NULL,
        daily_budget REAL,
        bid_strategy TEXT,
        optimization_goal TEXT,
        age_gender_breakdown TEXT
      )
    `);

    // Create budget_targets table
    await db.run(sql`
      CREATE TABLE budget_targets (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        account_id TEXT NOT NULL,
        period_type TEXT NOT NULL,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        target_spend REAL NOT NULL,
        target_roas REAL,
        target_cpa REAL,
        target_purchases INTEGER,
        notes TEXT
      )
    `);

    // Create daily_recommendations table
    await db.run(sql`
      CREATE TABLE daily_recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        account_id TEXT NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        priority TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        entity_name TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        data_points TEXT,
        status TEXT DEFAULT 'pending' NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL
      )
      `);

      // Set schema version to 1 after first successful migration
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS user_settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL,
          updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
        )
      `);

      await db.run(sql`
        INSERT OR REPLACE INTO user_settings (key, value, updated_at)
        VALUES ('schema_version', '1', unixepoch())
      `);

      console.log("✅ First migration completed - schema version set to 1");
    } else {
      // Schema version >= 1: Tables already exist with correct schema
      // Just ensure user_settings table exists for future use
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS user_settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL,
          updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
        )
      `);

      console.log("✅ Schema version ${schemaVersion} - tables already exist, skipping recreation");
    }

    console.log("✅ All migrations completed successfully");

    return NextResponse.json({
      success: true,
      message: `Database migrations completed successfully (schema v${schemaVersion === 0 ? 1 : schemaVersion})`,
    });
  } catch (error) {
    console.error("❌ Migration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Migration failed",
      },
      { status: 500 }
    );
  }
}
