import { timingSafeEqual } from "node:crypto";

import { apiError } from "@/lib/api-response";
import { UserRepository } from "@/server/repositories/user-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validCronSecret(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!expected || !supplied) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  if (!validCronSecret(request)) {
    return apiError("UNAUTHORIZED", "Nicht autorisiert.", 401);
  }
  const deleted = await new UserRepository().cleanupExpired();
  return Response.json({ data: deleted });
}
