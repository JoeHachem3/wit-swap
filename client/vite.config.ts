// eslint-disable-next-line node/no-unpublished-import
import { defineConfig } from 'vite';
// eslint-disable-next-line node/no-unpublished-import
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env,
  },
});
