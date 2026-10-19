import type { TaskPriority, TaskStatus } from "../types/todo";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
  blocked: "Blocked",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  none: "None",
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const BOARD_COLUMNS: readonly TaskStatus[] = [
  "todo",
  "in_progress",
  "blocked",
  "done",
];

export function formatDueDate(value: string): string {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function isOverdue(dueDate: string, status: TaskStatus): boolean {
  if (!dueDate || status === "done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  return due.getTime() < today.getTime();
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function groupTasksBySection<T extends { section: string; sort_order: number }>(
  tasks: readonly T[],
): readonly { readonly name: string; readonly tasks: readonly T[] }[] {
  const map = new Map<string, T[]>();
  for (const task of tasks) {
    const key = task.section || "Untitled section";
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(task);
    } else {
      map.set(key, [task]);
    }
  }

  return Array.from(map.entries()).map(([name, sectionTasks]) => ({
    name,
    tasks: [...sectionTasks].sort((a, b) => a.sort_order - b.sort_order),
  }));
}

export function postTitleFromWp(
  title: { readonly rendered: string } | string,
): string {
  if (typeof title === "string") return title;
  const tmp = document.createElement("textarea");
  tmp.innerHTML = title.rendered;
  return tmp.value;
}
