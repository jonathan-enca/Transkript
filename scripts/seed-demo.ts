#!/usr/bin/env tsx

import { seedDemoData } from "../lib/demo/seed";

async function main() {
  try {
    await seedDemoData();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    process.exit(1);
  }
}

main();
