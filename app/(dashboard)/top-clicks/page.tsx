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

async function getTopClicks(): Promise<CreativeWithMetrics[]> {
  const thirtyDaysAgo = formatDateToISO(subDays(new Date(), 30));

  const allAds = await db.select().from(ads);

  const allMetrics = await db
    .select()
    .from(dailyMetrics)
    .where(gte(dailyMetrics.date, thirtyDaysAgo));

  const metricsByAdId = new Map<string, typeof allMetrics>();
  for (const metric of allMetrics) {
    if (!metricsByAdId.has(metric.adId)) {
      metricsByAdId.set(metric.adId, []);
    }
    metricsByAdId.get(metric.adId)!.push(metric);
  }

  const topClicks: CreativeWithMetrics[] = [];

  for (const ad of allAds) {
    const metrics = metricsByAdId.get(ad.id) || [];
    if (metrics.length === 0) continue;

    const aggregated = aggregateMetrics(metrics);
    const calculated = calculateAllMetrics(aggregated);

    // Only include creatives with decent impressions
    if (aggregated.impressions < 1000) continue;

    topClicks.push({
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
      spendTrend: "holding",
      fatigueScore: 0,
    });
  }

  // Sort by click rate
  return topClicks
    .sort((a, b) => b.clickRate - a.clickRate)
    .slice(0, 30);
}

export default async function TopClicksPage() {
  const creatives = await getTopClicks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Top Clicks</h1>
        <p className="text-muted-foreground">
          Creatives ranked by CTR - best at driving traffic (min. 1k impressions)
        </p>
      </div>

      {creatives.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No creatives with sufficient impressions
        </div>
      ) : (
        <CreativeLeaderboard creatives={creatives} />
      )}
    </div>
  );
}
