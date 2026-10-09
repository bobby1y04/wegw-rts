import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../db/schema";

type PostgresClient = ReturnType<typeof postgres>;

interface DatabaseState {
  client?: PostgresClient;
  db?: ReturnType<typeof createDatabase>;
}

const globalDatabase = globalThis as typeof globalThis & {
  __wegwaertsDatabase?: DatabaseState;
};

const state = globalDatabase.__wegwaertsDatabase ?? {};

if (process.env.NODE_ENV !== "production") {
  globalDatabase.__wegwaertsDatabase = state;
}

export function createDatabase(connectionString: string) {
  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDatabase>;
export type DatabaseTransaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];

function requireDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured. Set it before using the database.",
    );
  }

  return databaseUrl;
}

export function getDatabase(): Database {
  if (!state.db) {
    state.client = postgres(requireDatabaseUrl(), {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
    state.db = drizzle(state.client, { schema });
  }

  return state.db;
}

export async function closeDatabase(): Promise<void> {
  if (state.client) {
    await state.client.end();
  }

  state.client = undefined;
  state.db = undefined;
}
