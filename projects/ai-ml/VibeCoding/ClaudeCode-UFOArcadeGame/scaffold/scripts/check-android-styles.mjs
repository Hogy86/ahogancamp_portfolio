#!/usr/bin/env node
// Regression guard for mobile validation-report-round2 F1: an unqualified
// `android:windowLayoutInDisplayCutoutMode="always"` in `values/styles.xml` (or any
// `values-vNN/styles.xml` below API 30) crashes real API 28-29 devices with
// `UnsupportedOperationException: Unknown windowLayoutInDisplayCutoutMode: 3`
// (docs/mobile/architecture/mobile-architecture.md §6.6, M1). `always` is only
// confirmed safe on API 30+ (svr_api30_mid, svr_api36_pixel7 device-matrix passes);
// API 28-29 must use `shortEdges` instead (the same value androidx.core:core-splashscreen
// ships in its own values-v27/values-v29 overrides for this attribute).
//
// Usage: node scripts/check-android-styles.mjs [--res-dir <path>]

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_RES_DIR = path.join('android', 'app', 'src', 'main', 'res');
// Matches only plain API-version qualifiers ("values" or "values-vNN") - a folder like
// "values-land" or "values-v28-land" is out of scope for this check (no version to
// reason about the same way, and none currently sets this attribute).
const VALUES_DIR_RE = /^values(?:-v(\d+))?$/;
const MIN_SAFE_ALWAYS_VERSION = 30;
const CUTOUT_ITEM_RE = /<item\s+name="android:windowLayoutInDisplayCutoutMode">\s*([^<]+?)\s*<\/item>/g;

/** Returns the resolved API version for a `values`/`values-vNN` folder name (0 for the
 * unqualified base folder, since it applies from API 1), or `null` if the folder name
 * isn't a plain version qualifier this check tracks. */
export function extractValuesVersion(folderName) {
  const match = VALUES_DIR_RE.exec(folderName);
  if (!match) return null;
  return match[1] ? Number(match[1]) : 0;
}

/** `filesByFolder`: `{ [folderName]: styles.xml text }`. Returns an array of
 * human-readable failure strings - empty means clean. Exported so fixture tests can
 * exercise this pure logic without touching the real `android/` tree. */
export function findUnsafeCutoutModeAlways(filesByFolder) {
  const failures = [];
  for (const [folder, xmlText] of Object.entries(filesByFolder)) {
    const version = extractValuesVersion(folder);
    if (version === null || version >= MIN_SAFE_ALWAYS_VERSION) continue;
    let match;
    // Reset lastIndex per file since CUTOUT_ITEM_RE is a shared /g regex.
    CUTOUT_ITEM_RE.lastIndex = 0;
    while ((match = CUTOUT_ITEM_RE.exec(xmlText))) {
      const value = match[1].trim();
      if (value === 'always') {
        failures.push(
          `${folder}/styles.xml sets android:windowLayoutInDisplayCutoutMode="always", but ` +
            `resolves to API ${version}, below the confirmed-safe API ${MIN_SAFE_ALWAYS_VERSION} ` +
            'floor - this crashes real API 28-29 devices (validation-report-round2 F1). Use ' +
            '"shortEdges" below API 30, matching values-v28/styles.xml.',
        );
      }
    }
  }
  return failures;
}

function loadStylesFiles(resDir) {
  const filesByFolder = {};
  let entries;
  try {
    entries = readdirSync(resDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return filesByFolder;
    throw error;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const stylesPath = path.join(resDir, entry.name, 'styles.xml');
    try {
      filesByFolder[entry.name] = readFileSync(stylesPath, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      // No styles.xml in this folder - nothing to check.
    }
  }
  return filesByFolder;
}

function parseArgs(argv) {
  const args = { resDir: DEFAULT_RES_DIR };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--res-dir') args.resDir = argv[++i];
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const filesByFolder = loadStylesFiles(args.resDir);
  const failures = findUnsafeCutoutModeAlways(filesByFolder);
  if (failures.length > 0) {
    console.error('check-android-styles: FAILED');
    for (const failure of failures) console.error(`  ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log('check-android-styles: no unqualified windowLayoutInDisplayCutoutMode="always" found.');
}

// Guarded so `extractValuesVersion`/`findUnsafeCutoutModeAlways` can be unit-tested with
// inline fixtures without touching the real `android/` tree.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
