# fleekdash/extensions

Open-source installable extensions for [FleekDash](https://fleekdash.com).
One directory per extension under `extensions/<slug>/` — each is a
WordPress plugin discovered by the FleekDash Hub through its
`fleekdash.json` manifest.

> Premium/paid extensions live in the private `fleekdash/extensions-premium`
> repository — this repo is the OSS collection only.

## Layout

```
extensions/<slug>/
├── fleekdash.json      ← required — kind/id/name + optional settings/sections/requires
├── <slug>.php          ← plugin bootstrap (Requires Plugins: fleekdash)
└── ...                 ← extension code (PHP, built assets committed or built by CI)
schema/                 ← vendored fleekdash.json JSON Schema (see note below)
```

## Manifests

Every extension ships a `fleekdash.json` at its root and it is validated
in CI against `schema/fleekdash-manifest.schema.json` (draft-07).

- **Source of truth:** the schema is generated from the FleekDash
  monorepo's `@fleekdash/contracts` package
  (`packages/extension-contracts/schema/`). When the runtime validator
  changes, the monorepo updates the package **and** syncs this vendored
  copy — do not hand-edit it here.
- **Editor autocomplete:** `.vscode/settings.json` already associates the
  schema with `**/fleekdash.json`.
- Minimal valid manifest:

```jsonc
{
  "kind": "integration",
  "id": "my-extension",
  "name": "My Extension",
  "version": "1.0.0",
  "plugin_file": "my-extension.php"
}
```

## Releasing an extension

Releases are tag-driven. Tag format: `ext-<slug>-v<version>`.

```bash
git tag ext-my-extension-v1.0.0
git push origin ext-my-extension-v1.0.0
```

CI then:

1. Verifies `extensions/<slug>/fleekdash.json` exists and its `version`
   matches the tag.
2. Re-validates the manifest against the schema.
3. Zips the extension directory and attaches it to a GitHub Release
   (`<slug>-v<version>.zip`).

The catalog's `package_url` points at the release asset — installs run
through WordPress `Plugin_Upgrader`, and update metadata comes from the
FleekDash update endpoint.

## Writing an extension

Authoring guide, manifest field reference, SDK surface and migration
playbook live in the FleekDash monorepo docs
(`docs/future/integration-system/`). Until the public developer portal
ships, start from `fleekdash/extension-starter` when it is published.

## License

GPL-2.0-or-later — extensions are WordPress derivatives.
