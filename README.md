# FleekDash Extensions

The official open source collection of installable extensions for
[FleekDash](https://fleekdash.com), the React powered workspace that replaces
the WordPress admin.

Every directory under `extensions/` is a **real, working WordPress plugin**
you can install on any site running FleekDash. No special packaging, no
hidden framework: each extension is just a plugin that happens to ship a
`fleekdash.json` manifest, and that single file is what turns it into a
FleekDash app with its own routes, settings screens and menu entries.

> Premium extensions live in the private `fleekdash/extensions-premium`
> repository. This repo is the open source collection only.

## Extensions in this repo

| Extension | What it does |
|---|---|
| [`extensions/todo-system`](extensions/todo-system/) | A full Asana style task manager inside wp-admin, and the canonical tour of every extension API capability. |
| [`extensions/excalidraw`](extensions/excalidraw/) | A complete Excalidraw drawing board living on a FleekDash app route. |

If you are exploring what extensions can do, start with **Task System**: its
second route is a live API demo where every card runs a real SDK call and
prints the host's actual response.

## What an extension actually is

An extension is a normal WordPress plugin plus one manifest:

```
my-extension/
├── fleekdash.json      manifest: id, routes, settings, requirements
├── my-extension.php    plugin bootstrap (Requires Plugins: fleekdash)
└── ...                 your code: PHP, a built React app, whatever you like
```

The manifest declares what the extension adds to FleekDash:

```jsonc
{
  "kind": "app",
  "id": "my-extension",
  "name": "My Extension",
  "version": "1.0.0",
  "plugin_file": "my-extension.php",
  "routes": [
    {
      "path": "my-extension/app",
      "title": "My App",
      "component_url": "dist/pages/app.html",
      "icon": "sparkles",
      "permissions": ["authenticated"],
      "sandbox_mode": "none"
    }
  ]
}
```

FleekDash discovers the manifest, creates the Hub card, mounts your page at
`#/app/my-extension/app` inside a sandboxed iframe, and serves your declared
settings. Your UI talks to the host through a typed postMessage SDK
(`window.FleekDashSDK`, typed via `@fleekdash/contracts`): read WordPress
data, show notifications, open modals, navigate, update menu badges and react
to theme changes. Your plugin keeps full access to WordPress hooks, custom
post types and REST endpoints on the PHP side.

## Build your own

The shortest path from zero to a running extension:

1. **Clone the starter.** [`fleekdash/extension-starter`](https://github.com/fleekdash/extension-starter)
   is this exact shape, ready to rename: manifest, plugin bootstrap, one
   iframe route, one settings field, typed SDK wired up.
2. **Iterate without WordPress.** [`fleekdash/devkit`](https://github.com/fleekdash/devkit)
   runs your built page inside a mock FleekDash host that answers the real
   SDK protocol with fixture data. No PHP, no database, instant reload.
3. **Install on a real site** when you want the genuine host: copy the plugin
   into `wp-content/plugins/`, activate, done.

What could you build? A few ideas that map naturally onto the API:

- a support inbox reading tickets from a custom post type
- a CRM panel over your customers and their order history
- an analytics dashboard pulling from your favorite service
- a notes app linked to the post being edited
- a project board synced with WooCommerce orders
- an uptime monitor card fed by a scheduled REST call

## Repository layout

```
extensions/<slug>/    one directory per extension (a WP plugin)
contracts/            vendored @fleekdash/contracts (workspace package)
schema/               vendored fleekdash.json JSON Schema
```

This repo is a **pnpm workspace** covering `contracts` and `extensions/*`.
Extension UI code imports the typed contract surface as
`"@fleekdash/contracts": "workspace:*"`, which provides manifest types,
`FleekDashSdk`, `getFleekDashSdk()` and `getBrowserWindow()`. Until the
package ships to npm, `contracts/` is a vendored, source only copy; running
`pnpm install` at the root wires it into every extension.

`dist/` output is **committed** on purpose (the WordPress.org convention):
release zips ship built iframe pages, so installs never need Node.

## Manifest validation

Every `fleekdash.json` is validated in CI against
`schema/fleekdash-manifest.schema.json` (JSON Schema draft 07), and your
editor gets autocomplete for free: `.vscode/settings.json` already
associates the schema with `**/fleekdash.json`.

The schema is generated from the `@fleekdash/contracts` package inside the
FleekDash monorepo and vendored here. Please do not hand edit it; changes
flow in when the runtime validator evolves.

## Releasing an extension

Releases are tag driven. Tag format: `ext-<slug>-v<version>`.

```bash
git tag ext-my-extension-v1.0.0
git push origin ext-my-extension-v1.0.0
```

CI then verifies the manifest exists and its `version` matches the tag,
revalidates it against the schema, zips the extension directory and attaches
`<slug>-v<version>.zip` to a GitHub Release. The catalog's `package_url`
points at that asset, so installs run through the normal WordPress
`Plugin_Upgrader` flow.

## Contributing

Adding an extension here means one PR containing `extensions/<slug>/` with
its `fleekdash.json`, a `typecheck`/`build` script and `pnpm install` run at
the root. CI validates the manifest on every pull request. Docs and comments
in English, one extension per PR.

## License

GPL-2.0-or-later. Extensions are WordPress derivatives, same as FleekDash
itself.
