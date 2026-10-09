import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import {
  apiError,
  requestSecurityError,
  sessionRequiredError,
  validationError,
} from "@/lib/api-response";
import {
  RoadmapRepository,
  RoadmapTaskNotFoundError,
} from "@/server/repositories/roadmap-repository";
import {
  readSecureJson,
  RequestSecurityError,
} from "@/server/security/request";
import {
  requireCurrentUserId,
  SessionRequiredError,
} from "@/server/session";

export const runtime = "nodejs";

const checklistUpdateSchema = z.object({ isCompleted: z.boolean() }).strict();

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ taskId: string; itemId: string }> },
) {
  try {
    const { taskId, itemId } = await params;
    if (!z.uuid().safeParse(taskId).success || !z.uuid().safeParse(itemId).success) {
      return apiError("INVALID_ID", "Die Aufgaben-ID ist ungültig.", 400);
    }

    const input = checklistUpdateSchema.parse(await readSecureJson(request));
    const userId = await requireCurrentUserId();
    const item = await new RoadmapRepository().setChecklistItemCompleted(
      userId,
      taskId,
      itemId,
      input.isCompleted,
    );
    return NextResponse.json({ data: item });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    if (error instanceof RequestSecurityError) return requestSecurityError(error);
    if (error instanceof SessionRequiredError) return sessionRequiredError(error);
    if (error instanceof RoadmapTaskNotFoundError) {
      return apiError("CHECKLIST_ITEM_NOT_FOUND", error.message, 404);
    }
    return apiError(
      "CHECKLIST_UPDATE_FAILED",
      "Der Teilschritt konnte nicht gespeichert werden.",
      500,
    );
  }
}
