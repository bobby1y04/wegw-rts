import { and, asc, count, desc, eq, sql } from "drizzle-orm";

import {
  chatConversations,
  chatMessages,
  type ChatConversation,
  type ChatMessage,
} from "../../db/schema";
import { getDatabase, type Database } from "../db";

export class ChatConversationNotFoundError extends Error {
  constructor() {
    super("Die Unterhaltung wurde nicht gefunden.");
    this.name = "ChatConversationNotFoundError";
  }
}

export class ChatStorageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatStorageLimitError";
  }
}

export class ChatRepository {
  constructor(private readonly database: Database = getDatabase()) {}

  async listConversations(userId: string): Promise<ChatConversation[]> {
    return this.database.query.chatConversations.findMany({
      where: eq(chatConversations.userId, userId),
      orderBy: [
        desc(chatConversations.updatedAt),
        desc(chatConversations.createdAt),
      ],
    });
  }

  async getConversation(userId: string, conversationId: string) {
    return (
      (await this.database.query.chatConversations.findFirst({
        where: and(
          eq(chatConversations.id, conversationId),
          eq(chatConversations.userId, userId),
        ),
        with: {
          messages: {
            orderBy: [
              asc(chatMessages.createdAt),
              asc(chatMessages.id),
            ],
          },
        },
      })) ?? null
    );
  }

  async createConversation(
    userId: string,
    title = "Neue Unterhaltung",
  ): Promise<ChatConversation> {
    return this.database.transaction(async (transaction) => {
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtext(${userId}))`,
      );
      const [result] = await transaction
        .select({ count: count() })
        .from(chatConversations)
        .where(eq(chatConversations.userId, userId));
      if ((result?.count ?? 0) >= 3) {
        throw new ChatStorageLimitError(
          "Du kannst in dieser Demo höchstens drei Unterhaltungen speichern.",
        );
      }

      const [conversation] = await transaction
        .insert(chatConversations)
        .values({ userId, title: title.trim() })
        .returning();

      if (!conversation) {
        throw new Error("Die Unterhaltung konnte nicht erstellt werden.");
      }
      return conversation;
    });
  }

  async renameConversation(
    userId: string,
    conversationId: string,
    title: string,
  ): Promise<ChatConversation> {
    const [conversation] = await this.database
      .update(chatConversations)
      .set({ title: title.trim(), updatedAt: new Date() })
      .where(
        and(
          eq(chatConversations.id, conversationId),
          eq(chatConversations.userId, userId),
        ),
      )
      .returning();

    if (!conversation) throw new ChatConversationNotFoundError();
    return conversation;
  }

  async addMessage(
    userId: string,
    conversationId: string,
    role: "user" | "assistant",
    content: string,
  ): Promise<ChatMessage> {
    return this.database.transaction(async (transaction) => {
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtext(${userId}))`,
      );
      const conversation =
        await transaction.query.chatConversations.findFirst({
          where: and(
            eq(chatConversations.id, conversationId),
            eq(chatConversations.userId, userId),
          ),
          columns: { id: true },
        });

      if (!conversation) throw new ChatConversationNotFoundError();

      const [stored] = await transaction
        .select({ count: count() })
        .from(chatMessages)
        .innerJoin(
          chatConversations,
          eq(chatMessages.conversationId, chatConversations.id),
        )
        .where(eq(chatConversations.userId, userId));
      if ((stored?.count ?? 0) >= 40) {
        throw new ChatStorageLimitError(
          "Das Nachrichtenlimit dieser Demo-Sitzung ist erreicht.",
        );
      }

      const [message] = await transaction
        .insert(chatMessages)
        .values({
          conversationId,
          role,
          content: content.trim(),
        })
        .returning();

      if (!message) {
        throw new Error("Die Nachricht konnte nicht gespeichert werden.");
      }

      await transaction
        .update(chatConversations)
        .set({ updatedAt: new Date() })
        .where(eq(chatConversations.id, conversationId));

      return message;
    });
  }

  async getRecentMessages(
    userId: string,
    conversationId: string,
    limit = 20,
  ): Promise<ChatMessage[]> {
    const conversation =
      await this.database.query.chatConversations.findFirst({
        where: and(
          eq(chatConversations.id, conversationId),
          eq(chatConversations.userId, userId),
        ),
        columns: { id: true },
      });

    if (!conversation) throw new ChatConversationNotFoundError();

    const messages = await this.database.query.chatMessages.findMany({
      where: eq(chatMessages.conversationId, conversationId),
      orderBy: [desc(chatMessages.createdAt), desc(chatMessages.id)],
      limit: Math.max(1, Math.min(limit, 100)),
    });

    return messages.reverse();
  }

  async deleteConversation(
    userId: string,
    conversationId: string,
  ): Promise<boolean> {
    const deleted = await this.database
      .delete(chatConversations)
      .where(
        and(
          eq(chatConversations.id, conversationId),
          eq(chatConversations.userId, userId),
        ),
      )
      .returning({ id: chatConversations.id });

    return deleted.length > 0;
  }
}
