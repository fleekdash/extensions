import type { Task, TodoUser } from "../../types/todo";
import {
  BOARD_COLUMNS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  formatDueDate,
} from "../../utils/todo-helpers";
import { AvatarStack } from "../shared/AvatarStack";

type BoardViewProps = {
  readonly tasks: readonly Task[];
  readonly selectedTaskId: number | null;
  readonly usersById: ReadonlyMap<number, TodoUser>;
  readonly onSelectTask: (id: number) => void;
  readonly onMoveTask: (taskId: number, status: Task["status"]) => void;
};

export function BoardView({
  tasks,
  selectedTaskId,
  usersById,
  onSelectTask,
  onMoveTask,
}: BoardViewProps) {
  return (
    <div className="todo-board">
      {BOARD_COLUMNS.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);
        return (
          <div key={status} className="todo-board-column">
            <h3>
              {STATUS_LABELS[status]} · {columnTasks.length}
            </h3>
            {columnTasks.map((task) => (
              <div
                key={task.id}
                className={`todo-board-card${selectedTaskId === task.id ? " selected" : ""}`}
              >
                <button
                  type="button"
                  className="todo-board-card-select"
                  onClick={() => onSelectTask(task.id)}
                >
                  <h4>{task.title}</h4>
                  <div
                    className="todo-task-meta"
                    style={{ justifyContent: "space-between" }}
                  >
                    <AvatarStack
                      userIds={task.assignee_ids}
                      usersById={usersById}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      {task.priority !== "none" ? (
                        <span className={`todo-chip priority-${task.priority}`}>
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                      ) : null}
                      {task.due_date ? (
                        <span className="todo-chip">
                          {formatDueDate(task.due_date)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
                <div style={{ marginTop: 10 }}>
                  <label className="sr-only" htmlFor={`board-status-${task.id}`}>
                    Status
                  </label>
                  <select
                    id={`board-status-${task.id}`}
                    className="todo-select todo-select-sm"
                    value={task.status}
                    onChange={(event) =>
                      onMoveTask(task.id, event.target.value as Task["status"])
                    }
                  >
                    {BOARD_COLUMNS.map((option) => (
                      <option key={option} value={option}>
                        {STATUS_LABELS[option]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
