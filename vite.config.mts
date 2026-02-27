import { defineConfig, searchForWorkspaceRoot } from 'vite';
import vue from '@vitejs/plugin-vue';

import 'vue';

export default defineConfig({
  plugins: [vue({
    template: {
      compilerOptions: {
        isCustomElement: (tag) =>
          ['accordion-element', 'accordion-fan'].includes(tag),
      },
    },
  })],
  // ui is technically a different project entirely, that gets independently built as part of the build step
  root: 'src/ui',
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(Deno.cwd())],
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
  },
});
