import { useCallback, useRef, useState } from "react";
import type { DragEvent } from "react";
import { Excalidraw, viewportCoordsToSceneCoords } from "@excalidraw/excalidraw";
import type { NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";
import { PostsPalette } from "./PostsPalette";
import { usePostsPalette } from "../hooks/usePostsPalette";
import {
  FLEEKDASH_POST_DRAG_MIME,
  type FleekDashPostDragPayload,
} from "../types/post-palette";
import {
  createPostCardElements,
  POST_CARD_HEIGHT,
  POST_CARD_WIDTH,
} from "../utils/post-canvas-elements";
import { openPostLinkInNewTab, resolvePostLinkFromElement } from "../utils/post-link-open";
import { getExcalidrawLibraryReturnUrl } from "../utils/library-return-url";
import "./ExcalidrawWorkspace.css";

export type ExcalidrawWorkspaceProps = {
  readonly theme: "light" | "dark";
  readonly postsFetchEnabled: boolean;
};

function parseDragPayload(raw: string): FleekDashPostDragPayload | null {
  try {
    const parsed = JSON.parse(raw) as FleekDashPostDragPayload;
    if (
      typeof parsed.id === "number" &&
      typeof parsed.title === "string" &&
      typeof parsed.link === "string"
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function ExcalidrawWorkspace({
  theme,
  postsFetchEnabled,
}: ExcalidrawWorkspaceProps) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const canvasHostRef = useRef<HTMLElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const { posts, loading, error } = usePostsPalette({ enabled: postsFetchEnabled });

  const handleDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    if (!event.dataTransfer.types.includes(FLEEKDASH_POST_DRAG_MIME)) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const api = apiRef.current;
    if (!api) {
      return;
    }

    const raw = event.dataTransfer.getData(FLEEKDASH_POST_DRAG_MIME);
    const post = parseDragPayload(raw);
    if (!post) {
      return;
    }

    const appState = api.getAppState();
    const { x, y } = viewportCoordsToSceneCoords(
      { clientX: event.clientX, clientY: event.clientY },
      {
        zoom: appState.zoom,
        offsetLeft: appState.offsetLeft,
        offsetTop: appState.offsetTop,
        scrollX: appState.scrollX,
        scrollY: appState.scrollY,
      },
    );

    const newElements = createPostCardElements(
      post,
      x - POST_CARD_WIDTH / 2,
      y - POST_CARD_HEIGHT / 2,
    );
    const existing = api.getSceneElements();
    api.updateScene({
      elements: [...existing, ...newElements],
    });
  }, []);

  const handleLinkOpen = useCallback((element: NonDeletedExcalidrawElement) => {
    const url = resolvePostLinkFromElement(element);
    if (url) {
      openPostLinkInNewTab(url);
    }
  }, []);

  return (
    <div className="excalidraw-workspace">
      <PostsPalette posts={posts} loading={loading} error={error} />
      <section
        ref={canvasHostRef}
        className={`excalidraw-workspace__canvas${isDragOver ? " excalidraw-workspace__canvas--drag-over" : ""}`}
        aria-label="Excalidraw canvas. Drag posts from the sidebar and drop here."
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}>
        <Excalidraw
          theme={theme}
          libraryReturnUrl={getExcalidrawLibraryReturnUrl()}
          onLinkOpen={handleLinkOpen}
          excalidrawAPI={(api) => {
            apiRef.current = api;
          }}
        />
      </section>
    </div>
  );
}
