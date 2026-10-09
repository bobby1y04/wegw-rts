import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LOCAL_USER_ID } from "@/db/local-user";
import { ChatClient } from "@/features/chat/chat-client";
import { ProfileRepository } from "@/server/repositories/profile-repository";
import { ChatRepository } from "@/server/repositories/chat-repository";
import { RoadmapRepository } from "@/server/repositories/roadmap-repository";

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
  const profile = await new ProfileRepository().getLocalProfile();
  if (!profile?.onboardingComplete) redirect("/onboarding");

  const query = await searchParams;
  const chatRepository = new ChatRepository();
  const conversations = await chatRepository.listConversations(LOCAL_USER_ID);
  const selectedId =
    query.new === "1" ? null : (query.conversationId ?? conversations[0]?.id ?? null);
  const selectedConversation = selectedId
    ? await chatRepository.getConversation(LOCAL_USER_ID, selectedId)
    : null;
  const task = query.taskId
    ? await new RoadmapRepository().getById(LOCAL_USER_ID, query.taskId)
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
    />
  );
}
