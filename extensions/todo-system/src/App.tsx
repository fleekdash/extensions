import { useEffect, useState } from "react";
import { TodoShell } from "./components/TodoShell";
import { useTodoApp } from "./hooks/useTodoApp";
import {
  DEFAULT_TODO_SETTINGS,
  normalizeTodoSettings,
  type TodoSettings,
} from "./types/settings";
import { isFleekDashEmbedded } from "./utils/fleekdash-embed";
import { whenFleekDashSdk } from "./utils/fleekdash-sdk";
import "./styles/app.css";

function resolveTheme(): "light" | "dark" {
  if (localStorage.getItem("fleekdash:theme-is-dark") === "true") {
    return "dark";
  }
  return "light";
}

export function App() {
  const [theme, setTheme] = useState<"light" | "dark">(resolveTheme);
  const embedded = isFleekDashEmbedded();
  const [dataEnabled, setDataEnabled] = useState(!embedded);
  const [settings, setSettings] = useState<TodoSettings>(DEFAULT_TODO_SETTINGS);
  const app = useTodoApp(dataEnabled, settings);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribeTheme: (() => void) | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    // Wait for the SDK global - enabling data before init() ran would send
    // bus messages with integration_id:null (observed boot race).
    let attempts = 0;
    const MAX_ATTEMPTS = 8; // ~14s of grace for a slow SDK script, then error UI
    const waitForSdk = () => {
      void whenFleekDashSdk(1500).then((sdk) => {
        if (cancelled) return;
        if (!sdk) {
          // Embedded hosts may load the SDK after the polling timeout — keep
          // data gated while there's still hope, then enable so bootstrap can
          // surface the honest "SDK is not available" error + Retry.
          if (embedded && ++attempts < MAX_ATTEMPTS) {
            retryTimer = setTimeout(waitForSdk, 250);
          } else {
            setDataEnabled(true);
          }
          return;
        }

        sdk.init({
          integration_id: "todo-system",
          // SDK-level debug is opt-in via ?sdk_debug=1 - it can't wait for the
          // async `debug_logging` setting, which gates sdkLog() instead.
          debug: new URLSearchParams(window.location.search).has("sdk_debug"),
          deferReady: embedded,
        });

        unsubscribeTheme = sdk.onMessage("THEME_CHANGED", (data) => {
          if (typeof data.isDarkMode === "boolean") {
            setTheme(data.isDarkMode ? "dark" : "light");
          }
        });

        // Manifest-declared extension settings (fleekdash.json → settings) —
        // the host resolves defaults + stored values server-side.
        sdk
          .getIntegrationSettings?.()
          .then((raw) => {
            setSettings(normalizeTodoSettings(raw as Record<string, unknown>));
          })
          .catch(() => {});

        setDataEnabled(true);

        if (embedded) {
          sdk.reportReady().catch(() => {
            // Non-blocking if parent is slow.
          });
        }
      });
    };

    waitForSdk();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      unsubscribeTheme?.();
    };
  }, [embedded]);

  return <TodoShell app={app} settings={settings} />;
}
