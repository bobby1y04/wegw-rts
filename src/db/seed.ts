import { LOCAL_USER_DISPLAY_NAME, LOCAL_USER_ID } from "./local-user";
import { users } from "./schema";
import { closeDatabase, getDatabase } from "../server/db";

async function seed(): Promise<void> {
  try {
    await getDatabase()
      .insert(users)
      .values({
        id: LOCAL_USER_ID,
        displayName: LOCAL_USER_DISPLAY_NAME,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          displayName: LOCAL_USER_DISPLAY_NAME,
          updatedAt: new Date(),
        },
      });

    console.info(`Seeded local user ${LOCAL_USER_ID}.`);
  } finally {
    await closeDatabase();
  }
}

void seed().catch((error: unknown) => {
  console.error("Database seed failed.", error);
  process.exitCode = 1;
});
