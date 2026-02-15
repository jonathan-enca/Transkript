import { db } from "@/lib/db";
import { dailyMetrics, ads } from "@/lib/db/schema";
import { gte } from "drizzle-orm";
import { subDays } from "date-fns";
import { formatDateToISO } from "@/lib/utils";
import { aggregateMetrics, calculateAllMetrics } from "@/lib/metrics/calculated";
import { CreativeLeaderboard } from "@/components/leaderboard/creative-leaderboard";
import type { CreativeWithMetrics } from "@/app/(dashboard)/leaderboard/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getTopConverters(): Promise<{
  topConverters: CreativeWithMetrics[];
  hiddenGems: CreativeWithMetrics[];
}> {
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

  const allCreatives: CreativeWithMetrics[] = [];

  for (const ad of allAds) {
    const metrics = metricsByAdId.get(ad.id) || [];
    if (metrics.length === 0) continue;

    const aggregated = aggregateMetrics(metrics);
    const calculated = calculateAllMetrics(aggregated);

    // Only include creatives with purchases
    if (aggregated.purchases === 0) continue;

    allCreatives.push({
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

  // Top converters: high spend, high ROAS
  const topConverters = allCreatives
    .filter((c) => c.spend >= 100)
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 20);

  // Hidden gems: low spend (50-200€), high ROAS (>3x)
  const hiddenGems = allCreatives
    .filter((c) => c.spend >= 50 && c.spend <= 200 && c.roas >= 3)
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 10);

  return { topConverters, hiddenGems };
}

export default async function TopConvertersPage() {
  const { topConverters, hiddenGems } = await getTopConverters();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Top Converters</h1>
        <p className="text-muted-foreground">
          Creatives with best ROAS and conversion performance
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Conversion Champions</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Proven performers with 100€+ spend
          </p>
          {topConverters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No converters found
            </div>
          ) : (
            <CreativeLeaderboard creatives={topConverters} />
          )}
        </div>

        {hiddenGems.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">💎 Hidden Gems</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Underrated performers (50-200€ spend, 3x+ ROAS) worth scaling
            </p>
            <CreativeLeaderboard creatives={hiddenGems} />
          </div>
        )}
      </div>
    </div>
  );
}
