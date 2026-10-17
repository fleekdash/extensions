/**
 * Route + Registry manifest types.
 *
 * `fleekdash.json` accepts `routes` on kind: app manifests; the runtime
 * sync maps them into the same `Registry::register()` array shape
 * (`RegistryManifest` below). During migration a plugin may keep calling
 * `Registry::register()` itself; the JSON `routes` must then be identical
 * to the imperative array (parity contract; the sync produces the same
 * manifest hash). Mirrors `ManifestRouteValidator` + `ManifestValidator`.
 */

import type {
  ExtensionKind,
  FleekDashManifest,
  ManifestIcon,
} from "./manifest";
import type { SettingsSchema } from "./settings";

/** iframe sandbox preset — mirrors ALLOWED_SANDBOX_MODES. */
export type SandboxMode = "strict" | "moderate" | "none";

export interface IntegrationRoute {
  /** Required — inner path under `#/app/<id>`; sanitized to [a-z0-9\-/]. */
  path: string;
  /** Required — menu/route label. */
  title: string;
  /**
   * Required iframe UI. In `fleekdash.json` a manifest-relative path
   * ("dist/pages/editor.html") resolves against the manifest directory;
   * a leading "/" is site-relative and http(s) URLs pass through.
   * `fleekdash_sdk_url` is appended automatically at sync time; callers
   * of `Registry::register()` must pass an already-absolute URL with the
   * param appended themselves for parity.
   */
  component_url: string;
  icon?: ManifestIcon;
  /** wp capabilities/roles required to see the route. */
  permissions?: string[];
  sandbox_mode?: SandboxMode;
}

/**
 * Imperative manifest passed to `Registry::register()`: the shape the
 * app-manifest sync produces from `fleekdash.json`. `settings_schema` is
 * the legacy key for what the JSON calls `settings`, same schema
 * validator. Keep the imperative call byte-identical to the JSON while
 * both writers run (see `FleekDashManifest.routes`).
 */
export interface RegistryManifest {
  integration_id: string;
  name: string;
  description?: string;
  version: string;
  integration_type:
    | "native"
    | "standalone"
    | "hybrid"
    | "internal"
    | "mu-plugin"
    | "premium-catalog";
  plugin_file: string;
  author?: string;
  icon?: ManifestIcon;
  category?: string;
  routes?: IntegrationRoute[];
  /** Same shape as `settings` in fleekdash.json (legacy key). */
  settings_schema?: SettingsSchema;
  settings_page_url?: string;
  requires?: FleekDashManifest["requires"];
  /**
   * Extension kind ("app" for route-bearing manifests). Persisted in the
   * stored manifest, required for hash parity with the JSON writer
   * during migration.
   */
  kind?: ExtensionKind;
  /** Catalog/Hub tags: forward from fleekdash.json during migration. */
  tags?: string[];
}
