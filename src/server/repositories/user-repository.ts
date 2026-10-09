import { eq, lt } from "drizzle-orm";

import { aiLeases, usageCounters, users } from "@/db/schema";
import { getDatabase, type Database } from "@/server/db";

const RETENTION_MS = 7 * 24 * 60 * 60 * 1_000;

export class UserRepository {
  constructor(private readonly database: Database = getDatabase()) {}

  async touch(userId: string): Promise<void> {
    const now = new Date();
    await this.database
      .update(users)
      .set({
        lastSeenAt: now,
        expiresAt: new Date(now.getTime() + RETENTION_MS),
        updatedAt: now,
      })
      .where(eq(users.id, userId));
  }

  async delete(userId: string): Promise<boolean> {
    const deleted = await this.database
      .delete(users)
      .where(eq(users.id, userId))
      .returning({ id: users.id });
    return deleted.length > 0;
  }

  async cleanupExpired(now = new Date()) {
    return this.database.transaction(async (transaction) => {
      const deletedUsers = await transaction
        .delete(users)
        .where(lt(users.expiresAt, now))
        .returning({ id: users.id });
      const deletedCounters = await transaction
        .delete(usageCounters)
        .where(
          lt(
            usageCounters.bucketStart,
            new Date(now.getTime() - 2 * 24 * 60 * 60 * 1_000),
          ),
        )
        .returning({ scope: usageCounters.scope });
      await transaction
        .delete(aiLeases)
        .where(lt(aiLeases.expiresAt, now));

      return {
        users: deletedUsers.length,
        counters: deletedCounters.length,
      };
    });
  }
}
