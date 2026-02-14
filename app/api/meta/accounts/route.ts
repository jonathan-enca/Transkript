import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdAccounts } from "@/lib/meta/api";

/**
 * GET /api/meta/accounts
 * Fetch user's Meta Ad Accounts
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const accounts = await getAdAccounts(session.accessToken);

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error("Error fetching ad accounts:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch ad accounts",
      },
      { status: 500 }
    );
  }
}
