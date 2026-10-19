# Task System: the reference FleekDash extension

A working, Asana style task manager that doubles as the **canonical example**
of every capability the FleekDash extension API exposes. Install it for the
productivity win, then read the code paths: each feature is implemented the
way the host expects.

## What it demonstrates

| Capability | Where |
|---|---|
| Declarative manifest (`fleekdash.json`) + imperative fallback registrar | `fleekdash.json`, `todo-system.php` |
| WordPress CPTs + meta + custom REST namespace | `includes/` (`PostTypes`, `Meta`, `RestApi`, `Rest*Controller`) |
| `sdk.init` + `deferReady` + `reportReady` | `src/App.tsx` |
| `getWordPressData` / `mutateWordPressData` (embedded via MessageBus, standalone via `X-WP-Nonce`) | `src/api/todo-api.ts` |
| `getIntegrationSettings` driving real UI (default view, badge, per page, placeholder, debug) | `src/App.tsx`, `src/hooks/useTodoApp.ts` |
| `showNotification` on mutations and errors | `src/utils/sdk-bridge.ts`, `useTodoApp` |
| `updateMenuBadge` mirroring the open task count | `src/utils/sdk-bridge.ts` (forward compatible: hosts without badge support reply `updated:false`, logged once) |
| `navigate` (host hash routing) | `TodoShell` "API tour" button |
| `openModal` (host drawer, same origin WP editor) | `TaskDetail` linked posts |
| `onMessage("THEME_CHANGED")` + theme preload | `src/App.tsx`, `pages/*.html` |
| `log` gated by the `debug_logging` setting | `src/utils/sdk-bridge.ts` |
| `sendMessage` raw primitive | `src/api-demo/ApiDemo.tsx` |

## Routes

- **`#/app/todo-system/app`**: the task manager itself. Projects, board and
  list views, filters, assignees, linked WordPress posts, due dates.
- **`#/app/todo-system/api-demo`**: a live SDK tour. Every card runs the real
  call and prints the host's actual response, so you can see what works and
  how errors surface in both embedded and standalone mode.

## Embedded vs standalone

Embedded inside FleekDash, all traffic flows through the postMessage
MessageBus, authenticated by the host. Opened top level
(`dist/pages/app.html` directly, for example in the devkit canvas), the SDK
falls back to direct `fetch` with cookies plus `X-WP-Nonce`: FleekDash
injects a valid `wp_rest` nonce as `_fleekdash_rest_nonce` on the iframe URL,
and outside FleekDash the request 403s unless you provide one. The API demo
cards are a great way to watch that honest failure happen.

## Build

```bash
pnpm install        # at the workspace root
pnpm --filter fleekdash-todo-system build
```

`dist/` is committed on purpose so release CI can package the built
directory. `composer build` runs the same steps plus a dist existence check.

## Local dev

Symlink or junction `extensions/todo-system` into
`wp-content/plugins/todo-system` and activate "Task System". With FleekDash
>= 2.6.7 the declarative registrar owns registry sync (`fleekdash.json` is
the single writer); on older hosts the PHP fallback in `todo-system.php`
registers an identical manifest shape.

## Digging deeper

- [`fleekdash/extension-starter`](https://github.com/fleekdash/extension-starter)
  strips everything down to the smallest working extension
- [`fleekdash/devkit`](https://github.com/fleekdash/devkit) runs this
  extension in a mock host with fixture data and a live SDK call log
