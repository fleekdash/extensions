/** Dependency-free browser environment helpers for extension consumers. */
export function getBrowserWindow(): Window | null {
  return globalThis.window ?? null;
}
