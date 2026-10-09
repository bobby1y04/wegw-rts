import { z } from "zod";

import {
  apiError,
  requestSecurityError,
  sessionRequiredError,
} from "@/lib/api-response";
import { ChatRepository } from "@/server/repositories/chat-repository";
import {
  readSecureJson,
  RequestSecurityError,
} from "@/server/security/request";
import {
  requireCurrentUserId,
  SessionRequiredError,
} from "@/server/session";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    await readSecureJson(request);
    const { conversationId } = await params;
    if (!z.uuid().safeParse(conversationId).success) {
      return apiError("INVALID_ID", "Die Unterhaltungs-ID ist ungültig.", 400);
    }
    const userId = await requireCurrentUserId();
    const deleted = await new ChatRepository().deleteConversation(
      userId,
      conversationId,
    );
    if (!deleted) {
      return apiError(
        "CONVERSATION_NOT_FOUND",
        "Die Unterhaltung wurde nicht gefunden.",
        404,
      );
    }
    return Response.json({ data: { deleted: true } });
  } catch (error) {
    if (error instanceof RequestSecurityError) return requestSecurityError(error);
    if (error instanceof SessionRequiredError) return sessionRequiredError(error);
    return apiError(
      "CONVERSATION_DELETE_FAILED",
      "Die Unterhaltung konnte nicht gelöscht werden.",
      500,
    );
  }
}
