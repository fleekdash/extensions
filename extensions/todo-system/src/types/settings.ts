/**
 * Values returned by `sdk.getIntegrationSettings()` — mirrors the
 * `settings` map in fleekdash.json (and the PHP parity schema).
 */
export type TodoSettings = {
  readonly default_view: "list" | "board";
  readonly open_tasks_badge: boolean;
  readonly badge_color: string;
  readonly tasks_per_page: number;
  readonly quick_add_placeholder: string;
  readonly debug_logging: boolean;
};

export const DEFAULT_TODO_SETTINGS: TodoSettings = {
  default_view: "list",
  open_tasks_badge: true,
  badge_color: "blue",
  tasks_per_page: 50,
  quick_add_placeholder: "Add a task…",
  debug_logging: false,
};

export function normalizeTodoSettings(
  raw: Record<string, unknown> | undefined | null,
): TodoSettings {
  const r = raw ?? {};
  return {
    default_view: r.default_view === "board" ? "board" : "list",
    open_tasks_badge: r.open_tasks_badge !== false,
    badge_color: typeof r.badge_color === "string" ? r.badge_color : "blue",
    tasks_per_page:
      typeof r.tasks_per_page === "number" && r.tasks_per_page > 0
        ? r.tasks_per_page
        : 50,
    quick_add_placeholder:
      typeof r.quick_add_placeholder === "string" && r.quick_add_placeholder
        ? r.quick_add_placeholder
        : "Add a task…",
    debug_logging: r.debug_logging === true,
  };
}
