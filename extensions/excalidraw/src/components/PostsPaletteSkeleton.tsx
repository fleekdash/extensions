import "./PostsPalette.css";

const SKELETON_ROW_COUNT = 6;

export function PostsPaletteSkeleton() {
  return (
    <ul className="posts-palette__list posts-palette__list--skeleton" aria-hidden="true">
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
        <li key={`posts-skeleton-${index}`}>
          <div className="posts-palette__skeleton-item">
            <div className="posts-palette__skeleton-line posts-palette__skeleton-line--title" />
            <div className="posts-palette__skeleton-line posts-palette__skeleton-line--badge" />
          </div>
        </li>
      ))}
    </ul>
  );
}
