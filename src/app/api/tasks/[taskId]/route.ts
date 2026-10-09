import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import {
  apiError,
  requestSecurityError,
  sessionRequiredError,
  validationError,
} from "@/lib/api-response";
import {
  InvalidTaskStatusTransitionError,
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

const updateTaskSchema = z
  .object({
    status: z.enum(["offen", "in_bearbeitung", "erledigt"]).optional(),
    dueDate: z
      .union([
        z.iso.date(),
        z.literal(""),
        z.null(),
      ])
      .optional(),
  })
  .strict()
  .refine((value) => value.status !== undefined || value.dueDate !== undefined, {
    message: "Mindestens eine Änderung ist erforderlich.",
  });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params;
    if (!z.uuid().safeParse(taskId).success) {
      return apiError("INVALID_ID", "Die Aufgaben-ID ist ungültig.", 400);
    }

    const input = updateTaskSchema.parse(await readSecureJson(request));
    const userId = await requireCurrentUserId();
    const repository = new RoadmapRepository();
    let task;

    if (input.status !== undefined) {
      task = await repository.updateStatus(userId, taskId, input.status);
    }
    if (input.dueDate !== undefined) {
      task = await repository.setDueDate(
        userId,
        taskId,
        input.dueDate || null,
      );
    }

    return NextResponse.json({ data: task });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    if (error instanceof RequestSecurityError) return requestSecurityError(error);
    if (error instanceof SessionRequiredError) return sessionRequiredError(error);
    if (error instanceof InvalidTaskStatusTransitionError) {
      return apiError("INVALID_STATUS_TRANSITION", error.message, 409);
    }
    if (error instanceof RoadmapTaskNotFoundError) {
      return apiError("TASK_NOT_FOUND", error.message, 404);
    }
    return apiError(
      "TASK_UPDATE_FAILED",
      "Die Aufgabe konnte nicht aktualisiert werden.",
      500,
    );
  }
}
