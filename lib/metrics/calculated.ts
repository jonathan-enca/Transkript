/**
 * Calculated metrics utilities
 * These functions compute derived metrics from raw Meta API data
 */

import { DailyMetric } from "@/lib/db/schema";

export interface CalculatedMetrics {
  // Hook & Retention
  hookRate: number; // (3-sec video views / Impressions) × 100
  holdRate: number; // (15-sec video views / 3-sec video views) × 100

  // Click & Conversion
  clickRate: number; // (Outbound clicks / Impressions) × 100
  conversionRate: number; // (Purchases / Outbound clicks) × 100

  // Cost & ROI
  cpa: number; // Spend / Purchases
  roas: number; // Purchase value / Spend
  cpm: number; // (Spend / Impressions) × 1000
  costPerThruPlay: number; // Spend / ThruPlays

  // Video engagement
  avgWatchTime: number; // Average seconds watched
  dropOff25: number; // % who watched to 25%
  dropOff50: number; // % who watched to 50%
  dropOff75: number; // % who watched to 75%
  dropOff100: number; // % who watched to 100%

  // Trends (require time-series data)
  creativeFatigueScore?: number; // 0-100, higher = more fatigued
  spendTrend?: "scaling" | "holding" | "declining";
}

/**
 * Calculate Hook Rate (Thumbstop Rate)
 * Measures ability to capture attention
 */
export function calculateHookRate(
  video3sViews: number,
  impressions: number
): number {
  if (impressions === 0) return 0;
  return (video3sViews / impressions) * 100;
}

/**
 * Calculate Hold Rate
 * Measures ability to retain attention after hook
 */
export function calculateHoldRate(
  video15sViews: number,
  video3sViews: number
): number {
  if (video3sViews === 0) return 0;
  return (video15sViews / video3sViews) * 100;
}

/**
 * Calculate Click Rate (CTR based on outbound clicks)
 */
export function calculateClickRate(
  outboundClicks: number,
  impressions: number
): number {
  if (impressions === 0) return 0;
  return (outboundClicks / impressions) * 100;
}

/**
 * Calculate Conversion Rate
 * Percentage of clicks that convert to purchases
 */
export function calculateConversionRate(
  purchases: number,
  outboundClicks: number
): number {
  if (outboundClicks === 0) return 0;
  return (purchases / outboundClicks) * 100;
}

/**
 * Calculate Cost Per Acquisition (CPA)
 */
export function calculateCPA(spend: number, purchases: number): number {
  if (purchases === 0) return 0;
  return spend / purchases;
}

/**
 * Calculate Return on Ad Spend (ROAS)
 */
export function calculateROAS(purchaseValue: number, spend: number): number {
  if (spend === 0) return 0;
  return purchaseValue / spend;
}

/**
 * Calculate Cost Per Mille (CPM)
 */
export function calculateCPM(spend: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (spend / impressions) * 1000;
}

/**
 * Calculate Cost Per ThruPlay
 */
export function calculateCostPerThruPlay(
  spend: number,
  thruPlays: number
): number {
  if (thruPlays === 0) return 0;
  return spend / thruPlays;
}

/**
 * Calculate video drop-off rates
 */
export function calculateVideoDropOff(metrics: {
  impressions: number;
  video25Pct: number;
  video50Pct: number;
  video75Pct: number;
  video100Pct: number;
}): {
  dropOff25: number;
  dropOff50: number;
  dropOff75: number;
  dropOff100: number;
} {
  const { impressions, video25Pct, video50Pct, video75Pct, video100Pct } =
    metrics;

  return {
    dropOff25: impressions === 0 ? 0 : (video25Pct / impressions) * 100,
    dropOff50: impressions === 0 ? 0 : (video50Pct / impressions) * 100,
    dropOff75: impressions === 0 ? 0 : (video75Pct / impressions) * 100,
    dropOff100: impressions === 0 ? 0 : (video100Pct / impressions) * 100,
  };
}

/**
 * Calculate all metrics for a given set of daily metrics
 */
export function calculateAllMetrics(
  metrics: DailyMetric | DailyMetric[]
): CalculatedMetrics {
  // If array, aggregate first
  const aggregated = Array.isArray(metrics)
    ? aggregateMetrics(metrics)
    : metrics;

  const hookRate = calculateHookRate(
    aggregated.video3sViews,
    aggregated.impressions
  );
  const holdRate = calculateHoldRate(
    aggregated.video15sViews,
    aggregated.video3sViews
  );
  const clickRate = calculateClickRate(
    aggregated.outboundClicks,
    aggregated.impressions
  );
  const conversionRate = calculateConversionRate(
    aggregated.purchases,
    aggregated.outboundClicks
  );
  const cpa = calculateCPA(aggregated.spend, aggregated.purchases);
  const roas = calculateROAS(aggregated.purchaseValue, aggregated.spend);
  const cpm = calculateCPM(aggregated.spend, aggregated.impressions);
  const costPerThruPlay = calculateCostPerThruPlay(
    aggregated.spend,
    aggregated.videoThruPlays
  );

  const dropOff = calculateVideoDropOff({
    impressions: aggregated.impressions,
    video25Pct: aggregated.video25Pct,
    video50Pct: aggregated.video50Pct,
    video75Pct: aggregated.video75Pct,
    video100Pct: aggregated.video100Pct,
  });

  return {
    hookRate,
    holdRate,
    clickRate,
    conversionRate,
    cpa,
    roas,
    cpm,
    costPerThruPlay,
    avgWatchTime: aggregated.videoAvgTimeWatched,
    ...dropOff,
  };
}

/**
 * Aggregate multiple daily metrics into a single metric
 */
