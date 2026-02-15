/**
 * Benchmarks calculation
 * Computes percentiles (P10, P25, P50, P75, P90) and mean for all metrics
 */

import { db } from "@/lib/db";
import { dailyMetrics, ads, benchmarks } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { subDays } from "date-fns";
import { formatDateToISO } from "@/lib/utils";

// Metrics to compute benchmarks for
const METRICS_TO_BENCHMARK = [
  'hookRate',
  'holdRate',
  'ctr',
  'cpm',
  'cpc',
  'purchaseRoas',
  'costPerPurchase',
] as const;

type MetricName = typeof METRICS_TO_BENCHMARK[number];

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedData: number[], p: number): number {
  if (sortedData.length === 0) return 0;

  const index = (p / 100) * (sortedData.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (upper >= sortedData.length) return sortedData[lower];

  return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
}

/**
 * Calculate mean (average)
 */
function mean(data: number[]): number {
  if (data.length === 0) return 0;
  return data.reduce((sum, val) => sum + val, 0) / data.length;
}

/**
 * Get metric values from database
 */
async function getMetricValues(
  metricName: MetricName,
  period: 'last_30d' | 'last_90d' | 'all_time',
  formatFilter: 'all' | 'video' | 'image'
): Promise<number[]> {
  // Determine date filter
  let dateFilter: string | null = null;
  if (period === 'last_30d') {
    dateFilter = formatDateToISO(subDays(new Date(), 30));
  } else if (period === 'last_90d') {
    dateFilter = formatDateToISO(subDays(new Date(), 90));
  }

  // Build query
  let query = db
    .select({
      value: dailyMetrics[metricName],
      adId: dailyMetrics.adId,
    })
    .from(dailyMetrics);

  // Apply date filter if needed
  if (dateFilter) {
    query = query.where(gte(dailyMetrics.date, dateFilter)) as any;
  }

  const results = await query;

  // Filter by format if needed
  let filteredResults = results;
  if (formatFilter !== 'all') {
    const adIds = new Set(
      (await db
        .select({ id: ads.id })
        .from(ads)
        .where(eq(ads.format, formatFilter))
      ).map(a => a.id)
    );

    filteredResults = results.filter(r => adIds.has(r.adId));
  }

  // Extract values and filter out nulls/zeros
  const values = filteredResults
    .map(r => r.value)
    .filter((v): v is number => v !== null && v !== undefined && v > 0);

  return values;
}

/**
 * Calculate benchmarks for a single metric
 */
async function calculateBenchmarkForMetric(
  metricName: MetricName,
  period: 'last_30d' | 'last_90d' | 'all_time',
  formatFilter: 'all' | 'video' | 'image'
) {
  console.log(`📊 Computing benchmark: ${metricName} - ${period} - ${formatFilter}`);

  const values = await getMetricValues(metricName, period, formatFilter);

  if (values.length === 0) {
    console.log(`⚠️  No data for ${metricName} - ${period} - ${formatFilter}`);
    return null;
  }

  // Sort for percentile calculation
  const sorted = values.sort((a, b) => a - b);

  const benchmark = {
    metricName,
    period,
    formatFilter,
    p10: percentile(sorted, 10),
    p25: percentile(sorted, 25),
    p50: percentile(sorted, 50),
    p75: percentile(sorted, 75),
    p90: percentile(sorted, 90),
    mean: mean(sorted),
    sampleSize: sorted.length,
  };

  console.log(`✅ ${metricName}: P50=${benchmark.p50.toFixed(2)}, Mean=${benchmark.mean.toFixed(2)}, N=${benchmark.sampleSize}`);

  return benchmark;
}

/**
 * Calculate all benchmarks
 * This should be run after each sync to update benchmarks
 */
export async function calculateAllBenchmarks() {
  console.log("🔄 Starting benchmark calculation...");

  const periods: ('last_30d' | 'last_90d' | 'all_time')[] = ['last_30d', 'last_90d', 'all_time'];
  const formats: ('all' | 'video' | 'image')[] = ['all', 'video', 'image'];

  let totalCalculated = 0;

  for (const period of periods) {
    for (const format of formats) {
      for (const metric of METRICS_TO_BENCHMARK) {
        const benchmark = await calculateBenchmarkForMetric(metric, period, format);

        if (benchmark) {
          // Check if benchmark already exists
          const existing = await db
            .select()
            .from(benchmarks)
            .where(
              and(
                eq(benchmarks.metricName, metric),
                eq(benchmarks.period, period),
                eq(benchmarks.formatFilter, format)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            // Update existing
            await db
              .update(benchmarks)
              .set({
                ...benchmark,
                computedAt: new Date(),
              })
              .where(eq(benchmarks.id, existing[0].id));
          } else {
            // Insert new
            await db.insert(benchmarks).values({
              ...benchmark,
              computedAt: new Date(),
            });
          }

          totalCalculated++;
        }
      }
    }
  }

  console.log(`✅ Calculated ${totalCalculated} benchmarks`);
  return totalCalculated;
}

/**
 * Get benchmark for a specific metric
 */
export async function getBenchmark(
  metricName: string,
  period: 'last_30d' | 'last_90d' | 'all_time' = 'last_30d',
  formatFilter: 'all' | 'video' | 'image' = 'all'
) {
  const result = await db
    .select()
    .from(benchmarks)
    .where(
      and(
        eq(benchmarks.metricName, metricName),
        eq(benchmarks.period, period),
        eq(benchmarks.formatFilter, formatFilter)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Calculate score (0-100) for a metric value based on benchmarks
 *
 * For "higher is better" metrics (hookRate, holdRate, ctr, purchaseRoas):
 * - Below P25: 0-25
 * - P25-P50: 25-50
 * - P50-P75: 50-75
 * - P75-P90: 75-90
 * - Above P90: 90-100
 *
 * For "lower is better" metrics (cpm, cpc, costPerPurchase):
 * - Inverted scoring
 */
export function scoreMetric(
  value: number,
  benchmark: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  },
  higherIsBetter: boolean = true
): number {
  if (!higherIsBetter) {
    // Invert for "lower is better" metrics
    if (value <= benchmark.p10) return 100;
    if (value <= benchmark.p25) return 90 - ((value - benchmark.p10) / (benchmark.p25 - benchmark.p10)) * 15;
    if (value <= benchmark.p50) return 75 - ((value - benchmark.p25) / (benchmark.p50 - benchmark.p25)) * 25;
    if (value <= benchmark.p75) return 50 - ((value - benchmark.p50) / (benchmark.p75 - benchmark.p50)) * 25;
    if (value <= benchmark.p90) return 25 - ((value - benchmark.p75) / (benchmark.p90 - benchmark.p75)) * 15;
    return Math.max(0, 25 - ((value - benchmark.p90) / benchmark.p90) * 25);
  }

  // Higher is better
  if (value <= benchmark.p10) return Math.max(0, (value / benchmark.p10) * 10);
  if (value <= benchmark.p25) return 10 + ((value - benchmark.p10) / (benchmark.p25 - benchmark.p10)) * 15;
  if (value <= benchmark.p50) return 25 + ((value - benchmark.p25) / (benchmark.p50 - benchmark.p25)) * 25;
  if (value <= benchmark.p75) return 50 + ((value - benchmark.p50) / (benchmark.p75 - benchmark.p50)) * 25;
  if (value <= benchmark.p90) return 75 + ((value - benchmark.p75) / (benchmark.p90 - benchmark.p75)) * 15;
  return Math.min(100, 90 + ((value - benchmark.p90) / benchmark.p90) * 10);
}
