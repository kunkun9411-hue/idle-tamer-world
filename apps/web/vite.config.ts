import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
  build: {
    rollupOptions: {
      input: {
        game: `${projectRoot}index.html`,
        roadmap: `${projectRoot}roadmap/index.html`,
        uiCatalog: `${projectRoot}dev/ui-catalog.html`,
      },
    },
  },
});
