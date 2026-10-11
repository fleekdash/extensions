import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      input: {
        editor: path.resolve(__dirname, "pages/editor.html"),
        "library-return": path.resolve(__dirname, "pages/library-return.html"),
      },
    },
  },
});
