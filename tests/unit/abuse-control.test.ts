import { createHmac } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import type { Database } from "../../src/server/db";
import {
  ABUSE_LIMITS,
  AbuseControlService,
  AIKillSwitchError,
  DEVELOPMENT_IP_HASH_SECRET,
  RateLimitExceededError,
  bucketEnd,
  bucketStart,
  deriveClientIdentifier,
  hashClientIdentifier,
  hmacIdentifier,
  readAbuseControlConfig,
  retryAfterSeconds,
  startOfUtcDay,
  startOfUtcMinute,
} from "../../src/server/abuse";

function headers(values: Record<string, string>): Headers {
  return new Headers(values);
}

function databaseWithCounterResults(counts: number[]): Database {
  let index = 0;
  const transaction = vi.fn(async (callback) => {
    const tx = {
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          onConflictDoUpdate: vi.fn(() => ({
            returning: vi.fn(async () => [{ count: counts[index++] }]),
          })),
        })),
      })),
    };
    return callback(tx);
  });

  return { transaction } as unknown as Database;
}

function databaseWithLeaseResults(
  acquiredLease: { userId: string; expiresAt: Date } | null,
  released: boolean,
): Database {
  return {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: vi.fn(() => ({
          returning: vi.fn(async () =>
            acquiredLease === null ? [] : [acquiredLease],
          ),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(async () => (released ? [{ userId: "user-1" }] : [])),
      })),
    })),
  } as unknown as Database;
}

describe("abuse-control config", () => {
  it("uses fixed limits and a development-only fallback secret", () => {
    const config = readAbuseControlConfig({ NODE_ENV: "development" });

    expect(config).toMatchObject({
      aiEnabled: true,
      ipHashSecret: DEVELOPMENT_IP_HASH_SECRET,
      limits: ABUSE_LIMITS,
    });
    expect(config.limits).toEqual({
      sessionDay: 8,
      ipDay: 12,
      sessionMinute: 2,
      globalDay: 150,
    });
  });

  it("requires an explicit IP hash secret in production", () => {
    expect(() =>
      readAbuseControlConfig({ PUBLIC_DEMO: "true", AI_ENABLED: "true" }),
    ).toThrow("IP_HASH_SECRET");

    expect(
      readAbuseControlConfig({
        PUBLIC_DEMO: "true",
        AI_ENABLED: "0",
        IP_HASH_SECRET: "production-secret",
      }),
    ).toMatchObject({
      aiEnabled: false,
      ipHashSecret: "production-secret",
    });
  });

  it("rejects ambiguous kill-switch values", () => {
    expect(() =>
      readAbuseControlConfig({
        NODE_ENV: "test",
        AI_ENABLED: "sometimes",
      }),
    ).toThrow("AI_ENABLED");
  });
});

describe("fixed UTC buckets", () => {
  const instant = new Date("2026-10-09T23:59:42.345Z");

  it("computes minute and day starts without mutating the input", () => {
    expect(startOfUtcMinute(instant).toISOString()).toBe(
      "2026-10-09T23:59:00.000Z",
    );
    expect(startOfUtcDay(instant).toISOString()).toBe(
      "2026-10-09T00:00:00.000Z",
    );
    expect(instant.toISOString()).toBe("2026-10-09T23:59:42.345Z");
  });

  it("computes fixed ends and retry-after values", () => {
    expect(bucketStart(instant, "minute").toISOString()).toBe(
      "2026-10-09T23:59:00.000Z",
    );
    expect(bucketEnd(instant, "minute").toISOString()).toBe(
      "2026-10-10T00:00:00.000Z",
    );
    expect(bucketEnd(instant, "day").toISOString()).toBe(
      "2026-10-10T00:00:00.000Z",
    );
    expect(retryAfterSeconds(instant, "minute")).toBe(18);
    expect(retryAfterSeconds(instant, "day")).toBe(18);
  });
});

