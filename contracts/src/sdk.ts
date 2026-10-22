/**
 * Iframe SDK contract - the `window.FleekDashSDK` global injected into
 * extension iframes. Mirrors `public/sdk/fleekdash-sdk.js` (runtime) and
 * `IntegrationMessageBus` message handling (host side).
 *
 * Extensions load it via:
 *   <script src="/wp-content/plugins/fleekdash/public/sdk/fleekdash-sdk.js"></script>
 * and read `window.FleekDashSDK`.
 */

/** Message types the host MessageBus accepts from an extension iframe. */
export type IntegrationMessageType =
  | "INTEGRATION_READY"
  | "SHOW_NOTIFICATION"
  | "WP_DATA_REQUEST"
  | "WP_DATA_MUTATION"
  | "NAVIGATE"
  | "OPEN_MODAL"
  | "UPDATE_MENU_BADGE"
  | "GET_INTEGRATION_SETTINGS"
  | "LOG_MESSAGE"
  | "GET_THEME_ASSETS";

/** Message types the host broadcasts to extension iframes (postMessage wire type). */
export type HostBroadcastType = "themeChange";

/**
 * Event names extensions subscribe to via `sdk.onMessage(...)`.
 * The host's "themeChange" broadcast is applied internally by the SDK and
 * re-emitted to listeners as "THEME_CHANGED" (fleekdash-sdk.js).
 */
export type SdkEventType = "THEME_CHANGED";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface FleekDashSdkConfig {
  /** The extension id - must match the manifest `id`. */
  integration_id: string;
  /**
   * Server-provided nonce (injected into the iframe URL/config).
   * Pass `null` on a later `init()` to deliberately clear the credential;
   * it stays cleared until another value is supplied.
   */
  nonce?: string | null;
  /**
   * `wp_rest` nonce injected as `_fleekdash_rest_nonce`/`data-rest-nonce`.
   * Used by the standalone REST path (`X-WP-Nonce`) - the bus nonce cannot
   * pass `wp_verify_nonce` for REST auth. Pass `null` to clear it.
   */
  restNonce?: string | null;
  debug?: boolean;
  /** Defer the automatic INTEGRATION_READY signal until reportReady(). */
  deferReady?: boolean;
}

/** Payload for `mutateWordPressData(endpoint, options)`. */
export interface WpDataMutationOptions {
  /** HTTP method; default "POST". One of POST | PUT | PATCH | DELETE. */
  method?: "POST" | "PUT" | "PATCH" | "DELETE" | (string & {});
  body?: unknown;
  params?: Record<string, unknown>;
}

/**
 * Configuration for `openModal()` - the universal Vaul drawer/modal.
 * `url` must be same-origin. Mirrors `IntegrationModalRequest`.
 */
export interface IntegrationModalConfig {
  title?: string;
  description?: string;
  /** Non-empty same-origin URL rendered inside the drawer. */
  url: string;
  width?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";
  direction?: "left" | "right" | "top" | "bottom";
  floating?: boolean;
  backdrop?: boolean;
  /** Allow dock/pin mode (default true). */
  enableDockMode?: boolean;
  dockStorageKey?: string;
  drawerId?: string;
  persistWhenDocked?: boolean;
  contentPadding?: string;
  showHeader?: boolean;
  showCloseButton?: boolean;
  iframeHeight?: string;
  iframeClassName?: string;
  iframeAllow?: string;
  iframeSandbox?: string;
}

export type SdkMessageHandler = (data: Record<string, unknown>) => void;

export interface FleekDashSdk {
  // ---- Core lifecycle ------------------------------------------------
  /** Bind the SDK to an integration id. Auto-runs when `window.FleekDashConfig` is set. */
  init(config: FleekDashSdkConfig): void;
  /** Signal the iframe finished its own boot (with `deferReady`). */
  reportReady(extraData?: Record<string, unknown>): Promise<unknown>;
  /** Low-level: send a typed message to the host and await the response. */
  sendMessage(
    messageType: IntegrationMessageType | (string & {}),
    data?: unknown,
  ): Promise<unknown>;
  /** Subscribe to host messages; returns an unsubscribe fn. */
  onMessage(type: string, handler: SdkMessageHandler): () => void;
  /** Remove all listeners for a message type; use onMessage's unsubscribe for one handler. */
  off(type: string): void;

  // ---- Helpers -------------------------------------------------------
  showNotification(message: string, type?: NotificationType): Promise<unknown>;
  /**
   * Read via WP REST. `endpoint` is normalized to `/wp-json/...` and run
   * through the host's authenticated apiClient.
   */
  getWordPressData(
    endpoint: string,
    params?: Record<string, string | number>,
  ): Promise<unknown>;
  /** POST/PUT/PATCH/DELETE via WP REST through the host's authenticated apiClient. */
  mutateWordPressData(
    endpoint: string,
    options?: WpDataMutationOptions,
  ): Promise<unknown>;
  /** Navigate the host SPA to a FleekDash route path. */
  navigate(path: string): Promise<unknown>;
  openModal(config: IntegrationModalConfig): Promise<unknown>;
  closeModal(): Promise<unknown>;
  updateMenuBadge(
    path: string,
    count: number,
    color?: string,
  ): Promise<unknown>;
  /** Current values of this extension's registered settings fields. */
  getIntegrationSettings(): Promise<Record<string, unknown>>;
  /** Host theme assets (css url, palette vars) for visual parity. */
  getThemeAssets(): Promise<unknown>;
  loadThemeAssets(prefetched?: unknown): Promise<unknown>;
  /** Log through the host (goes to FleekDash's debug channel). */
  log(...args: unknown[]): void;

  // ---- Utility -------------------------------------------------------
  getVersion(): string;
  isInitialized(): boolean;
  /** Read-only snapshot of the active config. */
  readonly config: Readonly<FleekDashSdkConfig>;
}

declare global {
  interface Window {
    FleekDashSDK?: FleekDashSdk;
    FleekDashConfig?: FleekDashSdkConfig;
  }
}

/** Convenience accessor - same shape extensions already hand-roll. */
import { getBrowserWindow } from "./browser-env";

export function getFleekDashSdk(): FleekDashSdk | undefined {
  return getBrowserWindow()?.FleekDashSDK;
}