export function aggregateMetrics(metrics: DailyMetric[]): DailyMetric {
  const aggregated = metrics.reduce(
    (acc, metric) => ({
      ...acc,
      spend: (acc.spend || 0) + metric.spend,
      impressions: (acc.impressions || 0) + metric.impressions,
      reach: (acc.reach || 0) + metric.reach,
      clicks: (acc.clicks || 0) + metric.clicks,
      outboundClicks: (acc.outboundClicks || 0) + metric.outboundClicks,
      inlineLinkClicks: (acc.inlineLinkClicks || 0) + metric.inlineLinkClicks,
      video3sViews: (acc.video3sViews || 0) + metric.video3sViews,
      video15sViews: (acc.video15sViews || 0) + metric.video15sViews,
      video25Pct: (acc.video25Pct || 0) + metric.video25Pct,
      video50Pct: (acc.video50Pct || 0) + metric.video50Pct,
      video75Pct: (acc.video75Pct || 0) + metric.video75Pct,
      video100Pct: (acc.video100Pct || 0) + metric.video100Pct,
      videoThruPlays: (acc.videoThruPlays || 0) + metric.videoThruPlays,
      purchases: (acc.purchases || 0) + metric.purchases,
      purchaseValue: (acc.purchaseValue || 0) + metric.purchaseValue,
    }),
    {
      spend: 0,
      impressions: 0,
      reach: 0,
      clicks: 0,
      outboundClicks: 0,
      inlineLinkClicks: 0,
      video3sViews: 0,
      video15sViews: 0,
      video25Pct: 0,
      video50Pct: 0,
      video75Pct: 0,
      video100Pct: 0,
      videoThruPlays: 0,
      purchases: 0,
      purchaseValue: 0,
    } as Partial<DailyMetric>
  );

  // Calculate averages for rate-based metrics
  const count = metrics.length;
  const avgFrequency =
    metrics.reduce((sum, m) => sum + m.frequency, 0) / count;
  const avgCtr = metrics.reduce((sum, m) => sum + m.ctr, 0) / count;
  const avgCpm = metrics.reduce((sum, m) => sum + m.cpm, 0) / count;
  const avgVideoTime =
    metrics.reduce((sum, m) => sum + m.videoAvgTimeWatched, 0) / count;

  return {
    ...aggregated,
    frequency: avgFrequency,
    ctr: avgCtr,
    cpm: avgCpm,
    videoAvgTimeWatched: avgVideoTime,
    // Calculated fields
    cpc: aggregated.clicks! > 0 ? aggregated.spend! / aggregated.clicks! : 0,
    outboundClicksCtr:
      aggregated.impressions! > 0
        ? (aggregated.outboundClicks! / aggregated.impressions!) * 100
        : 0,
    costPerOutboundClick:
      aggregated.outboundClicks! > 0
        ? aggregated.spend! / aggregated.outboundClicks!
        : 0,
    inlineLinkClickCtr:
      aggregated.impressions! > 0
        ? (aggregated.inlineLinkClicks! / aggregated.impressions!) * 100
        : 0,
    costPerPurchase:
      aggregated.purchases! > 0 ? aggregated.spend! / aggregated.purchases! : 0,
    purchaseRoas:
      aggregated.spend! > 0 ? aggregated.purchaseValue! / aggregated.spend! : 0,
  } as DailyMetric;
}

/**
 * Calculate Creative Fatigue Score
 * Based on CTR decline and CPM increase over last 7 days
 */
export function calculateFatigueScore(
  metricsLast7Days: DailyMetric[],
  metricsPrevious7Days: DailyMetric[]
): number {
  if (metricsLast7Days.length === 0 || metricsPrevious7Days.length === 0) {
    return 0;
  }

  const currentPeriod = aggregateMetrics(metricsLast7Days);
  const previousPeriod = aggregateMetrics(metricsPrevious7Days);

  const currentCtr = currentPeriod.outboundClicksCtr;
  const previousCtr = previousPeriod.outboundClicksCtr;
  const currentCpm = currentPeriod.cpm;
  const previousCpm = previousPeriod.cpm;

  // Calculate percentage changes
  const ctrChange =
    previousCtr > 0 ? ((currentCtr - previousCtr) / previousCtr) * 100 : 0;
  const cpmChange =
    previousCpm > 0 ? ((currentCpm - previousCpm) / previousCpm) * 100 : 0;

  // Fatigue indicators:
  // - CTR decline > 20% = +40 points
  // - CPM increase > 15% = +40 points
  // - Frequency > 3 = +20 points

  let fatigueScore = 0;

  if (ctrChange < -20) fatigueScore += 40;
  else if (ctrChange < -10) fatigueScore += 20;

  if (cpmChange > 15) fatigueScore += 40;
  else if (cpmChange > 10) fatigueScore += 20;

  if (currentPeriod.frequency > 3) fatigueScore += 20;
  else if (currentPeriod.frequency > 2.5) fatigueScore += 10;

  return Math.min(fatigueScore, 100);
}

/**
 * Determine spend trend (scaling, holding, declining)
 */
export function calculateSpendTrend(
  metricsCurrentWeek: DailyMetric[],
  metricsPreviousWeek: DailyMetric[]
): "scaling" | "holding" | "declining" {
  if (metricsCurrentWeek.length === 0 || metricsPreviousWeek.length === 0) {
    return "holding";
  }

  const currentSpend = metricsCurrentWeek.reduce((sum, m) => sum + m.spend, 0);
  const previousSpend = metricsPreviousWeek.reduce(
    (sum, m) => sum + m.spend,
    0
  );

  if (previousSpend === 0) return "holding";

  const spendChange = ((currentSpend - previousSpend) / previousSpend) * 100;

  if (spendChange > 15) return "scaling";
  if (spendChange < -15) return "declining";
  return "holding";
}
