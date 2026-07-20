import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        game: `${projectRoot}index.html`,
        roadmap: `${projectRoot}roadmap/index.html`,
      },
    },
  },
});
