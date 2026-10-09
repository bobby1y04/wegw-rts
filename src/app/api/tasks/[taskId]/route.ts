import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { LOCAL_USER_ID } from "@/db/local-user";
import { apiError, validationError } from "@/lib/api-response";
import {
  InvalidTaskStatusTransitionError,
  RoadmapRepository,
  RoadmapTaskNotFoundError,
} from "@/server/repositories/roadmap-repository";

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

    const input = updateTaskSchema.parse(await request.json());
    const repository = new RoadmapRepository();
    let task;

    if (input.status !== undefined) {
      task = await repository.updateStatus(LOCAL_USER_ID, taskId, input.status);
    }
    if (input.dueDate !== undefined) {
      task = await repository.setDueDate(
        LOCAL_USER_ID,
        taskId,
        input.dueDate || null,
      );
    }

    return NextResponse.json({ data: task });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
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
