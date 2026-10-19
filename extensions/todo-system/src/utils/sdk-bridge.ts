import type { TodoSettings } from "../types/settings";
import { getFleekDashSdk } from "./fleekdash-sdk";

const BADGE_ROUTE_PATH = "todo-system/app";

/** Host-channel debug log, gated by the `debug_logging` setting. */
export function sdkLog(
  settings: Pick<TodoSettings, "debug_logging">,
  ...args: unknown[]
): void {
  if (!settings.debug_logging) return;
  getFleekDashSdk()?.log("[todo-system]", ...args);
}

export function notify(
  message: string,
  type: "success" | "error" | "warning" | "info" = "info",
): void {
  void getFleekDashSdk()
    ?.showNotification(message, type)
    .catch(() => {});
}

let badgeDeclineLogged = false;

/** Reflect the open-task count on the route's sidebar menu badge. */
export function syncMenuBadge(
  settings: Pick<TodoSettings, "open_tasks_badge" | "badge_color">,
  openCount: number,
): void {
  const sdk = getFleekDashSdk();
  if (!sdk?.updateMenuBadge) return;
  const count = settings.open_tasks_badge ? openCount : 0;
  void sdk
    .updateMenuBadge(BADGE_ROUTE_PATH, count, settings.badge_color)
    .then((result) => {
      // Older hosts acknowledge the message but return updated:false —
      // forward-compatible call, surface it once instead of failing loudly.
      if (
        !badgeDeclineLogged &&
        result &&
        typeof result === "object" &&
        (result as { updated?: unknown }).updated === false
      ) {
        badgeDeclineLogged = true;
        console.info(
          "[todo-system] Host has no menu-badge support yet — updateMenuBadge was a no-op.",
        );
      }
    })
    .catch(() => {});
}
