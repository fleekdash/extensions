import type { TodoUser } from "../../types/todo";
import { getInitials } from "../../utils/todo-helpers";

type AvatarStackProps = {
  readonly userIds: readonly number[];
  readonly usersById: ReadonlyMap<number, TodoUser>;
  readonly max?: number;
};

export function AvatarStack({
  userIds,
  usersById,
  max = 3,
}: AvatarStackProps) {
  if (userIds.length === 0) return null;

  const visible = userIds.slice(0, max);
  const remaining = userIds.length - visible.length;

  return (
    <div className="todo-avatars" title={`${userIds.length} assignee(s)`}>
      {visible.map((id) => {
        const user = usersById.get(id);
        return (
          <span key={id} className="todo-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              getInitials(user?.name ?? "?")
            )}
          </span>
        );
      })}
      {remaining > 0 ? <span className="todo-avatar">+{remaining}</span> : null}
    </div>
  );
}
