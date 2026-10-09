import { jwtVerify, SignJWT } from "jose";

const ISSUER = "wegwaerts";
const AUDIENCE = "wegwaerts-web";
export const SESSION_LIFETIME_SECONDS = 7 * 24 * 60 * 60;

export function getSessionCookieName(): string {
  return process.env.PUBLIC_DEMO === "true"
    ? "__Host-wegwaerts-session"
    : "wegwaerts-session";
}

function getSessionSecret(): Uint8Array {
  const configured = process.env.SESSION_SECRET;
  if (configured && configured.length >= 32) {
    return new TextEncoder().encode(configured);
  }
  if (process.env.PUBLIC_DEMO !== "true") {
    return new TextEncoder().encode(
      "wegwaerts-local-development-session-secret",
    );
  }
  throw new Error("SESSION_SECRET must contain at least 32 characters.");
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_LIFETIME_SECONDS}s`)
    .sign(getSessionSecret());
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
