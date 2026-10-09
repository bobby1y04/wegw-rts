import { describe, expect, it } from "vitest";

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
});
