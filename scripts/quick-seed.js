const Database = require("better-sqlite3");
const { subDays, format } = require("date-fns");

const db = new Database("./creative-analytics.db");

console.log("🌱 Génération des données de démo...\n");

// Clear existing data
db.exec("DELETE FROM daily_metrics");
db.exec("DELETE FROM ads");
db.exec("DELETE FROM benchmarks");

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

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max));
}

function formatDateToISO(date) {
  return date.toISOString().split("T")[0];
}

// Create 10 demo ads
const insertAd = db.prepare(`
  INSERT INTO ads (id, creative_id, name, format, thumbnail_url, video_url, image_url,
    headline, body, call_to_action, campaign_id, campaign_name, adset_id, adset_name,
    status, created_time, updated_time, last_synced_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMetric = db.prepare(`
  INSERT INTO daily_metrics (ad_id, date, spend, impressions, reach, frequency, clicks, cpc, ctr,
    outbound_clicks, outbound_clicks_ctr, cost_per_outbound_click, inline_link_clicks, inline_link_click_ctr,
    cpm, video_3s_views, video_15s_views, video_25_pct, video_50_pct, video_75_pct, video_100_pct,
    video_avg_time_watched, video_thru_plays, purchases, purchase_value, cost_per_purchase, purchase_roas,
    placement, platform, synced_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const now = Date.now();
let adsCount = 0;
let metricsCount = 0;

for (let i = 0; i < 10; i++) {
  const campaign = DEMO_CAMPAIGNS[i % DEMO_CAMPAIGNS.length];
  const format = i < 7 ? "video" : i < 9 ? "image" : "carousel";
  const status = i < 8 ? "ACTIVE" : "PAUSED";
  const createdTime = Date.now() - randomInt(5, 45) * 24 * 60 * 60 * 1000;

  insertAd.run(
    `ad_demo_${i + 1}`,
    `creative_demo_${i + 1}`,
    DEMO_AD_NAMES[i],
    format,
    `https://picsum.photos/seed/${i}/800/450`,
    format === "video" ? `https://example.com/video_${i}.mp4` : null,
    format !== "video" ? `https://picsum.photos/seed/${i}/1080/1080` : null,
    `Limited Time Offer - ${DEMO_AD_NAMES[i]}`,
    "Découvrez notre produit révolutionnaire. Offre spéciale pour les 100 premiers clients !",
    "SHOP_NOW",
    campaign.id,
    campaign.name,
    `adset_${i + 1}`,
    `AdSet ${i + 1}`,
    status,
    createdTime,
    now,
    now
  );
  adsCount++;

  // Generate metrics for last 30 days
  const daysActive = Math.min(30, Math.floor((now - createdTime) / (1000 * 60 * 60 * 24)));
  const performanceTier = Math.random();
  const isWinner = performanceTier > 0.7;
  const isAverage = performanceTier > 0.3;

  for (let day = 0; day < daysActive; day++) {
    const date = formatDateToISO(subDays(new Date(), day));
    const baseSpend = isWinner ? randomBetween(100, 200) : isAverage ? randomBetween(50, 100) : randomBetween(20, 50);
    const impressions = Math.floor(baseSpend * randomBetween(150, 250));
    const reach = Math.floor(impressions * randomBetween(0.6, 0.8));
    const video3sViews = Math.floor(impressions * (isWinner ? randomBetween(0.35, 0.45) : randomBetween(0.15, 0.30)));
    const video15sViews = Math.floor(video3sViews * (isWinner ? randomBetween(0.6, 0.8) : randomBetween(0.3, 0.5)));
    const video25Pct = Math.floor(video3sViews * randomBetween(0.7, 0.9));
    const video50Pct = Math.floor(video25Pct * randomBetween(0.6, 0.8));
    const video75Pct = Math.floor(video50Pct * randomBetween(0.5, 0.7));
    const video100Pct = Math.floor(video75Pct * randomBetween(0.4, 0.6));
    const outboundClicks = Math.floor(impressions * (isWinner ? randomBetween(0.02, 0.04) : randomBetween(0.005, 0.015)));
    const purchases = Math.floor(outboundClicks * (isWinner ? randomBetween(0.03, 0.06) : randomBetween(0.01, 0.03)));
    const avgOrderValue = randomBetween(45, 85);
    const purchaseValue = purchases * avgOrderValue;

    insertMetric.run(
      `ad_demo_${i + 1}`,
      date,
      baseSpend,
      impressions,
      reach,
      impressions / reach,
      Math.floor(outboundClicks * 1.2),
      baseSpend / Math.max(outboundClicks, 1),
      (outboundClicks / impressions) * 100,
      outboundClicks,
      (outboundClicks / impressions) * 100,
      baseSpend / Math.max(outboundClicks, 1),
      outboundClicks,
      (outboundClicks / impressions) * 100,
      (baseSpend / impressions) * 1000,
      video3sViews,
      video15sViews,
      video25Pct,
      video50Pct,
      video75Pct,
      video100Pct,
      randomBetween(8, 25),
      video100Pct,
      purchases,
      purchaseValue,
      purchases > 0 ? baseSpend / purchases : 0,
      baseSpend > 0 ? purchaseValue / baseSpend : 0,
      null,
      null,
      now
    );
    metricsCount++;
  }
}

console.log(`✅ ${adsCount} créatives créées`);
console.log(`✅ ${metricsCount} métriques quotidiennes générées`);
console.log("🎉 Données de démo prêtes!\n");

db.close();
