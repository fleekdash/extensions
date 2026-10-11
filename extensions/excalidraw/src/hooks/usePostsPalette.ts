import { useEffect, useState } from "react";
import type { WpPostSummary } from "../types/post-palette";
import { fetchPublishedPosts } from "../utils/wordpress-posts";

type PostsPaletteState = {
  readonly posts: readonly WpPostSummary[];
  readonly loading: boolean;
  readonly error: string | null;
};

type UsePostsPaletteOptions = {
  /** Wait until FleekDash SDK.init() has run (MessageBus listener). */
  readonly enabled: boolean;
};

export function usePostsPalette({
  enabled,
}: UsePostsPaletteOptions): PostsPaletteState {
  const [posts, setPosts] = useState<readonly WpPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPublishedPosts()
      .then((items) => {
        if (!cancelled) {
          setPosts(items);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load posts");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { posts, loading, error };
}
