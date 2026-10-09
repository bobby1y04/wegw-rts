import path from "node:path";

import { migrate } from "drizzle-orm/postgres-js/migrator";

import { closeDatabase, getDatabase } from "../server/db";

async function runMigrations(): Promise<void> {
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
