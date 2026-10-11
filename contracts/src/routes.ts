/**
 * Route + Registry manifest types — transitional surface.
 *
 * `fleekdash.json` does not yet accept `routes`; kind:app registers them
 * through `FleekDash\Integration\Registry::register()` (PHP), whose array
 * shape is `RegistryManifest` below. Mirrors `ManifestRouteValidator` +
 * `ManifestValidator`.
 */

import type { FleekDashManifest, ManifestIcon } from "./manifest";
import type { SettingsSchema } from "./settings";

/** iframe sandbox preset — mirrors ALLOWED_SANDBOX_MODES. */
export type SandboxMode = "strict" | "moderate" | "none";

export interface IntegrationRoute {
  /** Required — inner path under `#/app/<id>`; sanitized to [a-z0-9\-/]. */
  path: string;
  /** Required — menu/route label. */
  title: string;
  /**
   * Required — the iframe UI. Leading "/" = relative to wp-content;
   * otherwise a valid http(s) URL.
   */
  component_url: string;
  icon?: ManifestIcon;
  /** wp capabilities/roles required to see the route. */
  permissions?: string[];
  sandbox_mode?: SandboxMode;
}

/**
 * Transitional manifest passed to `Registry::register()` for kind:app
 * until `routes` land in fleekdash.json. `settings_schema` is the legacy
 * key for what the JSON calls `settings` — same schema validator.
 */
export interface RegistryManifest {
  integration_id: string;
  name: string;
  description?: string;
  version: string;
  integration_type: "native" | "standalone" | "hybrid" | "internal" | "mu-plugin" | "premium-catalog";
  plugin_file: string;
  author?: string;
  icon?: ManifestIcon;
  category?: string;
  routes?: IntegrationRoute[];
  /** Same shape as `settings` in fleekdash.json (legacy key). */
  settings_schema?: SettingsSchema;
  settings_page_url?: string;
  requires?: FleekDashManifest["requires"];
}
