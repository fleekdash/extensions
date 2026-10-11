import type { WpPostSummary } from "../types/post-palette";
import { getFleekDashSdk } from "@fleekdash/contracts";

const POSTS_QUERY = {
  per_page: "20",
  status: "publish",
  orderby: "date",
  order: "desc",
  _fields: "id,title,link,status",
} as const;

async function fetchPostsViaSdk(): Promise<readonly WpPostSummary[]> {
  const sdk = getFleekDashSdk();
  if (!sdk) {
    throw new Error("FleekDash SDK is not available");
  }

  const data = await sdk.getWordPressData("/wp/v2/posts", { ...POSTS_QUERY });
  return Array.isArray(data) ? (data as WpPostSummary[]) : [];
}

/**
 * Load published posts.
 * - Inside FleekDash iframe: MessageBus only (iframe nonce is NOT wp_rest).
 * - Standalone tab: SDK standalone REST (requires valid nonce in URL).
 */
export async function fetchPublishedPosts(): Promise<readonly WpPostSummary[]> {
  return fetchPostsViaSdk();
}
