import path from "node:path";

import { migrate } from "drizzle-orm/postgres-js/migrator";

import { closeDatabase, getDatabase } from "../server/db";
import { loadLocalEnvironment } from "./load-env";

async function runMigrations(): Promise<void> {
  loadLocalEnvironment();
  if (process.env.DATABASE_MIGRATION_URL) {
    process.env.DATABASE_URL = process.env.DATABASE_MIGRATION_URL;
  }
  try {
    await migrate(getDatabase(), {
      migrationsFolder: path.resolve(process.cwd(), "src/db/migrations"),
    });
    console.info("Database migrations completed.");
  } finally {
    await closeDatabase();
  }
}

void runMigrations().catch((error: unknown) => {
  console.error("Database migration failed.", error);
  process.exitCode = 1;
});
