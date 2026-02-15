import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAds, getAdInsights, getAdById } from "@/lib/meta/api";
import { db } from "@/lib/db";
import { ads, dailyMetrics, accounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { subDays } from "date-fns";
import { formatDateToISO } from "@/lib/utils";

/**
 * Helper to safely parse float values and handle Infinity/NaN
 */
function safeParseFloat(value: string | undefined | null, defaultValue = 0): number {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isFinite(parsed) ? parsed : defaultValue;
}

/**
 * Helper to safely parse int values and handle NaN
 */
function safeParseInt(value: string | undefined | null, defaultValue = 0): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value);
  return isFinite(parsed) ? parsed : defaultValue;
}

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

    // Step 1: Fetch latest 100 ads from Meta
    console.log("📥 Fetching latest 100 ads from Meta...");
    const metaAds = await getAds(adAccountId, session.accessToken, 100);
    console.log(`✅ Fetched ${metaAds.length} ads`);

    // Step 2: Store ads in database
    let adsInserted = 0;
    let adsUpdated = 0;
    let adsSkipped = 0;
    const adsErrors: Array<{ adId: string; error: string }> = [];

    for (const metaAd of metaAds) {
      try {
        // Validate required fields
        if (!metaAd.creative?.id) {
          console.warn(`Skipping ad ${metaAd.id}: missing creative.id`);
          adsSkipped++;
          adsErrors.push({ adId: metaAd.id, error: "Missing creative.id" });
          continue;
        }
        if (!metaAd.campaign?.id || !metaAd.campaign?.name) {
          console.warn(`Skipping ad ${metaAd.id}: missing campaign data`);
          adsSkipped++;
          adsErrors.push({ adId: metaAd.id, error: "Missing campaign data" });
          continue;
        }
        if (!metaAd.adset?.id || !metaAd.adset?.name) {
          console.warn(`Skipping ad ${metaAd.id}: missing adset data`);
          adsSkipped++;
          adsErrors.push({ adId: metaAd.id, error: "Missing adset data" });
          continue;
        }

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
        adsSkipped++;
        adsErrors.push({
          adId: metaAd.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
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
    let metricsSkipped = 0;
    let adsAutoCreated = 0;
    const metricsErrors: Array<{ adId: string; error: string }> = [];

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
          // Auto-create ad with FULL data from Meta API
          console.log(`📝 Auto-creating ad ${adId} - fetching from Meta API`);
          try {
            const metaAd = await getAdById(adId, session.accessToken);

            if (!metaAd) {
              console.error(`Failed to fetch ad ${adId} from Meta API`);
              metricsSkipped++;
              metricsErrors.push({
                adId,
                error: 'Could not fetch ad details from Meta API'
              });
              continue;
            }

            // Determine format from creative
            let format = "image";
            let videoUrl = null;
            let imageUrl = null;
            let headline = null;
            let body = null;
            let callToAction = null;

            const videoData = metaAd.creative?.object_story_spec?.video_data;
            const linkData = metaAd.creative?.object_story_spec?.link_data;

            if (videoData) {
              format = "video";
              videoUrl = videoData.video_id || null;
              body = videoData.message || null;
              headline = videoData.link_description || null;
              callToAction = videoData.call_to_action?.type || null;
            } else if (linkData) {
              body = linkData.message || null;
              headline = linkData.name || null;
              callToAction = linkData.call_to_action?.type || null;
            }

            await db.insert(ads).values({
              id: metaAd.id,
              creativeId: metaAd.creative?.id || `creative_${adId}`,
              name: metaAd.name,
              format,
              thumbnailUrl: metaAd.creative?.thumbnail_url || null,
              videoUrl,
              imageUrl,
              headline,
              body,
              callToAction,
              campaignId: metaAd.campaign?.id || "unknown",
              campaignName: metaAd.campaign?.name || "Unknown Campaign",
              adsetId: metaAd.adset?.id || "unknown",
              adsetName: metaAd.adset?.name || "Unknown AdSet",
              status: metaAd.status || "UNKNOWN",
              createdTime: new Date(metaAd.created_time),
              updatedTime: new Date(metaAd.updated_time),
              lastSyncedAt: new Date(),
            });
            adsAutoCreated++;
            console.log(`✅ Auto-created ad ${adId}: "${metaAd.name}"`);
          } catch (createError) {
            console.error(`Failed to auto-create ad ${adId}:`, createError);
            metricsSkipped++;
            metricsErrors.push({
              adId,
              error: `Auto-create failed: ${createError instanceof Error ? createError.message : 'Unknown error'}`
            });
            continue;
          }
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
          spend: safeParseFloat(insight.spend),
          impressions: safeParseInt(insight.impressions),
          reach: safeParseInt(insight.reach),
          frequency: safeParseFloat(insight.frequency),
          clicks: safeParseInt(insight.clicks),
          cpc: safeParseFloat(insight.cpc),
          ctr: safeParseFloat(insight.ctr),
          cpm: safeParseFloat(insight.cpm),
          outboundClicks: safeParseInt(insight.outbound_clicks),
          outboundClicksCtr: safeParseFloat(insight.outbound_clicks_ctr),
          costPerOutboundClick: safeParseFloat(insight.cost_per_outbound_click),
          inlineLinkClicks: safeParseInt(insight.inline_link_clicks),
          inlineLinkClickCtr: safeParseFloat(insight.inline_link_click_ctr),
          video3sViews: safeParseInt(video3sViews),
          video25Pct: safeParseInt(video25Pct),
          video50Pct: safeParseInt(video50Pct),
          video75Pct: safeParseInt(video75Pct),
          video100Pct: safeParseInt(video100Pct),
          videoThruPlays: safeParseInt(videoThruPlays),
          videoAvgTimeWatched: safeParseFloat(videoAvgTime),
          purchases: safeParseInt(purchases),
          purchaseValue: safeParseFloat(purchaseValue),
          costPerPurchase: safeParseFloat(costPerPurchase),
          purchaseRoas: safeParseFloat(purchaseRoas),
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
        metricsSkipped++;
        metricsErrors.push({
          adId: insight.ad_id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    console.log(`✅ Metrics: ${metricsInserted} inserted, ${metricsUpdated} updated, ${metricsSkipped} skipped`);
    if (adsAutoCreated > 0) {
      console.log(`📝 Auto-created ${adsAutoCreated} ads from insights`);
    }

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
          skipped: adsSkipped,
          autoCreated: adsAutoCreated,
          total: metaAds.length,
          errors: adsErrors.length > 0 ? adsErrors : undefined,
        },
        metrics: {
          inserted: metricsInserted,
          updated: metricsUpdated,
          skipped: metricsSkipped,
          total: insights.length,
          errors: metricsErrors.length > 0 ? metricsErrors : undefined,
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
