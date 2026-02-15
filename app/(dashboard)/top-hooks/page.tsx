import { db } from "@/lib/db";
import { dailyMetrics, ads } from "@/lib/db/schema";
import { gte, eq } from "drizzle-orm";
import { subDays } from "date-fns";
import { formatDateToISO } from "@/lib/utils";
import { aggregateMetrics, calculateAllMetrics } from "@/lib/metrics/calculated";
import { CreativeLeaderboard } from "@/components/leaderboard/creative-leaderboard";
import type { CreativeWithMetrics } from "@/app/(dashboard)/leaderboard/page";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getTopHooks(): Promise<CreativeWithMetrics[]> {
  const thirtyDaysAgo = formatDateToISO(subDays(new Date(), 30));

  // Get only video ads (hooks only relevant for video)
  const videoAds = await db.select().from(ads).where(eq(ads.format, "video"));

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

  const topHooks: CreativeWithMetrics[] = [];

  for (const ad of videoAds) {
    const metrics = metricsByAdId.get(ad.id) || [];
    if (metrics.length === 0) continue;

    const aggregated = aggregateMetrics(metrics);
    const calculated = calculateAllMetrics(aggregated);

    // Only include creatives with decent impressions
    if (aggregated.impressions < 1000) continue;

    topHooks.push({
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

  // Sort by hook rate
  return topHooks
    .sort((a, b) => b.hookRate - a.hookRate)
    .slice(0, 30);
}

export default async function TopHooksPage() {
  const creatives = await getTopHooks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Top Hooks</h1>
        <p className="text-muted-foreground">
          Video creatives ranked by 3-second view rate (min. 1k impressions)
        </p>
      </div>

      {creatives.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No video creatives with sufficient impressions
        </div>
      ) : (
        <CreativeLeaderboard creatives={creatives} />
      )}
    </div>
  );
}
