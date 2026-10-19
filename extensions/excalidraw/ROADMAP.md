# Excalidraw × FleekDash: native posts UI roadmap

Product goal: feel like a **FleekDash native** editor, not a bare iframe
embed. Users drag **WordPress posts** onto the canvas as structured cards
linked to real content.

**Infra status:** React + Vite + SDK + `sandbox_mode: none`, shipped. See
[README.md](./README.md).

---

## Phase 1: Posts palette inside the integration (MVP) ✅ shipped

**Scope:** split layout inside the extension iframe: a FleekDash themed
**Posts** sidebar plus the canvas.

| Deliverable | Description |
|-------------|-------------|
| Posts list | Load published posts via `FleekDashSDK.getWordPressData('/wp/v2/posts', ...)` |
| Drag source | HTML5 drag from the sidebar (`application/fleekdash-post`) |
| Drop target | Drop on canvas → `viewportCoordsToSceneCoords` + `updateScene` |
| Canvas card | Rectangle + title text; `customData` + `link` to the post URL |
| Theme | Sidebar uses the preloaded FleekDash CSS variables |

**Out of scope:** featured image thumbnails, collaborative cursors, parent
shell UI.

---

## Phase 2: Parent shell panel (true FleekDash chrome)

**Scope:** a FleekDash host side panel renders the posts list **outside** the
iframe; the iframe only receives drop coordinates / post payloads over the
MessageBus.

| Deliverable | Description |
|-------------|-------------|
| `integration_id` layout slot | e.g. `excalidraw` → render a posts dock beside the iframe |
| New MessageBus types | `REQUEST_DROP_TARGET`, `INSERT_CANVAS_ELEMENTS` (or reuse `WP_DATA_REQUEST` + a custom handler) |
| Shared types | Post summary DTO shared between host and extension |

**Why:** a host side panel matches the FleekDash design system 1:1, survives
iframe remounts, and unlocks global search / command palette later.

---

## Phase 3: Rich post cards and actions

| Feature | Notes |
|---------|--------|
| Featured image | `?_embed` or the media endpoint; `newImageElement` in Excalidraw |
| Open in FleekDash | `FleekDashSDK.navigate('/posts/edit/:id')` on card click |
| Status badges | draft / publish / scheduled chips in the palette |
| Filter / search | debounced palette search; REST `search` param |

---

## Phase 4: Persistence and collaboration

| Feature | Notes |
|---------|--------|
| Save scene to post meta | REST route in the plugin or FleekDash |
| Load scene per post | optional "edit visual board for this post" |
| FleekDash drawer | open the post editor drawer via the SDK modal surface when documented |

---

## Technical contracts (stable)

```typescript
// Drag payload (Phase 1-2)
type FleekDashPostDragPayload = {
  id: number;
  title: string;
  link: string;
  status?: string;
};

// Excalidraw customData on the card group
type FleekDashPostCustomData = {
  fleekdashType: "post";
  postId: number;
  link: string;
};
```

---

## References

- Live examples of `getWordPressData`, `navigate` and `reportReady`: the
  [Task System API demo](../todo-system/) extension
- The smallest working version of this pattern:
  [fleekdash/extension-starter](https://github.com/fleekdash/extension-starter)
- Excalidraw imperative API: `excalidrawAPI`, `updateScene`,
  `viewportCoordsToSceneCoords`
