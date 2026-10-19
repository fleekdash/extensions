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

    // Wait for the SDK global - enabling data before init() ran would send
    // bus messages with integration_id:null (observed boot race).
    void whenFleekDashSdk().then((sdk) => {
      if (cancelled) return;
      if (!sdk) {
        setDataEnabled(true);
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

    return () => {
      cancelled = true;
      unsubscribeTheme?.();
    };
  }, [embedded]);

  return <TodoShell app={app} settings={settings} />;
}
