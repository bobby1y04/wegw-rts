import { z, ZodError } from "zod";

import { LOCAL_USER_ID } from "@/db/local-user";
import { streamMentorReply } from "@/features/chat/mentor-service";
import type { CompletedChatMessage } from "@/features/chat/prompt";
import { apiError, validationError } from "@/lib/api-response";
import {
  AIProviderError,
  createAIProvider,
} from "@/server/ai";
import { ProfileRepository } from "@/server/repositories/profile-repository";
import {
  ChatConversationNotFoundError,
  ChatRepository,
} from "@/server/repositories/chat-repository";
import { RoadmapRepository } from "@/server/repositories/roadmap-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const chatRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(4_000),
    conversationId: z.uuid().optional(),
    taskId: z.uuid().optional(),
  })
  .strict();

const encoder = new TextEncoder();
const event = (value: object) => encoder.encode(`${JSON.stringify(value)}\n`);

export async function POST(request: Request) {
  try {
    const input = chatRequestSchema.parse(await request.json());
    const profile = await new ProfileRepository().getLocalProfile();
    if (!profile?.onboardingComplete) {
      return apiError(
        "ONBOARDING_REQUIRED",
        "Schließe zuerst das Onboarding ab.",
        409,
      );
    }

    const chatRepository = new ChatRepository();
    let conversationId = input.conversationId;
    if (!conversationId) {
      const conversation = await chatRepository.createConversation(
        LOCAL_USER_ID,
        input.message.slice(0, 80),
      );
      conversationId = conversation.id;
    }

    const previousMessages = await chatRepository.getRecentMessages(
      LOCAL_USER_ID,
      conversationId,
      12,
    );
    const task = input.taskId
      ? await new RoadmapRepository().getById(LOCAL_USER_ID, input.taskId)
      : null;

    await chatRepository.addMessage(
      LOCAL_USER_ID,
      conversationId,
      "user",
      input.message,
    );

    const mentorInput = {
      profile: {
        displayName: profile.displayName,
        phase: profile.phase,
        studyProgram: profile.studyProgram,
        institution: profile.university,
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
            timeoutMs: 60_000,
          })) {
            assistantContent += chunk;
            controller.enqueue(event({ type: "token", content: chunk }));
          }

          if (assistantContent.trim()) {
            await chatRepository.addMessage(
              LOCAL_USER_ID,
              selectedConversationId,
              "assistant",
              assistantContent,
            );
          }
          controller.enqueue(event({ type: "done" }));
        } catch (error) {
          const message =
            error instanceof AIProviderError
              ? error.message
              : "Der Mentor konnte gerade keine Antwort erstellen.";
          const code =
            error instanceof AIProviderError ? error.code : "generation_failed";
          controller.enqueue(event({ type: "error", code, message }));
        } finally {
          controller.close();
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
    if (error instanceof ZodError) return validationError(error);
    if (error instanceof ChatConversationNotFoundError) {
      return apiError("CONVERSATION_NOT_FOUND", error.message, 404);
    }
    if (error instanceof SyntaxError) {
      return apiError("INVALID_JSON", "Die Anfrage enthält kein gültiges JSON.", 400);
    }
    return apiError(
      "CHAT_REQUEST_FAILED",
      "Die Nachricht konnte nicht gesendet werden.",
      500,
    );
  }
}
