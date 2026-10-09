import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { LOCAL_USER_ID } from "../../src/db/local-user";
import { usageCounters, users } from "../../src/db/schema";
import {
  AbuseControlService,
  RateLimitExceededError,
} from "../../src/server/abuse";
import { closeDatabase, getDatabase } from "../../src/server/db";
import {
  ChatConversationNotFoundError,
  ChatRepository,
  ChatStorageLimitError,
} from "../../src/server/repositories/chat-repository";
import { ProfileRepository } from "../../src/server/repositories/profile-repository";
import {
  RoadmapRepository,
  RoadmapTaskNotFoundError,
} from "../../src/server/repositories/roadmap-repository";
import { UserRepository } from "../../src/server/repositories/user-repository";

const databaseUrl = process.env.DATABASE_URL_TEST;

describe.runIf(Boolean(databaseUrl))("PostgreSQL repositories", () => {
  beforeEach(async () => {
    process.env.DATABASE_URL = databaseUrl;
    const db = getDatabase();
    await db.delete(users).where(eq(users.id, LOCAL_USER_ID));
    await db.delete(usageCounters);
    await db.insert(users).values({ id: LOCAL_USER_ID, displayName: "Test" });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it("speichert das Profil und erzeugt Templates ohne Duplikate", async () => {
    const profiles = new ProfileRepository();
    const input = {
      displayName: "Alex",
      phase: "vor_dem_studium" as const,
      studyProgram: "Informatik",
      interests: ["bewerbung" as const],
      onboardingComplete: true,
    };

    await profiles.upsert(LOCAL_USER_ID, input);
    await profiles.upsert(LOCAL_USER_ID, input);

    const tasks = await new RoadmapRepository().listForUser(
      LOCAL_USER_ID,
      "vor_dem_studium",
    );
    expect(tasks).toHaveLength(8);
    expect(new Set(tasks.map((task) => task.templateId)).size).toBe(8);
  });

  it("persistiert Status und Checklistenfortschritt", async () => {
    await new ProfileRepository().upsert(LOCAL_USER_ID, {
      phase: "im_studium",
      interests: [],
      onboardingComplete: true,
    });
    const roadmap = new RoadmapRepository();
    const [task] = await roadmap.listForUser(LOCAL_USER_ID, "im_studium");
    expect(task).toBeDefined();
    if (!task) return;

    const item = task.checklistItems[0];
    expect(item).toBeDefined();
    if (!item) return;

    await roadmap.setChecklistItemCompleted(
      LOCAL_USER_ID,
      task.id,
      item.id,
      true,
    );
    await roadmap.updateStatus(LOCAL_USER_ID, task.id, "erledigt");

    const updated = await roadmap.getById(LOCAL_USER_ID, task.id);
    expect(updated?.status).toBe("erledigt");
    expect(updated?.checklistItems[0]?.isCompleted).toBe(true);
  });

  it("isoliert Aufgaben und Chats zwischen anonymen Nutzern", async () => {
    const otherUserId = crypto.randomUUID();
    const profiles = new ProfileRepository();
    await profiles.upsert(LOCAL_USER_ID, {
      phase: "vor_dem_studium",
      interests: [],
      onboardingComplete: true,
    });
    await profiles.upsert(otherUserId, {
      phase: "im_studium",
      interests: [],
      onboardingComplete: true,
    });

    const roadmap = new RoadmapRepository();
    const [ownedTask] = await roadmap.listForUser(LOCAL_USER_ID);
    expect(ownedTask).toBeDefined();
    if (!ownedTask) return;
    await expect(
      roadmap.getById(otherUserId, ownedTask.id),
    ).resolves.toBeNull();
    await expect(
      roadmap.updateStatus(otherUserId, ownedTask.id, "erledigt"),
    ).rejects.toBeInstanceOf(RoadmapTaskNotFoundError);

    const chats = new ChatRepository();
    const conversation = await chats.createConversation(
      LOCAL_USER_ID,
      "Privater Chat",
    );
    await expect(
      chats.getConversation(otherUserId, conversation.id),
    ).resolves.toBeNull();
    await expect(
      chats.addMessage(otherUserId, conversation.id, "user", "Fremdzugriff"),
    ).rejects.toBeInstanceOf(ChatConversationNotFoundError);
  });

  it("begrenzt KI-Anfragen atomar und sperrt parallele Generierungen", async () => {
    await new ProfileRepository().upsert(LOCAL_USER_ID, {
      phase: "vor_dem_studium",
      interests: [],
      onboardingComplete: true,
    });
    const abuse = new AbuseControlService();
    const now = new Date("2026-10-09T12:00:10.000Z");
    const headers = new Headers({ "x-forwarded-for": "192.0.2.10" });

    await abuse.consumeRateLimits({
      sessionIdentifier: LOCAL_USER_ID,
      headers,
      now,
    });
    await abuse.consumeRateLimits({
      sessionIdentifier: LOCAL_USER_ID,
      headers,
      now,
    });
    await expect(
      abuse.consumeRateLimits({
        sessionIdentifier: LOCAL_USER_ID,
        headers,
        now,
      }),
    ).rejects.toBeInstanceOf(RateLimitExceededError);

    const lease = await abuse.acquireAILease(LOCAL_USER_ID, now);
    expect(lease).not.toBeNull();
    await expect(
      abuse.acquireAILease(LOCAL_USER_ID, now),
    ).resolves.toBeNull();
    if (lease) {
      await expect(abuse.releaseAILease(lease)).resolves.toBe(true);
    }
  });

  it("begrenzt gespeicherte Unterhaltungen pro Sitzung", async () => {
    await new ProfileRepository().upsert(LOCAL_USER_ID, {
      phase: "vor_dem_studium",
      interests: [],
      onboardingComplete: true,
    });
    const chats = new ChatRepository();
    await chats.createConversation(LOCAL_USER_ID, "Eins");
    await chats.createConversation(LOCAL_USER_ID, "Zwei");
    await chats.createConversation(LOCAL_USER_ID, "Drei");

    await expect(
      chats.createConversation(LOCAL_USER_ID, "Vier"),
    ).rejects.toBeInstanceOf(ChatStorageLimitError);
  });

  it("löscht abgelaufene anonyme Nutzerdaten kaskadierend", async () => {
    await new ProfileRepository().upsert(LOCAL_USER_ID, {
      phase: "vor_dem_studium",
      interests: [],
      onboardingComplete: true,
    });
    await getDatabase()
      .update(users)
      .set({ expiresAt: new Date("2026-10-01T00:00:00.000Z") })
      .where(eq(users.id, LOCAL_USER_ID));

    const deleted = await new UserRepository().cleanupExpired(
      new Date("2026-10-09T00:00:00.000Z"),
    );

    expect(deleted.users).toBe(1);
    await expect(
      new ProfileRepository().getForUser(LOCAL_USER_ID),
    ).resolves.toBeNull();
  });
});
