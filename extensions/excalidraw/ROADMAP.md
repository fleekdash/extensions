# Excalidraw × FleekDash — Native posts UI roadmap

Product goal: feel like a **FleekDash-native** editor, not a bare iframe embed. Users drag **WordPress posts** onto the canvas as structured cards linked to real content.

**Infra status:** React + Vite + SDK + `sandbox_mode: none` — done. See [README.md](./README.md) and [FleekDash React guide](../fleekdash/docs/developers/react-standalone-integration-guide.md).

---

## Phase 1 — Posts palette inside the integration (MVP) ✅ shipped

**Scope:** Split layout in the Excalidraw plugin (iframe): FleekDash-themed **Posts** sidebar + canvas.

| Deliverable | Description |
|-------------|-------------|
| Posts list | Load published posts via `FleekDashSDK.getWordPressData('/wp/v2/posts', …)` |
| Drag source | HTML5 drag from sidebar (`application/fleekdash-post`) |
| Drop target | Drop on canvas → `viewportCoordsToSceneCoords` + `updateScene` |
| Canvas card | Rectangle + title text; `customData` + `link` to post URL |
| Theme | Sidebar uses FleekDash CSS variables when preloaded |

**Out of scope:** Featured image thumbnails, collaborative cursors, parent-shell UI.

---

## Phase 2 — Parent shell panel (true FleekDash chrome)

**Scope:** FleekDash `IntegrationWindowPage` (or route slot) renders the posts panel **outside** the iframe; iframe only receives drop coordinates / post payload via MessageBus.

| Deliverable | Description |
|-------------|-------------|
| `integration_id` layout slot | e.g. `excalidraw` → render `<IntegrationPostsDock />` beside iframe |
| New MessageBus types | `REQUEST_DROP_TARGET`, `INSERT_CANVAS_ELEMENTS` (or reuse `WP_DATA_REQUEST` + custom handler) |
| Shared types | Post summary DTO in `@wordpress-bridge` or `domains/integrations` |

**Why:** Panel matches FleekDash design system 1:1; survives iframe remounts; enables global search/command palette later.

---

## Phase 3 — Rich post cards & actions

| Feature | Notes |
|---------|--------|
| Featured image | `?_embed` or media endpoint; `newImageElement` in Excalidraw |
| Open in FleekDash | `FleekDashSDK.navigate('/posts/edit/:id')` on card click |
| Status badges | draft / publish / scheduled chips in palette |
| Filter / search | Palette search debounced; REST `search` param |

---

## Phase 4 — Persistence & collaboration

| Feature | Notes |
|---------|--------|
| Save scene to post meta | REST route in plugin or FleekDash |
| Load scene per post | Optional “Edit visual board for this post” |
| FleekDash Vaul | Open post editor drawer via SDK `openModal` / Vaul when documented |

---

## Technical contracts (stable)

```typescript
// Drag payload (Phase 1–2)
type FleekDashPostDragPayload = {
  id: number;
  title: string;
  link: string;
  status?: string;
};

// Excalidraw customData on card group
type FleekDashPostCustomData = {
  fleekdashType: "post";
  postId: number;
  link: string;
};
```

---

## References

- SDK: `getWordPressData`, `navigate`, `reportReady` — [SDK_REFERENCE.md](../fleekdash/docs/production/integration-system/SDK_REFERENCE.md)
- Excalidraw imperative API: `excalidrawAPI`, `updateScene`, `viewportCoordsToSceneCoords`
- Future parent UI: [integration-ui-systems-extension](../fleekdash/docs/future/integration-system/technical-reference/integration-ui-systems-extension-27-oct-2025.md) (Vaul / MessageBus)
