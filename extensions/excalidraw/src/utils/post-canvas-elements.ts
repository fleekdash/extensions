import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { FleekDashPostDragPayload } from "../types/post-palette";

export const POST_CARD_WIDTH = 220;
export const POST_CARD_HEIGHT = 72;

export function createPostCardElements(
  post: FleekDashPostDragPayload,
  sceneX: number,
  sceneY: number,
): readonly ExcalidrawElement[] {
  return convertToExcalidrawElements(
    [
      {
        type: "rectangle",
        x: sceneX,
        y: sceneY,
        width: POST_CARD_WIDTH,
        height: POST_CARD_HEIGHT,
        backgroundColor: "#eef2ff",
        strokeColor: "#6366f1",
        strokeWidth: 1,
        roundness: { type: 3 },
        link: post.link,
        customData: {
          fleekdashType: "post",
          postId: post.id,
          link: post.link,
          openInNewTab: true,
        },
        label: {
          text: post.title,
          fontSize: 14,
        },
      },
    ],
    { regenerateIds: true },
  );
}
