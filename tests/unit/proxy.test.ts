import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "../../src/proxy";

describe("security proxy", () => {
  it("issues an anonymous session and security headers", async () => {
    const response = await proxy(
      new NextRequest("http://localhost:3000/dashboard", {
        headers: { "x-wegwaerts-user-id": crypto.randomUUID() },
      }),
    );

    expect(response.cookies.get("wegwaerts-session")?.value).toBeTruthy();
    expect(response.headers.get("content-security-policy")).toContain(
      "frame-ancestors 'none'",
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});
