import { describe, expect, it } from "vitest";

import { GET as runCleanup } from "../../src/app/api/cron/cleanup/route";
import { PUT as updateProfile } from "../../src/app/api/profile/route";
import { PATCH as updateTask } from "../../src/app/api/tasks/[taskId]/route";

describe("API validation", () => {
  it("returns a consistent validation error for invalid onboarding data", async () => {
    const response = await updateProfile(
      new Request("http://localhost/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phase: "irgendwann", interests: [] }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: "Bitte prüfe deine Eingaben.",
      },
    });
  });

  it("rejects malformed task identifiers before database access", async () => {
    const response = await updateTask(
      new Request("http://localhost/api/tasks/not-a-uuid", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "erledigt" }),
      }),
      { params: Promise.resolve({ taskId: "not-a-uuid" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_ID" },
    });
  });

  it("rejects non-JSON mutation requests", async () => {
    const response = await updateProfile(
      new Request("http://localhost/api/profile", {
        method: "PUT",
        headers: { "content-type": "text/plain" },
        body: JSON.stringify({ phase: "vor_dem_studium" }),
      }),
    );
    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "UNSUPPORTED_MEDIA_TYPE" },
    });
  });

  it("rejects cross-origin mutation requests", async () => {
    const response = await updateProfile(
      new Request("http://localhost/api/profile", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          origin: "https://attacker.example",
        },
        body: JSON.stringify({
          phase: "vor_dem_studium",
          interests: [],
          onboardingComplete: true,
        }),
      }),
    );
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_ORIGIN" },
    });
  });

  it("rejects unauthenticated cleanup requests", async () => {
    const response = await runCleanup(
      new Request("http://localhost/api/cron/cleanup"),
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "UNAUTHORIZED" },
    });
  });
});
