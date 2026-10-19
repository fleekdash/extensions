import { getFleekDashSdk, type FleekDashSdk } from "@fleekdash/contracts";

export { getFleekDashSdk };
export type { FleekDashSdk };

/**
 * Resolves with `window.FleekDashSDK` once it exists, or null after
 * `timeoutMs`. The page's loader writes the SDK tag via document.write
 * (parser-blocking), but async embeds can mount React before it executes —
 * polling briefly keeps first data calls from racing ahead of `sdk.init()`.
 */
export function whenFleekDashSdk(
  timeoutMs = 2000,
): Promise<FleekDashSdk | null> {
  const existing = getFleekDashSdk();
  if (existing) {
    return Promise.resolve(existing);
  }
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      const sdk = getFleekDashSdk();
      if (sdk || Date.now() - started >= timeoutMs) {
        resolve(sdk ?? null);
        return;
      }
      setTimeout(tick, 50);
    };
    tick();
  });
}
