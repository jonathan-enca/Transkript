import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

/**
 * POST /api/fix-schema
 * Recreate tables with correct schema
 *
 * WARNING: This will drop existing tables and recreate them
 */
export async function POST() {
  try {
    console.log("🔧 Fixing database schema...");

    // Drop tables in correct order (due to foreign keys)
    console.log("🗑️  Dropping old tables...");
    await db.run(sql`DROP TABLE IF EXISTS daily_metrics`);
    await db.run(sql`DROP TABLE IF EXISTS ads`);
    await db.run(sql`DROP TABLE IF EXISTS benchmarks`);

    // Create ads table with correct schema
    console.log("📦 Creating ads table...");
    await db.run(sql`
      CREATE TABLE ads (
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
    console.log("📦 Creating benchmarks table...");
    await db.run(sql`
      CREATE TABLE benchmarks (
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

    await db.run(sql`
      CREATE UNIQUE INDEX benchmarks_metric_name_unique
      ON benchmarks (metric_name)
    `);

    // Create daily_metrics table
    console.log("📦 Creating daily_metrics table...");
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
        placement TEXT,
        platform TEXT,
        synced_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE
      )
    `);

    console.log("✅ Schema fixed successfully!");

    return NextResponse.json({
      success: true,
      message: "Database schema has been recreated. Please sync your data again.",
    });
  } catch (error) {
    console.error("❌ Schema fix error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Schema fix failed",
      },
      { status: 500 }
    );
  }
}
