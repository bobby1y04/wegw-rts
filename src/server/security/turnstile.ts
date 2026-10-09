interface TurnstileResponse {
  success?: boolean;
  "error-codes"?: string[];
}

export class TurnstileVerificationError extends Error {
  constructor() {
    super("Die Bot-Schutz-Prüfung ist abgelaufen oder ungültig.");
    this.name = "TurnstileVerificationError";
  }
}

export async function verifyTurnstile(
  token: string | undefined,
  remoteIp?: string,
): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.PUBLIC_DEMO === "true") {
      throw new Error("TURNSTILE_SECRET_KEY is required in production.");
    }
    return;
  }
  if (!token) throw new TurnstileVerificationError();

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    },
  );
  if (!response.ok) throw new TurnstileVerificationError();

  const result = (await response.json()) as TurnstileResponse;
  if (result.success !== true) throw new TurnstileVerificationError();
}
