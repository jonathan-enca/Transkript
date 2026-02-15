import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/settings/benchmark-targets
 * Save benchmark target settings for the account
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { hookRateTarget, roasTarget, cpaMax, currency } = body;

    // Get first account for this user (TODO: support multiple accounts)
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, session.user.email || "default"))
      .limit(1);

    if (userAccounts.length === 0) {
      return NextResponse.json(
        { error: "No account found. Please connect your Meta account first." },
        { status: 404 }
      );
    }

    const account = userAccounts[0];

    // Update account settings
    await db
      .update(accounts)
      .set({
        targetHookRate: hookRateTarget,
        targetRoas: roasTarget,
        targetCpa: cpaMax,
        currency: currency || "EUR",
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, account.id));

    return NextResponse.json({
      success: true,
      message: "Benchmark targets saved successfully",
    });
  } catch (error) {
    console.error("Error saving benchmark targets:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save settings",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/settings/benchmark-targets
 * Get benchmark target settings for the account
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get first account for this user
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, session.user.email || "default"))
      .limit(1);

    if (userAccounts.length === 0) {
      return NextResponse.json({
        hookRateTarget: 30,
        roasTarget: 3,
        cpaMax: 30,
        currency: "EUR",
      });
    }

    const account = userAccounts[0];

    return NextResponse.json({
      hookRateTarget: account.targetHookRate || 30,
      roasTarget: account.targetRoas || 3,
      cpaMax: account.targetCpa || 30,
      currency: account.currency || "EUR",
    });
  } catch (error) {
    console.error("Error loading benchmark targets:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load settings",
      },
      { status: 500 }
    );
  }
}
