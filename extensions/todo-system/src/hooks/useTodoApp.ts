import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createProject,
  createTask,
  deleteProject,
  deleteTask,
  fetchBootstrap,
  updateProject,
  updateTask,
} from "../api/todo-api";
import type {
  Project,
  ProjectInput,
  Task,
  TaskInput,
  TaskPriority,
  TaskStatus,
  TodoUser,
  ViewMode,
} from "../types/todo";
import {
  DEFAULT_TODO_SETTINGS,
  type TodoSettings,
} from "../types/settings";
import { notify, sdkLog, syncMenuBadge } from "../utils/sdk-bridge";

function countOpenTasks(tasks: readonly Task[]): number {
  return tasks.filter((task) => task.status !== "done").length;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export type TodoFilters = {
  readonly search: string;
  readonly assigneeId: number | "all";
  readonly status: TaskStatus | "all";
  readonly priority: TaskPriority | "all";
};

const DEFAULT_FILTERS: TodoFilters = {
  search: "",
  assigneeId: "all",
  status: "all",
  priority: "all",
};

export function useTodoApp(
  enabled: boolean,
  settings: TodoSettings = DEFAULT_TODO_SETTINGS,
) {
  const [projects, setProjects] = useState<readonly Project[]>([]);
  const [tasks, setTasks] = useState<readonly Task[]>([]);
  const [users, setUsers] = useState<readonly TodoUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState(0);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(settings.default_view);
  const [filters, setFilters] = useState<TodoFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const bootedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBootstrap();
      sdkLog(settings, "bootstrap loaded", {
        projects: data.projects.length,
        tasks: data.tasks.length,
      });
      setProjects(data.projects);
      setTasks(data.tasks);
      setUsers(data.users);
      setCurrentUserId(data.current_user_id);
      setActiveProjectId((prev) => {
        if (prev && data.projects.some((p) => p.id === prev)) return prev;
        return data.projects[0]?.id ?? null;
      });
    } catch (err) {
      setError(errorMessage(err, "Failed to load todo data"));
    } finally {
      setLoading(false);
    }
  }, [settings]);

  useEffect(() => {
    if (!enabled || bootedRef.current) return;
    bootedRef.current = true;
    void load();
  }, [enabled, load]);

  // `default_view` arrives asynchronously via getIntegrationSettings —
  // apply it until the user picks a view explicitly.
  useEffect(() => {
    setViewMode(settings.default_view);
  }, [settings.default_view]);

  // Menu badge mirrors the open-task count when the setting is on.
  useEffect(() => {
    syncMenuBadge(settings, countOpenTasks(tasks));
  }, [settings, tasks]);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  const projectTasks = useMemo(() => {
    if (!activeProjectId) return [];
    return tasks.filter((task) => task.project_id === activeProjectId);
  }, [tasks, activeProjectId]);

  const filteredTasks = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return projectTasks
      .filter((task) => {
        if (query && !task.title.toLowerCase().includes(query)) return false;
        if (filters.status !== "all" && task.status !== filters.status) {
          return false;
        }
        if (filters.priority !== "all" && task.priority !== filters.priority) {
          return false;
        }
        if (
          filters.assigneeId !== "all" &&
          !task.assignee_ids.includes(filters.assigneeId)
        ) {
          return false;
        }
        return true;
      })
      .slice(0, settings.tasks_per_page);
  }, [projectTasks, filters, settings.tasks_per_page]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );

  const usersById = useMemo(() => {
    const map = new Map<number, TodoUser>();
    for (const user of users) map.set(user.id, user);
    return map;
  }, [users]);

  const handleCreateProject = useCallback(
    async (input: ProjectInput) => {
      setSaving(true);
      try {
        const project = await createProject(input);
        setProjects((prev) => [...prev, project]);
        setActiveProjectId(project.id);
        notify(`Project "${project.name}" created`, "success");
      } catch (err) {
        notify(errorMessage(err, "Could not create project"), "error");
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const handleUpdateProject = useCallback(
    async (id: number, input: Partial<ProjectInput>) => {
      setSaving(true);
      try {
        const project = await updateProject(id, input);
        setProjects((prev) => prev.map((p) => (p.id === id ? project : p)));
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const handleDeleteProject = useCallback(async (id: number) => {
    setSaving(true);
    try {
      await deleteProject(id);
      setProjects((prev) => {
        const remaining = prev.filter((p) => p.id !== id);
        setActiveProjectId((current) =>
          current === id ? (remaining[0]?.id ?? null) : current,
        );
        return remaining;
      });
      setTasks((prev) => prev.filter((t) => t.project_id !== id));
      notify("Project deleted", "info");
    } catch (err) {
      notify(errorMessage(err, "Could not delete project"), "error");
    } finally {
      setSaving(false);
    }
  }, []);

  const handleCreateTask = useCallback(
    async (input: Omit<TaskInput, "project_id"> & { project_id?: number }) => {
      if (!activeProjectId && !input.project_id) return;
      setSaving(true);
      try {
        const task = await createTask({
          ...input,
          project_id: input.project_id ?? activeProjectId ?? undefined,
          section: input.section ?? "Untitled section",
          status: input.status ?? "todo",
          priority: input.priority ?? "none",
        });
        setTasks((prev) => [...prev, task]);
        setProjects((prev) =>
          prev.map((project) =>
            project.id === task.project_id
              ? { ...project, count: project.count + 1 }
              : project,
          ),
        );
        setSelectedTaskId(task.id);
        notify(`Task "${task.title}" created`, "success");
      } catch (err) {
        notify(errorMessage(err, "Could not create task"), "error");
      } finally {
        setSaving(false);
      }
    },
    [activeProjectId],
  );

  const handleUpdateTask = useCallback(
    async (id: number, input: Partial<TaskInput>) => {
      setSaving(true);
      try {
        const task = await updateTask(id, input);
        setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
        sdkLog(settings, "task updated", { id, fields: Object.keys(input) });
      } catch (err) {
        notify(errorMessage(err, "Could not update task"), "error");
      } finally {
        setSaving(false);
      }
    },
    [settings],
  );

  const handleDeleteTask = useCallback(async (id: number) => {
    setSaving(true);
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setSelectedTaskId((prev) => (prev === id ? null : prev));
      notify("Task deleted", "info");
    } catch (err) {
      notify(errorMessage(err, "Could not delete task"), "error");
    } finally {
      setSaving(false);
    }
  }, []);

  const toggleTaskDone = useCallback(
    async (task: Task) => {
      const nextStatus: TaskStatus = task.status === "done" ? "todo" : "done";
      await handleUpdateTask(task.id, { status: nextStatus });
    },
    [handleUpdateTask],
  );

  return {
    projects,
    tasks: filteredTasks,
    allProjectTasks: projectTasks,
    users,
    usersById,
    currentUserId,
    activeProject,
    activeProjectId,
    setActiveProjectId,
    selectedTask,
    selectedTaskId,
    setSelectedTaskId,
    viewMode,
    setViewMode,
    filters,
    setFilters,
    loading,
    error,
    saving,
    reload: load,
    handleCreateProject,
    handleUpdateProject,
    handleDeleteProject,
    handleCreateTask,
    handleUpdateTask,
    handleDeleteTask,
    toggleTaskDone,
  };
}
