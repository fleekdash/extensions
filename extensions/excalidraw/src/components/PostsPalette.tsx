import type { DragEvent } from "react";
import type { WpPostSummary } from "../types/post-palette";
import { FLEEKDASH_POST_DRAG_MIME } from "../types/post-palette";
import { toDragPayload } from "../utils/post-text";
import { PostsPaletteSkeleton } from "./PostsPaletteSkeleton";
import "./PostsPalette.css";

export type PostsPaletteProps = {
  readonly posts: readonly WpPostSummary[];
  readonly loading: boolean;
  readonly error: string | null;
};

function handleDragStart(event: DragEvent<HTMLButtonElement>, post: WpPostSummary): void {
  const payload = toDragPayload(post);
  event.dataTransfer.setData(FLEEKDASH_POST_DRAG_MIME, JSON.stringify(payload));
  event.dataTransfer.effectAllowed = "copy";
}

export function PostsPalette({ posts, loading, error }: PostsPaletteProps) {
  return (
    <aside className="posts-palette" aria-label="WordPress posts">
      <header className="posts-palette__header">
        <h2 className="posts-palette__title">Posts</h2>
        <p className="posts-palette__hint">Drag onto the canvas</p>
      </header>

      <div className="posts-palette__body">
        {loading && <PostsPaletteSkeleton />}
        {error && <p className="posts-palette__status posts-palette__status--error">{error}</p>}
        {!loading && !error && posts.length === 0 && (
          <p className="posts-palette__status">No published posts found.</p>
        )}
        {!loading && !error && (
        <ul className="posts-palette__list">
          {posts.map((post) => (
            <li key={post.id}>
              <button
                type="button"
                className="posts-palette__item"
                draggable
                onDragStart={(e) => handleDragStart(e, post)}
                title={post.link}>
                <span className="posts-palette__item-title">
                  {toDragPayload(post).title || `Post #${post.id}`}
                </span>
                {post.status && (
                  <span className="posts-palette__item-badge">{post.status}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
        )}
      </div>
    </aside>
  );
}
