import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

/**
 * POST /api/clear-demo
 * Clear all demo data from the database
 */
export async function POST() {
  try {
    console.log("🗑️ Clearing demo data...");

    // Delete in order (respecting foreign keys)
    await db.run(sql`DELETE FROM daily_metrics`);
    await db.run(sql`DELETE FROM ads`);
    await db.run(sql`DELETE FROM benchmarks`);
    await db.run(sql`DELETE FROM sync_log`);
    await db.run(sql`DELETE FROM concept_metrics`);
    await db.run(sql`DELETE FROM ad_concepts`);
    await db.run(sql`DELETE FROM concepts`);
    await db.run(sql`DELETE FROM account_daily_metrics`);
    await db.run(sql`DELETE FROM campaign_daily_metrics`);
    await db.run(sql`DELETE FROM adset_daily_metrics`);
    await db.run(sql`DELETE FROM budget_targets`);
    await db.run(sql`DELETE FROM daily_recommendations`);

    console.log("✅ All demo data cleared successfully");

    return NextResponse.json({
      success: true,
      message: "All demo data has been cleared",
    });
  } catch (error) {
    console.error("❌ Clear demo error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Clear demo failed",
      },
      { status: 500 }
    );
  }
}