describe("client identifiers", () => {
  it("prefers Vercel's forwarded address and normalizes it", () => {
    expect(
      deriveClientIdentifier(
        headers({
          "x-vercel-forwarded-for": "2001:DB8::1, 192.0.2.5",
          "x-forwarded-for": "198.51.100.8",
        }),
      ),
    ).toBe("2001:db8::1");
  });

  it("skips invalid candidates and supports standard Forwarded syntax", () => {
    expect(
      deriveClientIdentifier(
        headers({
          "x-forwarded-for": "not-an-ip",
          forwarded: 'for="[2001:db8::2]:443";proto=https',
        }),
      ),
    ).toBe("2001:db8::2");
  });

  it("HMACs identifiers deterministically with domain separation", () => {
    const expected = createHmac("sha256", "secret")
      .update("client-ip\0" + "192.0.2.1")
      .digest("hex");

    expect(
      hashClientIdentifier(
        headers({ "x-forwarded-for": "192.0.2.1" }),
        "secret",
      ),
    ).toBe(expected);
    expect(hmacIdentifier("same", "secret", "session")).not.toBe(
      hmacIdentifier("same", "secret", "client-ip"),
    );
  });
});

describe("typed abuse-control errors", () => {
  it("exposes rate-limit response metadata without an identifier", () => {
    const error = new RateLimitExceededError("session_minute", 2, 37);

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: "RateLimitExceededError",
      code: "RATE_LIMIT_EXCEEDED",
      statusCode: 429,
      scope: "session_minute",
      limit: 2,
      retryAfterSeconds: 37,
    });
    expect(error.message).not.toContain("session");
  });

  it("applies the AI kill switch before accessing the database", async () => {
    const database = databaseWithCounterResults([]);
    const service = new AbuseControlService(database, {
      ...readAbuseControlConfig({
        NODE_ENV: "test",
        AI_ENABLED: "false",
        IP_HASH_SECRET: "secret",
      }),
    });

    await expect(
      service.consumeRateLimits({
        sessionIdentifier: "session-1",
        headers: headers({ "x-forwarded-for": "192.0.2.1" }),
      }),
    ).rejects.toBeInstanceOf(AIKillSwitchError);
    expect(database.transaction).not.toHaveBeenCalled();
  });
});

describe("atomic rate-limit consumption", () => {
  it("returns remaining capacity for all four policies", async () => {
    const service = new AbuseControlService(
      databaseWithCounterResults([1, 2, 1, 17]),
      readAbuseControlConfig({
        NODE_ENV: "test",
        IP_HASH_SECRET: "secret",
      }),
    );

    const result = await service.consumeRateLimits({
      sessionIdentifier: "session-1",
      headers: headers({ "x-forwarded-for": "192.0.2.1" }),
      now: new Date("2026-10-09T12:34:56.000Z"),
    });

    expect(result.map(({ scope, remaining }) => ({ scope, remaining }))).toEqual([
      { scope: "session_day", remaining: 7 },
      { scope: "ip_day", remaining: 10 },
      { scope: "session_minute", remaining: 1 },
      { scope: "global_day", remaining: 133 },
    ]);
  });

  it("throws the typed error returned from inside the transaction", async () => {
    const service = new AbuseControlService(
      databaseWithCounterResults([2, 2, 3]),
      readAbuseControlConfig({
        NODE_ENV: "test",
        IP_HASH_SECRET: "secret",
      }),
    );

    await expect(
      service.consumeRateLimits({
        sessionIdentifier: "session-1",
        headers: headers({ "x-forwarded-for": "192.0.2.1" }),
        now: new Date("2026-10-09T12:34:56.000Z"),
      }),
    ).rejects.toMatchObject({
      scope: "session_minute",
      limit: 2,
      retryAfterSeconds: 4,
    });
  });
});

describe("AI leases", () => {
  const config = readAbuseControlConfig({
    NODE_ENV: "test",
    IP_HASH_SECRET: "secret",
  });

  it("acquires an expiring lease and releases that exact lease", async () => {
    const now = new Date("2026-10-09T12:00:00.000Z");
    const expectedLease = {
      userId: "user-1",
      expiresAt: new Date("2026-10-09T12:02:00.000Z"),
    };
    const database = databaseWithLeaseResults(expectedLease, true);
    const service = new AbuseControlService(database, config);

    const lease = await service.acquireAILease("user-1", now);

    expect(lease).toEqual(expectedLease);
    await expect(service.releaseAILease(expectedLease)).resolves.toBe(true);
    expect(database.insert).toHaveBeenCalledOnce();
    expect(database.delete).toHaveBeenCalledOnce();
  });

  it("returns null when an unexpired lease wins the conflict", async () => {
    const service = new AbuseControlService(
      databaseWithLeaseResults(null, false),
      config,
    );

    await expect(
      service.acquireAILease(
        "user-1",
        new Date("2026-10-09T12:00:00.000Z"),
      ),
    ).resolves.toBeNull();
  });
});
