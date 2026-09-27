// Implements docs/mobile/architecture/mobile-architecture.md §10 item 3 / §10.1
// (M-ADR-0008): phone-emulation suite. Serves `dist-android` (built by
// `npm run build:android`) with `vite preview` and drives it with Chromium's mobile
// emulation (`hasTouch`, `isMobile`) at the four device-matrix landscape viewports.
// Outside real Capacitor, AndroidPlatform's GameShell calls fall through to its web
// fallback (registerPlugin(..., { web: ... })), which reads `?insets=l,r,t,b` (default
// 0) from the URL - see src/platform/android/GameShell.ts.

import { defineConfig, devices } from '@playwright/test';

const PORT = 4174;

export default defineConfig({
  testDir: 'tests/mobile-e2e',
  fullyParallel: true,
  reporter: [['list']],
  webServer: {
    // `--mode android` makes vite.config.ts resolve `build.outDir` to
    // `dist-android` (the same mode `npm run build:android` builds with), so
    // `vite preview` serves the Android-mode build, not the default web one.
    command: `npx vite preview --mode android --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
  },
  // §10.1: the four device-matrix landscape profiles from mobile-architecture.md §6.4.
  // M4: `devices['Desktop Chrome']` sets `hasTouch: false, isMobile: false,
  // deviceScaleFactor: 1` - spreading it INTO `use` at project level overrode the
  // top-level touch/DPR settings above (object spread order matters; the later key
  // wins). Re-asserting them AFTER the spread, per project, is what actually turns
  // touch emulation and DPR back on for every device-matrix viewport.
  projects: [
    {
      name: '640x360',
      use: { ...devices['Desktop Chrome'], viewport: { width: 640, height: 360 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
    },
    {
      name: '800x360',
      use: { ...devices['Desktop Chrome'], viewport: { width: 800, height: 360 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
    },
    {
      name: '915x412',
      use: { ...devices['Desktop Chrome'], viewport: { width: 915, height: 412 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
    },
    {
      name: '1280x800',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
    },
  ],
});
