import { afterEach, describe, expect, it, vi } from "vitest";

import {
  TurnstileVerificationError,
  verifyTurnstile,
} from "../../src/server/security/turnstile";

describe("Turnstile verification", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("is bypassed locally when no secret is configured", async () => {
    vi.stubEnv("NODE_ENV", "test");
    await expect(verifyTurnstile(undefined)).resolves.toBeUndefined();
  });

  it("requires a token when Turnstile is configured", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    await expect(verifyTurnstile(undefined)).rejects.toBeInstanceOf(
      TurnstileVerificationError,
    );
  });

  it("fails closed when the public demo has no Turnstile secret", async () => {
    vi.stubEnv("PUBLIC_DEMO", "true");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");

    await expect(verifyTurnstile("token")).rejects.toThrow(
      "TURNSTILE_SECRET_KEY",
    );
  });

  it("accepts a successfully verified token", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    const fetchMock = vi.fn(async () =>
      Response.json({ success: true }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyTurnstile("valid-token")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
