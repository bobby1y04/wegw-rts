export type RateLimitBucket = "minute" | "day";

export function startOfUtcMinute(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
    ),
  );
}

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function bucketStart(date: Date, bucket: RateLimitBucket): Date {
  return bucket === "minute" ? startOfUtcMinute(date) : startOfUtcDay(date);
}

export function bucketEnd(date: Date, bucket: RateLimitBucket): Date {
  const start = bucketStart(date, bucket);
  const durationMs = bucket === "minute" ? 60_000 : 86_400_000;
  return new Date(start.getTime() + durationMs);
}

export function retryAfterSeconds(
  date: Date,
  bucket: RateLimitBucket,
): number {
  return Math.max(
    1,
    Math.ceil((bucketEnd(date, bucket).getTime() - date.getTime()) / 1_000),
  );
}
