import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ads, dailyMetrics, accounts } from "@/lib/db/schema";
import { sql, InferSelectModel } from "drizzle-orm";

type Ad = InferSelectModel<typeof ads>;
type DailyMetric = InferSelectModel<typeof dailyMetrics>;

/**
 * GET /api/debug
 * Debug endpoint to check database contents
 */
export async function GET() {
  try {
    // Count tables
    const accountsCount = await db.select({ count: sql<number>`count(*)` }).from(accounts);
    const adsCount = await db.select({ count: sql<number>`count(*)` }).from(ads);
    const metricsCount = await db.select({ count: sql<number>`count(*)` }).from(dailyMetrics);

    // Get sample data
    const sampleAccounts = await db.select().from(accounts).limit(3);
    const sampleAds = await db.select().from(ads).limit(3);
    const sampleMetrics = await db.select().from(dailyMetrics).limit(10);

    return NextResponse.json({
      counts: {
        accounts: accountsCount[0]?.count || 0,
        ads: adsCount[0]?.count || 0,
        metrics: metricsCount[0]?.count || 0,
      },
      samples: {
        accounts: sampleAccounts,
        ads: sampleAds.map((ad: Ad) => ({
          id: ad.id,
          name: ad.name,
          status: ad.status,
          campaignName: ad.campaignName,
          format: ad.format,
        })),
        metrics: sampleMetrics.map((m: DailyMetric) => ({
          id: m.id,
          adId: m.adId,
          date: m.date,
          spend: m.spend,
          impressions: m.impressions,
          purchases: m.purchases,
        })),
      },
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Debug failed",
      },
      { status: 500 }
    );
  }
}
