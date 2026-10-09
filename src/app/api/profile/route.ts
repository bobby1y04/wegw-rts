import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { profileInputSchema } from "@/features/profile/schema";
import { getSessionCookieName } from "@/lib/session-token";
import {
  apiError,
  requestSecurityError,
  sessionRequiredError,
  validationError,
} from "@/lib/api-response";
import { ProfileRepository } from "@/server/repositories/profile-repository";
import { UserRepository } from "@/server/repositories/user-repository";
import {
  readSecureJson,
  RequestSecurityError,
} from "@/server/security/request";
import {
  TurnstileVerificationError,
  verifyTurnstile,
} from "@/server/security/turnstile";
import {
  requireCurrentUserId,
  SessionRequiredError,
} from "@/server/session";

export const runtime = "nodejs";

const profileMutationSchema = z
  .object({
    profile: profileInputSchema,
    turnstileToken: z.string().min(1).max(2_048).optional(),
  })
  .strict();

export async function GET() {
  try {
    const userId = await requireCurrentUserId();
    const profile = await new ProfileRepository().getForUser(userId);
    return NextResponse.json({ data: profile });
  } catch (error) {
    if (error instanceof SessionRequiredError) return sessionRequiredError(error);
    return apiError(
      "DATABASE_UNAVAILABLE",
      "Die lokale Datenbank ist nicht erreichbar.",
      503,
    );
  }
}

export async function PUT(request: Request) {
  try {
    const input = profileMutationSchema.parse(await readSecureJson(request));
    const userId = await requireCurrentUserId();
    const repository = new ProfileRepository();
    const existingProfile = await repository.getForUser(userId);
    if (!existingProfile) {
      await verifyTurnstile(input.turnstileToken);
    }
    const profile = await repository.upsert(userId, input.profile);
    return NextResponse.json({ data: profile });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    if (error instanceof RequestSecurityError) return requestSecurityError(error);
    if (error instanceof SessionRequiredError) return sessionRequiredError(error);
    if (error instanceof TurnstileVerificationError) {
      return apiError("TURNSTILE_FAILED", error.message, 403);
    }
    return apiError(
      "PROFILE_SAVE_FAILED",
      "Dein Profil konnte gerade nicht gespeichert werden.",
      500,
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await readSecureJson(request);
    const userId = await requireCurrentUserId();
    await new UserRepository().delete(userId);
    const response = NextResponse.json({ data: { deleted: true } });
    response.cookies.delete(getSessionCookieName());
    return response;
  } catch (error) {
    if (error instanceof RequestSecurityError) return requestSecurityError(error);
    if (error instanceof SessionRequiredError) return sessionRequiredError(error);
    return apiError(
      "PROFILE_DELETE_FAILED",
      "Deine Demo-Daten konnten nicht gelöscht werden.",
      500,
    );
  }
}
