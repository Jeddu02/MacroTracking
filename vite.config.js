import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Plain Vite + React setup. The service worker and manifest live in /public
// and are copied to the build output as-is (see public/sw.js, public/manifest.webmanifest).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  },
  preview: {
    port: 4173
  }
});
