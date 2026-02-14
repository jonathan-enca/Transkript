import { db } from "@/lib/db";
import { dailyMetrics, ads } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { subDays } from "date-fns";
import { formatDateToISO } from "@/lib/utils";
import { aggregateMetrics, calculateAllMetrics } from "@/lib/metrics/calculated";
import { getBenchmarks } from "@/lib/metrics/benchmarks";
import { calculateScores, getDiagnostic } from "@/lib/metrics/scoring";
import { CreativeDeepDive } from "@/components/creative/creative-deep-dive";
import { notFound } from "next/navigation";

async function getCreativeData(id: string) {
  // Get the ad
  const ad = await db.select().from(ads).where(eq(ads.id, id)).get();

  if (!ad) {
    return null;
  }

  // Get metrics for last 30 days
  const thirtyDaysAgo = formatDateToISO(subDays(new Date(), 30));
  const metrics = await db
    .select()
    .from(dailyMetrics)
    .where(and(eq(dailyMetrics.adId, id), gte(dailyMetrics.date, thirtyDaysAgo)))
    .orderBy(dailyMetrics.date)
    .all();

  const aggregated = aggregateMetrics(metrics);
  const calculated = calculateAllMetrics(aggregated);

  // Get benchmarks and calculate scores
  let diagnostic = null;
  try {
    const benchmarks = await getBenchmarks();
    if (benchmarks.hookRate && benchmarks.holdRate && benchmarks.clickRate && benchmarks.roas) {
      const scores = calculateScores(calculated, benchmarks);
      diagnostic = getDiagnostic(scores);
    }
  } catch (error) {
    console.error("Failed to get benchmarks:", error);
  }

  return {
    ad,
    metrics,
    aggregated,
    calculated,
    diagnostic,
  };
}

export default async function CreativePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCreativeData(id);

  if (!data) {
    notFound();
  }

  return <CreativeDeepDive data={data} />;
}
