import { and, eq, lte, sql } from "drizzle-orm";

import { aiLeases, usageCounters } from "../../db/schema";
import { getDatabase, type Database } from "../db";
import { bucketStart, retryAfterSeconds, type RateLimitBucket } from "./buckets";
import {
  readAbuseControlConfig,
  type AbuseControlConfig,
} from "./config";
import {
  AIKillSwitchError,
  RateLimitExceededError,
  type RateLimitScope,
} from "./errors";
import {
  deriveClientIdentifier,
  hmacIdentifier,
  type HeadersLike,
} from "./identifiers";

interface RateLimitPolicy {
  readonly scope: RateLimitScope;
  readonly bucket: RateLimitBucket;
  readonly limit: number;
  readonly identifierHash: string;
}

export interface ConsumeRateLimitsInput {
  readonly sessionIdentifier: string;
  readonly headers: HeadersLike;
  readonly now?: Date;
}

export interface RateLimitUsage {
  readonly scope: RateLimitScope;
  readonly count: number;
  readonly limit: number;
  readonly remaining: number;
  readonly resetsAt: Date;
}

export interface AILease {
  readonly userId: string;
  readonly expiresAt: Date;
}

export class AbuseControlService {
  constructor(
    private readonly database: Database = getDatabase(),
    private readonly config: AbuseControlConfig = readAbuseControlConfig(),
  ) {}

  assertAIEnabled(): void {
    if (!this.config.aiEnabled) throw new AIKillSwitchError();
  }

  async consumeRateLimits(
    input: ConsumeRateLimitsInput,
  ): Promise<RateLimitUsage[]> {
    this.assertAIEnabled();

    if (input.sessionIdentifier.trim() === "") {
      throw new Error("sessionIdentifier darf nicht leer sein.");
    }

    const now = input.now ?? new Date();
    const dailySalt = bucketStart(now, "day").toISOString();
    const sessionHash = hmacIdentifier(
      input.sessionIdentifier,
      this.config.ipHashSecret,
      `session:${dailySalt}`,
    );
    const ipHash = hmacIdentifier(
      deriveClientIdentifier(input.headers),
      this.config.ipHashSecret,
      `client-ip:${dailySalt}`,
    );
    const globalHash = hmacIdentifier(
      "wegwaerts-ai",
      this.config.ipHashSecret,
      "global",
    );
    const policies: RateLimitPolicy[] = [
      {
        scope: "session_day",
        bucket: "day",
        limit: this.config.limits.sessionDay,
        identifierHash: sessionHash,
      },
      {
        scope: "ip_day",
        bucket: "day",
        limit: this.config.limits.ipDay,
        identifierHash: ipHash,
      },
      {
        scope: "session_minute",
        bucket: "minute",
        limit: this.config.limits.sessionMinute,
        identifierHash: sessionHash,
      },
      {
        scope: "global_day",
        bucket: "day",
        limit: this.config.limits.globalDay,
        identifierHash: globalHash,
      },
    ];

    return this.database.transaction(async (transaction) => {
      const usage: RateLimitUsage[] = [];

      for (const policy of policies) {
        const start = bucketStart(now, policy.bucket);
        const [counter] = await transaction
          .insert(usageCounters)
          .values({
            scope: policy.scope,
            identifierHash: policy.identifierHash,
            bucketStart: start,
            count: 1,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [
              usageCounters.scope,
              usageCounters.identifierHash,
              usageCounters.bucketStart,
            ],
            set: {
              count: sql`${usageCounters.count} + 1`,
              updatedAt: now,
            },
          })
          .returning({ count: usageCounters.count });

        if (!counter) {
          throw new Error("Der Nutzungszähler konnte nicht aktualisiert werden.");
        }

        if (counter.count > policy.limit) {
          throw new RateLimitExceededError(
            policy.scope,
            policy.limit,
            retryAfterSeconds(now, policy.bucket),
          );
        }

        usage.push({
          scope: policy.scope,
          count: counter.count,
          limit: policy.limit,
          remaining: policy.limit - counter.count,
          resetsAt: new Date(
            start.getTime() +
              (policy.bucket === "minute" ? 60_000 : 86_400_000),
          ),
        });
      }

      return usage;
    });
  }

  async acquireAILease(
    userId: string,
    now = new Date(),
  ): Promise<AILease | null> {
    this.assertAIEnabled();
    if (userId.trim() === "") throw new Error("userId darf nicht leer sein.");

    const expiresAt = new Date(
      now.getTime() + this.config.aiLeaseSeconds * 1_000,
    );
    const [lease] = await this.database
      .insert(aiLeases)
      .values({ userId, expiresAt })
      .onConflictDoUpdate({
        target: aiLeases.userId,
        set: { expiresAt },
        setWhere: lte(aiLeases.expiresAt, now),
      })
      .returning({
        userId: aiLeases.userId,
        expiresAt: aiLeases.expiresAt,
      });

    return lease ?? null;
  }

  async releaseAILease(lease: AILease): Promise<boolean> {
    const released = await this.database
      .delete(aiLeases)
      .where(
        and(
          eq(aiLeases.userId, lease.userId),
          eq(aiLeases.expiresAt, lease.expiresAt),
        ),
      )
      .returning({ userId: aiLeases.userId });

    return released.length > 0;
  }
}
