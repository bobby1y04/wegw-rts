import { z, ZodError } from "zod";

import { streamMentorReply } from "@/features/chat/mentor-service";
import type { CompletedChatMessage } from "@/features/chat/prompt";
import {
  apiError,
  requestSecurityError,
  sessionRequiredError,
  validationError,
} from "@/lib/api-response";
import {
  AIInvalidResponseError,
  AIProviderError,
  createAIProvider,
} from "@/server/ai";
import {
  AbuseControlService,
  AIKillSwitchError,
  RateLimitExceededError,
} from "@/server/abuse";
import { ProfileRepository } from "@/server/repositories/profile-repository";
import {
  ChatConversationNotFoundError,
  ChatRepository,
  ChatStorageLimitError,
} from "@/server/repositories/chat-repository";
import { RoadmapRepository } from "@/server/repositories/roadmap-repository";
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
export const dynamic = "force-dynamic";

const chatRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(1_500),
    conversationId: z.uuid().optional(),
    taskId: z.uuid().optional(),
    turnstileToken: z.string().min(1).max(2_048).optional(),
  })
  .strict();

const encoder = new TextEncoder();
const event = (value: object) => encoder.encode(`${JSON.stringify(value)}\n`);

function publicAIErrorMessage(error: AIProviderError): string {
  if (process.env.PUBLIC_DEMO !== "true") return error.message;
  switch (error.code) {
    case "quota_exceeded":
      return "Das KI-Kontingent ist heute ausgeschöpft. Dein Fahrplan bleibt weiterhin verfügbar.";
    case "timeout":
      return "Die Mentor-Antwort hat zu lange gedauert. Bitte versuche es später erneut.";
    case "aborted":
      return "Die Mentor-Antwort wurde abgebrochen.";
    default:
      return "Der Mentor ist gerade nicht verfügbar. Bitte versuche es später erneut.";
  }
}

export async function POST(request: Request) {
  let abuseControl: AbuseControlService | null = null;
  let pendingLease: { userId: string; expiresAt: Date } | null = null;
  try {
    const input = chatRequestSchema.parse(await readSecureJson(request, 8_192));
    await verifyTurnstile(input.turnstileToken);
    const userId = await requireCurrentUserId();
    const profile = await new ProfileRepository().getForUser(userId);
    if (!profile?.onboardingComplete) {
      return apiError(
        "ONBOARDING_REQUIRED",
        "Schließe zuerst das Onboarding ab.",
        409,
      );
    }

    abuseControl = new AbuseControlService();
    const activeAbuseControl = abuseControl;
    await activeAbuseControl.consumeRateLimits({
      sessionIdentifier: userId,
      headers: request.headers,
    });
    const lease = await activeAbuseControl.acquireAILease(userId);
    if (!lease) {
      const response = apiError(
        "AI_CONCURRENCY_LIMIT",
        "Für diese Sitzung läuft bereits eine Mentor-Antwort.",
        429,
      );
      response.headers.set("Retry-After", "10");
      return response;
    }
    pendingLease = lease;

    const chatRepository = new ChatRepository();
    let conversationId = input.conversationId;
    if (!conversationId) {
      const conversation = await chatRepository.createConversation(
        userId,
        input.message.slice(0, 80),
      );
      conversationId = conversation.id;
    }

    const previousMessages = await chatRepository.getRecentMessages(
      userId,
      conversationId,
      12,
    );
    const task = input.taskId
      ? await new RoadmapRepository().getById(userId, input.taskId)
      : null;

    await chatRepository.addMessage(
      userId,
      conversationId,
      "user",
      input.message,
    );

    const mentorInput = {
      profile: {
        phase: profile.phase,
        studyProgram: profile.studyProgram,
        semester: profile.semester,
        interests: profile.interests,
      },
      task: task
        ? {
            title: task.title,
            description: task.description,
            checklist: task.checklistItems.map((item) => item.text),
          }
        : null,
      recentMessages: previousMessages.map(
        (message): CompletedChatMessage => ({
          role: message.role,
          content: message.content,
          status: "completed",
        }),
      ),
      userMessage: input.message,
    };

    const selectedConversationId = conversationId;
    await new UserRepository().touch(userId);
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(
          event({ type: "meta", conversationId: selectedConversationId }),
        );
        let assistantContent = "";
        try {
          const provider = createAIProvider();
          for await (const chunk of streamMentorReply(provider, mentorInput, {
            signal: request.signal,
            timeoutMs: 30_000,
          })) {
            if (assistantContent.length + chunk.length > 12_000) {
              throw new AIInvalidResponseError(
                "Die Mentor-Antwort überschreitet das Ausgabelimit.",
              );
            }
            assistantContent += chunk;
            controller.enqueue(event({ type: "token", content: chunk }));
          }

          if (assistantContent.trim()) {
            await chatRepository.addMessage(
              userId,
              selectedConversationId,
              "assistant",
              assistantContent,
            );
          }
          controller.enqueue(event({ type: "done" }));
        } catch (error) {
          const message =
            error instanceof AIProviderError
              ? publicAIErrorMessage(error)
              : "Der Mentor konnte gerade keine Antwort erstellen.";
          const code =
            error instanceof AIProviderError ? error.code : "generation_failed";
          controller.enqueue(event({ type: "error", code, message }));
        } finally {
          try {
            await activeAbuseControl.releaseAILease(lease);
          } finally {
            controller.close();
          }
        }
      },
      cancel() {
        // request.signal is forwarded to the provider by the route.
      },
    });

    return new Response(stream, {
      headers: {
        "content-type": "application/x-ndjson; charset=utf-8",
        "cache-control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    if (abuseControl && pendingLease) {
      await abuseControl.releaseAILease(pendingLease);
    }
    if (error instanceof ZodError) return validationError(error);
    if (error instanceof RequestSecurityError) return requestSecurityError(error);
    if (error instanceof SessionRequiredError) return sessionRequiredError(error);
    if (error instanceof TurnstileVerificationError) {
      return apiError("TURNSTILE_FAILED", error.message, 403);
    }
    if (error instanceof ChatStorageLimitError) {
      return apiError("CHAT_STORAGE_LIMIT", error.message, 429);
    }
    if (error instanceof RateLimitExceededError) {
      const response = apiError(error.code, error.message, error.statusCode);
      response.headers.set("Retry-After", String(error.retryAfterSeconds));
      return response;
    }
    if (error instanceof AIKillSwitchError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    if (error instanceof ChatConversationNotFoundError) {
      return apiError("CONVERSATION_NOT_FOUND", error.message, 404);
    }
    return apiError(
      "CHAT_REQUEST_FAILED",
      "Die Nachricht konnte nicht gesendet werden.",
      500,
    );
  }
}
