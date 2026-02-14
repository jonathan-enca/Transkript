import { NextResponse } from "next/server";
import { seedDemoData } from "@/lib/demo/seed";

export async function POST() {
  try {
    const result = await seedDemoData();
    return NextResponse.json({
      success: true,
      message: "Demo data seeded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error seeding demo data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to seed demo data",
      },
      { status: 500 }
    );
  }
}
