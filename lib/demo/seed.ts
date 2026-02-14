/**
 * Demo data seeding script
 * Generates fake data for testing the app without Meta API connection
 */

import { db } from "@/lib/db";
import { ads, dailyMetrics, benchmarks } from "@/lib/db/schema";
import { subDays, format } from "date-fns";
import { formatDateToISO } from "@/lib/utils";
import { recalculateBenchmarks } from "@/lib/metrics/benchmarks";

const DEMO_AD_NAMES = [
  "UGC Style - Product Demo",
  "Hook Test: Why 95% Fail",
  "Before/After Transformation",
  "Unboxing Experience",
  "Customer Testimonial #1",
  "Problem-Solution Framework",
  "Trending Sound Hook",
  "Educational How-To",
  "Behind the Scenes",
  "Influencer Partnership",
];

const DEMO_CAMPAIGNS = [
  { id: "campaign_1", name: "Q1 Prospecting" },
  { id: "campaign_2", name: "Retargeting - High Intent" },
  { id: "campaign_3", name: "Scaling Winners" },
];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max));
}

export async function seedDemoData() {
  console.log("🌱 Seeding demo data...");

  // Clear existing data
  await db.delete(dailyMetrics).run();
  await db.delete(ads).run();
  await db.delete(benchmarks).run();

  // Create 10 demo ads
  const createdAds = [];

  for (let i = 0; i < 10; i++) {
    const campaign = DEMO_CAMPAIGNS[i % DEMO_CAMPAIGNS.length];
    const format = i < 7 ? "video" : i < 9 ? "image" : "carousel";
    const status = i < 8 ? "ACTIVE" : "PAUSED";

    const ad = {
      id: `ad_demo_${i + 1}`,
      creativeId: `creative_demo_${i + 1}`,
      name: DEMO_AD_NAMES[i],
      format,
      thumbnailUrl: `https://picsum.photos/seed/${i}/800/450`,
      videoUrl: format === "video" ? `https://example.com/video_${i}.mp4` : null,
      imageUrl: format !== "video" ? `https://picsum.photos/seed/${i}/1080/1080` : null,
      headline: `Limited Time Offer - ${DEMO_AD_NAMES[i]}`,
      body: `Découvrez notre produit révolutionnaire. Offre spéciale pour les 100 premiers clients !`,
      callToAction: "SHOP_NOW",
      campaignId: campaign.id,
      campaignName: campaign.name,
      adsetId: `adset_${i + 1}`,
      adsetName: `AdSet ${i + 1}`,
      status,
      createdTime: subDays(new Date(), randomInt(5, 45)),
      updatedTime: new Date(),
      lastSyncedAt: new Date(),
    };

    await db.insert(ads).values(ad).run();
    createdAds.push(ad);
  }

  console.log(`✅ Created ${createdAds.length} demo ads`);

  // Generate metrics for last 30 days for each ad
  let metricsCount = 0;

  for (const ad of createdAds) {
    const adCreatedDate = ad.createdTime;
    const daysActive = Math.min(
      30,
      Math.floor((new Date().getTime() - adCreatedDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Performance tier (some ads perform better than others)
    const performanceTier = Math.random();
    const isWinner = performanceTier > 0.7;
    const isAverage = performanceTier > 0.3;

    for (let day = 0; day < daysActive; day++) {
      const date = formatDateToISO(subDays(new Date(), day));

      // Base metrics with some randomness
      const baseSpend = isWinner
        ? randomBetween(100, 200)
        : isAverage
        ? randomBetween(50, 100)
        : randomBetween(20, 50);

      const impressions = Math.floor(baseSpend * randomBetween(150, 250));
      const reach = Math.floor(impressions * randomBetween(0.6, 0.8));

      // Video metrics (higher for winners)
      const video3sViews = Math.floor(
        impressions * (isWinner ? randomBetween(0.35, 0.45) : randomBetween(0.15, 0.30))
      );
      const video15sViews = Math.floor(
        video3sViews * (isWinner ? randomBetween(0.6, 0.8) : randomBetween(0.3, 0.5))
      );
      const video25Pct = Math.floor(video3sViews * randomBetween(0.7, 0.9));
      const video50Pct = Math.floor(video25Pct * randomBetween(0.6, 0.8));
      const video75Pct = Math.floor(video50Pct * randomBetween(0.5, 0.7));
      const video100Pct = Math.floor(video75Pct * randomBetween(0.4, 0.6));

      // Click metrics
      const outboundClicks = Math.floor(
        impressions * (isWinner ? randomBetween(0.02, 0.04) : randomBetween(0.005, 0.015))
      );

      // Purchase metrics
      const purchases = Math.floor(
        outboundClicks * (isWinner ? randomBetween(0.03, 0.06) : randomBetween(0.01, 0.03))
      );
      const avgOrderValue = randomBetween(45, 85);
      const purchaseValue = purchases * avgOrderValue;

      const metric = {
        adId: ad.id,
        date,
        spend: baseSpend,
        impressions,
        reach,
        frequency: impressions / reach,
        clicks: Math.floor(outboundClicks * 1.2),
        cpc: baseSpend / Math.max(outboundClicks, 1),
        ctr: (outboundClicks / impressions) * 100,
        outboundClicks,
        outboundClicksCtr: (outboundClicks / impressions) * 100,
        costPerOutboundClick: baseSpend / Math.max(outboundClicks, 1),
        inlineLinkClicks: outboundClicks,
        inlineLinkClickCtr: (outboundClicks / impressions) * 100,
        cpm: (baseSpend / impressions) * 1000,
        video3sViews,
        video15sViews,
        video25Pct,
        video50Pct,
        video75Pct,
        video100Pct,
        videoAvgTimeWatched: randomBetween(8, 25),
        videoThruPlays: video100Pct,
        purchases,
        purchaseValue,
        costPerPurchase: purchases > 0 ? baseSpend / purchases : 0,
        purchaseRoas: baseSpend > 0 ? purchaseValue / baseSpend : 0,
        placement: null,
        platform: null,
        syncedAt: new Date(),
      };

      await db.insert(dailyMetrics).values(metric).run();
      metricsCount++;
    }
  }

  console.log(`✅ Created ${metricsCount} daily metrics`);

  // Calculate benchmarks
  console.log("📊 Calculating benchmarks...");
  await recalculateBenchmarks(20); // Min spend threshold for benchmarks

  console.log("🎉 Demo data seeded successfully!");

  return {
    ads: createdAds.length,
    metrics: metricsCount,
  };
}
