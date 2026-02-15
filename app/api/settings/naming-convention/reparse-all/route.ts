import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getNamingConvention, parseAdName } from "@/lib/naming-convention";

/**
 * POST /api/settings/naming-convention/reparse-all
 * Re-parse all existing ads with the current naming convention
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const config = await getNamingConvention(db);

    if (!config) {
      return NextResponse.json(
        { error: "No naming convention configured" },
        { status: 400 }
      );
    }

    // Get all ads
    const allAds = await db.select({ id: ads.id, name: ads.name }).from(ads);

    let updated = 0;

    for (const ad of allAds) {
      const parsedTags = parseAdName(ad.name, config);

      await db
        .update(ads)
        .set(parsedTags)
        .where(eq(ads.id, ad.id));

      updated++;
    }

    console.log(`✅ Re-parsed ${updated} ads`);

    return NextResponse.json({
      success: true,
      adsUpdated: updated,
    });
  } catch (error) {
    console.error("Error re-parsing ads:", error);
    return NextResponse.json(
      { error: "Failed to re-parse ads" },
      { status: 500 }
    );
  }
}
