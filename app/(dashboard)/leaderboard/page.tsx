import { db } from "@/lib/db";
import { dailyMetrics, ads } from "@/lib/db/schema";
import { sql, gte, and, eq } from "drizzle-orm";
import { subDays } from "date-fns";
import { formatDateToISO } from "@/lib/utils";
import { aggregateMetrics, calculateAllMetrics } from "@/lib/metrics/calculated";
import { CreativeLeaderboard } from "@/components/leaderboard/creative-leaderboard";

export interface CreativeWithMetrics {
  id: string;
  name: string;
  format: string;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  campaignName: string;
  status: string;
  createdTime: Date;

  // Aggregated metrics
  spend: number;
  impressions: number;
  purchases: number;
  purchaseValue: number;

  // Calculated metrics
  hookRate: number;
  holdRate: number;
  clickRate: number;
  conversionRate: number;
  cpa: number;
  roas: number;
  cpm: number;

  // Trend
  spendTrend: "scaling" | "holding" | "declining";
  fatigueScore: number;
}

async function getCreativesWithMetrics(): Promise<CreativeWithMetrics[]> {
  const thirtyDaysAgo = formatDateToISO(subDays(new Date(), 30));

  // Get all ads
  const allAds = await db.select().from(ads).all();

  const creativesWithMetrics: CreativeWithMetrics[] = [];

  for (const ad of allAds) {
    // Get metrics for this ad
    const metrics = await db
      .select()
      .from(dailyMetrics)
      .where(
        and(eq(dailyMetrics.adId, ad.id), gte(dailyMetrics.date, thirtyDaysAgo))
      )
      .all();

    if (metrics.length === 0) continue;

    const aggregated = aggregateMetrics(metrics);
    const calculated = calculateAllMetrics(aggregated);

    // Simple trend calculation (comparing first half vs second half of period)
    const midpoint = Math.floor(metrics.length / 2);
    const firstHalf = metrics.slice(0, midpoint);
    const secondHalf = metrics.slice(midpoint);

    let spendTrend: "scaling" | "holding" | "declining" = "holding";
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstHalfSpend = firstHalf.reduce((sum, m) => sum + m.spend, 0);
      const secondHalfSpend = secondHalf.reduce((sum, m) => sum + m.spend, 0);
      const spendChange =
        firstHalfSpend > 0
          ? ((secondHalfSpend - firstHalfSpend) / firstHalfSpend) * 100
          : 0;

      if (spendChange > 15) spendTrend = "scaling";
      else if (spendChange < -15) spendTrend = "declining";
    }

    creativesWithMetrics.push({
      id: ad.id,
      name: ad.name,
      format: ad.format,
      thumbnailUrl: ad.thumbnailUrl,
      videoUrl: ad.videoUrl,
      imageUrl: ad.imageUrl,
      campaignName: ad.campaignName,
      status: ad.status,
      createdTime: ad.createdTime,

      spend: aggregated.spend,
      impressions: aggregated.impressions,
      purchases: aggregated.purchases,
      purchaseValue: aggregated.purchaseValue,

      hookRate: calculated.hookRate,
      holdRate: calculated.holdRate,
      clickRate: calculated.clickRate,
      conversionRate: calculated.conversionRate,
      cpa: calculated.cpa,
      roas: calculated.roas,
      cpm: calculated.cpm,

      spendTrend,
      fatigueScore: 0, // TODO: Implement fatigue calculation
    });
  }

  // Sort by spend (descending) by default
  return creativesWithMetrics.sort((a, b) => b.spend - a.spend);
}

export default async function LeaderboardPage() {
  const creatives = await getCreativesWithMetrics();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Creative Leaderboard</h1>
        <p className="text-muted-foreground">
          Analysez et comparez la performance de vos créatives
        </p>
      </div>

      <CreativeLeaderboard creatives={creatives} />
    </div>
  );
}
