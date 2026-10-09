import { and, asc, eq } from "drizzle-orm";

import {
  roadmapTasks,
  taskChecklistItems,
  type RoadmapTask,
} from "../../db/schema";
import {
  canTransitionTaskStatus,
  type RoadmapTaskStatus,
} from "../../features/roadmap/progress";
import {
  getRoadmapTemplates,
  type EducationPhase,
} from "../../features/roadmap/templates";
import {
  getDatabase,
  type Database,
  type DatabaseTransaction,
} from "../db";

export class RoadmapTaskNotFoundError extends Error {
  constructor() {
    super("Die Fahrplanaufgabe wurde nicht gefunden.");
    this.name = "RoadmapTaskNotFoundError";
  }
}

export class InvalidTaskStatusTransitionError extends Error {
  constructor(current: RoadmapTaskStatus, next: RoadmapTaskStatus) {
    super(`Der Status kann nicht von „${current}“ zu „${next}“ wechseln.`);
    this.name = "InvalidTaskStatusTransitionError";
  }
}

export async function instantiateRoadmapTasks(
  transaction: DatabaseTransaction,
  userId: string,
  phase: EducationPhase,
): Promise<void> {
  const templates = getRoadmapTemplates(phase);

  for (const template of templates) {
    const [task] = await transaction
      .insert(roadmapTasks)
      .values({
        userId,
        templateId: template.id,
        templateVersion: template.version,
        phase: template.phase,
        title: template.title,
        description: template.description,
        category: template.category,
        sortOrder: template.sortOrder,
        links: template.links.map((link) => ({ ...link })),
      })
      .onConflictDoUpdate({
        target: [roadmapTasks.userId, roadmapTasks.templateId],
        set: {
          templateVersion: template.version,
          phase: template.phase,
          title: template.title,
          description: template.description,
          category: template.category,
          sortOrder: template.sortOrder,
          links: template.links.map((link) => ({ ...link })),
          updatedAt: new Date(),
        },
      })
      .returning({ id: roadmapTasks.id });

    if (!task) {
      throw new Error(`Could not instantiate roadmap task ${template.id}.`);
    }

    for (const [sortOrder, item] of template.checklist.entries()) {
      await transaction
        .insert(taskChecklistItems)
        .values({
          taskId: task.id,
          templateItemId: item.id,
          text: item.text,
          sortOrder,
        })
        .onConflictDoUpdate({
          target: [
            taskChecklistItems.taskId,
            taskChecklistItems.templateItemId,
          ],
          set: {
            text: item.text,
            sortOrder,
            updatedAt: new Date(),
          },
        });
    }
  }
}

export class RoadmapRepository {
  constructor(private readonly database: Database = getDatabase()) {}

  async instantiateForPhase(
    userId: string,
    phase: EducationPhase,
  ): Promise<void> {
    await this.database.transaction(async (transaction) => {
      await instantiateRoadmapTasks(transaction, userId, phase);
    });
  }

  async listForUser(userId: string, phase?: EducationPhase) {
    return this.database.query.roadmapTasks.findMany({
      where: phase
        ? and(
            eq(roadmapTasks.userId, userId),
            eq(roadmapTasks.phase, phase),
          )
        : eq(roadmapTasks.userId, userId),
      orderBy: [
        asc(roadmapTasks.sortOrder),
        asc(roadmapTasks.createdAt),
        asc(roadmapTasks.id),
      ],
      with: {
        checklistItems: {
          orderBy: [
            asc(taskChecklistItems.sortOrder),
            asc(taskChecklistItems.id),
          ],
        },
      },
    });
  }

  async getById(userId: string, taskId: string) {
    return (
      (await this.database.query.roadmapTasks.findFirst({
        where: and(
          eq(roadmapTasks.id, taskId),
          eq(roadmapTasks.userId, userId),
        ),
        with: {
          checklistItems: {
            orderBy: [
              asc(taskChecklistItems.sortOrder),
              asc(taskChecklistItems.id),
            ],
          },
        },
      })) ?? null
    );
  }

  async updateStatus(
    userId: string,
    taskId: string,
    nextStatus: RoadmapTaskStatus,
  ): Promise<RoadmapTask> {
    return this.database.transaction(async (transaction) => {
      const current = await transaction.query.roadmapTasks.findFirst({
        where: and(
          eq(roadmapTasks.id, taskId),
          eq(roadmapTasks.userId, userId),
        ),
      });

      if (!current) throw new RoadmapTaskNotFoundError();

      if (!canTransitionTaskStatus(current.status, nextStatus)) {
        throw new InvalidTaskStatusTransitionError(current.status, nextStatus);
      }

      const [updated] = await transaction
        .update(roadmapTasks)
        .set({ status: nextStatus, updatedAt: new Date() })
        .where(
          and(
            eq(roadmapTasks.id, taskId),
            eq(roadmapTasks.userId, userId),
            eq(roadmapTasks.status, current.status),
          ),
        )
        .returning();

      if (!updated) {
        throw new Error(
          "Die Aufgabe wurde gleichzeitig geändert. Bitte versuche es erneut.",
        );
      }

      return updated;
    });
  }

  async setDueDate(
    userId: string,
    taskId: string,
    dueDate: string | null,
  ): Promise<RoadmapTask> {
    const [updated] = await this.database
      .update(roadmapTasks)
      .set({ dueDate, updatedAt: new Date() })
      .where(
        and(
          eq(roadmapTasks.id, taskId),
          eq(roadmapTasks.userId, userId),
        ),
      )
      .returning();

    if (!updated) throw new RoadmapTaskNotFoundError();
    return updated;
  }

  async setChecklistItemCompleted(
    userId: string,
    taskId: string,
    itemId: string,
    isCompleted: boolean,
  ) {
    return this.database.transaction(async (transaction) => {
      const ownedItem = await transaction
        .select({ id: taskChecklistItems.id })
        .from(taskChecklistItems)
        .innerJoin(
          roadmapTasks,
          eq(taskChecklistItems.taskId, roadmapTasks.id),
        )
        .where(
          and(
            eq(taskChecklistItems.id, itemId),
            eq(taskChecklistItems.taskId, taskId),
            eq(roadmapTasks.userId, userId),
          ),
        )
        .limit(1);

      if (!ownedItem[0]) throw new RoadmapTaskNotFoundError();

      const [updated] = await transaction
        .update(taskChecklistItems)
        .set({ isCompleted, updatedAt: new Date() })
        .where(eq(taskChecklistItems.id, itemId))
        .returning();

      if (!updated) throw new RoadmapTaskNotFoundError();
      return updated;
    });
  }
}
