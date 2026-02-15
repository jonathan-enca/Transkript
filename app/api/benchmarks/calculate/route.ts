import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateAllBenchmarks } from "@/lib/benchmarks";

/**
 * POST /api/benchmarks/calculate
 * Calculate all benchmarks
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

    console.log("🔄 Starting benchmark calculation...");
    const totalCalculated = await calculateAllBenchmarks();

    return NextResponse.json({
      success: true,
      benchmarksCalculated: totalCalculated,
    });
  } catch (error) {
    console.error("Error calculating benchmarks:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Benchmark calculation failed",
      },
      { status: 500 }
    );
  }
}
