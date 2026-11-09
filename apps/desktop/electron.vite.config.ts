import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";

const PRODUCTION_CSP =
  "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:";

export default defineConfig({
  main: {},
  renderer: {
    build: { target: "esnext" },
    plugins: [
      react(),
      tailwindcss(),
      {
        // Build only: the dev server needs inline scripts for hot reload.
        name: "kworum-production-csp",
        apply: "build",
        transformIndexHtml: () => [
          {
            tag: "meta",
            attrs: {
              "http-equiv": "Content-Security-Policy",
              content: PRODUCTION_CSP,
            },
            injectTo: "head-prepend",
          },
        ],
      },
    ],
  },
});
