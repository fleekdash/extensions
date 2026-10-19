import { useEffect, useRef, useState } from "react";

type ProjectModalProps = {
  readonly open: boolean;
  readonly saving?: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: {
    name: string;
    description: string;
    color: string;
  }) => Promise<boolean>;
};

const COLORS = ["#2563eb", "#0ea5e9", "#059669", "#d97706", "#dc2626", "#7c3aed"];

export function ProjectModal({
  open,
  saving,
  onClose,
  onSubmit,
}: ProjectModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  onCloseRef.current = onClose;

  const resetForm = () => {
    setName("");
    setDescription("");
    setColor(COLORS[0]);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return undefined;
    }

    const handleDialogClose = () => {
      resetForm();
      onCloseRef.current();
    };

    dialog.addEventListener("close", handleDialogClose);
    return () => dialog.removeEventListener("close", handleDialogClose);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="todo-modal-dialog"
      aria-labelledby="project-modal-title"
    >
      <form
        className="todo-modal-panel"
        onSubmit={(event) => event.preventDefault()}
      >
        <h3 id="project-modal-title">New project</h3>
        <div className="todo-field" style={{ marginBottom: 12 }}>
          <label htmlFor="project-name">Name</label>
          <input
            id="project-name"
            className="todo-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Marketing launch"
            autoFocus
          />
        </div>
        <div className="todo-field" style={{ marginBottom: 12 }}>
          <label htmlFor="project-desc">Description</label>
          <textarea
            id="project-desc"
            className="todo-textarea"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional"
          />
        </div>
        <fieldset className="todo-field todo-field-group">
          <legend className="todo-field-label">Color</legend>
          <div className="todo-color-options">
            {COLORS.map((item) => (
              <label
                key={item}
                className={`todo-color-swatch-label${color === item ? " selected" : ""}`}
              >
                <input
                  type="radio"
                  name="project-color"
                  value={item}
                  checked={color === item}
                  onChange={() => setColor(item)}
                  className="todo-color-input"
                />
                <span
                  className="todo-color-swatch"
                  style={{ background: item }}
                  aria-hidden="true"
                />
                <span className="sr-only">{item}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="todo-modal-actions">
          <button
            type="button"
            className="todo-btn todo-btn-ghost"
            onClick={() => dialogRef.current?.close()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="todo-btn todo-btn-primary"
            disabled={saving || !name.trim()}
            onClick={() => {
              void onSubmit({
                name: name.trim(),
                description: description.trim(),
                color,
              }).then((created) => {
                // Only close on success - a failed create keeps the form.
                if (created) {
                  dialogRef.current?.close();
                }
              });
            }}
          >
            Create
          </button>
        </div>
      </form>
    </dialog>
  );
}
