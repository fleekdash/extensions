import type { Task, TodoUser } from "../../types/todo";
import {
  PRIORITY_LABELS,
  formatDueDate,
  isOverdue,
} from "../../utils/todo-helpers";
import { AvatarStack } from "../shared/AvatarStack";

type TaskRowProps = {
  readonly task: Task;
  readonly selected: boolean;
  readonly usersById: ReadonlyMap<number, TodoUser>;
  readonly onSelect: () => void;
  readonly onToggleDone: () => void;
};

export function TaskRow({
  task,
  selected,
  usersById,
  onSelect,
  onToggleDone,
}: TaskRowProps) {
  const overdue = isOverdue(task.due_date, task.status);
  const done = task.status === "done";

  return (
    <div
      className={`todo-task-row${selected ? " selected" : ""}${done ? " done" : ""}`}
    >
      <button
        type="button"
        className={`todo-check${done ? " checked" : ""}`}
        aria-label={done ? "Mark incomplete" : "Mark complete"}
        onClick={onToggleDone}
      >
        {done ? "✓" : null}
      </button>

      <button
        type="button"
        className="todo-task-select"
        onClick={onSelect}
      >
        <span className="todo-task-title">{task.title}</span>

        <AvatarStack userIds={task.assignee_ids} usersById={usersById} />

        <span className="todo-task-meta">
          {task.linked_post_ids.length > 0 ? (
            <span className="todo-chip">{task.linked_post_ids.length} post(s)</span>
          ) : null}
          {task.priority !== "none" ? (
            <span className={`todo-chip priority-${task.priority}`}>
              {PRIORITY_LABELS[task.priority]}
            </span>
          ) : null}
          {task.due_date ? (
            <span className={`todo-chip${overdue ? " overdue" : ""}`}>
              {formatDueDate(task.due_date)}
            </span>
          ) : null}
        </span>
      </button>
    </div>
  );
}
