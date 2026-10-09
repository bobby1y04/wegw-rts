import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createSessionToken,
  verifySessionToken,
} from "../../src/lib/session-token";

describe("anonymous session token", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("round-trips a signed anonymous user id", async () => {
    vi.stubEnv(
      "SESSION_SECRET",
      "test-session-secret-with-at-least-32-characters",
    );
    const userId = crypto.randomUUID();
    const token = await createSessionToken(userId);

    await expect(verifySessionToken(token)).resolves.toBe(userId);
  });

  it("rejects a manipulated token", async () => {
    vi.stubEnv(
      "SESSION_SECRET",
      "test-session-secret-with-at-least-32-characters",
    );
    const token = await createSessionToken(crypto.randomUUID());

    await expect(verifySessionToken(`${token}changed`)).resolves.toBeNull();
  });

  it("fails closed when the public demo has no strong secret", async () => {
    vi.stubEnv("PUBLIC_DEMO", "true");
    vi.stubEnv("SESSION_SECRET", "");

    await expect(createSessionToken(crypto.randomUUID())).rejects.toThrow(
      "SESSION_SECRET",
    );
  });
});
