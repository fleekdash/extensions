import { useCallback, useEffect, useRef, useState } from "react";
import type { NotificationType } from "@fleekdash/contracts";
import { getFleekDashSdk } from "../utils/fleekdash-sdk";
import { isFleekDashEmbedded } from "../utils/fleekdash-embed";
import { normalizeTodoSettings } from "../types/settings";

type RunStatus = "idle" | "running" | "ok" | "error";

type RunState = {
  status: RunStatus;
  output?: string;
};

const IDLE: RunState = { status: "idle" };

function pretty(value: unknown): string {
  if (typeof value === "string") return value;
  const text = JSON.stringify(value, null, 2) ?? "undefined";
  return text.length > 1600 ? `${text.slice(0, 1600)}\n… truncated` : text;
}

type DemoCardProps = {
  readonly title: string;
  readonly api: string;
  readonly description: string;
  readonly run?: RunState;
  readonly children: React.ReactNode;
};

function DemoCard({ title, api, description, run, children }: DemoCardProps) {
  const state = run ?? IDLE;
  return (
    <section className="demo-card">
      <h3>{title}</h3>
      <code className="demo-api">{api}</code>
      <p className="demo-desc">{description}</p>
      <div className="demo-actions">{children}</div>
      {state.status !== "idle" ? (
        <pre className={`demo-output demo-output-${state.status}`}>
          {state.status === "running" ? "Running…" : state.output}
        </pre>
      ) : null}
    </section>
  );
}

function DemoButton({
  label,
  onClick,
}: {
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button type="button" className="demo-btn" onClick={onClick}>
      {label}
    </button>
  );
}

