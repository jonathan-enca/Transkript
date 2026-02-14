import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import Database from "better-sqlite3";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Use Turso in production, SQLite locally
const isProduction = process.env.NODE_ENV === "production";
const useTurso = isProduction && process.env.TURSO_DATABASE_URL;

let db: ReturnType<typeof drizzleSqlite> | ReturnType<typeof drizzleLibsql>;

if (useTurso) {
  // Production: Use Turso (serverless SQLite)
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  db = drizzleLibsql(client, { schema });
} else {
  // Development: Use local SQLite
  const sqlite = new Database(
    process.env.DATABASE_URL?.replace("file:", "") || "./creative-analytics.db"
  );
  db = drizzleSqlite(sqlite, { schema });
}

export { db };
