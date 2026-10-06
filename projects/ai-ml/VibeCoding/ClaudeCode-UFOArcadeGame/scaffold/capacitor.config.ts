// Implements docs/mobile/architecture/mobile-architecture.md §7.2 (M-ADR-0007),
// amended by A8 (§14.1 row N2/N5). Hand-edited - the only Capacitor config file
// (§3 project layout table). The VALUES here are the binding decision; key names
// follow the installed Capacitor 8 config schema.
//
// applicationId: OQ-M11/OQ-S1 (b) - "io.github.hogy86.shieldvsrobots" per the owner's
// 2026-09-25 rename decision (docs/mobile/PRD-mobile.md §7, v1.3). This is a
// placeholder until confirmed immutable at the first Play upload (§7.1).
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.hogy86.shieldvsrobots',
  appName: 'Shield vs Robots',
  webDir: 'dist-android',
  backgroundColor: '#05050a', // no white flash (M9.4)
  loggingBehavior: 'debug', // console -> logcat only in debug builds (M11.3)
  server: {
    androidScheme: 'https', // PINNED origin https://localhost - never change (M7.4)
    hostname: 'localhost',
    errorPath: 'webview-update.html', // shown when WebView < minWebViewVersion (M1.4)
  },
  android: {
    minWebViewVersion: 80,
    allowMixedContent: false,
    // webContentsDebuggingEnabled intentionally left unset: Capacitor enables it only
    // for debuggable builds. check-capacitor-config.mjs enforces this (§14.1 row N2).
  },
  plugins: {
    SplashScreen: { launchAutoHide: false, backgroundColor: '#05050a', showSpinner: false },
    // §6.6/M1: GameShellPlugin (not Capacitor) owns immersive mode and edge insets -
    // Capacitor 8's own SystemBars plugin behavior must be disabled so it never
    // fights GameShell's `WindowCompat.setDecorFitsSystemWindows(false)`/insets
    // listener with its own inset handling.
    SystemBars: { insetsHandling: 'disable' },
  },
};

export default config;
