import type { Project } from "../../types/todo";

type SidebarProps = {
  readonly projects: readonly Project[];
  readonly activeProjectId: number | null;
  readonly onSelectProject: (id: number) => void;
  readonly onCreateProject: () => void;
};

export function Sidebar({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
}: SidebarProps) {
  return (
    <aside className="todo-sidebar">
      <div className="todo-brand">
        <div className="todo-brand-mark" aria-hidden>
          ✓
        </div>
        <div>
          <h1>Todo System</h1>
          <p>Projects &amp; work</p>
        </div>
      </div>

      <div className="todo-nav-label">Projects</div>
      <div className="todo-project-list">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            className={`todo-project-item${activeProjectId === project.id ? " active" : ""}`}
            onClick={() => onSelectProject(project.id)}
          >
            <span
              className="todo-project-dot"
              style={{ background: project.color }}
            />
            <span>{project.name}</span>
            <span className="todo-project-meta">{project.count}</span>
          </button>
        ))}
      </div>

      <div className="todo-sidebar-actions">
        <button
          type="button"
          className="todo-btn todo-btn-ghost todo-btn-block"
          onClick={onCreateProject}
        >
          + New project
        </button>
      </div>
    </aside>
  );
}
