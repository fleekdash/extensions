# Excalidraw for FleekDash

Standalone WordPress plugin that registers an Excalidraw editor inside FleekDash (`#/app/excalidraw/editor`).

**Requires:** [FleekDash](https://github.com/fleekdash/fleekdash) active on the same site.

---

## Build (production assets)

Frontend is bundled with **Vite** into `dist/` (offline — no esm.sh or CDN imports). WordPress loads **`dist/pages/editor.html`** in the FleekDash iframe — that folder must exist on the server.

### Release policy (recommended)

**Commit `dist/` in this repository** after every frontend change.

Installers and production servers do **not** need Node or pnpm — only the built files. This is the default workflow for this plugin.

```
Edit src/ or pages/editor.html
    → run build (below)
    → commit dist/ together with source changes
    → zip / deploy / push
```

`.gitignore` ignores `node_modules/` only — **`dist/` is meant to be tracked**.

### How to build (on your machine)

Requires [pnpm](https://pnpm.io/) on `PATH`.

**Composer (recommended):**

```bash
composer run build
```

Runs `pnpm install --frozen-lockfile`, `pnpm run build`, and verifies `dist/pages/editor.html` exists.

**Or pnpm directly:**

```bash
pnpm install
pnpm run build
```

### CI (`.github/workflows/build.yml`)

GitHub Actions runs `composer run build` on push/PR to **confirm the project still builds**. It does **not** replace committing `dist/` — use CI as a safety check, then commit updated `dist/` locally when you change the frontend.

---

## Opening `editor.html` directly (debug)

Posts load through the FleekDash **MessageBus** (parent proxies WordPress with `apiClient`). The iframe `data-nonce` is **not** a `wp_rest` nonce — do not call `/wp-json/wp/v2/posts` directly from the plugin.

Use FleekDash: `#/app/excalidraw/editor`.

---

## Development

```bash
pnpm install
pnpm run dev   # vite build --watch
```

After changing `src/` or `pages/editor.html`, run `composer run build` (or `pnpm run build`) and **commit `dist/`** before you test in FleekDash on another machine or ship a release.

---

## Documentation

This plugin is the **reference implementation** for React + Vite FleekDash integrations.

| Topic | Location |
|--------|----------|
| Full React standalone guide | [fleekdash/docs/developers/react-standalone-integration-guide.md](../fleekdash/docs/developers/react-standalone-integration-guide.md) |
| Integration developer guide | [fleekdash/docs/future/integration-system/DEVELOPER_GUIDE.md](../fleekdash/docs/future/integration-system/DEVELOPER_GUIDE.md) |
| SDK (`init`, `reportReady`, themes) | [fleekdash/docs/production/integration-system/SDK_REFERENCE.md](../fleekdash/docs/production/integration-system/SDK_REFERENCE.md) |

---

## Structure

```
excalidraw.php          # Registry registration (dist/pages/editor.html)
pages/editor.html       # Vite HTML entry
src/main.tsx            # React + FleekDash SDK
dist/                   # Production iframe target (built)
```

**Registry:** `sandbox_mode` => `none` (same-origin first-party plugin).

---

## Product roadmap

**Posts palette (drag onto canvas):** Phase 1 MVP — sidebar in this plugin. See [ROADMAP.md](./ROADMAP.md).
