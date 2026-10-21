/**
 * Native extension pages + data sources (`pages` / `data_sources` in
 * fleekdash.json, kind: app only). Mirrors
 * ExtensionManifestPageValidator + ExtensionManifestDataSourceValidator
 * (includes/Extension/) — the PHP validators are the runtime source of
 * truth, these types are the author-facing contract.
 *
 * v1 scope: pages are schema-v3 blocks snapshots rendered by the
 * dashboard core under `/app/<ext-id>/<page-id>`; data sources are
 * extension-owned REST GET endpoints bound to widgets via the ext-rest
 * adapter. Iframe routes stay on `routes[]` (see routes.ts).
 */

import type { ManifestIcon } from "./manifest";

/** Zones mirror AdminPageSanitizer::PLACEMENT_ZONES. */
export type ExtensionPageZone = "none" | "dashboard" | "menu";

export interface ExtensionPagePlacement {
  /**
   * "menu" injects a sidebar item; "dashboard" renders as a dashboard
   * tab; "none" keeps the page reachable only via its route.
   */
  zone: ExtensionPageZone;
  /** Ordering weight within the zone; default 0. */
  order?: number;
  parentId?: string;
}

export interface ExtensionPageRoute {
  /** v1: only "native" (fd-native schema-v3 page). */
  type: "native";
}

export interface ExtensionPageContent {
  /** v1: only "blocks" (DashboardPresetSnapshot, schema v3). */
  type: "blocks";
  /**
   * Schema-v3 dashboard snapshot (`sections` + `widgetPlacements` …).
   * Deep-normalized at provision time by AdminPageSanitizer; the
   * manifest validator only checks the shape.
   */
  config: Record<string, unknown>;
}

export interface ExtensionPage {
  /**
   * Required - lowercase slug ([a-z0-9-]+); becomes the route segment
   * `/app/<ext-id>/<id>` and the page identity the provisioner syncs.
   */
  id: string;
  /** Required - display title. */
  title: string;
  icon?: ManifestIcon;
  /** wp capability required to view the page (fails closed). */
  capability?: string;
  /** Absent → provisioner default (menu zone). */
  placement?: ExtensionPagePlacement;
  /** Absent → { type: "native" }. */
  route?: ExtensionPageRoute;
  content: ExtensionPageContent;
}

/**
 * Response shape the ext-rest adapter projects onto (mirrors
 * ALLOWED_DATA_SOURCE_SHAPES). `funnel` stays out of v1: the funnel widget
 * renders only the ecommerce funnel and never binds resource items, so an
 * extension funnel source would be unbindable.
 */
export type ExtensionDataSourceShape =
  | "metric-cards"
  | "table-rows"
  | "time-series"
  | "geo";

export interface ExtensionDataSourceColumn {
  /** Row object key the adapter reads (alphanumeric, `_-.`). */
  key: string;
  label: string;
  /** Rendering hint (e.g. "date", "number", "badge"); free-form slug. */
  type?: string;
}

/** Mirrors ALLOWED_ROW_ACTIONS. */
export type ExtensionRowAction = "view" | "edit" | "delete" | "duplicate";

export interface ExtensionDataSource {
  /**
   * Required - namespaced `ext.<manifest-id>.<name>` where <name> is a
   * lowercase slug ([a-z0-9-]+). The validator enforces the manifest id
   * prefix so extensions cannot squat on each other's namespaces.
   */
  id: string;
  /** Required - picker label. */
  label: string;
  /** Required - adapter projection contract. */
  shape: ExtensionDataSourceShape;
  /**
   * Required - site-relative REST path WITHOUT the /wp-json prefix,
   * same form register_rest_route() takes ("/fd-tasks/v1/summary").
   * GET only in v1.
   */
  rest_route: string;
  /** Query batching groups (lowercase slugs, `:` allowed). */
  queryGroups?: string[];
  /** wp capability required to read the source (fails closed). */
  capability?: string;
  /**
   * Entity-table renderer key for table-rows sources (e.g. "task");
   * shares the posts entity-table shape when the row contract matches.
   */
  entity?: string;
  /** Explicit column contract for table-rows (v1: no inference). */
  columns?: ExtensionDataSourceColumn[];
  rowActions?: ExtensionRowAction[];
}
