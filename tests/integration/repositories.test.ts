import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { LOCAL_USER_ID } from "../../src/db/local-user";
import { users } from "../../src/db/schema";
import { closeDatabase, getDatabase } from "../../src/server/db";
import { ProfileRepository } from "../../src/server/repositories/profile-repository";
import { RoadmapRepository } from "../../src/server/repositories/roadmap-repository";

const databaseUrl = process.env.DATABASE_URL_TEST;

describe.runIf(Boolean(databaseUrl))("PostgreSQL repositories", () => {
  beforeEach(async () => {
    process.env.DATABASE_URL = databaseUrl;
    const db = getDatabase();
    await db.delete(users).where(eq(users.id, LOCAL_USER_ID));
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

    await profiles.upsertLocal(input);
    await profiles.upsertLocal(input);

    const tasks = await new RoadmapRepository().listForUser(
      LOCAL_USER_ID,
      "vor_dem_studium",
    );
    expect(tasks).toHaveLength(8);
    expect(new Set(tasks.map((task) => task.templateId)).size).toBe(8);
  });

  it("persistiert Status und Checklistenfortschritt", async () => {
    await new ProfileRepository().upsertLocal({
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
});
