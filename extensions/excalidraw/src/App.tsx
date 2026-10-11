import { useEffect, useState } from "react";
import { ExcalidrawWorkspace } from "./components/ExcalidrawWorkspace";
import { isFleekDashEmbedded } from "./utils/fleekdash-embed";
import { getFleekDashSdk } from "@fleekdash/contracts";

function resolveTheme(): "light" | "dark" {
  if (localStorage.getItem("fleekdash-dark-mode") === "true") {
    return "dark";
  }
  return "light";
}

export function App() {
  const [theme, setTheme] = useState<"light" | "dark">(resolveTheme);
  const embedded = isFleekDashEmbedded();
  const [postsFetchEnabled, setPostsFetchEnabled] = useState(!embedded);

  useEffect(() => {
    const sdk = getFleekDashSdk();
    if (!sdk) {
      setPostsFetchEnabled(true);
      return;
    }

    sdk.init({
      integration_id: "excalidraw",
      debug: true,
      deferReady: embedded,
    });

    sdk.onMessage("THEME_CHANGED", (data) => {
      if (typeof data.isDarkMode === "boolean") {
        setTheme(data.isDarkMode ? "dark" : "light");
      }
    });

    setPostsFetchEnabled(true);

    if (embedded) {
      sdk.reportReady().catch(() => {
        // Non-blocking if parent is slow; posts use MessageBus after init.
      });
    }
  }, [embedded]);

  return (
    <ExcalidrawWorkspace theme={theme} postsFetchEnabled={postsFetchEnabled} />
  );
}
