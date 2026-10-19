# Excalidraw for FleekDash

A standalone WordPress plugin that mounts a complete Excalidraw drawing board
inside FleekDash at `#/app/excalidraw/editor`.

**Requires:** [FleekDash](https://github.com/fleekdash/fleekdash) active on
the same site.

This plugin doubles as a reference implementation: it shows how a real React
plus Vite app registers itself as a FleekDash app route, loads the SDK,
follows the host theme and pulls WordPress posts into its UI.

---

## Build (production assets)

The frontend is bundled with **Vite** into `dist/`, fully offline with no
esm.sh or CDN imports. WordPress loads **`dist/pages/editor.html`** in the
FleekDash iframe, so that folder must exist on the server.

### Release policy (recommended)

**Commit `dist/` after every frontend change.**

Installers and production servers never need Node or pnpm, only the built
files. This is the default workflow for this plugin:

```
Edit src/ or pages/editor.html
    → run the build (below)
    → commit dist/ together with the source changes
    → zip / deploy / push
```

`.gitignore` ignores `node_modules/` only. `dist/` is meant to be tracked.

### How to build

Requires [pnpm](https://pnpm.io/) on `PATH`.

**Composer (recommended):**

```bash
composer run build
```

Runs `pnpm install --frozen-lockfile`, `pnpm run build`, and verifies
`dist/pages/editor.html` exists.

**Or pnpm directly:**

```bash
pnpm install
pnpm run build
```

### CI (`.github/workflows/build.yml`)

GitHub Actions runs `composer run build` on push and PRs as a safety check
that the project still builds. It does not replace committing `dist/`: when
you change the frontend, rebuild and commit the output locally.

---

## A note on data flow

Posts load through the FleekDash **MessageBus**: the host proxies WordPress
with its own authenticated `apiClient`. The iframe `data-nonce` is not a
`wp_rest` nonce, so do not call `/wp-json/wp/v2/posts` directly from the
plugin. Go through `FleekDashSDK.getWordPressData()` instead and the host
handles auth, caching and errors for you.

Opening `dist/pages/editor.html` directly is a debug path only. For the real
experience use FleekDash: `#/app/excalidraw/editor`.

---

## Development

```bash
pnpm install
pnpm run dev   # vite build --watch
```

After changing `src/` or `pages/editor.html`, run `composer run build` (or
`pnpm run build`) and commit `dist/` before testing on another machine or
shipping a release.

Want to iterate without WordPress at all? The [`fleekdash/devkit`](https://github.com/fleekdash/devkit)
canvas serves this extension inside a mock FleekDash host and logs every SDK
call live.

---

## Learn from this extension

This repo is meant to be read, not just installed:

| Topic | Where |
|---|---|
| The manifest that registers the app route | [`fleekdash.json`](./fleekdash.json) |
| Plugin bootstrap + dormant Registry fallback | `excalidraw.php` |
| SDK init, theme preloading, posts palette | `src/` |
| Minimal copyable scaffold | [fleekdash/extension-starter](https://github.com/fleekdash/extension-starter) |
| Every SDK capability in one tour | [`../todo-system`](../todo-system/) (the API demo route) |

---

## Structure

```
excalidraw.php          plugin bootstrap + registry fallback
fleekdash.json          app manifest (route, icon, requirements)
pages/editor.html       Vite HTML entry
src/main.tsx            React + FleekDash SDK
dist/                   built iframe target (committed)
```

**Sandbox:** `sandbox_mode: "none"`, appropriate for a same origin first
party plugin.

---

## Product roadmap

The posts palette (drag WordPress posts onto the canvas as linked cards) is
shipped. Next phases live in [ROADMAP.md](./ROADMAP.md).
