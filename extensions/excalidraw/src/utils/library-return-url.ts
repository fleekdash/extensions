const LIBRARY_RETURN_PAGE = "dist/pages/library-return.html";

/**
 * URL passed to libraries.excalidraw.com as `referrer`.
 * After "Add to Excalidraw", libraries redirect here with #addLibrary=…&token=…
 * (token is Excalidraw session id, not FleekDash nonce).
 */
export function getExcalidrawLibraryReturnUrl(): string {
  const { origin, pathname } = globalThis.location;

  if (pathname.includes("/wp-content/plugins/excalidraw/")) {
    const pluginRoot = pathname.split("/dist/")[0] || pathname.split("/pages/")[0];
    return `${origin}${pluginRoot}/${LIBRARY_RETURN_PAGE}`;
  }

  return `${origin}/wp-content/plugins/excalidraw/${LIBRARY_RETURN_PAGE}`;
}
