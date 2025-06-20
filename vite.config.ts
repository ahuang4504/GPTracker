import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      input: {
        main: "index.html",
        content: "src/content.ts",
        background: "src/background.ts",
      },
      output: {
        entryFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
      },
    },
  },
});
