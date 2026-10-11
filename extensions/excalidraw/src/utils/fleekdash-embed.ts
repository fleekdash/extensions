export function isFleekDashEmbedded(): boolean {
  try {
    return globalThis.parent !== globalThis.window;
  } catch {
    return false;
  }
}
