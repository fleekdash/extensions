export type WpPostTitle = {
  readonly rendered: string;
};

export type WpPostSummary = {
  readonly id: number;
  readonly title: WpPostTitle;
  readonly link: string;
  readonly status?: string;
};

export type FleekDashPostDragPayload = {
  readonly id: number;
  readonly title: string;
  readonly link: string;
  readonly status?: string;
};

export const FLEEKDASH_POST_DRAG_MIME = "application/fleekdash-post";

export type FleekDashPostCustomData = {
  readonly fleekdashType: "post";
  readonly postId: number;
  readonly link: string;
  readonly openInNewTab?: boolean;
};
