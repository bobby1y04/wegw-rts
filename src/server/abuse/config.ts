export const ABUSE_LIMITS = {
  sessionDay: 8,
  ipDay: 12,
  sessionMinute: 2,
  globalDay: 150,
} as const;

export const DEFAULT_AI_LEASE_SECONDS = 120;
export const DEVELOPMENT_IP_HASH_SECRET =
  "wegwaerts-development-only-ip-hash-secret";

export interface AbuseControlConfig {
  readonly aiEnabled: boolean;
  readonly ipHashSecret: string;
  readonly limits: typeof ABUSE_LIMITS;
  readonly aiLeaseSeconds: number;
}

function parseEnabled(value: string | undefined): boolean {
  if (value === undefined || value.trim() === "") return true;

  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;

  throw new Error('AI_ENABLED muss "true", "false", "1" oder "0" sein.');
}

export function readAbuseControlConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): AbuseControlConfig {
  const isPublicDemo = env.PUBLIC_DEMO === "true";
  const configuredSecret = env.IP_HASH_SECRET?.trim();

  if (isPublicDemo && !configuredSecret) {
    throw new Error(
      "IP_HASH_SECRET muss in Produktionsumgebungen konfiguriert sein.",
    );
  }

  return {
    aiEnabled: parseEnabled(env.AI_ENABLED),
    ipHashSecret: configuredSecret || DEVELOPMENT_IP_HASH_SECRET,
    limits: ABUSE_LIMITS,
    aiLeaseSeconds: DEFAULT_AI_LEASE_SECONDS,
  };
}
