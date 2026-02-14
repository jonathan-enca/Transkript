import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAds, getAdInsights } from "@/lib/meta/api";
import { db } from "@/lib/db";
import { ads, dailyMetrics, accounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { subDays } from "date-fns";
import { formatDateToISO } from "@/lib/utils";

/**
 * POST /api/meta/sync
 * Synchronize ads and metrics from Meta Ads API
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { adAccountId, daysBack = 30 } = body;

    if (!adAccountId) {
      return NextResponse.json(
        { error: "adAccountId is required" },
        { status: 400 }
      );
    }

    // Get or create account in DB
    const existingAccount = await db
      .select()
      .from(accounts)
      .where(eq(accounts.adAccountId, adAccountId))
      .limit(1);

    let account;
    if (existingAccount.length === 0) {
      // Create new account
      const newAccount = await db.insert(accounts).values({
        userId: session.user?.email || "default",
        adAccountId,
        adAccountName: adAccountId,
        accessToken: session.accessToken,
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      }).returning();
      account = newAccount[0];
    } else {
      // Update access token
      const updated = await db
        .update(accounts)
        .set({
          accessToken: session.accessToken,
          updatedAt: new Date(),
        })
        .where(eq(accounts.adAccountId, adAccountId))
        .returning();
      account = updated[0];
    }

    console.log(`🔄 Starting sync for account: ${adAccountId}`);

    // Step 1: Fetch ads from Meta
    console.log("📥 Fetching ads from Meta...");
    const metaAds = await getAds(adAccountId, session.accessToken);
    console.log(`✅ Fetched ${metaAds.length} ads`);

    // Step 2: Store ads in database
    let adsInserted = 0;
    let adsUpdated = 0;

    for (const metaAd of metaAds) {
      try {
        // Extract creative data
        const creative = metaAd.creative;
        const objectStory = creative?.object_story_spec;
        const videoData = objectStory?.video_data;
        const linkData = objectStory?.link_data;

        // Determine format
        let format = "image";
        if (videoData?.video_id) format = "video";

        // Extract URLs and text
        const thumbnailUrl = creative?.thumbnail_url;
        const headline = videoData?.message || linkData?.name || metaAd.name;
        const body = videoData?.link_description || linkData?.description;
        const callToAction = videoData?.call_to_action?.type || linkData?.call_to_action?.type;

        // Check if ad exists
        const existingAd = await db
          .select()
          .from(ads)
          .where(eq(ads.id, metaAd.id))
          .limit(1);

        if (existingAd.length === 0) {
          // Insert new ad
          await db.insert(ads).values({
            id: metaAd.id,
            creativeId: metaAd.creative.id,
            name: metaAd.name,
            format,
            thumbnailUrl,
            videoUrl: videoData?.video_id ? `https://www.facebook.com/${videoData.video_id}` : null,
            imageUrl: linkData?.image_hash ? `https://graph.facebook.com/${linkData.image_hash}/picture` : null,
            headline,
            body,
            callToAction,
            campaignId: metaAd.campaign.id,
            campaignName: metaAd.campaign.name,
            adsetId: metaAd.adset.id,
            adsetName: metaAd.adset.name,
            status: metaAd.status,
            createdTime: new Date(metaAd.created_time),
            updatedTime: new Date(metaAd.updated_time),
            lastSyncedAt: new Date(),
          });
          adsInserted++;
        } else {
          // Update existing ad
          await db
            .update(ads)
            .set({
              name: metaAd.name,
              status: metaAd.status,
              updatedTime: new Date(metaAd.updated_time),
              lastSyncedAt: new Date(),
            })
            .where(eq(ads.id, metaAd.id));
          adsUpdated++;
        }
      } catch (error) {
        console.error(`Error processing ad ${metaAd.id}:`, error);
      }
    }

    console.log(`✅ Ads: ${adsInserted} inserted, ${adsUpdated} updated`);

    // Step 3: Fetch insights for last N days
    console.log(`📊 Fetching insights for last ${daysBack} days...`);
    const dateFrom = formatDateToISO(subDays(new Date(), daysBack)).split("T")[0];
    const dateTo = formatDateToISO(new Date()).split("T")[0];

    const insights = await getAdInsights(
      adAccountId,
      session.accessToken,
      dateFrom,
      dateTo,
      "ad"
    );

    console.log(`✅ Fetched ${insights.length} insight records`);

    // Step 4: Store insights in database
    let metricsInserted = 0;
    let metricsUpdated = 0;

    for (const insight of insights) {
      try {
        const adId = insight.ad_id;

        // Check if ad exists in our database
        const adExists = await db
          .select()
          .from(ads)
          .where(eq(ads.id, adId))
          .limit(1);

        if (adExists.length === 0) {
          console.warn(`Ad ${adId} not found in database, skipping metrics`);
          continue;
        }

        // Parse metrics
        const purchases = insight.actions?.find(a => a.action_type === "purchase")?.value || "0";
        const purchaseValue = insight.action_values?.find(a => a.action_type === "purchase")?.value || "0";
        const costPerPurchase = insight.cost_per_action_type?.find(a => a.action_type === "purchase")?.value || "0";
        const purchaseRoas = insight.purchase_roas?.find(a => a.action_type === "purchase")?.value || "0";

        const video3sViews = insight.actions?.find(a => a.action_type === "video_view")?.value || "0";
        const video25Pct = insight.video_p25_watched_actions?.[0]?.value || "0";
        const video50Pct = insight.video_p50_watched_actions?.[0]?.value || "0";
        const video75Pct = insight.video_p75_watched_actions?.[0]?.value || "0";
        const video100Pct = insight.video_p100_watched_actions?.[0]?.value || "0";
        const videoThruPlays = insight.video_thruplay_watched_actions?.[0]?.value || "0";
        const videoAvgTime = insight.video_avg_time_watched_actions?.[0]?.value || "0";

        // Check if metric exists for this ad and date
        const existingMetric = await db
          .select()
          .from(dailyMetrics)
          .where(
            and(
              eq(dailyMetrics.adId, adId),
              eq(dailyMetrics.date, insight.date_start)
            )
          )
          .limit(1);

        const metricData = {
          adId,
          date: insight.date_start,
          spend: parseFloat(insight.spend || "0"),
          impressions: parseInt(insight.impressions || "0"),
          reach: parseInt(insight.reach || "0"),
          frequency: parseFloat(insight.frequency || "0"),
          clicks: parseInt(insight.clicks || "0"),
          cpc: parseFloat(insight.cpc || "0"),
          ctr: parseFloat(insight.ctr || "0"),
          cpm: parseFloat(insight.cpm || "0"),
          outboundClicks: parseInt(insight.outbound_clicks || "0"),
          outboundClicksCtr: parseFloat(insight.outbound_clicks_ctr || "0"),
          costPerOutboundClick: parseFloat(insight.cost_per_outbound_click || "0"),
          inlineLinkClicks: parseInt(insight.inline_link_clicks || "0"),
          inlineLinkClickCtr: parseFloat(insight.inline_link_click_ctr || "0"),
          video3sViews: parseInt(video3sViews),
          video25Pct: parseInt(video25Pct),
          video50Pct: parseInt(video50Pct),
          video75Pct: parseInt(video75Pct),
          video100Pct: parseInt(video100Pct),
          videoThruPlays: parseInt(videoThruPlays),
          videoAvgTimeWatched: parseFloat(videoAvgTime),
          purchases: parseInt(purchases),
          purchaseValue: parseFloat(purchaseValue),
          costPerPurchase: parseFloat(costPerPurchase),
          purchaseRoas: parseFloat(purchaseRoas),
          syncedAt: new Date(),
        };

        if (existingMetric.length === 0) {
          await db.insert(dailyMetrics).values(metricData);
          metricsInserted++;
        } else {
          await db
            .update(dailyMetrics)
            .set(metricData)
            .where(eq(dailyMetrics.id, existingMetric[0].id));
          metricsUpdated++;
        }
      } catch (error) {
        console.error(`Error processing insight for ad ${insight.ad_id}:`, error);
      }
    }

    console.log(`✅ Metrics: ${metricsInserted} inserted, ${metricsUpdated} updated`);

    // Update account's last sync time
    await db
      .update(accounts)
      .set({ lastSyncAt: new Date() })
      .where(eq(accounts.id, account.id));

    return NextResponse.json({
      success: true,
      data: {
        ads: {
          inserted: adsInserted,
          updated: adsUpdated,
          total: metaAds.length,
        },
        metrics: {
          inserted: metricsInserted,
          updated: metricsUpdated,
          total: insights.length,
        },
      },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 }
    );
  }
}
