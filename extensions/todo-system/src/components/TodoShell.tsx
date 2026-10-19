import { useState } from "react";
import type { useTodoApp } from "../hooks/useTodoApp";
import type { TodoSettings } from "../types/settings";
import type { TaskPriority, TaskStatus } from "../types/todo";
import { getFleekDashSdk } from "../utils/fleekdash-sdk";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
} from "../utils/todo-helpers";
import { BoardView } from "./board/BoardView";
import { ProjectModal } from "./shared/ProjectModal";
import { QuickAdd } from "./shared/QuickAdd";
import { Sidebar } from "./sidebar/Sidebar";
import { TaskDetail } from "./task-detail/TaskDetail";
import { TaskListView } from "./task-list/TaskListView";

type TodoShellProps = {
  readonly app: ReturnType<typeof useTodoApp>;
  readonly settings: TodoSettings;
};

export function TodoShell({ app, settings }: TodoShellProps) {
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  // sdk.navigate() — host-side hash routing to the second manifest route.
  const openApiDemo = () => {
    getFleekDashSdk()
      ?.navigate("/app/todo-system/api-demo")
      .catch(() => {});
  };

  if (app.loading) {
    return (
      <div className="todo-state">
        <div className="todo-loading-spinner" />
        <h3>Loading Todo System</h3>
        <p>Syncing projects, tasks, and teammates…</p>
      </div>
    );
  }

  if (app.error) {
    return (
      <div className="todo-state">
        <h3>Could not load</h3>
        <p>{app.error}</p>
        <button
          type="button"
          className="todo-btn todo-btn-primary"
          onClick={() => void app.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`todo-shell${app.selectedTask ? " detail-open" : ""}`}>
      <Sidebar
        projects={app.projects}
        activeProjectId={app.activeProjectId}
        onSelectProject={app.selectProject}
        onCreateProject={() => setProjectModalOpen(true)}
      />

      <main className="todo-main">
        <header className="todo-header">
          <div className="todo-header-top">
            <h2>{app.activeProject?.name ?? "Tasks"}</h2>
            <div className="todo-header-actions">
              <button
                type="button"
                className="todo-btn todo-btn-ghost todo-btn-sm"
                onClick={openApiDemo}
                title="Live showcase of every FleekDash SDK capability"
              >
                API tour
              </button>
              <div className="todo-view-toggle">
                <button
                  type="button"
                  className={app.viewMode === "list" ? "active" : ""}
                  onClick={() => app.setViewMode("list")}
                >
                  List
                </button>
                <button
                  type="button"
                  className={app.viewMode === "board" ? "active" : ""}
                  onClick={() => app.setViewMode("board")}
                >
                  Board
                </button>
              </div>
            </div>
          </div>

          <div className="todo-filters">
            <input
              className="todo-input todo-input-sm"
              placeholder="Search tasks…"
              value={app.filters.search}
              onChange={(event) =>
                app.setFilters({ ...app.filters, search: event.target.value })
              }
            />
            <select
              className="todo-select todo-select-sm"
              value={String(app.filters.assigneeId)}
              onChange={(event) => {
                const value = event.target.value;
                app.setFilters({
                  ...app.filters,
                  assigneeId: value === "all" ? "all" : Number(value),
                });
              }}
            >
              <option value="all">All assignees</option>
              {app.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
            <select
              className="todo-select todo-select-sm"
              value={app.filters.status}
              onChange={(event) =>
                app.setFilters({
                  ...app.filters,
                  status: event.target.value as TaskStatus | "all",
                })
              }
            >
              <option value="all">All statuses</option>
              {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <select
              className="todo-select todo-select-sm"
              value={app.filters.priority}
              onChange={(event) =>
                app.setFilters({
                  ...app.filters,
                  priority: event.target.value as TaskPriority | "all",
                })
              }
            >
              <option value="all">All priorities</option>
              {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="todo-content">
          {app.tasksTruncated ? (
            <p className="todo-truncated-notice" role="status">
              This site has {app.tasksTotal} tasks — showing the first{" "}
              {app.tasks.length}. Reload to refresh.
            </p>
          ) : null}
          <QuickAdd
            disabled={!app.activeProjectId || app.saving}
            placeholder={settings.quick_add_placeholder}
            onAdd={(title) => app.handleCreateTask({ title })}
          />

          {app.viewMode === "list" ? (
            <TaskListView
              tasks={app.tasks}
              selectedTaskId={app.selectedTaskId}
              usersById={app.usersById}
              onSelectTask={app.setSelectedTaskId}
              onToggleDone={(task) => void app.toggleTaskDone(task)}
            />
          ) : (
            <BoardView
              tasks={app.tasks}
              selectedTaskId={app.selectedTaskId}
              usersById={app.usersById}
              onSelectTask={app.setSelectedTaskId}
              onMoveTask={(taskId, status) =>
                void app.handleUpdateTask(taskId, { status })
              }
            />
          )}

          {app.hiddenTaskCount > 0 && !app.showAll ? (
            <button
              type="button"
              className="todo-btn todo-btn-ghost"
              onClick={() => app.setShowAll(true)}
            >
              Show all {app.filteredCount} tasks ({app.hiddenTaskCount} hidden by
              the tasks-per-page setting)
            </button>
          ) : null}
        </div>
      </main>

      {app.selectedTask ? (
        <TaskDetail
          task={app.selectedTask}
          users={app.users}
          adminUrl={app.adminUrl}
          saving={app.saving}
          onClose={() => app.setSelectedTaskId(null)}
          onUpdate={app.handleUpdateTask}
          onDelete={app.handleDeleteTask}
        />
      ) : null}

      <ProjectModal
        open={projectModalOpen}
        saving={app.saving}
        onClose={() => setProjectModalOpen(false)}
        onSubmit={app.handleCreateProject}
      />
    </div>
  );
}
