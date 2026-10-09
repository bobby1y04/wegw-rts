import { cookies, headers } from "next/headers";
import { z } from "zod";

import {
  getSessionCookieName,
  verifySessionToken,
} from "@/lib/session-token";

export class SessionRequiredError extends Error {
  constructor() {
    super("Es konnte keine gültige anonyme Sitzung ermittelt werden.");
    this.name = "SessionRequiredError";
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  const requestHeaders = await headers();
  const proxiedUserId = requestHeaders.get("x-wegwaerts-user-id");
  if (proxiedUserId && z.uuid().safeParse(proxiedUserId).success) {
    return proxiedUserId;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  const userId = await verifySessionToken(token);
  return userId && z.uuid().safeParse(userId).success ? userId : null;
}

export async function requireCurrentUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new SessionRequiredError();
  return userId;
}
