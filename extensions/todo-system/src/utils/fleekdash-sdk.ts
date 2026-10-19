import { getFleekDashSdk, type FleekDashSdk } from "@fleekdash/contracts";

export { getFleekDashSdk };
export type { FleekDashSdk };

/**
 * Resolves with `window.FleekDashSDK` once it exists, or null after
 * `timeoutMs`. The page's loader writes the SDK tag via document.write
 * (parser-blocking), but async embeds can mount React before it executes -
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
      // The page loader sets this flag when the script can't arrive at all
      // (network error or rejected URL) - no point polling the full timeout.
      const failed = (window as unknown as Record<string, unknown>)
        .__fleekdashSdkLoadFailed === true;
      if (sdk || failed || Date.now() - started >= timeoutMs) {
        resolve(sdk ?? null);
        return;
      }
      setTimeout(tick, 50);
    };
    tick();
  });
}
