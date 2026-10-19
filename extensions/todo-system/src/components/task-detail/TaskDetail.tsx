import { useEffect, useRef, useState } from "react";
import { searchPosts } from "../../api/todo-api";
import type {
  Task,
  TaskInput,
  TaskPriority,
  TaskStatus,
  TodoUser,
} from "../../types/todo";
import { getFleekDashSdk } from "../../utils/fleekdash-sdk";
import { notify } from "../../utils/sdk-bridge";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
} from "../../utils/todo-helpers";

type TaskDetailProps = {
  readonly task: Task;
  readonly users: readonly TodoUser[];
  readonly adminUrl?: string;
  readonly saving?: boolean;
  readonly onClose: () => void;
  readonly onUpdate: (id: number, input: Partial<TaskInput>) => Promise<boolean>;
  readonly onDelete: (id: number) => Promise<unknown>;
};

export function TaskDetail({
  task,
  users,
  adminUrl,
  saving,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [section, setSection] = useState(task.section);
  const [postQuery, setPostQuery] = useState("");
  const [postResults, setPostResults] = useState<
    readonly { id: number; title: string; link: string; status: string }[]
  >([]);
  const [searchingPosts, setSearchingPosts] = useState(false);

  // Sync server values into safe fields only - never clobber the field
  // being edited, and never overwrite a submitted-but-unconfirmed edit
  // (a stale interim response would revert the input otherwise).
  const focusedField = useRef<string | null>(null);
  const pendingEdits = useRef<
    Partial<Record<"title" | "description" | "section", string>>
  >({});
  const lastTaskId = useRef(task.id);
  // Mirrors of the freshest prop/local values so async callbacks can check
  // what the pane actually shows *now* (not at commit time).
  const taskRef = useRef(task);
  taskRef.current = task;
  const valuesRef = useRef({ title, description, section });
  valuesRef.current = { title, description, section };
  useEffect(() => {
    if (lastTaskId.current !== task.id) {
      lastTaskId.current = task.id;
      pendingEdits.current = {};
      focusedField.current = null;
      setTitle(task.title);
      setDescription(task.description);
      setSection(task.section);
      return;
    }
    const maybeSync = (
      field: "title" | "description" | "section",
      server: string,
      set: (value: string) => void,
    ) => {
      const pending = pendingEdits.current[field];
      if (pending !== undefined) {
        if (server === pending) delete pendingEdits.current[field];
        else return;
      }
      if (focusedField.current !== field) set(server);
    };
    maybeSync("title", task.title, setTitle);
    maybeSync("description", task.description, setDescription);
    maybeSync("section", task.section, setSection);
  }, [task]);

  useEffect(() => {
    let cancelled = false;
    const timer = globalThis.setTimeout(() => {
      if (!postQuery.trim()) {
        setPostResults([]);
        setSearchingPosts(false);
        return;
      }
      setSearchingPosts(true);
      void searchPosts(postQuery)
        .then((results) => {
          if (!cancelled) setPostResults(results);
        })
        .catch(() => {
          if (!cancelled) setPostResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearchingPosts(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
    };
  }, [postQuery]);

  const commit = (input: Partial<TaskInput>) => {
    const edited = (["title", "description", "section"] as const).filter(
      (field) => input[field] !== undefined,
    );
    for (const field of edited) {
      pendingEdits.current[field] = input[field] as string;
    }
    void onUpdate(task.id, input).then((ok) => {
      // Touch pending markers only while the pane still shows THIS task -
      // a switch already reset them and they now belong to the new task.
      if (lastTaskId.current !== task.id) return;
      for (const field of edited) delete pendingEdits.current[field];
      // Restore only when the field isn't being edited and the input
      // still holds the submitted value - a newer draft is never clobbered.
      if (ok) return;
      const restore = (
        field: "title" | "description" | "section",
        set: (value: string) => void,
      ) => {
        if (input[field] === undefined) return;
        if (focusedField.current === field) return;
        const local = valuesRef.current[field];
        const submitted = input[field] as string;
        // Blur submits trimmed title/section while the input keeps the
        // raw text - both spellings count as "unchanged since submit".
        if (local !== submitted && local.trim() !== submitted) return;
        set(taskRef.current[field]);
      };
      restore("title", setTitle);
      restore("description", setDescription);
      restore("section", setSection);
    });
  };

  const toggleAssignee = (userId: number) => {
    const exists = task.assignee_ids.includes(userId);
    const next = exists
      ? task.assignee_ids.filter((id) => id !== userId)
      : [...task.assignee_ids, userId];
    commit({ assignee_ids: next });
  };

  const toggleLinkedPost = (postId: number) => {
    const exists = task.linked_post_ids.includes(postId);
    const next = exists
      ? task.linked_post_ids.filter((id) => id !== postId)
      : [...task.linked_post_ids, postId];
    commit({ linked_post_ids: next });
  };

  // sdk.openModal - renders the WP editor for the linked post in a
  // host-managed modal instead of leaving FleekDash (same-origin URL).
  const openLinkedPost = (post: { id: number; title: string }) => {
    const sdk = getFleekDashSdk();
    if (!sdk?.openModal) {
      notify("Host modal unavailable outside FleekDash", "warning");
      return;
    }
    sdk
      .openModal({
        title: `Edit: ${post.title}`,
        url: `${adminUrl || "/wp-admin/"}post.php?post=${post.id}&action=edit`,
        size: "3xl",
        direction: "right",
      })
      .catch(() => notify("Could not open post editor", "error"));
  };

  return (
    <aside className="todo-detail">
      <div className="todo-detail-header">
        <div style={{ flex: 1 }}>
          <input
            className="todo-title-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onFocus={() => {
              focusedField.current = "title";
            }}
            onBlur={() => {
              focusedField.current = null;
              if (title.trim() && title.trim() !== task.title) {
                commit({ title: title.trim() });
              }
            }}
          />
        </div>
        <button type="button" className="todo-btn todo-btn-ghost todo-btn-sm" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="todo-detail-body">
        <div className="todo-field">
          <label htmlFor="task-status">Status</label>
          <select
            id="task-status"
            className="todo-select"
            value={task.status}
            onChange={(event) =>
              commit({ status: event.target.value as TaskStatus })
            }
          >
            {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="todo-field">
          <label htmlFor="task-priority">Priority</label>
          <select
            id="task-priority"
            className="todo-select"
            value={task.priority}
            onChange={(event) =>
              commit({ priority: event.target.value as TaskPriority })
            }
          >
            {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
        </div>

        <div className="todo-field">
          <label htmlFor="task-due">Due date</label>
          <input
            id="task-due"
            type="date"
            className="todo-input"
            value={task.due_date}
            onChange={(event) => commit({ due_date: event.target.value })}
          />
        </div>

        <div className="todo-field">
          <label htmlFor="task-section">Section</label>
          <input
            id="task-section"
            className="todo-input"
            value={section}
            onChange={(event) => setSection(event.target.value)}
            onFocus={() => {
              focusedField.current = "section";
            }}
            onBlur={() => {
              focusedField.current = null;
              if (section.trim() && section.trim() !== task.section) {
                commit({ section: section.trim() });
              }
            }}
          />
        </div>

        <div className="todo-field">
          <label htmlFor="task-desc">Description</label>
          <textarea
            id="task-desc"
            className="todo-textarea"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onFocus={() => {
              focusedField.current = "description";
            }}
            onBlur={() => {
              focusedField.current = null;
              if (description !== task.description) {
                commit({ description });
              }
            }}
            placeholder="Add details…"
          />
        </div>

        <fieldset className="todo-field todo-field-group">
          <legend className="todo-field-label">Assignees</legend>
          <div className="todo-assignee-grid">
            {users.map((user) => {
              const active = task.assignee_ids.includes(user.id);
              return (
                <button
                  key={user.id}
                  type="button"
                  className={`todo-assignee-option${active ? " active" : ""}`}
                  onClick={() => toggleAssignee(user.id)}
                  aria-pressed={active}
                >
                  <span className="todo-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" />
                    ) : (
                      user.name.slice(0, 1)
                    )}
                  </span>
                  <span>{user.name}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="todo-field">
          <label htmlFor="task-linked-post-search">Linked WordPress posts</label>
          {task.linked_posts.length > 0 ? (
            <div className="todo-linked-list" style={{ marginBottom: 8 }}>
              {task.linked_posts.map((post) => (
                <div key={post.id} className="todo-linked-item">
                  <button
                    type="button"
                    className="todo-linked-open"
                    onClick={() => openLinkedPost(post)}
                    title="Open in FleekDash modal"
                  >
                    {post.title}
                  </button>
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noreferrer"
                    className="todo-linked-external"
                    title="Open frontend URL in a new tab"
                  >
                    ↗
                  </a>
                  <button
                    type="button"
                    className="todo-btn todo-btn-ghost todo-btn-sm"
                    onClick={() => toggleLinkedPost(post.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <input
            id="task-linked-post-search"
            className="todo-input"
            placeholder="Search posts to link…"
            value={postQuery}
            onChange={(event) => setPostQuery(event.target.value)}
          />
          {searchingPosts ? (
            <p style={{ fontSize: 12, color: "var(--todo-text-muted)" }}>
              Searching…
            </p>
          ) : null}
          <div className="todo-post-results" style={{ marginTop: 8 }}>
            {postResults.map((post) => {
              const active = task.linked_post_ids.includes(post.id);
              return (
                <button
                  key={post.id}
                  type="button"
                  className={`todo-post-option${active ? " active" : ""}`}
                  onClick={() => toggleLinkedPost(post.id)}
                >
                  <span style={{ flex: 1 }}>{post.title}</span>
                  <span className="todo-chip">{post.status}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="todo-btn todo-btn-danger"
          disabled={saving}
          onClick={() => {
            if (globalThis.confirm("Delete this task?")) {
              void onDelete(task.id);
            }
          }}
        >
          Delete task
        </button>
      </div>
    </aside>
  );
}
