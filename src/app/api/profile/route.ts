import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { profileInputSchema } from "@/features/profile/schema";
import { apiError, validationError } from "@/lib/api-response";
import { ProfileRepository } from "@/server/repositories/profile-repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const profile = await new ProfileRepository().getLocalProfile();
    return NextResponse.json({ data: profile });
  } catch {
    return apiError(
      "DATABASE_UNAVAILABLE",
      "Die lokale Datenbank ist nicht erreichbar.",
      503,
    );
  }
}

export async function PUT(request: Request) {
  try {
    const input = profileInputSchema.parse(await request.json());
    const profile = await new ProfileRepository().upsertLocal(input);
    return NextResponse.json({ data: profile });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    if (error instanceof SyntaxError) {
      return apiError("INVALID_JSON", "Die Anfrage enthält kein gültiges JSON.", 400);
    }
    return apiError(
      "PROFILE_SAVE_FAILED",
      "Dein Profil konnte gerade nicht gespeichert werden.",
      500,
    );
  }
}
