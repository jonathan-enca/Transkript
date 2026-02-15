import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getNamingConvention, saveNamingConvention, NamingConventionConfig } from "@/lib/naming-convention";

/**
 * GET /api/settings/naming-convention
 * Get the current naming convention configuration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const config = await getNamingConvention(db);

    return NextResponse.json({
      config,
    });
  } catch (error) {
    console.error("Error fetching naming convention:", error);
    return NextResponse.json(
      { error: "Failed to fetch naming convention" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/naming-convention
 * Save naming convention configuration
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

    const body = await request.json();
    const { config } = body as { config: NamingConventionConfig };

    if (!config || !config.pattern || !config.separator) {
      return NextResponse.json(
        { error: "Invalid configuration" },
        { status: 400 }
      );
    }

    await saveNamingConvention(db, config);

    return NextResponse.json({
      success: true,
      message: "Naming convention saved successfully",
    });
  } catch (error) {
    console.error("Error saving naming convention:", error);
    return NextResponse.json(
      { error: "Failed to save naming convention" },
      { status: 500 }
    );
  }
}
