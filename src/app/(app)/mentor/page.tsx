import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChatClient } from "@/features/chat/chat-client";
import { ProfileRepository } from "@/server/repositories/profile-repository";
import { ChatRepository } from "@/server/repositories/chat-repository";
import { RoadmapRepository } from "@/server/repositories/roadmap-repository";
import { requireCurrentUserId } from "@/server/session";

export const metadata: Metadata = { title: "Mentor" };
export const dynamic = "force-dynamic";

export default async function MentorPage({
  searchParams,
}: {
  searchParams: Promise<{
    conversationId?: string;
    taskId?: string;
    new?: string;
  }>;
}) {
  const userId = await requireCurrentUserId();
  const profile = await new ProfileRepository().getForUser(userId);
  if (!profile?.onboardingComplete) redirect("/onboarding");

  const query = await searchParams;
  const chatRepository = new ChatRepository();
  const conversations = await chatRepository.listConversations(userId);
  const selectedId =
    query.new === "1" ? null : (query.conversationId ?? conversations[0]?.id ?? null);
  const selectedConversation = selectedId
    ? await chatRepository.getConversation(userId, selectedId)
    : null;
  const task = query.taskId
    ? await new RoadmapRepository().getById(userId, query.taskId)
    : null;

  return (
    <ChatClient
      initialConversationId={selectedConversation?.id ?? null}
      initialMessages={
        selectedConversation?.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
        })) ?? []
      }
      conversations={conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
      }))}
      task={task ? { id: task.id, title: task.title } : null}
      turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      aiNotice={
        process.env.AI_PROVIDER === "workers-ai"
          ? "Verarbeitung durch Cloudflare Workers AI"
          : "Lokale Verarbeitung mit Ollama"
      }
    />
  );
}
