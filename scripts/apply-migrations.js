const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const db = new Database("./creative-analytics.db");

// Read migration file
const migrationPath = path.join(__dirname, "..", "drizzle", "0000_lyrical_betty_ross.sql");
const migration = fs.readFileSync(migrationPath, "utf8");

// Split by statement separator and execute
const statements = migration
  .split("--> statement-breakpoint")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log(`Applying ${statements.length} SQL statements...`);

try {
  for (const statement of statements) {
    db.exec(statement);
  }
  console.log("✅ Migrations applied successfully!");
} catch (error) {
  console.error("❌ Error applying migrations:", error);
  process.exit(1);
} finally {
  db.close();
}
