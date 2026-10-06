import { defineConfig } from 'vite';

// Zero-plugin, zero-runtime-dependency build per ADR-0001. Static output only.
//
// docs/mobile/architecture/mobile-architecture.md §3.1 (M-ADR-0001): a second build
// mode, `android`, adds Capacitor's requirements without touching the default
// (`production`) web build's output at all - `mode` defaults to something other than
// 'android' for every existing command (`vite`, `vite build`, `vite preview`), so
// `npm run build`'s output is byte-identical to before Android support existed (C3).
export default defineConfig(({ mode }) => ({
  root: '.',
  publicDir: 'public',
  // The Docker/nginx and AWS (S3+CloudFront) deployments both serve this app
  // from the domain root, so the default base ('/') is correct for them.
  // GitHub Pages serves project repos (not <user>.github.io repos) under a
  // subpath instead - e.g. hogy86.github.io/ahogancamp_portfolio/... - so the
  // Pages build sets VITE_BASE_PATH (see .github/workflows/deploy-pages.yml)
  // rather than changing this default and breaking the other deployments.
  // Android always serves from Capacitor's local https://localhost/ origin, so its
  // base is always '/' regardless of VITE_BASE_PATH (§3.1 table).
  base: mode === 'android' ? '/' : (process.env.VITE_BASE_PATH ?? '/'),
  build: {
    outDir: mode === 'android' ? 'dist-android' : 'dist',
    target: 'es2020',
    // Amendment A7 (review-v1 L2): the APK ships no `.map` files; web keeps them
    // (identical web output, C3).
    sourcemap: mode !== 'android',
  },
  server: {
    port: 5173,
    strictPort: false,
  },
}));
