/**
 * Benchmark calculation utilities
 * Computes percentiles for scoring system
 */

import { db } from "@/lib/db";
import { dailyMetrics, benchmarks, ads } from "@/lib/db/schema";
import { sql, and, gte } from "drizzle-orm";
import { calculateAllMetrics, aggregateMetrics } from "./calculated";
import { subDays } from "date-fns";
import { formatDateToISO } from "@/lib/utils";

/**
 * Calculate percentiles from an array of values
 */
export function calculatePercentiles(values: number[]): {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
} {
  if (values.length === 0) {
    return { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const getPercentile = (p: number) => {
    const index = (p / 100) * (n - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sorted[lower];
    }

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };

  return {
    p10: getPercentile(10),
    p25: getPercentile(25),
    p50: getPercentile(50),
    p75: getPercentile(75),
    p90: getPercentile(90),
  };
}

/**
 * Recalculate all benchmarks based on last 30 days of data
 * Only includes ads with spend > minSpend threshold
 */
export async function recalculateBenchmarks(minSpend: number = 50) {
  const thirtyDaysAgo = formatDateToISO(subDays(new Date(), 30));

  // Get all ads with sufficient spend in the last 30 days
  const adsWithMetrics = await db
    .select({
      adId: dailyMetrics.adId,
      metrics: dailyMetrics,
    })
    .from(dailyMetrics)
    .where(gte(dailyMetrics.date, thirtyDaysAgo))
    ;

  // Group by ad and aggregate
  const adMetricsMap = new Map<string, typeof dailyMetrics.$inferSelect[]>();

  for (const row of adsWithMetrics) {
    if (!adMetricsMap.has(row.adId)) {
      adMetricsMap.set(row.adId, []);
    }
    adMetricsMap.get(row.adId)!.push(row.metrics);
  }

  // Calculate metrics for each ad
  const hookRates: number[] = [];
  const holdRates: number[] = [];
  const clickRates: number[] = [];
  const roasValues: number[] = [];

  for (const [adId, metrics] of adMetricsMap) {
    const aggregated = aggregateMetrics(metrics);

    // Only include ads with sufficient spend
    if (aggregated.spend < minSpend) continue;

    const calculated = calculateAllMetrics(aggregated);

    // Only include valid values (non-zero, non-NaN)
    if (calculated.hookRate > 0 && !isNaN(calculated.hookRate)) {
      hookRates.push(calculated.hookRate);
    }
    if (calculated.holdRate > 0 && !isNaN(calculated.holdRate)) {
      holdRates.push(calculated.holdRate);
    }
    if (calculated.clickRate > 0 && !isNaN(calculated.clickRate)) {
      clickRates.push(calculated.clickRate);
    }
    if (calculated.roas > 0 && !isNaN(calculated.roas)) {
      roasValues.push(calculated.roas);
    }
  }

  const sampleSize = adMetricsMap.size;
  const now = new Date();

  // Calculate and store benchmarks
  const hookRateBenchmarks = calculatePercentiles(hookRates);
  const holdRateBenchmarks = calculatePercentiles(holdRates);
  const clickRateBenchmarks = calculatePercentiles(clickRates);
  const roasBenchmarks = calculatePercentiles(roasValues);

  // Upsert benchmarks into database
  await db
    .insert(benchmarks)
    .values([
      {
        metricName: "hookRate",
        ...hookRateBenchmarks,
        computedAt: now,
        sampleSize,
      },
      {
        metricName: "holdRate",
        ...holdRateBenchmarks,
        computedAt: now,
        sampleSize,
      },
      {
        metricName: "clickRate",
        ...clickRateBenchmarks,
        computedAt: now,
        sampleSize,
      },
      {
        metricName: "roas",
        ...roasBenchmarks,
        computedAt: now,
        sampleSize,
      },
    ])
    .onConflictDoUpdate({
      target: benchmarks.metricName,
      set: {
        p10: sql`excluded.p10`,
        p25: sql`excluded.p25`,
        p50: sql`excluded.p50`,
        p75: sql`excluded.p75`,
        p90: sql`excluded.p90`,
        computedAt: sql`excluded.computed_at`,
        sampleSize: sql`excluded.sample_size`,
      },
    });

  return {
    hookRate: hookRateBenchmarks,
    holdRate: holdRateBenchmarks,
    clickRate: clickRateBenchmarks,
    roas: roasBenchmarks,
    sampleSize,
  };
}

/**
 * Get current benchmarks from database
 */
export async function getBenchmarks() {
  const allBenchmarks = await db.select().from(benchmarks);

  const benchmarkMap = allBenchmarks.reduce(
    (acc: any, b: any) => {
      acc[b.metricName] = b;
      return acc;
    },
    {} as Record<string, typeof benchmarks.$inferSelect>
  );

  return {
    hookRate: benchmarkMap.hookRate,
    holdRate: benchmarkMap.holdRate,
    clickRate: benchmarkMap.clickRate,
    roas: benchmarkMap.roas,
  };
}
