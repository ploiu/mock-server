import { defineConfig } from 'npm:vite@^5.2.10';
import vue from 'npm:@vitejs/plugin-vue@^5.0.4';

import 'npm:vue@^3.4.23';

export default defineConfig({
  plugins: [vue()],
  // ui is technically a different project entirely, that gets independently built as part of the build step
  root: 'src/ui',
});
