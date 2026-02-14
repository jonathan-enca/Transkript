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

    // Create accounts table
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

    // Create unique index on ad_account_id
    await db.run(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS accounts_ad_account_id_unique
      ON accounts (ad_account_id)
    `);

    // Create ads table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS ads (
        id TEXT PRIMARY KEY NOT NULL,
        creative_id TEXT NOT NULL,
        name TEXT NOT NULL,
        format TEXT NOT NULL,
        thumbnail_url TEXT,
        video_url TEXT,
        image_url TEXT,
        headline TEXT,
        body TEXT,
        call_to_action TEXT,
        campaign_id TEXT NOT NULL,
        campaign_name TEXT NOT NULL,
        adset_id TEXT NOT NULL,
        adset_name TEXT NOT NULL,
        status TEXT NOT NULL,
        created_time INTEGER NOT NULL,
        updated_time INTEGER NOT NULL,
        last_synced_at INTEGER DEFAULT (unixepoch()) NOT NULL
      )
    `);

    // Create benchmarks table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS benchmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        metric_name TEXT NOT NULL,
        p10 REAL NOT NULL,
        p25 REAL NOT NULL,
        p50 REAL NOT NULL,
        p75 REAL NOT NULL,
        p90 REAL NOT NULL,
        computed_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        sample_size INTEGER NOT NULL
      )
    `);

    // Create unique index on metric_name
    await db.run(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS benchmarks_metric_name_unique
      ON benchmarks (metric_name)
    `);

    // Create daily_metrics table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS daily_metrics (
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
        placement TEXT,
        platform TEXT,
        synced_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE
      )
    `);

    console.log("✅ All migrations completed successfully");

    return NextResponse.json({
      success: true,
      message: "Database migrations completed successfully",
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
