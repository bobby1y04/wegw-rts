export type RateLimitScope =
  | "session_day"
  | "ip_day"
  | "session_minute"
  | "global_day";

export class RateLimitExceededError extends Error {
  readonly code = "RATE_LIMIT_EXCEEDED";
  readonly statusCode = 429;

  constructor(
    readonly scope: RateLimitScope,
    readonly limit: number,
    readonly retryAfterSeconds: number,
  ) {
    super(
      `Anfragelimit erreicht. Bitte in ${retryAfterSeconds} Sekunden erneut versuchen.`,
    );
    this.name = "RateLimitExceededError";
  }
}

export class AIKillSwitchError extends Error {
  readonly code = "AI_DISABLED";
  readonly statusCode = 503;

  constructor() {
    super("Die KI-Funktion ist derzeit deaktiviert.");
    this.name = "AIKillSwitchError";
  }
}
