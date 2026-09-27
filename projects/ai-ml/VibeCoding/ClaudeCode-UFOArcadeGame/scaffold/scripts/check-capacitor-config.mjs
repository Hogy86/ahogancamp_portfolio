#!/usr/bin/env node
// Implements docs/mobile/architecture/mobile-architecture.md §10.3 step 8 / §14.1 row
// N2 (M-ADR-0012, amended by A8/review-v1b N2+N5). Checks BOTH `capacitor.config.ts`
// (source of truth) and the generated `android/app/src/main/assets/capacitor.config.json`
// (the file that actually ships - must be checked too, since a stale/hand-edited
// generated file would otherwise slip past a source-only check). Run in CI after
// `npx cap sync android` (§10.3 android-build step 8).
//
// `capacitor.config.ts` is checked with a strict text match (documented here, per the
// script-header requirement): this project's config is a plain object literal with no
// computed keys, so matching the literal `server.url`/`server.cleartext`/etc. tokens is
// exact for this file's shape. Key patterns tolerate an optional closing quote
// (`'url':` as well as `url:`, L8) since object-literal keys may be quoted or bare.
// The generated `.json` is parsed with `JSON.parse` (it is always valid JSON).
//
// Fails on any of (checked on both files):
//  1. `server.url` present
//  2. `server.cleartext: true`
//  3. `android.webContentsDebuggingEnabled: true` (or top-level `webContentsDebuggingEnabled: true`)
//  4. `android.allowMixedContent: true`
//  5. `server.androidScheme` other than 'https' (missing counts as a failure on the
//     generated JSON, since that is the shipped origin, M7.4)
//  6. `server.hostname` other than 'localhost' (same missing-value rule)
//  7. [N5] any `server.allowNavigation` key, whatever its value (even an empty array)

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const TS_CONFIG_PATH = 'capacitor.config.ts';
const JSON_CONFIG_PATH = 'android/app/src/main/assets/capacitor.config.json';

export function checkParsedConfig(config, label) {
  const failures = [];
  const server = config.server ?? {};
  const android = config.android ?? {};

  if (server.url !== undefined) failures.push(`${label}: server.url is present`);
  if (server.cleartext === true) failures.push(`${label}: server.cleartext is true`);
  if (android.webContentsDebuggingEnabled === true || config.webContentsDebuggingEnabled === true) {
    failures.push(`${label}: webContentsDebuggingEnabled is true`);
  }
  if (android.allowMixedContent === true) failures.push(`${label}: android.allowMixedContent is true`);

  // These two fields fail on missing-in-the-shipped-JSON too (M7.4 - the shipped
  // origin must stay pinned); the .ts source may omit them if it relies on Capacitor's
  // own default, but the generated JSON always has whatever will actually load.
  const scheme = server.androidScheme;
  if (label === 'capacitor.config.json' ? scheme !== 'https' : scheme !== undefined && scheme !== 'https') {
    failures.push(`${label}: server.androidScheme is "${scheme}", expected "https"`);
  }
  const hostname = server.hostname;
  if (label === 'capacitor.config.json' ? hostname !== 'localhost' : hostname !== undefined && hostname !== 'localhost') {
    failures.push(`${label}: server.hostname is "${hostname}", expected "localhost"`);
  }

  if (server.allowNavigation !== undefined) {
    failures.push(`${label}: server.allowNavigation is present (N5 - not allowed, whatever its value)`);
  }

  return failures;
}

/** H5: takes the raw JSON text directly (rather than reading the file itself) so
 * tests can exercise rules 1-7 against fixture strings, including one with a missing
 * `androidScheme`/`hostname` key entirely. */
export function checkGeneratedJsonText(raw) {
  const config = JSON.parse(raw);
  return checkParsedConfig(config, 'capacitor.config.json');
}

function checkGeneratedJson() {
  return checkGeneratedJsonText(readFileSync(JSON_CONFIG_PATH, 'utf8'));
}

/** Strict text-match check of the source `.ts` file (documented above): this file has
 * no computed keys, so literal substring checks are exact for its shape. H5: takes
 * the raw text directly so tests can exercise rules 1-7 against fixture strings. */
export function checkSourceTsText(raw) {
  const failures = [];
  if (/\bserver\s*['"]?\s*:\s*{[^}]*\burl\s*['"]?\s*:/s.test(raw)) {
    failures.push('capacitor.config.ts: server.url is present');
  }
  if (/\bcleartext\s*['"]?\s*:\s*true/.test(raw)) failures.push('capacitor.config.ts: server.cleartext: true is present');
  if (/\bwebContentsDebuggingEnabled\s*['"]?\s*:\s*true/.test(raw)) {
    failures.push('capacitor.config.ts: webContentsDebuggingEnabled: true is present');
  }
  if (/\ballowMixedContent\s*['"]?\s*:\s*true/.test(raw)) {
    failures.push('capacitor.config.ts: allowMixedContent: true is present');
  }
  const schemeMatch = /androidScheme\s*['"]?\s*:\s*['"]([^'"]+)['"]/.exec(raw);
  if (schemeMatch && schemeMatch[1] !== 'https') {
    failures.push(`capacitor.config.ts: androidScheme is "${schemeMatch[1]}", expected "https"`);
  }
  const hostnameMatch = /hostname\s*['"]?\s*:\s*['"]([^'"]+)['"]/.exec(raw);
  if (hostnameMatch && hostnameMatch[1] !== 'localhost') {
    failures.push(`capacitor.config.ts: hostname is "${hostnameMatch[1]}", expected "localhost"`);
  }
  if (/\ballowNavigation\s*['"]?\s*:/.test(raw)) {
    failures.push('capacitor.config.ts: server.allowNavigation is present (N5)');
  }
  return failures;
}

function checkSourceTs() {
  return checkSourceTsText(readFileSync(TS_CONFIG_PATH, 'utf8'));
}

function main() {
  const failures = [...checkSourceTs(), ...checkGeneratedJson()];
  if (failures.length > 0) {
    console.error('check-capacitor-config: FAILED');
    for (const failure of failures) console.error(`  ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log('check-capacitor-config: PASSED');
}

// H5: guarded so the exported check functions can be unit-tested with fixture
// strings without this script also running its CLI (which reads real files).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
