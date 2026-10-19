import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, "pages/app.html"),
        "api-demo": path.resolve(__dirname, "pages/api-demo.html"),
      },
    },
  },
});
