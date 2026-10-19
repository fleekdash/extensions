import { useState } from "react";

type QuickAddProps = {
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly onAdd: (title: string) => Promise<boolean>;
};

export function QuickAdd({ disabled, placeholder, onAdd }: QuickAddProps) {
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async () => {
    const value = title.trim();
    if (!value || pending) return;
    setPending(true);
    try {
      // Keep the typed title on failure so the user can retry.
      if (await onAdd(value)) {
        setTitle("");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="todo-quick-add">
      <input
        className="todo-input"
        placeholder={placeholder ?? "Add a task…"}
        value={title}
        disabled={disabled || pending}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void submit();
          }
        }}
      />
      <button
        type="button"
        className="todo-btn todo-btn-primary todo-btn-sm"
        disabled={disabled || pending || !title.trim()}
        onClick={() => void submit()}
      >
        Add
      </button>
    </div>
  );
}
