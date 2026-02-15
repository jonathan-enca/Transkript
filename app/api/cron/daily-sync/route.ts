import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";

/**
 * GET /api/cron/daily-sync
 * Daily cron job to sync all accounts automatically
 *
 * Called by Vercel Cron every day at 6am UTC
 * Authorization: Vercel Cron Secret
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel automatically adds this header)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🕐 Running daily sync cron job...");

    // Get all accounts
    const allAccounts = await db.select().from(accounts);

    if (allAccounts.length === 0) {
      console.log("⚠️ No accounts found to sync");
      return NextResponse.json({
        success: true,
        message: "No accounts to sync",
        synced: 0,
      });
    }

    console.log(`📊 Found ${allAccounts.length} account(s) to sync`);

    const results: Array<{ accountId: string; success: boolean; error?: string }> = [];

    // Sync each account
    for (const account of allAccounts) {
      try {
        console.log(`🔄 Syncing account ${account.adAccountId}...`);

        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

        // Call sync endpoint with account's access token
        const response = await fetch(`${baseUrl}/api/meta/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Pass access token in header for cron job
            "X-Account-Token": account.accessToken,
            "X-Account-Id": account.adAccountId,
          },
          body: JSON.stringify({
            adAccountId: account.adAccountId,
            daysBack: 7, // Only sync last 7 days for daily cron
          }),
        });

        const data = await response.json();

        if (response.ok) {
          console.log(`✅ Account ${account.adAccountId} synced successfully`);
          results.push({
            accountId: account.adAccountId,
            success: true,
          });
        } else {
          console.error(`❌ Failed to sync account ${account.adAccountId}:`, data.error);
          results.push({
            accountId: account.adAccountId,
            success: false,
            error: data.error || "Unknown error",
          });
        }
      } catch (error) {
        console.error(`❌ Error syncing account ${account.adAccountId}:`, error);
        results.push({
          accountId: account.adAccountId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log(`✅ Daily sync completed: ${successCount} successful, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Daily sync completed`,
      synced: successCount,
      failed: failureCount,
      results,
    });
  } catch (error) {
    console.error("❌ Cron job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Cron job failed",
      },
      { status: 500 }
    );
  }
}
