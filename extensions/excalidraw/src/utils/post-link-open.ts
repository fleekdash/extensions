import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { FleekDashPostCustomData } from "../types/post-palette";

export function resolvePostLinkFromElement(element: ExcalidrawElement): string | null {
  if (typeof element.link === "string" && element.link.length > 0) {
    return element.link;
  }

  const custom = element.customData as FleekDashPostCustomData | undefined;
  if (custom?.fleekdashType === "post" && typeof custom.link === "string" && custom.link.length > 0) {
    return custom.link;
  }

  return null;
}

export function openPostLinkInNewTab(url: string): void {
  globalThis.open(url, "_blank", "noopener,noreferrer");
}
