export const roadmapTaskStatuses = [
  "offen",
  "in_bearbeitung",
  "erledigt",
] as const;

export type RoadmapTaskStatus = (typeof roadmapTaskStatuses)[number];

export interface ProgressTask {
  status: RoadmapTaskStatus;
}

export interface PrioritizedTask extends ProgressTask {
  id: string;
  sortOrder: number;
  dueDate?: string | null;
}

export interface RoadmapProgress {
  total: number;
  completed: number;
  open: number;
  percent: number;
}

export function calculateRoadmapProgress(
  tasks: readonly ProgressTask[],
): RoadmapProgress {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "erledigt").length;

  return {
    total,
    completed,
    open: total - completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function calculateChecklistProgress(
  items: readonly { isCompleted: boolean }[],
): RoadmapProgress {
  const total = items.length;
  const completed = items.filter((item) => item.isCompleted).length;

  return {
    total,
    completed,
    open: total - completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

/**
 * Picks deterministically: work already started, then user-dated work, then
 * template order. IDs provide a stable final tie-breaker.
 */
export function selectNextRoadmapTask<T extends PrioritizedTask>(
  tasks: readonly T[],
): T | null {
  const candidates = tasks.filter((task) => task.status !== "erledigt");

  candidates.sort((left, right) => {
    const statusDifference =
      statusPriority(left.status) - statusPriority(right.status);
    if (statusDifference !== 0) return statusDifference;

    const dateDifference = compareDueDates(left.dueDate, right.dueDate);
    if (dateDifference !== 0) return dateDifference;

    const orderDifference = left.sortOrder - right.sortOrder;
    if (orderDifference !== 0) return orderDifference;

    return left.id.localeCompare(right.id);
  });

  return candidates[0] ?? null;
}

export function canTransitionTaskStatus(
  current: RoadmapTaskStatus,
  next: RoadmapTaskStatus,
): boolean {
  if (current === next) return true;

  const allowedTransitions: Readonly<
    Record<RoadmapTaskStatus, readonly RoadmapTaskStatus[]>
  > = {
    offen: ["in_bearbeitung", "erledigt"],
    in_bearbeitung: ["offen", "erledigt"],
    erledigt: ["in_bearbeitung"],
  };

  return allowedTransitions[current].includes(next);
}

function statusPriority(status: RoadmapTaskStatus): number {
  return status === "in_bearbeitung" ? 0 : 1;
}

function compareDueDates(
  left: string | null | undefined,
  right: string | null | undefined,
): number {
  if (left && right) return left.localeCompare(right);
  if (left) return -1;
  if (right) return 1;
  return 0;
}
