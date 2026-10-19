import { useEffect, useState } from "react";
import { TodoShell } from "./components/TodoShell";
import { useTodoApp } from "./hooks/useTodoApp";
import {
  DEFAULT_TODO_SETTINGS,
  normalizeTodoSettings,
  type TodoSettings,
} from "./types/settings";
import { isFleekDashEmbedded } from "./utils/fleekdash-embed";
import { getFleekDashSdk } from "./utils/fleekdash-sdk";
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
    const sdk = getFleekDashSdk();
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

    const unsubscribeTheme = sdk.onMessage("THEME_CHANGED", (data) => {
      if (typeof data.isDarkMode === "boolean") {
        setTheme(data.isDarkMode ? "dark" : "light");
      }
    });

    // Manifest-declared extension settings (fleekdash.json → settings) -
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
    return unsubscribeTheme;
  }, [embedded]);

  return <TodoShell app={app} settings={settings} />;
}
