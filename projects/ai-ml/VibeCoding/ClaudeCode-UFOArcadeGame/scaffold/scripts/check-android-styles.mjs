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
// code-review-round7.md L1-L3:
// - L1: the standalone checker used to fail OPEN (exit 0, "no ... found") when the res
//   dir didn't exist or the script ran from the wrong cwd - the exact case where it is
//   most likely to be run by hand and most needs to say something. It now fails
//   CLOSED (exit 2, actionable message) whenever the res dir itself, or every
//   `values`/`values-vNN` folder within it, is missing.
// - L2: the cutout-item regex now tolerates extra attributes (e.g. the Android Studio
//   quick-fix's `tools:targetApi="o_mr1"`) and single-quoted values, which the old
//   exact-match regex silently missed.
// - L3: `checkStylesParity` asserts the three `styles.xml` files declare the same style
//   names/parents/items (apart from the cutout item itself) and that v28/v30 hold the
//   expected positive values - a future edit to only one file, or a deleted
//   values-v28/, is now a failure instead of a silent regression.
//
// code-review-round8.md L1-L2:
// - L1: corrected the comment below about why `import.meta.url` was not adopted for
//   `DEFAULT_RES_DIR` - it IS a valid `file:` URL under vitest+jsdom; what throws is
//   jsdom's own global `URL`, not `import.meta.url` itself. Also fixed this header's
//   stale `checkParity` name (see L3 above, which already used the real name).
// - L2: `STYLE_RE`/`ITEM_RE` (the parity parser) now tolerate extra attributes on
//   `<item>` (e.g. `tools:targetApi="s"`) the same way `CUTOUT_ITEM_RE` already did for
//   round-7 L2, and strip XML comments before parsing - both used to let a drifted item
//   silently pass parity by falling out of the match entirely.
//
// Usage: node scripts/check-android-styles.mjs [--res-dir <path>]

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// L1 item 4 considered resolving this from the script's own location
// (`fileURLToPath(new URL('../android/app/src/main/res', import.meta.url))`) instead
// of `process.cwd()`. Reverted: under `vitest` + jsdom (this file's own real-tree tests
// import it as a module), `import.meta.url` IS a valid `file:` URL - what throws is
// jsdom's own global `URL`, which `new URL('..', import.meta.url)` resolves through:
// the result is a jsdom URL object, and Node's `fileURLToPath` rejects it with
// `ERR_INVALID_URL_SCHEME`. (`path.dirname(fileURLToPath(import.meta.url))`, or
// importing `URL` from `node:url` explicitly, both work around it - but add a real
// difference in behavior between environments for no benefit here.) `process.cwd()`
// (matching `main()`'s own convention, and every other script under `scripts/`) plus
// the fail-CLOSED `run()` below (which reports a clear, actionable error - not a
// silent "no ... found" - when this resolves to the wrong place) covers the same case
// L1 was raised for. code-review-round8 L1: this paragraph previously misattributed
// the failure to `import.meta.url` itself.
const DEFAULT_RES_DIR = path.join('android', 'app', 'src', 'main', 'res');
// Matches only plain API-version qualifiers ("values" or "values-vNN") - a folder like
// "values-land" or "values-v28-land" is out of scope for this check (no version to
// reason about the same way, and none currently sets this attribute).
const VALUES_DIR_RE = /^values(?:-v(\d+))?$/;
const MIN_SAFE_ALWAYS_VERSION = 30;
// L2: tolerates any attribute order/extras (e.g. `tools:targetApi="o_mr1"`) and either
// quote style, not just the exact `<item name="android:windowLayoutInDisplayCutoutMode">`
// form.
const CUTOUT_ITEM_RE =
  /<item\b[^>]*?\bname\s*=\s*["']android:windowLayoutInDisplayCutoutMode["'][^>]*>\s*([^<]+?)\s*<\/item>/g;
// L3: the three folders every app theme's cutout mode is split across (§6.6 A10).
const PARITY_FOLDERS = ['values', 'values-v28', 'values-v30'];
const EXPECTED_CUTOUT_VALUE = { values: null, 'values-v28': 'shortEdges', 'values-v30': 'always' };
// L2 (round8): both are attribute-tolerant, like CUTOUT_ITEM_RE (round-7 L2) - a
// `<style>`/`<item>` with an extra attribute (any order, either quote style, e.g. the
// Android Studio quick-fix's `tools:targetApi="s"`) used to fall out of the match
// entirely, which silently dropped it from the parity comparison instead of failing.
const STYLE_ATTR_RE = /([\w:.-]+)\s*=\s*(["'])(.*?)\2/g;
const STYLE_TAG_RE = /<style\b([^>]*)>([\s\S]*?)<\/style>/g;
const ITEM_RE = /<item\b[^>]*?\bname\s*=\s*["']([^"']+)["'][^>]*>\s*([^<]*?)\s*<\/item>/g;
const XML_COMMENT_RE = /<!--[\s\S]*?-->/g;

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

/** Parses a tag's attribute string (e.g. `<style THIS_PART>`) into `{ [attrName]: value }`,
 * in whatever order they appear - order and extra attributes are both tolerated
 * (code-review-round8 L2), unlike a fixed `name="..." parent="..."` sequence. */
function parseAttrs(attrText) {
  const attrs = {};
  let match;
  STYLE_ATTR_RE.lastIndex = 0;
  while ((match = STYLE_ATTR_RE.exec(attrText))) {
    attrs[match[1]] = match[3];
  }
  return attrs;
}

/** Parses one `styles.xml` text into `{ [styleName]: { parent, items: { [name]: value } } }`.
 * XML comments are stripped first so a commented-out style/item can never be mistaken
 * for a live one. */
function parseStyles(xmlText) {
  const stripped = xmlText.replace(XML_COMMENT_RE, '');
  const styles = {};
  let styleMatch;
  STYLE_TAG_RE.lastIndex = 0;
  while ((styleMatch = STYLE_TAG_RE.exec(stripped))) {
    const [, attrText, body] = styleMatch;
    const attrs = parseAttrs(attrText);
    const items = {};
    let itemMatch;
    ITEM_RE.lastIndex = 0;
    while ((itemMatch = ITEM_RE.exec(body))) {
      items[itemMatch[1]] = itemMatch[2];
    }
    styles[attrs.name] = { parent: attrs.parent ?? '', items };
  }
  return styles;
}

/** code-review-round7 L3: the three `values{,-v28,-v30}/styles.xml` copies must hold
 * the same style names, parents and items (apart from the cutout item itself, which
 * is EXPECTED to differ), and v28/v30 must each positively set the value §6.6 A10
 * requires - not just "not the unsafe one". A missing values-v28/values-v30 folder, a
 * style/parent/item that drifted between copies, or a v28/v30 file that no longer sets
 * its expected value are all failures here. Exported for fixture tests. */
export function checkStylesParity(filesByFolder) {
  const failures = [];
  const CUTOUT_ITEM = 'android:windowLayoutInDisplayCutoutMode';

  for (const folder of PARITY_FOLDERS) {
    if (!(folder in filesByFolder)) {
      failures.push(`${folder}/styles.xml is missing - the three-folder parity set (§6.6 A10) requires it.`);
    }
  }
  if (failures.length > 0) return failures; // Nothing more can be compared without all three.

  const parsedByFolder = Object.fromEntries(PARITY_FOLDERS.map((folder) => [folder, parseStyles(filesByFolder[folder])]));
  const baseStyles = parsedByFolder.values;
  const baseNames = Object.keys(baseStyles).sort();

  for (const folder of ['values-v28', 'values-v30']) {
    const styles = parsedByFolder[folder];
    const names = Object.keys(styles).sort();
    if (JSON.stringify(names) !== JSON.stringify(baseNames)) {
      failures.push(`${folder}/styles.xml declares different style names than values/styles.xml (${names.join(', ')} vs ${baseNames.join(', ')}).`);
      continue;
    }
    for (const name of baseNames) {
      const base = baseStyles[name];
      const other = styles[name];
      if (base.parent !== other.parent) {
        failures.push(`${folder}/styles.xml: style "${name}" has parent "${other.parent}", but values/styles.xml has "${base.parent}".`);
      }
      const baseItemNames = Object.keys(base.items).filter((n) => n !== CUTOUT_ITEM).sort();
      const otherItemNames = Object.keys(other.items).filter((n) => n !== CUTOUT_ITEM).sort();
      if (JSON.stringify(baseItemNames) !== JSON.stringify(otherItemNames)) {
        failures.push(`${folder}/styles.xml: style "${name}" has different items (apart from the cutout item) than values/styles.xml.`);
      } else {
        for (const itemName of baseItemNames) {
          if (base.items[itemName] !== other.items[itemName]) {
            failures.push(
              `${folder}/styles.xml: style "${name}" item "${itemName}" is "${other.items[itemName]}", but values/styles.xml has "${base.items[itemName]}".`,
            );
          }
        }
      }
      const expected = EXPECTED_CUTOUT_VALUE[folder];
      const actual = other.items[CUTOUT_ITEM];
      if (actual !== expected) {
        failures.push(
          `${folder}/styles.xml: style "${name}" sets ${CUTOUT_ITEM}="${actual}", expected "${expected}" (§6.6 A10).`,
        );
      }
    }
  }
  // The base folder must never set the cutout item at all (API < 28 doesn't have it).
  for (const name of baseNames) {
    if (CUTOUT_ITEM in baseStyles[name].items) {
      failures.push(`values/styles.xml: style "${name}" sets ${CUTOUT_ITEM}, but the base folder (API < 28) must omit it entirely.`);
    }
  }
  return failures;
}

/** L1: distinguishes "the res dir itself is missing" (fails closed, see `run` below)
 * from "a values/values-vNN subfolder just has no styles.xml" (not an error - some
 * qualifiers legitimately don't need one). */
function loadStylesFiles(resDir) {
  const filesByFolder = {};
  const entries = readdirSync(resDir, { withFileTypes: true }); // throws ENOENT if resDir itself is missing - caller handles it.
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

/** L1: the fail-closed core, returning `{ code, messages }` rather than touching
 * `process.exitCode`/`console` directly, so a test can assert every path (missing res
 * dir, no values/ folder, real failures, clean) without spawning a subprocess. `code`
 * is 0 (clean), 1 (found a violation) or 2 (couldn't run the check at all). */
export function run(resDir) {
  let filesByFolder;
  try {
    filesByFolder = loadStylesFiles(resDir);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return {
      code: 2,
      messages: [`check-android-styles: res dir not found (${resDir}); run from scaffold/ or pass --res-dir`],
    };
  }
  if (!('values' in filesByFolder)) {
    return {
      code: 2,
      messages: [`check-android-styles: no values/styles.xml found under ${resDir}; run from scaffold/ or pass --res-dir`],
    };
  }

  const failures = [...findUnsafeCutoutModeAlways(filesByFolder), ...checkStylesParity(filesByFolder)];
  if (failures.length > 0) {
    return { code: 1, messages: ['check-android-styles: FAILED', ...failures.map((f) => `  ${f}`)] };
  }
  return {
    code: 0,
    messages: ['check-android-styles: no unqualified windowLayoutInDisplayCutoutMode="always" found, and the three styles.xml folders are in parity.'],
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const { code, messages } = run(args.resDir);
  for (const message of messages) {
    if (code === 0) console.log(message);
    else console.error(message);
  }
  if (code !== 0) process.exitCode = code;
}

// Guarded so the exported functions can be unit-tested with inline fixtures without
// touching the real `android/` tree.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
