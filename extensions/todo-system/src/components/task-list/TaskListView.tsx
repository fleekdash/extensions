import { useState } from "react";
import type { Task, TodoUser } from "../../types/todo";
import { groupTasksBySection } from "../../utils/todo-helpers";
import { TaskRow } from "./TaskRow";

type TaskListViewProps = {
  readonly tasks: readonly Task[];
  readonly selectedTaskId: number | null;
  readonly usersById: ReadonlyMap<number, TodoUser>;
  readonly onSelectTask: (id: number) => void;
  readonly onToggleDone: (task: Task) => void;
};

export function TaskListView({
  tasks,
  selectedTaskId,
  usersById,
  onSelectTask,
  onToggleDone,
}: TaskListViewProps) {
  const sections = groupTasksBySection(tasks);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (tasks.length === 0) {
    return (
      <div className="todo-empty">
        <h3>No tasks yet</h3>
        <p>Add a task above to start organizing this project.</p>
      </div>
    );
  }

  return (
    <div>
      {sections.map((section) => {
        const isCollapsed = Boolean(collapsed[section.name]);
        return (
          <section key={section.name} className="todo-section">
            <div className="todo-section-header">
              <button
                type="button"
                aria-label={isCollapsed ? "Expand section" : "Collapse section"}
                onClick={() =>
                  setCollapsed((prev) => ({
                    ...prev,
                    [section.name]: !prev[section.name],
                  }))
                }
              >
                {isCollapsed ? "▸" : "▾"}
              </button>
              <h3>{section.name}</h3>
              <span className="todo-section-count">{section.tasks.length}</span>
            </div>
            {!isCollapsed
              ? section.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    selected={selectedTaskId === task.id}
                    usersById={usersById}
                    onSelect={() => onSelectTask(task.id)}
                    onToggleDone={() => onToggleDone(task)}
                  />
                ))
              : null}
          </section>
        );
      })}
    </div>
  );
}
