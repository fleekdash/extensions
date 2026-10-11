/**
 * `fleekdash.json` manifest — mirrors `ExtensionManifest::validate()`
 * (includes/Extension/ExtensionManifest.php). Keep in sync: the validator
 * is the runtime source of truth, this type is the author-facing contract.
 */

export type ExtensionKind =
  | "compat"
  | "integration"
  | "app"
  | "snippet"
  | "connector";

/**
 * Icons allowed in `manifest.icon` / route `icon` — allowlist mirrors
 * `ManifestValidationConstants::ALLOWED_ICONS` (Lucide names via icons-map).
 */
export type ManifestIconName =
  | "sparkles"
  | "message-square"
  | "settings"
  | "dashboard"
  | "users"
  | "file"
  | "folder"
  | "mail"
  | "bell"
  | "heart"
  | "star"
  | "search"
  | "plus"
  | "edit"
  | "trash"
  | "check"
  | "x"
  | "menu"
  | "more-vertical"
  | "briefcase"
  | "shopping-cart"
  | "credit-card"
  | "dollar-sign"
  | "trending-up"
  | "trending-down"
  | "activity"
  | "bar-chart"
  | "phone"
  | "video"
  | "mic"
  | "send"
  | "inbox"
  | "archive"
  | "tool"
  | "wrench"
  | "code"
  | "terminal"
  | "database"
  | "server"
  | "cloud"
  | "download"
  | "upload"
  | "link"
  | "external-link"
  | "box"
  | "package"
  | "layers";

export type ManifestIcon =
  | ManifestIconName
  | `http://${string}`
  | `https://${string}`;

/**
 * Version requirements checked at discovery time. `wp`/`fleekdash`/`php`
 * accept plain version strings only ("6.5", "2.7.0-beta.1") — the validator
 * rejects range syntax (`>=`, `^`). `plugins`/`themes` list
 * required plugin files or theme slugs.
 */
export interface ManifestRequires {
  wp?: string;
  fleekdash?: string;
  php?: string;
  plugins?: string[];
  themes?: string[];
}

import type { SettingsSchema } from "./settings";

export interface FleekDashManifest {
  /** Required — one of the five extension kinds. */
  kind: ExtensionKind;
  /** Required — lowercase slug; the stable identity (merger + Hub + storage). */
  id: string;
  /** Required — display name. */
  name: string;

  description?: string;
  /** Semver (e.g. 1.0.0); runtime defaults this when absent. */
  version?: string;
  author?: string;
  author_uri?: string;
  icon?: ManifestIcon;
  /** Hub grouping; defaults to "plugin". */
  category?: string;
  /** Ordering weight in Hub listings; default 100. */
  priority?: number;

  /**
   * Main plugin file relative to the extension directory.
   * REQUIRED for kind `compat` and `integration` — `app`/`snippet` derive
   * their location from the scanned directory.
   */
  plugin_file?: string;
  /** Theme slug this compat entry targets (kind: compat). */
  theme?: string;
  /** Relative wp-admin PHP page reference (e.g. admin.php?page=my-extension). */
  settings_page_url?: string;
  requires?: ManifestRequires;

  /**
   * Snippet entry point — relative .php path inside the package
   * (^[a-zA-Z0-9_\-\.\/]+\.php$, no traversal). Used by the snippet loader.
   */
  entry?: string;

  /**
   * Settings fields owned by this extension — flat map key → field schema.
   * Injected into the Hub/extension settings surfaces.
   */
  settings?: SettingsSchema;
  /**
   * Fields injected INTO FleekDash core sections:
   * map of target section slug → field schema (e.g. "performance").
   */
  sections?: Record<string, SettingsSchema>;

  /** Licensing gate (Cloud feature key, e.g. "extension:my-app"). */
  feature_key?: string;
  license_required?: boolean;
  required_tier?: string;
  /** wp roles allowed to see/use the extension (empty = all). */
  allowed_roles?: string[];
  tags?: string[];
  preview_link?: string;
  roadmap_link?: string;
  /** e.g. "upcoming" — catalog cards that are not installable yet. */
  mode?: string;

  /**
   * kind: integration → references a WP 7.0 native connector id;
   * resolved to `connector_status` in the Hub.
   */
  connector_id?: string;
}
