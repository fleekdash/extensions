# Task System — reference FleekDash extension

A working, Asana-style task manager that doubles as the **canonical example** of
every capability the FleekDash extension API exposes. Copy it, run it, and read
the code paths — each feature is implemented the way the host expects.

## What it demonstrates

| Capability | Where |
|---|---|
| Declarative manifest (`fleekdash.json`) + imperative fallback registrar | `fleekdash.json`, `todo-system.php` |
| WordPress CPTs + meta + custom REST namespace | `includes/` (`PostTypes`, `Meta`, `RestApi`, `Rest*Controller`) |
| `sdk.init` + `deferReady` + `reportReady` | `src/App.tsx` |
| `getWordPressData` / `mutateWordPressData` (embedded via MessageBus, standalone via `X-WP-Nonce`) | `src/api/todo-api.ts` |
| `getIntegrationSettings` driving real UI (default view, badge, per-page, placeholder, debug) | `src/App.tsx`, `src/hooks/useTodoApp.ts` |
| `showNotification` on mutations/errors | `src/utils/sdk-bridge.ts`, `useTodoApp` |
| `updateMenuBadge` mirroring open-task count | `src/utils/sdk-bridge.ts` |
| `navigate` (host hash routing) | `TodoShell` "API tour" button |
| `openModal` (host drawer, same-origin WP editor) | `TaskDetail` linked-posts |
| `onMessage("THEME_CHANGED")` + theme preload | `src/App.tsx`, `pages/*.html` |
| `log` gated by the `debug_logging` setting | `src/utils/sdk-bridge.ts` |
| `sendMessage` raw primitive | `src/api-demo/ApiDemo.tsx` |

## Routes

- **`#/app/todo-system/app`** — the task manager itself (projects, board/list,
  filters, assignees, linked WP posts, due dates).
- **`#/app/todo-system/api-demo`** — live SDK tour: every card runs the real
  call and prints the host's actual response, so you can see what works (and
  how errors surface) in both embedded and standalone mode.

## Standalone vs embedded

Embedded (inside FleekDash) all traffic goes through the postMessage
MessageBus, authenticated by the host. Opened top-level
(`dist/pages/app.html` directly, e.g. in the devkit canvas) the SDK falls back
to direct `fetch` with cookies + `X-WP-Nonce` — FleekDash injects a valid
`wp_rest` nonce as `_fleekdash_rest_nonce` on the iframe URL; outside FleekDash
the request 403s unless you pass one (try the demo cards standalone to see the
honest failure).

## Build

```bash
pnpm install        # workspace root
pnpm --filter fleekdash-todo-system build
```

`dist/` is committed on purpose — release CI packages the built directory.
`composer build` runs the same steps plus a dist-existence check.

## Local dev

Symlink/junction `extensions/todo-system` into `wp-content/plugins/todo-system`
and activate "Task System". With FleekDash ≥ 2.6.7 the declarative registrar
owns registry sync (`fleekdash.json` is the single writer); on older hosts the
PHP fallback in `todo-system.php` registers an identical manifest shape.
