export function stripHtml(html: string): string {
  if (!html) {
    return "";
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").trim();
}

export function toDragPayload(post: {
  id: number;
  title: { rendered: string };
  link: string;
  status?: string;
}): { id: number; title: string; link: string; status?: string } {
  return {
    id: post.id,
    title: stripHtml(post.title.rendered),
    link: post.link,
    status: post.status,
  };
}
