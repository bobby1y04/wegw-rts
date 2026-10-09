import { NextResponse, type NextRequest } from "next/server";

import {
  createSessionToken,
  getSessionCookieName,
  SESSION_LIFETIME_SECONDS,
  verifySessionToken,
} from "@/lib/session-token";

function contentSecurityPolicy(nonce: string, publicDemo: boolean): string {
  const development = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self' https://challenges.cloudflare.com",
    "frame-src https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(publicDemo ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const publicDemo = process.env.PUBLIC_DEMO === "true";
  const nonce = crypto.randomUUID();
  const csp = contentSecurityPolicy(nonce, publicDemo);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  requestHeaders.delete("x-wegwaerts-user-id");

  const isCron = request.nextUrl.pathname.startsWith("/api/cron/");
  const isPublicLegalPage =
    request.nextUrl.pathname === "/datenschutz" ||
    request.nextUrl.pathname === "/impressum";
  const needsSession = !isCron && !isPublicLegalPage;
  const cookieName = getSessionCookieName();
  const existingToken = request.cookies.get(cookieName)?.value;
  let userId = needsSession ? await verifySessionToken(existingToken) : null;
  let newToken: string | null = null;

  if (needsSession && !userId) {
    userId = crypto.randomUUID();
  }
  if (userId) newToken = await createSessionToken(userId);
  if (userId) requestHeaders.set("x-wegwaerts-user-id", userId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (newToken) {
    response.cookies.set({
      name: cookieName,
      value: newToken,
      httpOnly: true,
      secure: publicDemo,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_LIFETIME_SECONDS,
    });
  }

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  if (publicDemo) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
