export type TaskStatus = "todo" | "in_progress" | "done" | "blocked";
export type TaskPriority = "none" | "low" | "medium" | "high" | "urgent";
export type ViewMode = "list" | "board";

export type TodoUser = {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly avatar: string;
};

export type LinkedPost = {
  readonly id: number;
  readonly title: string;
  readonly link: string;
  readonly status: string;
};

export type Project = {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly color: string;
  readonly count: number;
};

export type Task = {
  readonly id: number;
  readonly title: string;
  readonly description: string;
  readonly project_id: number;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly due_date: string;
  readonly section: string;
  readonly sort_order: number;
  readonly assignee_ids: readonly number[];
  readonly linked_post_ids: readonly number[];
  readonly linked_posts: readonly LinkedPost[];
  readonly created_at: string;
  readonly updated_at: string;
};

export type BootstrapResponse = {
  readonly success: boolean;
  readonly projects: readonly Project[];
  readonly tasks: readonly Task[];
  readonly users: readonly TodoUser[];
  readonly current_user_id: number;
};

export type TaskInput = {
  readonly title: string;
  readonly description?: string;
  readonly project_id?: number;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly due_date?: string;
  readonly section?: string;
  readonly sort_order?: number;
  readonly assignee_ids?: readonly number[];
  readonly linked_post_ids?: readonly number[];
};

export type ProjectInput = {
  readonly name: string;
  readonly description?: string;
  readonly color?: string;
};

export type WpPostSummary = {
  readonly id: number;
  readonly title: { readonly rendered: string } | string;
  readonly link: string;
  readonly status: string;
};