export function ApiDemo() {
  const [sdkReady, setSdkReady] = useState(false);
  const [embedded] = useState(isFleekDashEmbedded);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    localStorage.getItem("fleekdash:theme-is-dark") === "true"
      ? "dark"
      : "light",
  );
  const [runs, setRuns] = useState<Record<string, RunState>>({});
  const [badgeCount, setBadgeCount] = useState(0);
  const themeChanges = useRef(0);

  const sdk = getFleekDashSdk();

  const setRun = useCallback((key: string, state: RunState) => {
    setRuns((prev) => ({ ...prev, [key]: state }));
  }, []);

  const run = useCallback(
    (key: string, fn: () => unknown) => {
      setRun(key, { status: "running" });
      void Promise.resolve(fn())
        .then((result) =>
          setRun(key, { status: "ok", output: pretty(result) }),
        )
        .catch((err: unknown) =>
          setRun(key, {
            status: "error",
            output: err instanceof Error ? err.message : String(err),
          }),
        );
    },
    [setRun],
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (!sdk) {
      setSdkReady(false);
      return;
    }
    sdk.init({
      integration_id: "todo-system",
      debug: true,
      deferReady: embedded,
    });
    sdk.onMessage("THEME_CHANGED", (data) => {
      themeChanges.current += 1;
      if (typeof data.isDarkMode === "boolean") {
        setTheme(data.isDarkMode ? "dark" : "light");
      }
    });
    setSdkReady(true);
    if (embedded) {
      sdk.reportReady().catch(() => {});
    }
  }, [sdk, embedded]);

  const notify = (type: NotificationType) =>
    sdk?.showNotification(
      `Todo System demo — ${type} notification`,
      type,
    );

  const badgeDemo = (count: number) =>
    run("badge", async () => {
      if (!sdk?.updateMenuBadge) return "Host does not implement badges";
      const response = await sdk.updateMenuBadge(
        "todo-system/app",
        count,
        "blue",
      );
      setBadgeCount(count);
      return response;
    });

  return (
    <div className="demo-page">
      <header className="demo-header">
        <div>
          <h1>FleekDash SDK — live tour</h1>
          <p className="demo-subtitle">
            Every card below calls the real bridge this page is running on.{" "}
            {embedded
              ? "Embedded: requests go through the MessageBus to the host."
              : "Standalone: requests hit WP REST directly with X-WP-Nonce."}
          </p>
        </div>
        <div className="demo-status">
          <span className={`demo-dot ${sdkReady ? "on" : "off"}`} />
          SDK {sdkReady ? `ready · v${sdk?.getVersion() ?? "?"}` : "not found"}
          <span className="demo-theme-pill">
            theme: {theme} ({themeChanges.current} live changes)
          </span>
        </div>
      </header>

      <div className="demo-grid">
        <DemoCard
          title="Lifecycle"
          api="init / isInitialized / config / reportReady"
          description="The contract every extension completes on boot."
          run={runs.lifecycle}
        >
          <DemoButton
            label="Inspect"
            onClick={() =>
              run("lifecycle", async () => ({
                initialized: sdk?.isInitialized() ?? false,
                version: sdk?.getVersion() ?? "n/a",
                config: sdk?.config ?? null,
                embedded,
              }))
            }
          />
        </DemoCard>

        <DemoCard
          title="WordPress data — read"
          api="getWordPressData(endpoint, params)"
          description="Runs WP REST GET through the host's authenticated client."
          run={runs.read}
        >
          <DemoButton
            label="GET /todo-system/v1/bootstrap"
            onClick={() =>
              run("read", async () => {
                const data = await sdk?.getWordPressData(
                  "/todo-system/v1/bootstrap",
                );
                return data;
              })
            }
          />
          <DemoButton
            label="GET /wp/v2/posts"
            onClick={() =>
              run("read", () =>
                sdk?.getWordPressData("/wp/v2/posts", {
                  per_page: 3,
                  _fields: "id,title,link",
                }),
              )
            }
          />
        </DemoCard>

        <DemoCard
          title="WordPress data — write"
          api="mutateWordPressData(endpoint, {method, body})"
          description="Creates a real task, then deletes it — a full REST roundtrip."
          run={runs.write}
        >
          <DemoButton
            label="Create + delete demo task"
            onClick={() =>
              run("write", async () => {
                const created = (await sdk?.mutateWordPressData(
                  "/todo-system/v1/tasks",
                  {
                    method: "POST",
                    body: {
                      title: `API demo task ${new Date().toISOString()}`,
                      status: "todo",
                    },
                  },
                )) as { id?: number } | undefined;
                const deleted = created?.id
                  ? await sdk?.mutateWordPressData(
                      `/todo-system/v1/tasks/${created.id}`,
                      { method: "DELETE" },
                    )
                  : "skipped (no id)";
                return { created, deleted };
              })
            }
          />
        </DemoCard>

        <DemoCard
          title="Notifications"
          api="showNotification(message, type)"
          description="Host toast notifications in all four variants."
          run={runs.notify}
        >
          {(["success", "info", "warning", "error"] as const).map((type) => (
            <DemoButton
              key={type}
              label={type}
              onClick={() =>
                run("notify", async () => {
                  await notify(type);
                  return `sent ${type}`;
                })
              }
            />
          ))}
        </DemoCard>

        <DemoCard
          title="Navigation"
          api="navigate(path)"
          description="Host-side hash routing — jumps to another route without reloads."
          run={runs.navigate}
        >
          <DemoButton
            label="Back to the app"
            onClick={() =>
              run("navigate", () => sdk?.navigate("/app/todo-system/app"))
            }
          />
          <DemoButton
            label="Integrations hub"
            onClick={() =>
              run("navigate", () => sdk?.navigate("/integrations"))
            }
          />
        </DemoCard>

        <DemoCard
          title="Modal"
          api="openModal / closeModal"
          description="Host-drawer modal rendering a same-origin URL."
          run={runs.modal}
        >
          <DemoButton
            label="Open WP posts screen"
            onClick={() =>
              run("modal", () =>
                sdk?.openModal({
                  title: "Posts (via openModal)",
                  url: "/wp-admin/edit.php",
                  size: "xl",
                  direction: "right",
                }),
              )
            }
          />
          <DemoButton
            label="Close modal"
            onClick={() => run("modal", () => sdk?.closeModal())}
          />
        </DemoCard>

        <DemoCard
          title="Menu badge"
          api="updateMenuBadge(routePath, count, color)"
          description="Reflects live state on this extension's menu entry."
          run={runs.badge}
        >
          <DemoButton label="Set badge 3" onClick={() => badgeDemo(3)} />
          <DemoButton
            label={`Clear (current ${badgeCount})`}
            onClick={() => badgeDemo(0)}
          />
        </DemoCard>

        <DemoCard
          title="Settings"
          api="getIntegrationSettings()"
          description="Manifest-declared fields resolved by the host (defaults + user values)."
          run={runs.settings}
        >
          <DemoButton
            label="Read current settings"
            onClick={() =>
              run("settings", async () => {
                const raw = await sdk?.getIntegrationSettings?.();
                return normalizeTodoSettings(raw);
              })
            }
          />
        </DemoCard>

        <DemoCard
          title="Theme"
          api="getThemeAssets + THEME_CHANGED"
          description="Palette/css parity plus live theme-change broadcasts."
          run={runs.theme}
        >
          <DemoButton
            label="Fetch theme assets"
            onClick={() =>
              run("theme", async () => {
                const assets = await sdk?.getThemeAssets?.();
                return assets;
              })
            }
          />
        </DemoCard>

        <DemoCard
          title="Logging"
          api="log(...args)"
          description="Ships to the FleekDash debug channel (visible with FD debug on)."
          run={runs.log}
        >
          <DemoButton
            label="Send a log line"
            onClick={() =>
              run("log", async () => {
                sdk?.log("api-demo", "hello from todo-system");
                return "sent — check host debug output";
              })
            }
          />
        </DemoCard>

        <DemoCard
          title="Raw sendMessage"
          api="sendMessage(type, data)"
          description="The primitive every helper wraps — shown for completeness."
          run={runs.raw}
        >
          <DemoButton
            label="WP_DATA_REQUEST directly"
            onClick={() =>
              run("raw", () =>
                sdk?.sendMessage("WP_DATA_REQUEST", {
                  endpoint: "/todo-system/v1/bootstrap",
                }),
              )
            }
          />
        </DemoCard>

        <DemoCard
          title="onMessage"
          api="onMessage(type, handler)"
          description="This page subscribes to THEME_CHANGED — toggle host theme and watch the pill."
          run={runs.messages}
        >
          <DemoButton
            label="Show received count"
            onClick={() =>
              run("messages", async () => ({
                theme_changes_received: themeChanges.current,
              }))
            }
          />
        </DemoCard>
      </div>

      <footer className="demo-footer">
        <p>
          Source of truth for these calls:{" "}
          <code>@fleekdash/contracts → src/sdk.ts</code> and{" "}
          <code>fleekdash/public/sdk/fleekdash-sdk.js</code>. Standalone mode
          requires a valid <code>_fleekdash_rest_nonce</code> URL param or a
          <code> data-rest-nonce</code> attribute; embedded mode authenticates
          through the MessageBus nonce instead.
        </p>
      </footer>
    </div>
  );
}
