import { db } from "@/lib/db";
import { dailyMetrics, ads } from "@/lib/db/schema";
import { gte } from "drizzle-orm";
import { subDays } from "date-fns";
import { formatDateToISO } from "@/lib/utils";
import { aggregateMetrics, calculateAllMetrics } from "@/lib/metrics/calculated";
import { CreativeLeaderboard } from "@/components/leaderboard/creative-leaderboard";
import type { CreativeWithMetrics } from "@/app/(dashboard)/leaderboard/page";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getTopCreatives(): Promise<CreativeWithMetrics[]> {
  const thirtyDaysAgo = formatDateToISO(subDays(new Date(), 30));

  // Get all ads with their metrics
  const allAds = await db.select().from(ads);
  const allMetrics = await db
    .select()
    .from(dailyMetrics)
    .where(gte(dailyMetrics.date, thirtyDaysAgo));

  // Group metrics by adId
  const metricsByAdId = new Map<string, typeof allMetrics>();
  for (const metric of allMetrics) {
    if (!metricsByAdId.has(metric.adId)) {
      metricsByAdId.set(metric.adId, []);
    }
    metricsByAdId.get(metric.adId)!.push(metric);
  }

  const creativesWithMetrics: CreativeWithMetrics[] = [];

  for (const ad of allAds) {
    const metrics = metricsByAdId.get(ad.id) || [];
    if (metrics.length === 0) continue;

    const aggregated = aggregateMetrics(metrics);
    const calculated = calculateAllMetrics(aggregated);

    // Calculate spend trend
    const midpoint = Math.floor(metrics.length / 2);
    const firstHalf = metrics.slice(0, midpoint);
    const secondHalf = metrics.slice(midpoint);

    let spendTrend: "scaling" | "holding" | "declining" = "holding";
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstHalfSpend = firstHalf.reduce((sum: number, m: any) => sum + m.spend, 0);
      const secondHalfSpend = secondHalf.reduce((sum: number, m: any) => sum + m.spend, 0);
      const spendChange =
        firstHalfSpend > 0
          ? ((secondHalfSpend - firstHalfSpend) / firstHalfSpend) * 100
          : 0;

      if (spendChange > 15) spendTrend = "scaling";
      else if (spendChange < -15) spendTrend = "declining";
    }

    // Calculate fatigue score (simplified)
    const fatigueScore = calculated.hookRate > 0 ? Math.min(100, calculated.hookRate) : 0;

    creativesWithMetrics.push({
      ...aggregated,
      ...calculated,
      id: ad.id,
      name: ad.name,
      format: ad.format,
      thumbnailUrl: ad.thumbnailUrl,
      videoUrl: ad.videoUrl,
      imageUrl: ad.imageUrl,
      campaignName: ad.campaignName,
      status: ad.status,
      createdTime: ad.createdTime,
      spendTrend,
      fatigueScore,
    });
  }

  // Filter creatives with minimum spend and sort by ROAS
  return creativesWithMetrics
    .filter((c) => c.spend >= 10) // Minimum 10€ spend (lowered for better visibility)
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 50); // Top 50
}

export default async function TopCreativesPage() {
  const creatives = await getTopCreatives();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Top Creatives</h1>
        <p className="text-muted-foreground">
          Your best performing creatives ranked by ROAS (min. 50€ spend)
        </p>
      </div>

      <CreativeLeaderboard creatives={creatives} />
    </div>
  );
}
