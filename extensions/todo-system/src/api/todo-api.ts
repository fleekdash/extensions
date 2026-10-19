import type {
  BootstrapResponse,
  Project,
  ProjectInput,
  Task,
  TaskInput,
  WpPostSummary,
} from "../types/todo";
import { getFleekDashSdk } from "../utils/fleekdash-sdk";
import { postTitleFromWp } from "../utils/todo-helpers";

function requireSdk() {
  const sdk = getFleekDashSdk();
  if (!sdk) {
    throw new Error("FleekDash SDK is not available");
  }
  return sdk;
}

export async function fetchBootstrap(): Promise<BootstrapResponse> {
  const sdk = requireSdk();
  const data = await sdk.getWordPressData("/todo-system/v1/bootstrap");
  return data as BootstrapResponse;
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const sdk = requireSdk();
  const data = (await sdk.mutateWordPressData("/todo-system/v1/projects", {
    method: "POST",
    body: input,
  })) as { project: Project };
  return data.project;
}

export async function updateProject(
  id: number,
  input: Partial<ProjectInput>,
): Promise<Project> {
  const sdk = requireSdk();
  const data = (await sdk.mutateWordPressData(
    `/todo-system/v1/projects/${id}`,
    {
      method: "PUT",
      body: input,
    },
  )) as { project: Project };
  return data.project;
}

export async function deleteProject(id: number): Promise<void> {
  const sdk = requireSdk();
  await sdk.mutateWordPressData(`/todo-system/v1/projects/${id}`, {
    method: "DELETE",
  });
}

export async function createTask(input: TaskInput): Promise<Task> {
  const sdk = requireSdk();
  const data = (await sdk.mutateWordPressData("/todo-system/v1/tasks", {
    method: "POST",
    body: input,
  })) as { task: Task };
  return data.task;
}

export async function updateTask(
  id: number,
  input: Partial<TaskInput>,
): Promise<Task> {
  const sdk = requireSdk();
  const data = (await sdk.mutateWordPressData(`/todo-system/v1/tasks/${id}`, {
    method: "PUT",
    body: input,
  })) as { task: Task };
  return data.task;
}

export async function deleteTask(id: number): Promise<void> {
  const sdk = requireSdk();
  await sdk.mutateWordPressData(`/todo-system/v1/tasks/${id}`, {
    method: "DELETE",
  });
}

export async function searchPosts(search: string): Promise<
  readonly {
    readonly id: number;
    readonly title: string;
    readonly link: string;
    readonly status: string;
  }[]
> {
  const sdk = requireSdk();
  const data = await sdk.getWordPressData("/wp/v2/posts", {
    search: search || "",
    per_page: 12,
    status: "publish,draft,pending,future",
    orderby: "date",
    order: "desc",
    _fields: "id,title,link,status",
  });

  const posts = Array.isArray(data) ? (data as WpPostSummary[]) : [];
  return posts.map((post) => ({
    id: post.id,
    title: postTitleFromWp(post.title),
    link: post.link,
    status: post.status,
  }));
}
