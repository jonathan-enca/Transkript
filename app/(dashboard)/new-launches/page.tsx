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

async function getNewLaunches(): Promise<CreativeWithMetrics[]> {
  const thirtyDaysAgo = formatDateToISO(subDays(new Date(), 30));
  const fourteenDaysAgo = formatDateToISO(subDays(new Date(), 14));

  // Get ads created in last 14 days
  const recentAds = await db.select().from(ads);

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

  const newLaunches: CreativeWithMetrics[] = [];

  for (const ad of recentAds) {
    // Filter by first spend date (if available) or created time
    const firstSpendDate = ad.firstSpendDate || formatDateToISO(ad.createdTime);
    if (firstSpendDate < fourteenDaysAgo) continue;

    const metrics = metricsByAdId.get(ad.id) || [];
    if (metrics.length === 0) continue; // Skip ads with no data yet

    const aggregated = aggregateMetrics(metrics);
    const calculated = calculateAllMetrics(aggregated);

    newLaunches.push({
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
      spendTrend: "scaling",
      fatigueScore: 0,
    });
  }

  // Sort by creation date (newest first)
  return newLaunches
    .sort((a, b) => b.createdTime.getTime() - a.createdTime.getTime())
    .slice(0, 30);
}

export default async function NewLaunchesPage() {
  const creatives = await getNewLaunches();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Launches</h1>
        <p className="text-muted-foreground">
          Creatives launched in the last 14 days with early performance signals
        </p>
      </div>

      {creatives.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No new creatives launched in the last 14 days
        </div>
      ) : (
        <CreativeLeaderboard creatives={creatives} />
      )}
    </div>
  );
}
