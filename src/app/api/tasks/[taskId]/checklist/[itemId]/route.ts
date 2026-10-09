import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { LOCAL_USER_ID } from "@/db/local-user";
import { apiError, validationError } from "@/lib/api-response";
import {
  RoadmapRepository,
  RoadmapTaskNotFoundError,
} from "@/server/repositories/roadmap-repository";

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

    const input = checklistUpdateSchema.parse(await request.json());
    const item = await new RoadmapRepository().setChecklistItemCompleted(
      LOCAL_USER_ID,
      taskId,
      itemId,
      input.isCompleted,
    );
    return NextResponse.json({ data: item });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
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
