import { defineConfig } from 'vite';

// Zero-plugin, zero-runtime-dependency build per ADR-0001. Static output only.
export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: true,
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
