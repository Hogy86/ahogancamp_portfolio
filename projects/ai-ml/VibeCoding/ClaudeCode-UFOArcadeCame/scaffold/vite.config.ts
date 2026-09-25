import { defineConfig } from 'vite';

// Zero-plugin, zero-runtime-dependency build per ADR-0001. Static output only.
export default defineConfig({
  root: '.',
  publicDir: 'public',
  // The Docker/nginx and AWS (S3+CloudFront) deployments both serve this app
  // from the domain root, so the default base ('/') is correct for them.
  // GitHub Pages serves project repos (not <user>.github.io repos) under a
  // subpath instead - e.g. hogy86.github.io/ahogancamp_portfolio/... - so the
  // Pages build sets VITE_BASE_PATH (see .github/workflows/deploy-pages.yml)
  // rather than changing this default and breaking the other deployments.
  base: process.env.VITE_BASE_PATH ?? '/',
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
