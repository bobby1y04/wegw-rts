import { describe, expect, it } from "vitest";

import {
  calculateChecklistProgress,
  calculateRoadmapProgress,
  canTransitionTaskStatus,
  selectNextRoadmapTask,
} from "../../src/features/roadmap/progress";

describe("roadmap progress", () => {
  it("calculates task progress without division by zero", () => {
    expect(calculateRoadmapProgress([])).toEqual({
      total: 0,
      completed: 0,
      open: 0,
      percent: 0,
    });

    expect(
      calculateRoadmapProgress([
        { status: "erledigt" },
        { status: "offen" },
        { status: "in_bearbeitung" },
      ]),
    ).toEqual({
      total: 3,
      completed: 1,
      open: 2,
      percent: 33,
    });
  });

  it("calculates checklist progress independently", () => {
    expect(
      calculateChecklistProgress([
        { isCompleted: true },
        { isCompleted: true },
        { isCompleted: false },
        { isCompleted: false },
      ]),
    ).toMatchObject({ total: 4, completed: 2, open: 2, percent: 50 });
  });
});

describe("next roadmap task", () => {
  it("prefers started work, then due dates, then template order", () => {
    const tasks = [
      {
        id: "first",
        status: "offen" as const,
        sortOrder: 10,
        dueDate: null,
      },
      {
        id: "dated",
        status: "offen" as const,
        sortOrder: 30,
        dueDate: "2026-10-12",
      },
      {
        id: "started",
        status: "in_bearbeitung" as const,
        sortOrder: 40,
        dueDate: null,
      },
      {
        id: "done",
        status: "erledigt" as const,
        sortOrder: 1,
        dueDate: "2026-01-01",
      },
    ];

    expect(selectNextRoadmapTask(tasks)?.id).toBe("started");
    expect(tasks.map((task) => task.id)).toEqual([
      "first",
      "dated",
      "started",
      "done",
    ]);
  });

  it("returns null when every task is complete", () => {
    expect(
      selectNextRoadmapTask([
        {
          id: "done",
          status: "erledigt",
          sortOrder: 1,
          dueDate: null,
        },
      ]),
    ).toBeNull();
  });
});

describe("task status transitions", () => {
  it("allows deliberate completion and reopening", () => {
    expect(canTransitionTaskStatus("offen", "erledigt")).toBe(true);
    expect(canTransitionTaskStatus("erledigt", "in_bearbeitung")).toBe(true);
    expect(canTransitionTaskStatus("erledigt", "offen")).toBe(false);
  });
});
